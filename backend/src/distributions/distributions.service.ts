import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { Decimal } from 'decimal.js';
import { DistributionStatus } from '@prisma/client';
import { DistributionCalculatedEvent } from '../events/domain-events/distribution.events';

@Injectable()
export class DistributionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async findAll(companyId: string) {
    return this.prisma.distribution.findMany({
      where: { companyId },
      include: {
        companyProfit: true,
        memberDistributions: {
          include: {
            member: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async calculateDistribution(companyId: string, profitId: string, distributionAmount?: string) {
    // Get profit details
    const profit = await this.prisma.companyProfit.findUnique({
      where: { id: profitId },
    });

    if (!profit || profit.companyId !== companyId) {
      throw new BadRequestException('Invalid profit record');
    }

    // Get active members with equity
    const members = await this.prisma.member.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        equityPercentage: { gt: 0 },
      },
    });

    // Calculate distribution amount
    const totalToDistribute = distributionAmount 
      ? new Decimal(distributionAmount)
      : new Decimal(profit.distributableAmount.toString());

    // Calculate each member's distribution
    const memberDistributions = members.map(member => {
      const equityDecimal = new Decimal(member.equityPercentage.toString());
      const grossAmount = totalToDistribute
        .mul(equityDecimal)
        .div(100)
        .toDecimalPlaces(2, Decimal.ROUND_DOWN);

      const taxRate = new Decimal(member.taxWithholdingPercentage.toString());
      const taxWithholding = grossAmount
        .mul(taxRate)
        .div(100)
        .toDecimalPlaces(2, Decimal.ROUND_UP);

      const netAmount = grossAmount.minus(taxWithholding);

      return {
        memberId: member.id,
        amount: grossAmount,
        taxWithholding: taxWithholding,
        netAmount: netAmount,
        member: {
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          equityPercentage: equityDecimal.toFixed(4),
        },
      };
    });

    // Verify total matches (with rounding tolerance)
    const totalCalculated = memberDistributions.reduce(
      (sum, dist) => sum.plus(dist.amount),
      new Decimal(0)
    );

    const difference = totalToDistribute.minus(totalCalculated).abs();
    if (difference.greaterThan(new Decimal('0.10'))) {
      throw new BadRequestException(
        `Distribution calculation error: total ${totalCalculated.toFixed(2)} != expected ${totalToDistribute.toFixed(2)}`
      );
    }

    return {
      profitId,
      totalAmount: totalToDistribute.toFixed(2),
      totalCalculated: totalCalculated.toFixed(2),
      memberCount: members.length,
      distributions: memberDistributions.map(d => ({
        ...d,
        amount: d.amount.toFixed(2),
        taxWithholding: d.taxWithholding.toFixed(2),
        netAmount: d.netAmount.toFixed(2),
      })),
    };
  }

  async createDistribution(companyId: string, profitId: string, approvedBy: string) {
    const calculation = await this.calculateDistribution(companyId, profitId);

    // Create distribution and member distributions in transaction
    const distribution = await this.prisma.$transaction(async (tx) => {
      // Create main distribution record
      const dist = await tx.distribution.create({
        data: {
          companyId,
          companyProfitId: profitId,
          totalAmount: new Decimal(calculation.totalAmount),
          distributionDate: new Date(),
          status: DistributionStatus.APPROVED,
          approvedBy,
          approvedAt: new Date(),
        },
      });

      // Create member distribution records
      const memberDists = await Promise.all(
        calculation.distributions.map(memberDist =>
          tx.memberDistribution.create({
            data: {
              distributionId: dist.id,
              memberId: memberDist.memberId,
              amount: new Decimal(memberDist.amount),
              taxWithholding: new Decimal(memberDist.taxWithholding),
              netAmount: new Decimal(memberDist.netAmount),
              paymentStatus: 'PENDING',
            },
          })
        )
      );

      return { ...dist, memberDistributions: memberDists };
    });

    // Emit event for notifications
    const event = new DistributionCalculatedEvent(
      distribution.id,
      {
        companyId,
        companyProfitId: profitId,
        totalAmount: new Decimal(calculation.totalAmount),
        distributionDate: distribution.distributionDate,
        memberDistributions: calculation.distributions.map(d => ({
          memberId: d.memberId,
          amount: new Decimal(d.amount),
          taxWithholding: new Decimal(d.taxWithholding),
          netAmount: new Decimal(d.netAmount),
        })),
      },
      { userId: approvedBy }
    );
    await this.eventBus.publish(event);

    return distribution;
  }
}