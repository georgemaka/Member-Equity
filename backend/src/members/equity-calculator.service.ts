import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from 'decimal.js';

export interface EquityValidationResult {
  isValid: boolean;
  currentTotal: Decimal;
  newTotal: Decimal;
  difference: Decimal;
  message?: string;
}

export interface EquityDistribution {
  memberId: string;
  memberName: string;
  currentPercentage: Decimal;
  newPercentage: Decimal;
  change: Decimal;
}

@Injectable()
export class EquityCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  async validateEquityChange(
    companyId: string,
    memberId: string,
    newPercentage: Decimal,
  ): Promise<EquityValidationResult> {
    // Get current equity distribution
    const members = await this.prisma.member.findMany({
      where: { 
        companyId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        equityPercentage: true,
      },
    });

    // Calculate current total
    const currentTotal = members.reduce(
      (sum, member) => sum.add(new Decimal(member.equityPercentage.toString())),
      new Decimal(0),
    );

    // Find the member being updated
    const targetMember = members.find(m => m.id === memberId);
    if (!targetMember) {
      return {
        isValid: false,
        currentTotal,
        newTotal: new Decimal(0),
        difference: new Decimal(0),
        message: 'Member not found',
      };
    }

    // Calculate new total
    const currentMemberPercentage = new Decimal(targetMember.equityPercentage.toString());
    const newTotal = currentTotal.sub(currentMemberPercentage).add(newPercentage);
    const difference = newTotal.sub(new Decimal(100));

    // Validate the change
    const isValid = newTotal.lte(new Decimal(100)) && newPercentage.gte(new Decimal(0));
    let message: string | undefined;

    if (newPercentage.lt(new Decimal(0))) {
      message = 'Equity percentage cannot be negative';
    } else if (newTotal.gt(new Decimal(100))) {
      message = `Total equity would exceed 100% by ${difference.toFixed(4)}%`;
    } else if (newTotal.eq(new Decimal(100))) {
      message = 'Equity distribution is perfectly balanced at 100%';
    } else {
      message = `Remaining equity available: ${new Decimal(100).sub(newTotal).toFixed(4)}%`;
    }

    return {
      isValid,
      currentTotal,
      newTotal,
      difference,
      message,
    };
  }

  async getCurrentEquityDistribution(companyId: string): Promise<EquityDistribution[]> {
    const members = await this.prisma.member.findMany({
      where: { 
        companyId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        equityPercentage: true,
      },
      orderBy: {
        equityPercentage: 'desc',
      },
    });

    return members.map(member => ({
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      currentPercentage: new Decimal(member.equityPercentage.toString()),
      newPercentage: new Decimal(member.equityPercentage.toString()),
      change: new Decimal(0),
    }));
  }

  async calculateProportionalAdjustment(
    companyId: string,
    memberId: string,
    newPercentage: Decimal,
    adjustOthers: boolean = true,
  ): Promise<EquityDistribution[]> {
    const currentDistribution = await this.getCurrentEquityDistribution(companyId);
    const targetMember = currentDistribution.find(m => m.memberId === memberId);
    
    if (!targetMember) {
      throw new Error('Member not found');
    }

    const result = [...currentDistribution];
    const targetIndex = result.findIndex(m => m.memberId === memberId);
    
    // Update target member
    result[targetIndex].newPercentage = newPercentage;
    result[targetIndex].change = newPercentage.sub(result[targetIndex].currentPercentage);

    if (!adjustOthers) {
      return result;
    }

    // Calculate the change needed
    const totalChange = result[targetIndex].change;
    
    if (totalChange.eq(0)) {
      return result;
    }

    // Find other active members to adjust
    const otherMembers = result.filter(m => m.memberId !== memberId);
    const totalOtherEquity = otherMembers.reduce(
      (sum, member) => sum.add(member.currentPercentage),
      new Decimal(0),
    );

    if (totalOtherEquity.eq(0)) {
      return result;
    }

    // Distribute the change proportionally among other members
    const adjustmentFactor = totalChange.neg().div(totalOtherEquity);
    
    for (const member of otherMembers) {
      const memberIndex = result.findIndex(m => m.memberId === member.memberId);
      const proportionalAdjustment = member.currentPercentage.mul(adjustmentFactor);
      
      result[memberIndex].newPercentage = member.currentPercentage.add(proportionalAdjustment);
      result[memberIndex].change = proportionalAdjustment;
      
      // Ensure no negative percentages
      if (result[memberIndex].newPercentage.lt(0)) {
        result[memberIndex].newPercentage = new Decimal(0);
        result[memberIndex].change = member.currentPercentage.neg();
      }
    }

    return result;
  }

  async getEquityTrends(companyId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const equityEvents = await this.prisma.equityEvent.findMany({
      where: {
        member: {
          companyId,
        },
        effectiveDate: {
          gte: startDate,
        },
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        effectiveDate: 'asc',
      },
    });

    // Group by month and calculate trends
    const monthlyData = new Map<string, { [memberId: string]: Decimal }>();
    
    for (const event of equityEvents) {
      const monthKey = event.effectiveDate.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {});
      }
      
      monthlyData.get(monthKey)![event.memberId] = new Decimal(event.newPercentage.toString());
    }

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      members: Object.entries(data).map(([memberId, percentage]) => {
        const event = equityEvents.find(e => e.memberId === memberId);
        return {
          memberId,
          memberName: event ? `${event.member.firstName} ${event.member.lastName}` : 'Unknown',
          percentage,
        };
      }),
    }));
  }

  async calculateMemberValue(
    memberId: string,
    companyValuation: Decimal,
  ): Promise<{
    equityPercentage: Decimal;
    estimatedValue: Decimal;
    lastUpdated: Date;
  }> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        equityHistory: {
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    const equityPercentage = new Decimal(member.equityPercentage.toString());
    const estimatedValue = companyValuation.mul(equityPercentage).div(100);
    const lastUpdated = member.equityHistory[0]?.effectiveDate || member.createdAt;

    return {
      equityPercentage,
      estimatedValue,
      lastUpdated,
    };
  }
}