import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): string {
    return 'Sukut Construction Member Equity Management API is running!';
  }

  getStatus() {
    return {
      service: 'Sukut Construction Member Equity Management API',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      company: 'Sukut Construction, LLC',
    };
  }
}