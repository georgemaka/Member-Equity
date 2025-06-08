import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DistributionsService } from './distributions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('distributions')
@Controller('distributions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DistributionsController {
  constructor(private readonly distributionsService: DistributionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all distributions' })
  findAll() {
    const companyId = 'sukut-construction-llc';
    return this.distributionsService.findAll(companyId);
  }
}