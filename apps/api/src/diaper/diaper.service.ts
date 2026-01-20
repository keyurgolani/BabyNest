import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DiaperEntry } from '@prisma/client';

import {
  CreateDiaperDto,
  UpdateDiaperDto,
  DiaperResponseDto,
  DiaperListResponseDto,
  DiaperQueryDto,
  DiaperType,
  DiaperSortField,
  SortOrder,
  DiaperStatisticsDto,
  DiaperStatisticsQueryDto,
  DailyDiaperBreakdownDto,
  HydrationAlertDto,
} from './dto';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';


/**
 * Diaper Service
 * Handles CRUD operations for diaper entries
 * Validates: Requirements 5.1, 5.2
 */
@Injectable()
export class DiaperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
  ) {}

  /**
   * Transform a diaper entry to response DTO
   */
  private toDiaperResponse(entry: DiaperEntry): DiaperResponseDto {
    return {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      type: entry.type as DiaperType,
      color: entry.color,
      consistency: entry.consistency,
      hasRash: entry.hasRash,
      notes: entry.notes,
      timestamp: entry.timestamp,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
    };
  }

  /**
   * Create a new diaper entry
   * Validates: Requirements 5.1, 5.2
   */
  async create(
    babyId: string,
    caregiverId: string,
    createDiaperDto: CreateDiaperDto,
  ): Promise<DiaperResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const timestamp = createDiaperDto.timestamp
      ? new Date(createDiaperDto.timestamp)
      : new Date();

    const entry = await this.prisma.diaperEntry.create({
      data: {
        babyId,
        caregiverId,
        type: createDiaperDto.type,
        color: createDiaperDto.color ?? null,
        consistency: createDiaperDto.consistency ?? null,
        hasRash: createDiaperDto.hasRash ?? false,
        notes: createDiaperDto.notes ?? null,
        timestamp,
      },
    });

    return this.toDiaperResponse(entry);
  }

  /**
   * List diaper entries for a baby with filtering and pagination
   * Validates: Requirements 5.3, 12.6
   */
  async findAll(
    babyId: string,
    caregiverId: string,
    query: DiaperQueryDto,
  ): Promise<DiaperListResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Build where clause
    const where: {
      babyId: string;
      isDeleted?: boolean;
      type?: string;
      hasRash?: boolean;
      timestamp?: { gte?: Date; lte?: Date };
    } = {
      babyId,
    };

    // Filter by deleted status
    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    // Filter by diaper type
    if (query.type) {
      where.type = query.type;
    }

    // Filter by rash presence
    if (query.hasRash !== undefined) {
      where.hasRash = query.hasRash;
    }

    // Filter by date range
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
    const sortField = query.sortBy || DiaperSortField.TIMESTAMP;
    orderBy[sortField] = query.sortOrder || SortOrder.DESC;

    // Calculate pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [entries, total] = await Promise.all([
      this.prisma.diaperEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.diaperEntry.count({ where }),
    ]);

    return {
      data: entries.map((entry) => this.toDiaperResponse(entry)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single diaper entry by ID
   * Validates: Requirements 5.1, 5.2
   */
  async findOne(
    babyId: string,
    diaperId: string,
    caregiverId: string,
  ): Promise<DiaperResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const entry = await this.prisma.diaperEntry.findUnique({
      where: { id: diaperId },
    });

    if (!entry) {
      throw new NotFoundException('Diaper entry not found');
    }

    // Verify the entry belongs to the specified baby
    if (entry.babyId !== babyId) {
      throw new NotFoundException('Diaper entry not found');
    }

    return this.toDiaperResponse(entry);
  }

  /**
   * Update a diaper entry
   * Validates: Requirements 5.1, 5.2
   */
  async update(
    babyId: string,
    diaperId: string,
    caregiverId: string,
    updateDiaperDto: UpdateDiaperDto,
  ): Promise<DiaperResponseDto> {
    // First verify access and that entry exists
    await this.findOne(babyId, diaperId, caregiverId);

    // Build update data
    const updateData: {
      type?: string;
      timestamp?: Date;
      color?: string | null;
      consistency?: string | null;
      hasRash?: boolean;
      notes?: string | null;
    } = {};

    if (updateDiaperDto.type !== undefined) {
      updateData.type = updateDiaperDto.type;
    }
    if (updateDiaperDto.timestamp !== undefined) {
      updateData.timestamp = new Date(updateDiaperDto.timestamp);
    }
    if (updateDiaperDto.color !== undefined) {
      updateData.color = updateDiaperDto.color;
    }
    if (updateDiaperDto.consistency !== undefined) {
      updateData.consistency = updateDiaperDto.consistency;
    }
    if (updateDiaperDto.hasRash !== undefined) {
      updateData.hasRash = updateDiaperDto.hasRash;
    }
    if (updateDiaperDto.notes !== undefined) {
      updateData.notes = updateDiaperDto.notes;
    }

    const entry = await this.prisma.diaperEntry.update({
      where: { id: diaperId },
      data: updateData,
    });

    return this.toDiaperResponse(entry);
  }

  /**
   * Soft delete a diaper entry
   * Validates: Requirements 5.1
   */
  async remove(
    babyId: string,
    diaperId: string,
    caregiverId: string,
  ): Promise<void> {
    // First verify access and that entry exists
    await this.findOne(babyId, diaperId, caregiverId);

    // Soft delete by setting isDeleted flag
    await this.prisma.diaperEntry.update({
      where: { id: diaperId },
      data: { isDeleted: true },
    });
  }

  /**
   * Get the date string (YYYY-MM-DD) for a given date
   */
  private getDateString(date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr ?? '';
  }

  /**
   * Calculate baby's age in months from date of birth
   * Used for determining hydration thresholds
   */
  private calculateAgeInMonths(dateOfBirth: Date): number {
    const now = new Date();
    const years = now.getFullYear() - dateOfBirth.getFullYear();
    const months = now.getMonth() - dateOfBirth.getMonth();
    const totalMonths = years * 12 + months;
    
    // Adjust if the day of month hasn't been reached yet
    if (now.getDate() < dateOfBirth.getDate()) {
      return Math.max(0, totalMonths - 1);
    }
    return Math.max(0, totalMonths);
  }

  /**
   * Get the expected minimum wet diapers per day based on baby's age
   * Hydration thresholds (based on baby age):
   * - Newborn (0-1 month): 6+ wet diapers per day
   * - 1-6 months: 6+ wet diapers per day
   * - 6+ months: 4+ wet diapers per day
   * Validates: Requirements 5.4
   * Property 15: Hydration Alert Threshold
   */
  private getHydrationThreshold(ageInMonths: number): { minimum: number; category: string } {
    if (ageInMonths < 1) {
      return { minimum: 6, category: 'Newborn (0-1 month)' };
    } else if (ageInMonths < 6) {
      return { minimum: 6, category: '1-6 months' };
    } else {
      return { minimum: 4, category: '6+ months' };
    }
  }

  /**
   * Calculate hydration alert based on wet diaper count in last 24 hours
   * Validates: Requirements 5.4
   * Property 15: Hydration Alert Threshold
   */
  private calculateHydrationAlert(
    wetCount24h: number,
    ageInMonths: number,
  ): HydrationAlertDto {
    const threshold = this.getHydrationThreshold(ageInMonths);
    const isAlert = wetCount24h < threshold.minimum;

    return {
      isAlert,
      wetCount24h,
      expectedMinimum: threshold.minimum,
      ageCategory: threshold.category,
      alertMessage: isAlert
        ? `Only ${wetCount24h} wet diaper${wetCount24h !== 1 ? 's' : ''} in the last 24 hours. Expected at least ${threshold.minimum} for ${threshold.category}. Consider consulting a pediatrician if this persists.`
        : null,
    };
  }

  /**
   * Get diaper statistics for a baby within a date range
   * Calculates daily counts by type and hydration alert
   * Validates: Requirements 5.3, 5.4
   * Property 14: Diaper Statistics Calculation
   * Property 15: Hydration Alert Threshold
   */
  async getStatistics(
    babyId: string,
    caregiverId: string,
    query: DiaperStatisticsQueryDto,
  ): Promise<DiaperStatisticsDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby's date of birth for age-based hydration threshold
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { dateOfBirth: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    const ageInMonths = this.calculateAgeInMonths(baby.dateOfBirth);

    // Determine date range for statistics
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
    const where = {
      babyId,
      isDeleted: false,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get all diaper entries in the date range
    const entries = await this.prisma.diaperEntry.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    // Initialize counters for counts by type
    const byType = {
      wet: 0,
      dirty: 0,
      mixed: 0,
      dry: 0,
    };

    // Daily breakdown map
    const dailyBreakdown = new Map<string, DailyDiaperBreakdownDto>();

    // Process each entry
    for (const entry of entries) {
      // Count by type
      const type = entry.type as DiaperType;
      if (type in byType) {
        byType[type as keyof typeof byType]++;
      }

      // Add to daily breakdown
      const dateStr = this.getDateString(entry.timestamp);
      if (!dailyBreakdown.has(dateStr)) {
        dailyBreakdown.set(dateStr, {
          date: dateStr,
          totalChanges: 0,
          wetCount: 0,
          dirtyCount: 0,
          mixedCount: 0,
          dryCount: 0,
        });
      }

      const dayStats = dailyBreakdown.get(dateStr)!;
      dayStats.totalChanges++;

      switch (type) {
        case DiaperType.WET:
          dayStats.wetCount++;
          break;
        case DiaperType.DIRTY:
          dayStats.dirtyCount++;
          break;
        case DiaperType.MIXED:
          dayStats.mixedCount++;
          break;
        case DiaperType.DRY:
          dayStats.dryCount++;
          break;
      }
    }

    // Calculate wet count in last 24 hours for hydration alert
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const wetCount24h = await this.prisma.diaperEntry.count({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: twentyFourHoursAgo,
          lte: now,
        },
        type: {
          in: [DiaperType.WET, DiaperType.MIXED], // Mixed diapers also count as wet
        },
      },
    });

    // Calculate hydration alert
    const hydrationAlert = this.calculateHydrationAlert(wetCount24h, ageInMonths);

    // Calculate totals and averages
    const totalChanges = entries.length;
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const daysWithData = dailyBreakdown.size;
    const averageChangesPerDay = periodDays > 0
      ? Math.round(totalChanges / periodDays)
      : 0;

    // Get last diaper entry
    const lastDiaper = entries.length > 0 && entries[0]
      ? this.toDiaperResponse(entries[0])
      : null;

    // Convert daily breakdown map to sorted array
    const dailyBreakdownArray = Array.from(dailyBreakdown.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: {
        startDate,
        endDate,
      },
      totalChanges,
      byType,
      hydrationAlert,
      lastDiaper,
      dailyBreakdown: dailyBreakdownArray,
      daysWithData,
      averageChangesPerDay,
    };
  }
}
