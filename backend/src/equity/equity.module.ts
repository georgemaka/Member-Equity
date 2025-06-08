import { Module } from '@nestjs/common';
import { EquityController } from './equity.controller';
import { EquityService } from './equity.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [EquityController],
  providers: [EquityService],
  exports: [EquityService],
})
export class EquityModule {}