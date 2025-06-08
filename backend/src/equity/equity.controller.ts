import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EquityService } from './equity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('equity')
@Controller('equity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EquityController {
  constructor(private readonly equityService: EquityService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get company equity overview' })
  getEquityOverview() {
    const companyId = 'sukut-construction-llc';
    return this.equityService.getCompanyEquityOverview(companyId);
  }
}