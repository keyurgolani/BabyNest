import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FeedingEntry } from '@prisma/client';

import {
  CreateFeedingDto,
  UpdateFeedingDto,
  FeedingResponseDto,
  FeedingListResponseDto,
  FeedingQueryDto,
  FeedingSuggestionDto,
  FeedingStatisticsDto,
  FeedingStatisticsQueryDto,
  FeedingType,
  BreastSide,
  PumpSide,
  BottleType,
  FeedingSortField,
  SortOrder,
} from './dto';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';


/**
 * Feeding Service
 * Handles CRUD operations for feeding entries
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
@Injectable()
export class FeedingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
  ) {}

  /**
   * Transform a feeding entry to response DTO
   */
  private toFeedingResponse(entry: FeedingEntry): FeedingResponseDto {
    return {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      type: entry.type as FeedingType,
      timestamp: entry.timestamp,
      leftDuration: entry.leftDuration,
      rightDuration: entry.rightDuration,
      lastSide: entry.lastSide as BreastSide | null,
      amount: entry.amount,
      bottleType: entry.bottleType as BottleType | null,
      pumpedAmount: entry.pumpedAmount,
      pumpSide: entry.pumpSide as PumpSide | null,
      foodType: entry.foodType,
      reaction: entry.reaction,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
    };
  }

  /**
   * Validate type-specific fields for feeding entry
   * Validates: Requirements 3.1, 3.4, 3.5, 3.6
   */
  private validateTypeSpecificFields(dto: CreateFeedingDto | UpdateFeedingDto): void {
    const type = dto.type;

    if (type === FeedingType.BREASTFEEDING) {
      // Breastfeeding should have at least one duration
      if (
        dto.leftDuration === undefined &&
        dto.rightDuration === undefined &&
        dto.lastSide === undefined
      ) {
        // Allow empty breastfeeding entry (timer might be started but not completed)
      }
      // Clear non-breastfeeding fields
      if (dto.amount !== undefined || dto.bottleType !== undefined) {
        throw new BadRequestException(
          'Bottle fields (amount, bottleType) are not allowed for breastfeeding entries',
        );
      }
      if (dto.pumpedAmount !== undefined || dto.pumpSide !== undefined || dto.duration !== undefined) {
        throw new BadRequestException(
          'Pumping fields (pumpedAmount, pumpSide, duration) are not allowed for breastfeeding entries',
        );
      }
      if (dto.foodType !== undefined || dto.reaction !== undefined) {
        throw new BadRequestException(
          'Solid food fields (foodType, reaction) are not allowed for breastfeeding entries',
        );
      }
    } else if (type === FeedingType.BOTTLE) {
      // Bottle should have amount and type
      if (dto.amount === undefined && dto.bottleType === undefined) {
        throw new BadRequestException(
          'Bottle feeding requires at least amount or bottleType',
        );
      }
      // Clear non-bottle fields
      if (dto.leftDuration !== undefined || dto.rightDuration !== undefined || dto.lastSide !== undefined) {
        throw new BadRequestException(
          'Breastfeeding fields (leftDuration, rightDuration, lastSide) are not allowed for bottle entries',
        );
      }
      if (dto.pumpedAmount !== undefined || dto.pumpSide !== undefined || dto.duration !== undefined) {
        throw new BadRequestException(
          'Pumping fields (pumpedAmount, pumpSide, duration) are not allowed for bottle entries',
        );
      }
      if (dto.foodType !== undefined || dto.reaction !== undefined) {
        throw new BadRequestException(
          'Solid food fields (foodType, reaction) are not allowed for bottle entries',
        );
      }
    } else if (type === FeedingType.PUMPING) {
      // Pumping should have at least one field
      if (
        dto.pumpedAmount === undefined &&
        dto.pumpSide === undefined &&
        dto.duration === undefined
      ) {
        throw new BadRequestException(
          'Pumping entry requires at least pumpedAmount, pumpSide, or duration',
        );
      }
      // Clear non-pumping fields
      if (dto.leftDuration !== undefined || dto.rightDuration !== undefined || dto.lastSide !== undefined) {
        throw new BadRequestException(
          'Breastfeeding fields (leftDuration, rightDuration, lastSide) are not allowed for pumping entries',
        );
      }
      if (dto.amount !== undefined || dto.bottleType !== undefined) {
        throw new BadRequestException(
          'Bottle fields (amount, bottleType) are not allowed for pumping entries',
        );
      }
      if (dto.foodType !== undefined || dto.reaction !== undefined) {
        throw new BadRequestException(
          'Solid food fields (foodType, reaction) are not allowed for pumping entries',
        );
      }
    } else if (type === FeedingType.SOLID) {
      // Solid food should have foodType
      if (dto.foodType === undefined) {
        throw new BadRequestException('Solid food entry requires foodType');
      }
      // Clear non-solid fields
      if (dto.leftDuration !== undefined || dto.rightDuration !== undefined || dto.lastSide !== undefined) {
        throw new BadRequestException(
          'Breastfeeding fields (leftDuration, rightDuration, lastSide) are not allowed for solid food entries',
        );
      }
      if (dto.amount !== undefined || dto.bottleType !== undefined) {
        throw new BadRequestException(
          'Bottle fields (amount, bottleType) are not allowed for solid food entries',
        );
      }
      if (dto.pumpedAmount !== undefined || dto.pumpSide !== undefined || dto.duration !== undefined) {
        throw new BadRequestException(
          'Pumping fields (pumpedAmount, pumpSide, duration) are not allowed for solid food entries',
        );
      }
    }
  }

  /**
   * Create a new feeding entry
   * Validates: Requirements 3.1, 3.3, 3.4, 3.5, 3.6
   */
  async create(
    babyId: string,
    caregiverId: string,
    createFeedingDto: CreateFeedingDto,
  ): Promise<FeedingResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Validate type-specific fields
    this.validateTypeSpecificFields(createFeedingDto);

    // Build create data based on type
    const timestamp = createFeedingDto.timestamp
      ? new Date(createFeedingDto.timestamp)
      : new Date();

    const entry = await this.prisma.feedingEntry.create({
      data: {
        babyId,
        caregiverId,
        type: createFeedingDto.type,
        timestamp,
        // Breastfeeding fields
        leftDuration: createFeedingDto.leftDuration ?? null,
        rightDuration: createFeedingDto.rightDuration ?? null,
        lastSide: createFeedingDto.lastSide ?? null,
        // Bottle fields
        amount: createFeedingDto.amount ?? null,
        bottleType: createFeedingDto.bottleType ?? null,
        // Pumping fields - store duration in leftDuration for pumping
        pumpedAmount: createFeedingDto.pumpedAmount ?? null,
        pumpSide: createFeedingDto.pumpSide ?? null,
        // Solid food fields
        foodType: createFeedingDto.foodType ?? null,
        reaction: createFeedingDto.reaction ?? null,
        // Common fields
        notes: createFeedingDto.notes ?? null,
      },
    });

    return this.toFeedingResponse(entry);
  }

  /**
   * List feeding entries for a baby with filtering and pagination
   * Validates: Requirements 3.7, 12.6
   */
  async findAll(
    babyId: string,
    caregiverId: string,
    query: FeedingQueryDto,
  ): Promise<FeedingListResponseDto> {
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
      timestamp?: { gte?: Date; lte?: Date };
    } = {
      babyId,
    };

    // Filter by deleted status
    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    // Filter by type
    if (query.type) {
      where.type = query.type;
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
    const sortField = query.sortBy || FeedingSortField.TIMESTAMP;
    orderBy[sortField] = query.sortOrder || SortOrder.DESC;

    // Calculate pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [entries, total] = await Promise.all([
      this.prisma.feedingEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.feedingEntry.count({ where }),
    ]);

    return {
      data: entries.map((entry) => this.toFeedingResponse(entry)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single feeding entry by ID
   * Validates: Requirements 3.1, 3.4, 3.5, 3.6
   */
  async findOne(
    babyId: string,
    feedingId: string,
    caregiverId: string,
  ): Promise<FeedingResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const entry = await this.prisma.feedingEntry.findUnique({
      where: { id: feedingId },
    });

    if (!entry) {
      throw new NotFoundException('Feeding entry not found');
    }

    // Verify the entry belongs to the specified baby
    if (entry.babyId !== babyId) {
      throw new NotFoundException('Feeding entry not found');
    }

    return this.toFeedingResponse(entry);
  }

  /**
   * Update a feeding entry
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
   */
  async update(
    babyId: string,
    feedingId: string,
    caregiverId: string,
    updateFeedingDto: UpdateFeedingDto,
  ): Promise<FeedingResponseDto> {
    // First verify access and that entry exists
    const existingEntry = await this.findOne(babyId, feedingId, caregiverId);

    // Determine the type for validation (use existing if not provided)
    const effectiveType = updateFeedingDto.type || existingEntry.type;
    const dtoWithType = { ...updateFeedingDto, type: effectiveType };

    // Validate type-specific fields if type is being changed or type-specific fields are provided
    if (updateFeedingDto.type || this.hasTypeSpecificFields(updateFeedingDto)) {
      this.validateTypeSpecificFields(dtoWithType as CreateFeedingDto);
    }

    // Build update data
    const updateData: {
      type?: string;
      timestamp?: Date;
      leftDuration?: number;
      rightDuration?: number;
      lastSide?: string;
      amount?: number;
      bottleType?: string;
      pumpedAmount?: number;
      pumpSide?: string;
      foodType?: string;
      reaction?: string;
      notes?: string;
    } = {};

    if (updateFeedingDto.type !== undefined) {
      updateData.type = updateFeedingDto.type;
    }
    if (updateFeedingDto.timestamp !== undefined) {
      updateData.timestamp = new Date(updateFeedingDto.timestamp);
    }
    if (updateFeedingDto.leftDuration !== undefined) {
      updateData.leftDuration = updateFeedingDto.leftDuration;
    }
    if (updateFeedingDto.rightDuration !== undefined) {
      updateData.rightDuration = updateFeedingDto.rightDuration;
    }
    if (updateFeedingDto.lastSide !== undefined) {
      updateData.lastSide = updateFeedingDto.lastSide;
    }
    if (updateFeedingDto.amount !== undefined) {
      updateData.amount = updateFeedingDto.amount;
    }
    if (updateFeedingDto.bottleType !== undefined) {
      updateData.bottleType = updateFeedingDto.bottleType;
    }
    if (updateFeedingDto.pumpedAmount !== undefined) {
      updateData.pumpedAmount = updateFeedingDto.pumpedAmount;
    }
    if (updateFeedingDto.pumpSide !== undefined) {
      updateData.pumpSide = updateFeedingDto.pumpSide;
    }
    if (updateFeedingDto.foodType !== undefined) {
      updateData.foodType = updateFeedingDto.foodType;
    }
    if (updateFeedingDto.reaction !== undefined) {
      updateData.reaction = updateFeedingDto.reaction;
    }
    if (updateFeedingDto.notes !== undefined) {
      updateData.notes = updateFeedingDto.notes;
    }

    const entry = await this.prisma.feedingEntry.update({
      where: { id: feedingId },
      data: updateData,
    });

    return this.toFeedingResponse(entry);
  }

  /**
   * Check if DTO has any type-specific fields
   */
  private hasTypeSpecificFields(dto: UpdateFeedingDto): boolean {
    return (
      dto.leftDuration !== undefined ||
      dto.rightDuration !== undefined ||
      dto.lastSide !== undefined ||
      dto.amount !== undefined ||
      dto.bottleType !== undefined ||
      dto.pumpedAmount !== undefined ||
      dto.pumpSide !== undefined ||
      dto.duration !== undefined ||
      dto.foodType !== undefined ||
      dto.reaction !== undefined
    );
  }

  /**
   * Soft delete a feeding entry
   * Validates: Requirements 3.1
   */
  async remove(
    babyId: string,
    feedingId: string,
    caregiverId: string,
  ): Promise<void> {
    // First verify access and that entry exists
    await this.findOne(babyId, feedingId, caregiverId);

    // Soft delete by setting isDeleted flag
    await this.prisma.feedingEntry.update({
      where: { id: feedingId },
      data: { isDeleted: true },
    });
  }

  /**
   * Get the last breastfeeding entry for a baby
   * Used for breast side suggestion
   * Validates: Requirements 3.8
   */
  async getLastBreastfeedingEntry(babyId: string): Promise<FeedingEntry | null> {
    return this.prisma.feedingEntry.findFirst({
      where: {
        babyId,
        type: FeedingType.BREASTFEEDING,
        isDeleted: false,
        lastSide: { not: null },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get the suggested next breast side based on the last breastfeeding session
   * If the last session used left, suggest right, and vice versa
   * Validates: Requirements 3.8
   * Property 7: Breast Side Suggestion
   */
  async getSuggestion(
    babyId: string,
    caregiverId: string,
  ): Promise<FeedingSuggestionDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const lastBreastfeeding = await this.getLastBreastfeedingEntry(babyId);

    if (!lastBreastfeeding || !lastBreastfeeding.lastSide) {
      return {
        suggestedNextSide: null,
        lastUsedSide: null,
        lastBreastfeedingTime: null,
        hasPreviousBreastfeeding: false,
      };
    }

    // Alternate the side: if last was left, suggest right; if last was right, suggest left
    const lastSide = lastBreastfeeding.lastSide as BreastSide;
    const suggestedNextSide = lastSide === BreastSide.LEFT 
      ? BreastSide.RIGHT 
      : BreastSide.LEFT;

    return {
      suggestedNextSide,
      lastUsedSide: lastSide,
      lastBreastfeedingTime: lastBreastfeeding.timestamp,
      hasPreviousBreastfeeding: true,
    };
  }

  /**
   * Get feeding statistics for a baby within a date range
   * Calculates totals, averages, counts by type
   * Validates: Requirements 3.7
   * Property 8: Feeding Statistics Calculation
   */
  async getStatistics(
    babyId: string,
    caregiverId: string,
    query: FeedingStatisticsQueryDto,
  ): Promise<FeedingStatisticsDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Determine date range (default to last 7 days if not specified)
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Build where clause for the date range
    const where = {
      babyId,
      isDeleted: false,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get all feeding entries in the date range
    const entries = await this.prisma.feedingEntry.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    // Calculate counts by type
    const byType = {
      breastfeeding: 0,
      bottle: 0,
      pumping: 0,
      solid: 0,
    };

    // Accumulators for averages
    let totalBreastfeedingDuration = 0;
    let breastfeedingCount = 0;
    let totalBottleAmount = 0;
    let bottleCount = 0;
    let totalPumpedAmount = 0;
    let pumpingCount = 0;

    for (const entry of entries) {
      // Count by type
      switch (entry.type) {
        case FeedingType.BREASTFEEDING: {
          byType.breastfeeding++;
          // Calculate total duration (left + right)
          const leftDuration = entry.leftDuration ?? 0;
          const rightDuration = entry.rightDuration ?? 0;
          const totalDuration = leftDuration + rightDuration;
          if (totalDuration > 0) {
            totalBreastfeedingDuration += totalDuration;
            breastfeedingCount++;
          }
          break;
        }
        case FeedingType.BOTTLE:
          byType.bottle++;
          if (entry.amount !== null && entry.amount > 0) {
            totalBottleAmount += entry.amount;
            bottleCount++;
          }
          break;
        case FeedingType.PUMPING:
          byType.pumping++;
          if (entry.pumpedAmount !== null && entry.pumpedAmount > 0) {
            totalPumpedAmount += entry.pumpedAmount;
            pumpingCount++;
          }
          break;
        case FeedingType.SOLID:
          byType.solid++;
          break;
      }
    }

    // Calculate averages
    const averageBreastfeedingDuration =
      breastfeedingCount > 0
        ? Math.round(totalBreastfeedingDuration / breastfeedingCount)
        : null;

    const averageBottleAmount =
      bottleCount > 0 ? Math.round(totalBottleAmount / bottleCount) : null;

    const averagePumpedAmount =
      pumpingCount > 0 ? Math.round(totalPumpedAmount / pumpingCount) : null;

    // Get last feeding entry
    const lastFeeding = entries.length > 0 && entries[0] ? this.toFeedingResponse(entries[0]) : null;

    // Get suggested next breast side
    const suggestion = await this.getSuggestion(babyId, caregiverId);

    return {
      period: {
        startDate,
        endDate,
      },
      totalFeedings: entries.length,
      byType,
      averageBreastfeedingDuration,
      averageBottleAmount,
      averagePumpedAmount,
      lastFeeding,
      suggestedNextSide: suggestion.suggestedNextSide,
    };
  }
}
