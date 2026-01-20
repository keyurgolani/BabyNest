import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  CreateScheduledReportDto,
  UpdateScheduledReportDto,
  ReportFrequency,
  ScheduledReportResponseDto,
} from './dto';
import { ReportService } from './report.service';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Scheduled Report Service
 * Manages scheduled report configurations and processes due reports
 * Validates: Requirements 13.4
 */
@Injectable()
export class ScheduledReportService {
  private readonly logger = new Logger(ScheduledReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
    private readonly reportService: ReportService,
  ) {}

  /**
   * Verify caregiver has access to baby
   */
  private async verifyAccess(babyId: string, caregiverId: string): Promise<void> {
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }
  }

  /**
   * Calculate the next send date based on frequency and schedule settings
   */
  calculateNextSendAt(
    frequency: ReportFrequency,
    time: string,
    dayOfWeek?: number,
    dayOfMonth?: number,
    fromDate: Date = new Date(),
  ): Date {
    const timeParts = time.split(':').map(Number);
    const hours = timeParts[0] ?? 9;
    const minutes = timeParts[1] ?? 0;
    const nextSendAt = new Date(fromDate);
    nextSendAt.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case ReportFrequency.DAILY: {
        // If the time has already passed today, schedule for tomorrow
        if (nextSendAt <= fromDate) {
          nextSendAt.setDate(nextSendAt.getDate() + 1);
        }
        break;
      }
      case ReportFrequency.WEEKLY: {
        const targetDay = dayOfWeek ?? 1; // Default to Monday
        const currentDay = nextSendAt.getDay();
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextSendAt <= fromDate)) {
          daysUntilTarget += 7;
        }
        nextSendAt.setDate(nextSendAt.getDate() + daysUntilTarget);
        break;
      }
      case ReportFrequency.MONTHLY: {
        const targetDate = dayOfMonth ?? 1; // Default to 1st
        nextSendAt.setDate(targetDate);
        // If the date has passed this month, move to next month
        if (nextSendAt <= fromDate) {
          nextSendAt.setMonth(nextSendAt.getMonth() + 1);
        }
        // Handle months with fewer days
        const maxDays = new Date(nextSendAt.getFullYear(), nextSendAt.getMonth() + 1, 0).getDate();
        if (targetDate > maxDays) {
          nextSendAt.setDate(maxDays);
        }
        break;
      }
    }

    return nextSendAt;
  }

  /**
   * Get the report period based on frequency
   */
  getReportPeriod(frequency: ReportFrequency): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (frequency) {
      case ReportFrequency.DAILY:
        startDate.setDate(startDate.getDate() - 1);
        break;
      case ReportFrequency.WEEKLY:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case ReportFrequency.MONTHLY:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Create a new scheduled report
   * Validates: Requirements 13.4
   */
  async create(
    babyId: string,
    caregiverId: string,
    dto: CreateScheduledReportDto,
  ): Promise<ScheduledReportResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const nextSendAt = this.calculateNextSendAt(
      dto.frequency,
      dto.time,
      dto.dayOfWeek,
      dto.dayOfMonth,
    );

    const scheduledReport = await this.prisma.scheduledReport.create({
      data: {
        babyId,
        caregiverId,
        name: dto.name,
        frequency: dto.frequency,
        dayOfWeek: dto.dayOfWeek,
        dayOfMonth: dto.dayOfMonth,
        time: dto.time,
        email: dto.email,
        isActive: dto.isActive ?? true,
        nextSendAt,
      },
    });

    return this.toResponseDto(scheduledReport);
  }

  /**
   * List all scheduled reports for a baby
   * Validates: Requirements 13.4
   */
  async findAll(babyId: string, caregiverId: string): Promise<ScheduledReportResponseDto[]> {
    await this.verifyAccess(babyId, caregiverId);

    const scheduledReports = await this.prisma.scheduledReport.findMany({
      where: { babyId },
      orderBy: { createdAt: 'desc' },
    });

    return scheduledReports.map((report) => this.toResponseDto(report));
  }

  /**
   * Get a specific scheduled report
   */
  async findOne(
    babyId: string,
    scheduleId: string,
    caregiverId: string,
  ): Promise<ScheduledReportResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const scheduledReport = await this.prisma.scheduledReport.findFirst({
      where: {
        id: scheduleId,
        babyId,
      },
    });

    if (!scheduledReport) {
      throw new NotFoundException('Scheduled report not found');
    }

    return this.toResponseDto(scheduledReport);
  }

  /**
   * Update a scheduled report
   * Validates: Requirements 13.4
   */
  async update(
    babyId: string,
    scheduleId: string,
    caregiverId: string,
    dto: UpdateScheduledReportDto,
  ): Promise<ScheduledReportResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const existing = await this.prisma.scheduledReport.findFirst({
      where: {
        id: scheduleId,
        babyId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Scheduled report not found');
    }

    // Determine if we need to recalculate next send time
    const frequency = dto.frequency ?? (existing.frequency as ReportFrequency);
    const time = dto.time ?? existing.time;
    const dayOfWeek = dto.dayOfWeek !== undefined ? dto.dayOfWeek : existing.dayOfWeek;
    const dayOfMonth = dto.dayOfMonth !== undefined ? dto.dayOfMonth : existing.dayOfMonth;

    const needsRecalculation =
      dto.frequency !== undefined ||
      dto.time !== undefined ||
      dto.dayOfWeek !== undefined ||
      dto.dayOfMonth !== undefined;

    const updateData: {
      name?: string;
      frequency?: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
      time?: string;
      email?: string;
      isActive?: boolean;
      nextSendAt?: Date;
    } = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
    if (dto.dayOfWeek !== undefined) updateData.dayOfWeek = dto.dayOfWeek;
    if (dto.dayOfMonth !== undefined) updateData.dayOfMonth = dto.dayOfMonth;
    if (dto.time !== undefined) updateData.time = dto.time;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (needsRecalculation) {
      updateData.nextSendAt = this.calculateNextSendAt(
        frequency,
        time,
        dayOfWeek ?? undefined,
        dayOfMonth ?? undefined,
      );
    }

    const scheduledReport = await this.prisma.scheduledReport.update({
      where: { id: scheduleId },
      data: updateData,
    });

    return this.toResponseDto(scheduledReport);
  }

  /**
   * Delete a scheduled report
   * Validates: Requirements 13.4
   */
  async delete(babyId: string, scheduleId: string, caregiverId: string): Promise<void> {
    await this.verifyAccess(babyId, caregiverId);

    const existing = await this.prisma.scheduledReport.findFirst({
      where: {
        id: scheduleId,
        babyId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Scheduled report not found');
    }

    await this.prisma.scheduledReport.delete({
      where: { id: scheduleId },
    });
  }

  /**
   * Process due scheduled reports
   * Runs every hour to check for reports that need to be sent
   * Validates: Requirements 13.4
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processDueReports(): Promise<void> {
    this.logger.log('Checking for due scheduled reports...');

    const now = new Date();
    const dueReports = await this.prisma.scheduledReport.findMany({
      where: {
        isActive: true,
        nextSendAt: {
          lte: now,
        },
      },
      include: {
        baby: true,
        caregiver: true,
      },
    });

    this.logger.log(`Found ${dueReports.length} due reports to process`);

    for (const report of dueReports) {
      try {
        await this.processReport(report);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Failed to process scheduled report ${report.id}: ${errorMessage}`,
          errorStack,
        );
      }
    }
  }

  /**
   * Process a single scheduled report
   */
  private async processReport(report: {
    id: string;
    babyId: string;
    caregiverId: string;
    name: string;
    frequency: string;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    time: string;
    email: string;
    baby: { name: string };
  }): Promise<void> {
    this.logger.log(`Processing scheduled report ${report.id} (${report.name}) for baby ${report.baby.name}`);

    const frequency = report.frequency as ReportFrequency;
    const { startDate, endDate } = this.getReportPeriod(frequency);

    // Generate the PDF report
    const pdfBuffer = await this.reportService.generatePDFReport(
      report.babyId,
      report.caregiverId,
      {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    );

    // TODO: Send email with PDF attachment
    // For now, just log that the email would be sent
    this.logger.log(
      `[STUB] Would send ${frequency} report "${report.name}" email to ${report.email} for baby ${report.baby.name}. ` +
        `Report size: ${pdfBuffer.length} bytes. Period: ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Update the scheduled report with last sent time and next send time
    const nextSendAt = this.calculateNextSendAt(
      frequency,
      report.time,
      report.dayOfWeek ?? undefined,
      report.dayOfMonth ?? undefined,
    );

    await this.prisma.scheduledReport.update({
      where: { id: report.id },
      data: {
        lastSentAt: new Date(),
        nextSendAt,
      },
    });

    this.logger.log(`Scheduled report ${report.id} processed. Next send at: ${nextSendAt.toISOString()}`);
  }

  /**
   * Convert database entity to response DTO
   */
  private toResponseDto(report: {
    id: string;
    babyId: string;
    caregiverId: string;
    name: string;
    frequency: string;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    time: string;
    email: string;
    isActive: boolean;
    lastSentAt: Date | null;
    nextSendAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): ScheduledReportResponseDto {
    return {
      id: report.id,
      babyId: report.babyId,
      caregiverId: report.caregiverId,
      name: report.name,
      frequency: report.frequency as ReportFrequency,
      dayOfWeek: report.dayOfWeek ?? undefined,
      dayOfMonth: report.dayOfMonth ?? undefined,
      time: report.time,
      email: report.email,
      isActive: report.isActive,
      lastSentAt: report.lastSentAt?.toISOString(),
      nextScheduledAt: report.nextSendAt.toISOString(),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }
}
