import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MilestoneEntry } from '@prisma/client';

import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  MilestoneEntryResponseDto,
  MilestoneEntryListResponseDto,
  MilestoneQueryDto,
  MilestoneSortField,
  SortOrder,
  MilestonesByCategoryQueryDto,
  MilestonesByCategoryResponseDto,
  MilestoneWithStatusDto,
  MilestoneDefinitionResponseDto,
  MilestoneDefinitionQueryDto,
  MilestoneCategory,
  MilestoneProgressResponseDto,
  UpcomingMilestonesResponseDto,
  UpcomingMilestoneDto,
} from './dto';
import {
  MILESTONE_DEFINITIONS,
  MILESTONE_DEFINITIONS_MAP,
  MilestoneDefinitionData,
} from './milestone-definitions';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';


/**
 * Milestone Service
 * Handles CRUD operations for milestone entries and definitions
 * Validates: Requirements 7.1, 7.2, 7.4, 7.5
 */
@Injectable()
export class MilestoneService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
  ) {}

  /**
   * Calculate age in months from date of birth to a given date
   */
  calculateAgeInMonths(dateOfBirth: Date, targetDate: Date): number {
    const birthDate = new Date(dateOfBirth);
    const target = new Date(targetDate);
    
    const yearsDiff = target.getFullYear() - birthDate.getFullYear();
    const monthsDiff = target.getMonth() - birthDate.getMonth();
    const daysDiff = target.getDate() - birthDate.getDate();
    
    let totalMonths = yearsDiff * 12 + monthsDiff;
    
    // Adjust for partial months
    if (daysDiff < 0) {
      totalMonths -= 1;
    }
    
    // Add fractional month based on days
    const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    const fractionalMonth = (daysDiff >= 0 ? daysDiff : daysInMonth + daysDiff) / daysInMonth;
    
    return Math.round((totalMonths + fractionalMonth) * 10) / 10;
  }

  /**
   * Transform a milestone entry to response DTO
   */
  private toMilestoneEntryResponse(
    entry: MilestoneEntry,
    includeDefinition: boolean = true,
  ): MilestoneEntryResponseDto {
    const response: MilestoneEntryResponseDto = {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      milestoneId: entry.milestoneId,
      achievedDate: entry.achievedDate,
      photoUrl: entry.photoUrl,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
    };

    if (includeDefinition) {
      const definition = MILESTONE_DEFINITIONS_MAP.get(entry.milestoneId);
      if (definition) {
        response.milestone = this.toMilestoneDefinitionResponse(definition);
      }
    }

    return response;
  }

  /**
   * Transform a milestone definition to response DTO
   */
  private toMilestoneDefinitionResponse(
    definition: MilestoneDefinitionData,
  ): MilestoneDefinitionResponseDto {
    return {
      id: definition.id,
      category: definition.category,
      name: definition.name,
      description: definition.description,
      expectedAgeMonthsMin: definition.expectedAgeMonthsMin,
      expectedAgeMonthsMax: definition.expectedAgeMonthsMax,
    };
  }

  /**
   * Get all milestone definitions from static data
   * Validates: Requirements 7.1
   */
  async getDefinitions(
    query: MilestoneDefinitionQueryDto,
  ): Promise<MilestoneDefinitionResponseDto[]> {
    let definitions = [...MILESTONE_DEFINITIONS];

    if (query.category) {
      definitions = definitions.filter((d) => d.category === query.category);
    }

    if (query.minAgeMonths !== undefined) {
      definitions = definitions.filter((d) => d.expectedAgeMonthsMin >= query.minAgeMonths!);
    }

    if (query.maxAgeMonths !== undefined) {
      definitions = definitions.filter((d) => d.expectedAgeMonthsMax <= query.maxAgeMonths!);
    }

    // Sort by expectedAgeMonthsMin, then category, then name
    definitions.sort((a, b) => {
      if (a.expectedAgeMonthsMin !== b.expectedAgeMonthsMin) {
        return a.expectedAgeMonthsMin - b.expectedAgeMonthsMin;
      }
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return definitions.map((d) => this.toMilestoneDefinitionResponse(d));
  }

  /**
   * Get a single milestone definition by ID from static data
   */
  async getDefinition(definitionId: string): Promise<MilestoneDefinitionResponseDto> {
    const definition = MILESTONE_DEFINITIONS_MAP.get(definitionId);

    if (!definition) {
      throw new NotFoundException('Milestone definition not found');
    }

    return this.toMilestoneDefinitionResponse(definition);
  }

  /**
   * Mark a milestone as achieved
   * Validates: Requirements 7.2
   */
  async create(
    babyId: string,
    caregiverId: string,
    createMilestoneDto: CreateMilestoneDto,
  ): Promise<MilestoneEntryResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Verify milestone definition exists in static data
    const definition = MILESTONE_DEFINITIONS_MAP.get(createMilestoneDto.milestoneId);

    if (!definition) {
      throw new NotFoundException('Milestone definition not found');
    }

    // Check if milestone is already achieved for this baby
    const existingEntry = await this.prisma.milestoneEntry.findFirst({
      where: {
        babyId,
        milestoneId: createMilestoneDto.milestoneId,
        isDeleted: false,
      },
    });

    if (existingEntry) {
      throw new BadRequestException('This milestone has already been achieved');
    }

    const achievedDate = createMilestoneDto.achievedDate
      ? new Date(createMilestoneDto.achievedDate)
      : new Date();

    const entry = await this.prisma.milestoneEntry.create({
      data: {
        babyId,
        caregiverId,
        milestoneId: createMilestoneDto.milestoneId,
        achievedDate,
        photoUrl: createMilestoneDto.photoUrl ?? null,
        notes: createMilestoneDto.notes ?? null,
        timestamp: achievedDate,
      },
    });

    return this.toMilestoneEntryResponse(entry);
  }

  /**
   * List achieved milestones for a baby with filtering and pagination
   * Validates: Requirements 7.2, 12.6
   */
  async findAll(
    babyId: string,
    caregiverId: string,
    query: MilestoneQueryDto,
  ): Promise<MilestoneEntryListResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Build where clause
    const where: {
      babyId: string;
      isDeleted?: boolean;
      achievedDate?: { gte?: Date; lte?: Date };
      milestone?: { category?: string };
    } = {
      babyId,
    };

    // Filter by deleted status
    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      where.achievedDate = {};
      if (query.startDate) {
        where.achievedDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.achievedDate.lte = new Date(query.endDate);
      }
    }

    // Filter by category
    if (query.category) {
      where.milestone = { category: query.category };
    }

    // Build order by
    const orderBy: Record<string, SortOrder> = {};
    const sortField = query.sortBy || MilestoneSortField.ACHIEVED_DATE;
    orderBy[sortField] = query.sortOrder || SortOrder.DESC;

    // Calculate pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const includeDefinition = query.includeDefinition !== false;

    // Execute queries
    const [entries, total] = await Promise.all([
      this.prisma.milestoneEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.milestoneEntry.count({ where }),
    ]);

    return {
      data: entries.map((entry) =>
        this.toMilestoneEntryResponse(entry, includeDefinition),
      ),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single milestone entry by ID
   * Validates: Requirements 7.2
   */
  async findOne(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<MilestoneEntryResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const entry = await this.prisma.milestoneEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Milestone entry not found');
    }

    // Verify the entry belongs to the specified baby
    if (entry.babyId !== babyId) {
      throw new NotFoundException('Milestone entry not found');
    }

    return this.toMilestoneEntryResponse(entry);
  }

  /**
   * Update a milestone entry
   * Validates: Requirements 7.2
   */
  async update(
    babyId: string,
    entryId: string,
    caregiverId: string,
    updateMilestoneDto: UpdateMilestoneDto,
  ): Promise<MilestoneEntryResponseDto> {
    // First verify access and that entry exists
    await this.findOne(babyId, entryId, caregiverId);

    // Build update data
    const updateData: {
      achievedDate?: Date;
      photoUrl?: string | null;
      notes?: string | null;
      timestamp?: Date;
    } = {};

    if (updateMilestoneDto.achievedDate !== undefined) {
      updateData.achievedDate = new Date(updateMilestoneDto.achievedDate);
      updateData.timestamp = updateData.achievedDate;
    }
    if (updateMilestoneDto.photoUrl !== undefined) {
      updateData.photoUrl = updateMilestoneDto.photoUrl;
    }
    if (updateMilestoneDto.notes !== undefined) {
      updateData.notes = updateMilestoneDto.notes;
    }

    const entry = await this.prisma.milestoneEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    return this.toMilestoneEntryResponse(entry);
  }

  /**
   * Soft delete a milestone entry
   * Validates: Requirements 7.2
   */
  async remove(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<void> {
    // First verify access and that entry exists
    await this.findOne(babyId, entryId, caregiverId);

    // Soft delete by setting isDeleted flag
    await this.prisma.milestoneEntry.update({
      where: { id: entryId },
      data: { isDeleted: true },
    });
  }

  /**
   * Get milestones organized by category with achievement status
   * Validates: Requirements 7.1, 7.4, 7.5
   */
  async getMilestonesByCategory(
    babyId: string,
    caregiverId: string,
    query: MilestonesByCategoryQueryDto,
  ): Promise<MilestonesByCategoryResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby details for age calculation
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { dateOfBirth: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    const babyAgeMonths = this.calculateAgeInMonths(baby.dateOfBirth, new Date());

    // Get milestone definitions from static data
    let definitions = [...MILESTONE_DEFINITIONS];
    if (query.category) {
      definitions = definitions.filter((d) => d.category === query.category);
    }

    // Sort by expectedAgeMonthsMin, then name
    definitions.sort((a, b) => {
      if (a.expectedAgeMonthsMin !== b.expectedAgeMonthsMin) {
        return a.expectedAgeMonthsMin - b.expectedAgeMonthsMin;
      }
      return a.name.localeCompare(b.name);
    });

    // Get all achieved milestones for this baby
    const achievedEntries = await this.prisma.milestoneEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
      },
    });

    // Create a map of achieved milestones
    const achievedMap = new Map<string, MilestoneEntry>();
    for (const entry of achievedEntries) {
      achievedMap.set(entry.milestoneId, entry);
    }

    // Build milestones with status
    const milestonesWithStatus: MilestoneWithStatusDto[] = [];

    for (const definition of definitions) {
      const achievement = achievedMap.get(definition.id);
      const isAchieved = !!achievement;
      
      // Milestone is upcoming if baby hasn't reached the minimum expected age
      const isUpcoming = !isAchieved && babyAgeMonths < definition.expectedAgeMonthsMin;
      
      // Milestone is delayed if baby is past the maximum expected age and hasn't achieved it
      const isDelayed = !isAchieved && babyAgeMonths > definition.expectedAgeMonthsMax;

      // Filter based on query parameters
      if (query.includeAchieved === false && isAchieved) continue;
      if (query.includeUpcoming === false && isUpcoming) continue;
      
      // Age appropriate filter: only show milestones where baby is within or past the expected range
      if (query.ageAppropriate && isUpcoming) continue;

      let achievedAgeMonths: number | null = null;
      if (achievement) {
        achievedAgeMonths = this.calculateAgeInMonths(baby.dateOfBirth, achievement.achievedDate);
      }

      milestonesWithStatus.push({
        definition: this.toMilestoneDefinitionResponse(definition),
        isAchieved,
        achievement: achievement ? this.toMilestoneEntryResponse(achievement, false) : null,
        isUpcoming,
        isDelayed,
        achievedAgeMonths,
      });
    }

    // Group by category
    const motor = milestonesWithStatus.filter((m) => m.definition.category === MilestoneCategory.MOTOR);
    const cognitive = milestonesWithStatus.filter((m) => m.definition.category === MilestoneCategory.COGNITIVE);
    const social = milestonesWithStatus.filter((m) => m.definition.category === MilestoneCategory.SOCIAL);
    const language = milestonesWithStatus.filter((m) => m.definition.category === MilestoneCategory.LANGUAGE);

    // Calculate summary
    const totalMilestones = milestonesWithStatus.length;
    const achievedCount = milestonesWithStatus.filter((m) => m.isAchieved).length;
    const upcomingCount = milestonesWithStatus.filter((m) => m.isUpcoming).length;
    const delayedCount = milestonesWithStatus.filter((m) => m.isDelayed).length;

    return {
      babyId,
      babyAgeMonths,
      motor,
      cognitive,
      social,
      language,
      summary: {
        totalMilestones,
        achievedCount,
        upcomingCount,
        delayedCount,
      },
    };
  }

  /**
   * Get overall milestone progress percentage
   */
  async getMilestoneProgress(
    babyId: string,
    caregiverId: string,
  ): Promise<MilestoneProgressResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby details for age calculation
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { dateOfBirth: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    const babyAgeMonths = this.calculateAgeInMonths(baby.dateOfBirth, new Date());

    // Get all milestone definitions
    const allDefinitions = [...MILESTONE_DEFINITIONS];

    // Filter to age-appropriate milestones (baby has reached minimum expected age)
    const ageAppropriateMilestones = allDefinitions.filter(
      (d) => babyAgeMonths >= d.expectedAgeMonthsMin,
    );

    // Get all achieved milestones for this baby
    const achievedEntries = await this.prisma.milestoneEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
      },
      select: { milestoneId: true },
    });

    const achievedIds = new Set(achievedEntries.map((e) => e.milestoneId));

    // Calculate overall progress
    const totalMilestones = ageAppropriateMilestones.length;
    const achievedMilestones = ageAppropriateMilestones.filter((m) =>
      achievedIds.has(m.id),
    ).length;
    const progressPercentage =
      totalMilestones > 0 ? (achievedMilestones / totalMilestones) * 100 : 0;

    // Calculate progress by category
    const progressByCategory = {
      motor: 0,
      cognitive: 0,
      social: 0,
      language: 0,
    };

    for (const category of Object.keys(progressByCategory)) {
      const categoryMilestones = ageAppropriateMilestones.filter(
        (m) => m.category === category,
      );
      const categoryAchieved = categoryMilestones.filter((m) => achievedIds.has(m.id)).length;
      progressByCategory[category as keyof typeof progressByCategory] =
        categoryMilestones.length > 0
          ? (categoryAchieved / categoryMilestones.length) * 100
          : 0;
    }

    return {
      babyId,
      babyAgeMonths,
      totalMilestones,
      achievedMilestones,
      progressPercentage: Math.round(progressPercentage * 10) / 10,
      progressByCategory: {
        motor: Math.round(progressByCategory.motor * 10) / 10,
        cognitive: Math.round(progressByCategory.cognitive * 10) / 10,
        social: Math.round(progressByCategory.social * 10) / 10,
        language: Math.round(progressByCategory.language * 10) / 10,
      },
    };
  }

  /**
   * Get upcoming milestones (next expected milestones)
   */
  async getUpcomingMilestones(
    babyId: string,
    caregiverId: string,
  ): Promise<UpcomingMilestonesResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby details for age calculation
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { dateOfBirth: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    const babyAgeMonths = this.calculateAgeInMonths(baby.dateOfBirth, new Date());

    // Get all milestone definitions
    const allDefinitions = [...MILESTONE_DEFINITIONS];

    // Get all achieved milestones for this baby
    const achievedEntries = await this.prisma.milestoneEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
      },
      select: { milestoneId: true },
    });

    const achievedIds = new Set(achievedEntries.map((e) => e.milestoneId));

    // Filter to upcoming milestones (not achieved and baby hasn't reached minimum expected age yet)
    const upcomingMilestones: UpcomingMilestoneDto[] = allDefinitions
      .filter((d) => !achievedIds.has(d.id) && babyAgeMonths < d.expectedAgeMonthsMin)
      .map((d) => {
        const monthsUntilExpected = d.expectedAgeMonthsMin - babyAgeMonths;
        return {
          definition: this.toMilestoneDefinitionResponse(d),
          monthsUntilExpected: Math.round(monthsUntilExpected * 10) / 10,
          isImminent: monthsUntilExpected <= 3,
        };
      })
      .sort((a, b) => a.monthsUntilExpected - b.monthsUntilExpected);

    return {
      babyId,
      babyAgeMonths,
      upcomingMilestones,
      total: upcomingMilestones.length,
    };
  }
}
