import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ReportService } from './report.service';
import { ScheduledReportController } from './scheduled-report.controller';
import { ScheduledReportService } from './scheduled-report.service';
import { BabyModule } from '../baby/baby.module';
import { InsightsModule } from '../insights/insights.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Export Module
 * Provides CSV export, PDF report functionality, and scheduled report generation
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4
 */
@Module({
  imports: [
    PrismaModule,
    BabyModule,
    InsightsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [ExportController, ScheduledReportController],
  providers: [ExportService, ReportService, ScheduledReportService],
  exports: [ExportService, ReportService, ScheduledReportService],
})
export class ExportModule {}

