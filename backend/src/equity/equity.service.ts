import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

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
      (sum, member) => sum + Number(member.equityPercentage),
      0,
    );

    return {
      totalAllocated: totalEquity,
      availableEquity: 100 - totalEquity,
      memberCount: members.length,
      members: members.map(member => ({
        ...member,
        equityPercentage: Number(member.equityPercentage),
      })),
    };
  }
}