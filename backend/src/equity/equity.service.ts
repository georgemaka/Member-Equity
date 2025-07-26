import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class EquityService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyEquityOverview(companyId: string) {
    const members = await this.prisma.member.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        equityPercentage: true,
        joinDate: true,
      },
      orderBy: { equityPercentage: 'desc' },
    });

    const totalEquity = members.reduce(
      (sum, member) => sum.plus(new Decimal(member.equityPercentage.toString())),
      new Decimal(0),
    );

    const availableEquity = new Decimal(100).minus(totalEquity);

    return {
      totalAllocated: totalEquity.toFixed(4),
      availableEquity: availableEquity.toFixed(4),
      memberCount: members.length,
      members: members.map(member => ({
        ...member,
        equityPercentage: new Decimal(member.equityPercentage.toString()).toFixed(4),
      })),
    };
  }
}