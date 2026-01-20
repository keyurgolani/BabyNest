import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ActivityEntry } from '@prisma/client';

import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityResponseDto,
  ActivityListResponseDto,
  ActivityQueryDto,
  ActivityType,
  ActivitySortField,
  SortOrder,
  ActivityStatisticsQueryDto,
  ActivityStatisticsDto,
  ActivityCountByTypeDto,
  ActivityDurationByTypeDto,
  ActivityAverageDurationByTypeDto,
  DailyActivityBreakdownDto,
  ActivityTrendDto,
  ActivityTrendByTypeDto,
} from './dto';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';


/**
 * Activity Service
 * Handles CRUD operations for activity entries (tummy time, bath, outdoor, play)
 * Validates: Requirements 9.1, 9.2, 9.3
 */
@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
  ) {}

  /**
   * Calculate activity duration in minutes from start and end times
   * Duration = endTime - startTime in minutes
   */
  private calculateDuration(startTime: Date | null, endTime: Date | null): number | null {
    if (!startTime || !endTime) {
      return null;
    }
    const durationMs = endTime.getTime() - startTime.getTime();
    return Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Transform an activity entry to response DTO
   */
  private toActivityResponse(entry: ActivityEntry): ActivityResponseDto {
    // Map database activityType to enum value
    const activityTypeMap: Record<string, ActivityType> = {
      'tummy_time': ActivityType.TUMMY_TIME,
      'tummyTime': ActivityType.TUMMY_TIME,
      'bath': ActivityType.BATH,
      'outdoor': ActivityType.OUTDOOR,
      'play': ActivityType.PLAY,
    };

    return {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      activityType: activityTypeMap[entry.activityType] || entry.activityType as ActivityType,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
      notes: entry.notes,
      timestamp: entry.timestamp,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
    };
  }

  /**
   * Validate activity entry times
   */
  private validateTimes(startTime: Date | null, endTime: Date | null): void {
    if (startTime && endTime && endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  /**
   * Create a new activity entry
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  async create(
    babyId: string,
    caregiverId: string,
    createActivityDto: CreateActivityDto,
  ): Promise<ActivityResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const now = new Date();
    const startTime = createActivityDto.startTime ? new Date(createActivityDto.startTime) : now;
    const endTime = createActivityDto.endTime ? new Date(createActivityDto.endTime) : null;

    // Validate times
    this.validateTimes(startTime, endTime);

    // Calculate duration: use provided duration, or calculate from times, or null
    let duration: number | null = null;
    if (createActivityDto.duration !== undefined) {
      duration = createActivityDto.duration;
    } else if (startTime && endTime) {
      duration = this.calculateDuration(startTime, endTime);
    }

    const entry = await this.prisma.activityEntry.create({
      data: {
        babyId,
        caregiverId,
        activityType: createActivityDto.activityType,
        startTime,
        endTime,
        duration,
        notes: createActivityDto.notes ?? null,
        timestamp: startTime, // Use startTime as the activity timestamp
      },
    });

    return this.toActivityResponse(entry);
  }

  /**
   * List activity entries for a baby with filtering and pagination
   * Validates: Requirements 12.6
   */
  async findAll(
    babyId: string,
    caregiverId: string,
    query: ActivityQueryDto,
  ): Promise<ActivityListResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Build where clause
    const where: {
      babyId: string;
      isDeleted?: boolean;
      activityType?: string;
      timestamp?: { gte?: Date; lte?: Date };
    } = {
      babyId,
    };

    // Filter by deleted status
    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    // Filter by activity type
    if (query.activityType) {
      where.activityType = query.activityType;
    }

    // Filter by date range (based on timestamp)
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) {
        where.timestamp.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.timestamp.lte = new Date(query.endDate);
      }
    }

    // Build order by
    const orderBy: Record<string, SortOrder> = {};
    const sortField = query.sortBy || ActivitySortField.TIMESTAMP;
    orderBy[sortField] = query.sortOrder || SortOrder.DESC;

    // Calculate pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [entries, total] = await Promise.all([
      this.prisma.activityEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.activityEntry.count({ where }),
    ]);

    return {
      data: entries.map((entry) => this.toActivityResponse(entry)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single activity entry by ID
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  async findOne(
    babyId: string,
    activityId: string,
    caregiverId: string,
  ): Promise<ActivityResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const entry = await this.prisma.activityEntry.findUnique({
      where: { id: activityId },
    });

    if (!entry) {
      throw new NotFoundException('Activity entry not found');
    }

    // Verify the entry belongs to the specified baby
    if (entry.babyId !== babyId) {
      throw new NotFoundException('Activity entry not found');
    }

    return this.toActivityResponse(entry);
  }

  /**
   * Update an activity entry
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  async update(
    babyId: string,
    activityId: string,
    caregiverId: string,
    updateActivityDto: UpdateActivityDto,
  ): Promise<ActivityResponseDto> {
    // First verify access and that entry exists
    const existingEntry = await this.findOne(babyId, activityId, caregiverId);

    // Determine effective start and end times for validation
    const startTime = updateActivityDto.startTime
      ? new Date(updateActivityDto.startTime)
      : existingEntry.startTime;
    const endTime = updateActivityDto.endTime !== undefined
      ? (updateActivityDto.endTime ? new Date(updateActivityDto.endTime) : null)
      : existingEntry.endTime;

    // Validate times
    this.validateTimes(startTime, endTime);

    // Build update data
    const updateData: {
      activityType?: string;
      startTime?: Date;
      endTime?: Date | null;
      duration?: number | null;
      notes?: string | null;
      timestamp?: Date;
    } = {};

    if (updateActivityDto.activityType !== undefined) {
      updateData.activityType = updateActivityDto.activityType;
    }
    if (updateActivityDto.notes !== undefined) {
      updateData.notes = updateActivityDto.notes;
    }
    if (updateActivityDto.startTime !== undefined) {
      updateData.startTime = new Date(updateActivityDto.startTime);
      updateData.timestamp = updateData.startTime; // Keep timestamp in sync with startTime
    }
    if (updateActivityDto.endTime !== undefined) {
      updateData.endTime = updateActivityDto.endTime ? new Date(updateActivityDto.endTime) : null;
    }

    // Handle duration: use provided duration, or recalculate if times changed
    if (updateActivityDto.duration !== undefined) {
      updateData.duration = updateActivityDto.duration;
    } else if (updateActivityDto.startTime !== undefined || updateActivityDto.endTime !== undefined) {
      // Recalculate duration when start or end time changes
      updateData.duration = this.calculateDuration(startTime, endTime);
    }

    const entry = await this.prisma.activityEntry.update({
      where: { id: activityId },
      data: updateData,
    });

    return this.toActivityResponse(entry);
  }

  /**
   * Soft delete an activity entry
   * Validates: Requirements 9.1
   */
  async remove(
    babyId: string,
    activityId: string,
    caregiverId: string,
  ): Promise<void> {
    // First verify access and that entry exists
    await this.findOne(babyId, activityId, caregiverId);

    // Soft delete by setting isDeleted flag
    await this.prisma.activityEntry.update({
      where: { id: activityId },
      data: { isDeleted: true },
    });
  }

  /**
   * Initialize empty count by type object
   */
  private initializeCountByType(): ActivityCountByTypeDto {
    return {
      tummy_time: 0,
      bath: 0,
      outdoor: 0,
      play: 0,
    };
  }

  /**
   * Initialize empty duration by type object
   */
  private initializeDurationByType(): ActivityDurationByTypeDto {
    return {
      tummy_time: 0,
      bath: 0,
      outdoor: 0,
      play: 0,
    };
  }

  /**
   * Map database activity type to DTO key
   */
  private mapActivityTypeToKey(activityType: string): keyof ActivityCountByTypeDto {
    const typeMap: Record<string, keyof ActivityCountByTypeDto> = {
      'tummy_time': 'tummy_time',
      'tummyTime': 'tummy_time',
      'bath': 'bath',
      'outdoor': 'outdoor',
      'play': 'play',
    };
    return typeMap[activityType] || 'play';
  }

  /**
   * Calculate trend between two values
   */
  private calculateTrend(
    currentDuration: number,
    previousDuration: number,
    currentCount: number,
    previousCount: number,
  ): ActivityTrendDto {
    const durationChange = currentDuration - previousDuration;
    const durationChangePercent = previousDuration > 0
      ? Math.round((durationChange / previousDuration) * 100)
      : null;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (durationChange > 0) {
      trend = 'increasing';
    } else if (durationChange < 0) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      currentPeriodDuration: currentDuration,
      previousPeriodDuration: previousDuration,
      durationChange,
      durationChangePercent,
      trend,
      currentPeriodCount: currentCount,
      previousPeriodCount: previousCount,
      countChange: currentCount - previousCount,
    };
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  private formatDateToString(date: Date): string {
    const isoString = date.toISOString();
    const datePart = isoString.split('T')[0];
    return datePart ?? isoString.substring(0, 10);
  }

  /**
   * Get activity statistics for a baby
   * Validates: Requirements 9.4, 9.5
   * Property 27: Activity Statistics Calculation
   */
  async getStatistics(
    babyId: string,
    caregiverId: string,
    query: ActivityStatisticsQueryDto,
  ): Promise<ActivityStatisticsDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Determine date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (query.periodDays) {
      // Use period days (overrides startDate)
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - query.periodDays);
      startDate.setHours(0, 0, 0, 0);
    } else if (query.startDate) {
      startDate = new Date(query.startDate);
      if (query.endDate) {
        endDate = new Date(query.endDate);
      }
    } else {
      // Default to last 7 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    // Calculate period length in days for previous period comparison
    const periodLengthMs = endDate.getTime() - startDate.getTime();
    const periodLengthDays = Math.ceil(periodLengthMs / (1000 * 60 * 60 * 24));

    // Calculate previous period dates
    const previousEndDate = new Date(startDate);
    previousEndDate.setMilliseconds(previousEndDate.getMilliseconds() - 1);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodLengthDays);
    previousStartDate.setHours(0, 0, 0, 0);

    // Fetch current period entries
    const currentEntries = await this.prisma.activityEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Fetch previous period entries for trend comparison
    const previousEntries = await this.prisma.activityEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
    });

    // Calculate current period statistics
    const countByType = this.initializeCountByType();
    const durationByType = this.initializeDurationByType();
    const durationCountByType: Record<keyof ActivityCountByTypeDto, number> = {
      tummy_time: 0,
      bath: 0,
      outdoor: 0,
      play: 0,
    };

    let totalDuration = 0;
    const dailyData: Map<string, {
      count: number;
      duration: number;
      countByType: ActivityCountByTypeDto;
      durationByType: ActivityDurationByTypeDto;
    }> = new Map();

    for (const entry of currentEntries) {
      const typeKey = this.mapActivityTypeToKey(entry.activityType);
      countByType[typeKey]++;

      const duration = entry.duration ?? 0;
      durationByType[typeKey] += duration;
      totalDuration += duration;

      if (entry.duration !== null) {
        durationCountByType[typeKey]++;
      }

      // Daily breakdown
      const dateStr = this.formatDateToString(entry.timestamp);
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, {
          count: 0,
          duration: 0,
          countByType: this.initializeCountByType(),
          durationByType: this.initializeDurationByType(),
        });
      }
      const dayData = dailyData.get(dateStr)!;
      dayData.count++;
      dayData.duration += duration;
      dayData.countByType[typeKey]++;
      dayData.durationByType[typeKey] += duration;
    }

    // Calculate average duration by type
    const averageDurationByType: ActivityAverageDurationByTypeDto = {
      tummy_time: durationCountByType.tummy_time > 0
        ? Math.round(durationByType.tummy_time / durationCountByType.tummy_time)
        : null,
      bath: durationCountByType.bath > 0
        ? Math.round(durationByType.bath / durationCountByType.bath)
        : null,
      outdoor: durationCountByType.outdoor > 0
        ? Math.round(durationByType.outdoor / durationCountByType.outdoor)
        : null,
      play: durationCountByType.play > 0
        ? Math.round(durationByType.play / durationCountByType.play)
        : null,
    };

    // Calculate previous period statistics for trends
    const prevCountByType = this.initializeCountByType();
    const prevDurationByType = this.initializeDurationByType();
    let prevTotalDuration = 0;

    for (const entry of previousEntries) {
      const typeKey = this.mapActivityTypeToKey(entry.activityType);
      prevCountByType[typeKey]++;
      const duration = entry.duration ?? 0;
      prevDurationByType[typeKey] += duration;
      prevTotalDuration += duration;
    }

    // Calculate overall trend
    const overallTrend = this.calculateTrend(
      totalDuration,
      prevTotalDuration,
      currentEntries.length,
      previousEntries.length,
    );

    // Calculate trend by type
    const trendByType: ActivityTrendByTypeDto = {
      tummy_time: this.calculateTrend(
        durationByType.tummy_time,
        prevDurationByType.tummy_time,
        countByType.tummy_time,
        prevCountByType.tummy_time,
      ),
      bath: this.calculateTrend(
        durationByType.bath,
        prevDurationByType.bath,
        countByType.bath,
        prevCountByType.bath,
      ),
      outdoor: this.calculateTrend(
        durationByType.outdoor,
        prevDurationByType.outdoor,
        countByType.outdoor,
        prevCountByType.outdoor,
      ),
      play: this.calculateTrend(
        durationByType.play,
        prevDurationByType.play,
        countByType.play,
        prevCountByType.play,
      ),
    };

    // Build daily breakdown (only for periods of 30 days or less)
    let dailyBreakdown: DailyActivityBreakdownDto[] | undefined;
    if (periodLengthDays <= 30) {
      dailyBreakdown = Array.from(dailyData.entries())
        .map(([date, data]) => ({
          date,
          totalCount: data.count,
          totalDuration: data.duration,
          countByType: data.countByType,
          durationByType: data.durationByType,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // Get last activity
    const lastActivity = currentEntries.length > 0 && currentEntries[0]
      ? this.toActivityResponse(currentEntries[0])
      : null;

    return {
      period: {
        startDate,
        endDate,
      },
      totalActivities: currentEntries.length,
      totalDurationMinutes: totalDuration,
      countByType,
      durationByType,
      averageDurationByType,
      dailyBreakdown,
      overallTrend,
      trendByType,
      lastActivity,
      daysWithData: dailyData.size,
    };
  }
}
