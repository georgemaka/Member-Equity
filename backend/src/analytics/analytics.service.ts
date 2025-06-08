import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyMetrics(companyId: string) {
    return {
      message: 'Analytics service - Coming soon',
      companyId,
    };
  }
}