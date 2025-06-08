import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { ExcelUploadService } from './excel-upload.service';
import { EquityCalculatorService } from './equity-calculator.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    PrismaModule, 
    EventsModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  ],
  controllers: [MembersController],
  providers: [MembersService, ExcelUploadService, EquityCalculatorService],
  exports: [MembersService, ExcelUploadService, EquityCalculatorService],
})
export class MembersModule {}