import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SleepEntry } from '@prisma/client';

import {
  CreateSleepDto,
  UpdateSleepDto,
  SleepResponseDto,
  SleepListResponseDto,
  SleepQueryDto,
  SleepType,
  SleepQuality,
  SleepSortField,
  SortOrder,
  WakeWindowResponseDto,
  WakeWindowTimerResponseDto,
  WakeWindowStatus,
  SleepStatisticsDto,
  SleepStatisticsQueryDto,
  DailySleepBreakdownDto,
} from './dto';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';


/**
 * Sleep Service
 * Handles CRUD operations for sleep entries
 * Validates: Requirements 4.1, 4.2, 4.5
 */
@Injectable()
export class SleepService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
  ) {}

  /**
   * Calculate sleep duration in minutes from start and end times
   * Validates: Requirements 4.2
   * Property 10: Sleep Duration Calculation
   */
  private calculateDuration(startTime: Date, endTime: Date | null): number | null {
    if (!endTime) {
      return null;
    }
    const durationMs = endTime.getTime() - startTime.getTime();
    return Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Transform a sleep entry to response DTO
   */
  private toSleepResponse(entry: SleepEntry): SleepResponseDto {
    return {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
      sleepType: entry.sleepType as SleepType,
      quality: entry.quality as SleepQuality | null,
      notes: entry.notes,
      timestamp: entry.timestamp,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
    };
  }

  /**
   * Validate sleep entry times
   */
  private validateTimes(startTime: Date, endTime: Date | null): void {
    if (endTime && endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  /**
   * Create a new sleep entry
   * Validates: Requirements 4.1, 4.2, 4.5
   */
  async create(
    babyId: string,
    caregiverId: string,
    createSleepDto: CreateSleepDto,
  ): Promise<SleepResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const startTime = new Date(createSleepDto.startTime);
    const endTime = createSleepDto.endTime ? new Date(createSleepDto.endTime) : null;

    // Validate times
    this.validateTimes(startTime, endTime);

    // Calculate duration if end time is provided
    const duration = this.calculateDuration(startTime, endTime);

    const entry = await this.prisma.sleepEntry.create({
      data: {
        babyId,
        caregiverId,
        startTime,
        endTime,
        duration,
        sleepType: createSleepDto.sleepType,
        quality: createSleepDto.quality ?? null,
        notes: createSleepDto.notes ?? null,
        timestamp: startTime, // Use startTime as the activity timestamp
      },
    });

    return this.toSleepResponse(entry);
  }

  /**
   * List sleep entries for a baby with filtering and pagination
   * Validates: Requirements 4.3, 12.6
   */
  async findAll(
    babyId: string,
    caregiverId: string,
    query: SleepQueryDto,
  ): Promise<SleepListResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Build where clause
    const where: {
      babyId: string;
      isDeleted?: boolean;
      sleepType?: string;
      startTime?: { gte?: Date; lte?: Date };
      endTime?: null | { not: null };
    } = {
      babyId,
    };

    // Filter by deleted status
    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    // Filter by sleep type
    if (query.sleepType) {
      where.sleepType = query.sleepType;
    }

    // Filter by date range (based on startTime)
    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) {
        where.startTime.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.startTime.lte = new Date(query.endDate);
      }
    }

    // Filter for ongoing sleep sessions only
    if (query.ongoingOnly) {
      where.endTime = null;
    }

    // Build order by
    const orderBy: Record<string, SortOrder> = {};
    const sortField = query.sortBy || SleepSortField.START_TIME;
    orderBy[sortField] = query.sortOrder || SortOrder.DESC;

    // Calculate pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [entries, total] = await Promise.all([
      this.prisma.sleepEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.sleepEntry.count({ where }),
    ]);

    return {
      data: entries.map((entry) => this.toSleepResponse(entry)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single sleep entry by ID
   * Validates: Requirements 4.1, 4.2, 4.5
   */
  async findOne(
    babyId: string,
    sleepId: string,
    caregiverId: string,
  ): Promise<SleepResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const entry = await this.prisma.sleepEntry.findUnique({
      where: { id: sleepId },
    });

    if (!entry) {
      throw new NotFoundException('Sleep entry not found');
    }

    // Verify the entry belongs to the specified baby
    if (entry.babyId !== babyId) {
      throw new NotFoundException('Sleep entry not found');
    }

    return this.toSleepResponse(entry);
  }

  /**
   * Update a sleep entry
   * Validates: Requirements 4.1, 4.2, 4.5
   */
  async update(
    babyId: string,
    sleepId: string,
    caregiverId: string,
    updateSleepDto: UpdateSleepDto,
  ): Promise<SleepResponseDto> {
    // First verify access and that entry exists
    const existingEntry = await this.findOne(babyId, sleepId, caregiverId);

    // Determine effective start and end times for validation
    const startTime = updateSleepDto.startTime
      ? new Date(updateSleepDto.startTime)
      : existingEntry.startTime;
    const endTime = updateSleepDto.endTime !== undefined
      ? (updateSleepDto.endTime ? new Date(updateSleepDto.endTime) : null)
      : existingEntry.endTime;

    // Validate times
    this.validateTimes(startTime, endTime);

    // Calculate duration if we have both start and end times
    const duration = this.calculateDuration(startTime, endTime);

    // Build update data
    const updateData: {
      startTime?: Date;
      endTime?: Date | null;
      duration?: number | null;
      sleepType?: string;
      quality?: string | null;
      notes?: string | null;
      timestamp?: Date;
    } = {};

    if (updateSleepDto.startTime !== undefined) {
      updateData.startTime = new Date(updateSleepDto.startTime);
      updateData.timestamp = updateData.startTime; // Keep timestamp in sync with startTime
    }
    if (updateSleepDto.endTime !== undefined) {
      updateData.endTime = updateSleepDto.endTime ? new Date(updateSleepDto.endTime) : null;
    }
    if (updateSleepDto.sleepType !== undefined) {
      updateData.sleepType = updateSleepDto.sleepType;
    }
    if (updateSleepDto.quality !== undefined) {
      updateData.quality = updateSleepDto.quality;
    }
    if (updateSleepDto.notes !== undefined) {
      updateData.notes = updateSleepDto.notes;
    }

    // Always recalculate duration when start or end time changes
    if (updateSleepDto.startTime !== undefined || updateSleepDto.endTime !== undefined) {
      updateData.duration = duration;
    }

    const entry = await this.prisma.sleepEntry.update({
      where: { id: sleepId },
      data: updateData,
    });

    return this.toSleepResponse(entry);
  }

  /**
   * Soft delete a sleep entry
   * Validates: Requirements 4.1
   */
  async remove(
    babyId: string,
    sleepId: string,
    caregiverId: string,
  ): Promise<void> {
    // First verify access and that entry exists
    await this.findOne(babyId, sleepId, caregiverId);

    // Soft delete by setting isDeleted flag
    await this.prisma.sleepEntry.update({
      where: { id: sleepId },
      data: { isDeleted: true },
    });
  }

  /**
   * Get the most recent completed sleep entry for a baby
   * Used for wake window calculation
   * Validates: Requirements 4.4
   */
  async getLastCompletedSleep(babyId: string): Promise<SleepEntry | null> {
    return this.prisma.sleepEntry.findFirst({
      where: {
        babyId,
        isDeleted: false,
        endTime: { not: null },
      },
      orderBy: { endTime: 'desc' },
    });
  }

  /**
   * Format wake window duration as hours and minutes
   */
  private formatWakeWindow(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) {
      return `${mins}m`;
    }
    return `${hours}h ${mins}m`;
  }

  /**
   * Calculate the current wake window for a baby
   * Wake window = time elapsed since the end of the most recent sleep session
   * Validates: Requirements 4.4
   * Property 11: Wake Window Calculation
   */
  async getWakeWindow(
    babyId: string,
    caregiverId: string,
  ): Promise<WakeWindowResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const now = new Date();
    const lastSleep = await this.getLastCompletedSleep(babyId);

    if (!lastSleep || !lastSleep.endTime) {
      // No sleep history - return zero wake window with current time as start
      return {
        babyId,
        wakeWindowMinutes: 0,
        wakeWindowFormatted: '0m',
        wakeWindowStartTime: now,
        calculatedAt: now,
        lastSleep: null,
        hasSleepHistory: false,
      };
    }

    // Calculate wake window: now - lastSleep.endTime
    const wakeWindowMs = now.getTime() - lastSleep.endTime.getTime();
    const wakeWindowMinutes = Math.max(0, Math.round(wakeWindowMs / (1000 * 60)));

    return {
      babyId,
      wakeWindowMinutes,
      wakeWindowFormatted: this.formatWakeWindow(wakeWindowMinutes),
      wakeWindowStartTime: lastSleep.endTime,
      calculatedAt: now,
      lastSleep: this.toSleepResponse(lastSleep),
      hasSleepHistory: true,
    };
  }

  /**
   * Get the date string (YYYY-MM-DD) for a given date
   */
  private getDateString(date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr ?? '';
  }

  /**
   * Get sleep statistics for a baby within a date range
   * Calculates daily totals, averages, trends for date range
   * Validates: Requirements 4.3, 4.6
   * Property 12: Sleep Statistics Calculation
   */
  async getStatistics(
    babyId: string,
    caregiverId: string,
    query: SleepStatisticsQueryDto,
  ): Promise<SleepStatisticsDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Determine date range
    const now = new Date();
    let endDate: Date;
    let startDate: Date;

    if (query.periodDays) {
      // Use period days (7, 14, or 30 days)
      endDate = now;
      startDate = new Date(now.getTime() - query.periodDays * 24 * 60 * 60 * 1000);
    } else if (query.startDate || query.endDate) {
      // Use provided dates
      endDate = query.endDate ? new Date(query.endDate) : now;
      startDate = query.startDate
        ? new Date(query.startDate)
        : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // Default to last 7 days
      endDate = now;
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build where clause for the date range
    // We look for sleep entries where startTime falls within the range
    const where = {
      babyId,
      isDeleted: false,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get all sleep entries in the date range
    const entries = await this.prisma.sleepEntry.findMany({
      where,
      orderBy: { startTime: 'desc' },
    });

    // Initialize counters
    let totalSleepMinutes = 0;
    let napCount = 0;
    let napMinutes = 0;
    let nightSleepCount = 0;
    let nightSleepMinutes = 0;

    // Daily breakdown map
    const dailyBreakdown = new Map<string, DailySleepBreakdownDto>();

    // Process each entry
    for (const entry of entries) {
      // Only count completed sleep sessions (with duration)
      if (entry.duration === null) {
        continue;
      }

      const duration = entry.duration;
      totalSleepMinutes += duration;

      // Count by sleep type
      if (entry.sleepType === 'nap') {
        napCount++;
        napMinutes += duration;
      } else if (entry.sleepType === 'night') {
        nightSleepCount++;
        nightSleepMinutes += duration;
      }

      // Add to daily breakdown
      const dateStr = this.getDateString(entry.startTime);
      if (!dailyBreakdown.has(dateStr)) {
        dailyBreakdown.set(dateStr, {
          date: dateStr,
          totalMinutes: 0,
          napCount: 0,
          napMinutes: 0,
          nightMinutes: 0,
          sessionCount: 0,
        });
      }

      const dayStats = dailyBreakdown.get(dateStr)!;
      dayStats.totalMinutes += duration;
      dayStats.sessionCount++;

      if (entry.sleepType === 'nap') {
        dayStats.napCount++;
        dayStats.napMinutes += duration;
      } else if (entry.sleepType === 'night') {
        dayStats.nightMinutes += duration;
      }
    }

    // Calculate number of days in the period
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const daysWithData = dailyBreakdown.size;

    // Calculate averages
    const averageSleepMinutesPerDay = periodDays > 0
      ? Math.round(totalSleepMinutes / periodDays)
      : 0;

    const averageNapDuration = napCount > 0
      ? Math.round(napMinutes / napCount)
      : null;

    const averageNightSleepDuration = nightSleepCount > 0
      ? Math.round(nightSleepMinutes / nightSleepCount)
      : null;

    // Get current wake window
    const wakeWindowData = await this.getWakeWindow(babyId, caregiverId);

    // Get last sleep entry
    const lastSleep = entries.length > 0 && entries[0]
      ? this.toSleepResponse(entries[0])
      : null;

    // Convert daily breakdown map to sorted array
    const dailyBreakdownArray = Array.from(dailyBreakdown.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: {
        startDate,
        endDate,
      },
      totalSleepMinutes,
      averageSleepMinutesPerDay,
      napCount,
      napMinutes,
      nightSleepCount,
      nightSleepMinutes,
      totalSessions: napCount + nightSleepCount,
      averageNapDuration,
      averageNightSleepDuration,
      currentWakeWindowMinutes: wakeWindowData.wakeWindowMinutes,
      currentWakeWindowFormatted: wakeWindowData.wakeWindowFormatted,
      lastSleep,
      dailyBreakdown: dailyBreakdownArray,
      daysWithData,
    };
  }

  /**
   * Age-based wake window guidelines in minutes
   * Based on pediatric sleep research and similar to Huckleberry's SweetSpot feature
   */
  private readonly WAKE_WINDOW_GUIDELINES: { maxAgeMonths: number; minMinutes: number; maxMinutes: number }[] = [
    { maxAgeMonths: 1, minMinutes: 45, maxMinutes: 60 },      // 0-1 months
    { maxAgeMonths: 2, minMinutes: 60, maxMinutes: 90 },      // 1-2 months
    { maxAgeMonths: 3, minMinutes: 75, maxMinutes: 105 },     // 2-3 months
    { maxAgeMonths: 4, minMinutes: 90, maxMinutes: 120 },     // 3-4 months
    { maxAgeMonths: 6, minMinutes: 120, maxMinutes: 150 },    // 4-6 months
    { maxAgeMonths: 9, minMinutes: 150, maxMinutes: 180 },    // 6-9 months
    { maxAgeMonths: 12, minMinutes: 180, maxMinutes: 240 },   // 9-12 months
    { maxAgeMonths: 18, minMinutes: 240, maxMinutes: 300 },   // 12-18 months
    { maxAgeMonths: 24, minMinutes: 300, maxMinutes: 360 },   // 18-24 months
    { maxAgeMonths: Infinity, minMinutes: 360, maxMinutes: 420 }, // 24+ months (default)
  ];

  /**
   * Get the recommended wake window range for a baby's age
   */
  private getWakeWindowRangeForAge(ageMonths: number): { minMinutes: number; maxMinutes: number } {
    for (const guideline of this.WAKE_WINDOW_GUIDELINES) {
      if (ageMonths < guideline.maxAgeMonths) {
        return { minMinutes: guideline.minMinutes, maxMinutes: guideline.maxMinutes };
      }
    }
    // Default for older children
    return { minMinutes: 360, maxMinutes: 420 };
  }

  /**
   * Determine wake window status based on current awake time vs recommended
   */
  private getWakeWindowStatus(
    currentAwakeMinutes: number,
    minWakeWindow: number,
    maxWakeWindow: number,
  ): WakeWindowStatus {
    const midpoint = (minWakeWindow + maxWakeWindow) / 2;
    
    if (currentAwakeMinutes <= midpoint) {
      return WakeWindowStatus.WELL_RESTED;
    } else if (currentAwakeMinutes <= maxWakeWindow) {
      return WakeWindowStatus.APPROACHING_TIRED;
    } else {
      return WakeWindowStatus.OVERTIRED;
    }
  }

  /**
   * Format minutes until next sleep (handles negative values for overdue)
   */
  private formatMinutesUntilSleep(minutes: number): string {
    if (minutes <= 0) {
      const overdue = Math.abs(minutes);
      return `${this.formatWakeWindow(overdue)} overdue`;
    }
    return this.formatWakeWindow(minutes);
  }

  /**
   * Calculate the enhanced wake window timer for a baby
   * Includes age-appropriate recommendations similar to Huckleberry's SweetSpot feature
   * Validates: Requirements 4.4
   */
  async getWakeWindowTimer(
    babyId: string,
    caregiverId: string,
  ): Promise<WakeWindowTimerResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby's age
    const baby = await this.babyService.findOne(babyId, caregiverId);
    const babyAgeMonths = baby.age.months + (baby.age.days / 30); // Approximate decimal months

    // Get wake window range for baby's age
    const { minMinutes, maxMinutes } = this.getWakeWindowRangeForAge(babyAgeMonths);
    const recommendedMidpoint = Math.round((minMinutes + maxMinutes) / 2);

    const now = new Date();
    const lastSleep = await this.getLastCompletedSleep(babyId);

    if (!lastSleep || !lastSleep.endTime) {
      // No sleep history - return defaults with current time
      return {
        babyId,
        lastSleepEndTime: null,
        currentAwakeMinutes: 0,
        currentAwakeFormatted: '0m',
        recommendedWakeWindowMinutes: recommendedMidpoint,
        minWakeWindowMinutes: minMinutes,
        maxWakeWindowMinutes: maxMinutes,
        recommendedWakeWindowFormatted: `${this.formatWakeWindow(minMinutes)} - ${this.formatWakeWindow(maxMinutes)}`,
        suggestedNextSleepTime: null,
        minutesUntilNextSleep: recommendedMidpoint,
        minutesUntilNextSleepFormatted: this.formatWakeWindow(recommendedMidpoint),
        status: WakeWindowStatus.WELL_RESTED,
        percentageOfWakeWindow: 0,
        babyAgeMonths: Math.floor(babyAgeMonths),
        calculatedAt: now,
        lastSleep: null,
        hasSleepHistory: false,
      };
    }

    // Calculate current awake time
    const awakeMs = now.getTime() - lastSleep.endTime.getTime();
    const currentAwakeMinutes = Math.max(0, Math.round(awakeMs / (1000 * 60)));

    // Calculate suggested next sleep time (based on midpoint of recommended range)
    const suggestedNextSleepTime = new Date(lastSleep.endTime.getTime() + recommendedMidpoint * 60 * 1000);
    
    // Calculate minutes until next sleep (can be negative if overdue)
    const minutesUntilNextSleep = Math.round((suggestedNextSleepTime.getTime() - now.getTime()) / (1000 * 60));

    // Calculate percentage of wake window used (based on midpoint)
    const percentageOfWakeWindow = Math.round((currentAwakeMinutes / recommendedMidpoint) * 100);

    // Determine status
    const status = this.getWakeWindowStatus(currentAwakeMinutes, minMinutes, maxMinutes);

    return {
      babyId,
      lastSleepEndTime: lastSleep.endTime,
      currentAwakeMinutes,
      currentAwakeFormatted: this.formatWakeWindow(currentAwakeMinutes),
      recommendedWakeWindowMinutes: recommendedMidpoint,
      minWakeWindowMinutes: minMinutes,
      maxWakeWindowMinutes: maxMinutes,
      recommendedWakeWindowFormatted: `${this.formatWakeWindow(minMinutes)} - ${this.formatWakeWindow(maxMinutes)}`,
      suggestedNextSleepTime,
      minutesUntilNextSleep,
      minutesUntilNextSleepFormatted: this.formatMinutesUntilSleep(minutesUntilNextSleep),
      status,
      percentageOfWakeWindow,
      babyAgeMonths: Math.floor(babyAgeMonths),
      calculatedAt: now,
      lastSleep: this.toSleepResponse(lastSleep),
      hasSleepHistory: true,
    };
  }
}
