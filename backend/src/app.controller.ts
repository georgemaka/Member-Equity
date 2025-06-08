import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth(): string {
    return this.appService.getHealth();
  }

  @Get('status')
  @ApiOperation({ summary: 'Application status' })
  getStatus() {
    return this.appService.getStatus();
  }
}