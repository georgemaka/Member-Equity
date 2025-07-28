import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { ExcelUploadService } from './excel-upload.service';
import { EquityCalculatorService } from './equity-calculator.service';
import { ExcelExportService } from './services/excel-export.service';
import { ExcelImportService } from './services/excel-import.service';
import { ProRataDistributionService } from './services/pro-rata-distribution.service';
import { BoardApprovalService } from './services/board-approval.service';
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
  providers: [
    MembersService, 
    ExcelUploadService, 
    EquityCalculatorService,
    ExcelExportService,
    ExcelImportService,
    ProRataDistributionService,
    BoardApprovalService,
  ],
  exports: [
    MembersService, 
    ExcelUploadService, 
    EquityCalculatorService,
    ExcelExportService,
    ExcelImportService,
    ProRataDistributionService,
    BoardApprovalService,
  ],
})
export class MembersModule {}