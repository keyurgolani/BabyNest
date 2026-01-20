import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { GrowthEntry } from '@prisma/client';

import {
  CreateGrowthDto,
  UpdateGrowthDto,
  GrowthResponseDto,
  GrowthListResponseDto,
  GrowthQueryDto,
  GrowthSortField,
  SortOrder,
  PercentileChartQueryDto,
  PercentileChartResponseDto,
  MeasurementTypeEnum,
  ConvertedMeasurementsDto,
  GrowthVelocityQueryDto,
  GrowthVelocityResponseDto,
  VelocityDataPointDto,
  VelocitySummaryDto,
  VelocityTimeUnit,
} from './dto';
import { PercentileService } from './percentile.service';
import { convertGrowthMeasurements } from './unit-conversion';
import { Gender, MeasurementType } from './who-growth-standards';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Growth Service
 * Handles CRUD operations for growth entries
 * Validates: Requirements 6.1, 6.4
 */
@Injectable()
export class GrowthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
    private readonly percentileService: PercentileService,
  ) {}

  /**
   * Transform a growth entry to response DTO
   * @param entry The growth entry from database
   * @param includeConversions Whether to include metric/imperial conversions
   */
  private toGrowthResponse(entry: GrowthEntry, includeConversions: boolean = false): GrowthResponseDto {
    const response: GrowthResponseDto = {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      weight: entry.weight,
      height: entry.height,
      headCircumference: entry.headCircumference,
      weightPercentile: entry.weightPercentile,
      heightPercentile: entry.heightPercentile,
      headPercentile: entry.headPercentile,
      notes: entry.notes,
      timestamp: entry.timestamp,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
    };

    // Add converted measurements if requested
    if (includeConversions) {
      response.convertedMeasurements = convertGrowthMeasurements(
        entry.weight,
        entry.height,
        entry.headCircumference,
      ) as ConvertedMeasurementsDto;
    }

    return response;
  }

  /**
   * Create a new growth entry
   * Validates: Requirements 6.1, 6.2
   */
  async create(
    babyId: string,
    caregiverId: string,
    createGrowthDto: CreateGrowthDto,
  ): Promise<GrowthResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Validate that at least one measurement is provided
    if (
      createGrowthDto.weight === undefined &&
      createGrowthDto.height === undefined &&
      createGrowthDto.headCircumference === undefined
    ) {
      throw new BadRequestException(
        'At least one measurement (weight, height, or headCircumference) must be provided',
      );
    }

    const timestamp = createGrowthDto.timestamp
      ? new Date(createGrowthDto.timestamp)
      : new Date();

    // Get baby details for percentile calculation
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { dateOfBirth: true, gender: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    // Calculate percentiles using WHO growth standards
    const percentiles = this.percentileService.calculateGrowthPercentiles(
      createGrowthDto.weight ?? null,
      createGrowthDto.height ?? null,
      createGrowthDto.headCircumference ?? null,
      baby.dateOfBirth,
      timestamp,
      baby.gender,
    );

    const entry = await this.prisma.growthEntry.create({
      data: {
        babyId,
        caregiverId,
        weight: createGrowthDto.weight ?? null,
        height: createGrowthDto.height ?? null,
        headCircumference: createGrowthDto.headCircumference ?? null,
        notes: createGrowthDto.notes ?? null,
        timestamp,
        // WHO percentiles calculated from growth standards
        weightPercentile: percentiles.weightPercentile,
        heightPercentile: percentiles.heightPercentile,
        headPercentile: percentiles.headPercentile,
      },
    });

    return this.toGrowthResponse(entry);
  }

  /**
   * List growth entries for a baby with filtering and pagination
   * Validates: Requirements 6.1, 12.6
   */
  async findAll(
    babyId: string,
    caregiverId: string,
    query: GrowthQueryDto,
  ): Promise<GrowthListResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Build where clause
    const where: {
      babyId: string;
      isDeleted?: boolean;
      timestamp?: { gte?: Date; lte?: Date };
    } = {
      babyId,
    };

    // Filter by deleted status
    if (!query.includeDeleted) {
      where.isDeleted = false;
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
    const sortField = query.sortBy || GrowthSortField.TIMESTAMP;
    orderBy[sortField] = query.sortOrder || SortOrder.DESC;

    // Calculate pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [entries, total] = await Promise.all([
      this.prisma.growthEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.growthEntry.count({ where }),
    ]);

    return {
      data: entries.map((entry) => this.toGrowthResponse(entry, query.includeConversions)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single growth entry by ID
   * Validates: Requirements 6.1, 6.4
   */
  async findOne(
    babyId: string,
    growthId: string,
    caregiverId: string,
    includeConversions: boolean = false,
  ): Promise<GrowthResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const entry = await this.prisma.growthEntry.findUnique({
      where: { id: growthId },
    });

    if (!entry) {
      throw new NotFoundException('Growth entry not found');
    }

    // Verify the entry belongs to the specified baby
    if (entry.babyId !== babyId) {
      throw new NotFoundException('Growth entry not found');
    }

    return this.toGrowthResponse(entry, includeConversions);
  }

  /**
   * Update a growth entry
   * Validates: Requirements 6.1, 6.2
   */
  async update(
    babyId: string,
    growthId: string,
    caregiverId: string,
    updateGrowthDto: UpdateGrowthDto,
  ): Promise<GrowthResponseDto> {
    // First verify access and that entry exists
    const existingEntry = await this.findOne(babyId, growthId, caregiverId);

    // Build update data
    const updateData: {
      weight?: number | null;
      height?: number | null;
      headCircumference?: number | null;
      timestamp?: Date;
      notes?: string | null;
      weightPercentile?: number | null;
      heightPercentile?: number | null;
      headPercentile?: number | null;
    } = {};

    if (updateGrowthDto.weight !== undefined) {
      updateData.weight = updateGrowthDto.weight;
    }
    if (updateGrowthDto.height !== undefined) {
      updateData.height = updateGrowthDto.height;
    }
    if (updateGrowthDto.headCircumference !== undefined) {
      updateData.headCircumference = updateGrowthDto.headCircumference;
    }
    if (updateGrowthDto.timestamp !== undefined) {
      updateData.timestamp = new Date(updateGrowthDto.timestamp);
    }
    if (updateGrowthDto.notes !== undefined) {
      updateData.notes = updateGrowthDto.notes;
    }

    // Recalculate percentiles if any measurement or timestamp changed
    const measurementsChanged =
      updateGrowthDto.weight !== undefined ||
      updateGrowthDto.height !== undefined ||
      updateGrowthDto.headCircumference !== undefined ||
      updateGrowthDto.timestamp !== undefined;

    if (measurementsChanged) {
      // Get baby details for percentile calculation
      const baby = await this.prisma.baby.findUnique({
        where: { id: babyId },
        select: { dateOfBirth: true, gender: true },
      });

      if (baby) {
        // Use updated values or fall back to existing values
        const weight = updateGrowthDto.weight ?? existingEntry.weight;
        const height = updateGrowthDto.height ?? existingEntry.height;
        const headCircumference =
          updateGrowthDto.headCircumference ?? existingEntry.headCircumference;
        const timestamp = updateData.timestamp ?? existingEntry.timestamp;

        const percentiles = this.percentileService.calculateGrowthPercentiles(
          weight,
          height,
          headCircumference,
          baby.dateOfBirth,
          timestamp,
          baby.gender,
        );

        updateData.weightPercentile = percentiles.weightPercentile;
        updateData.heightPercentile = percentiles.heightPercentile;
        updateData.headPercentile = percentiles.headPercentile;
      }
    }

    const entry = await this.prisma.growthEntry.update({
      where: { id: growthId },
      data: updateData,
    });

    return this.toGrowthResponse(entry);
  }

  /**
   * Soft delete a growth entry
   * Validates: Requirements 6.1
   */
  async remove(
    babyId: string,
    growthId: string,
    caregiverId: string,
  ): Promise<void> {
    // First verify access and that entry exists
    await this.findOne(babyId, growthId, caregiverId);

    // Soft delete by setting isDeleted flag
    await this.prisma.growthEntry.update({
      where: { id: growthId },
      data: { isDeleted: true },
    });
  }

  /**
   * Get WHO percentile chart data for a baby
   * Returns percentile curves and the baby's measurements plotted on the chart
   * Validates: Requirements 6.2
   */
  async getPercentileChartData(
    babyId: string,
    caregiverId: string,
    query: PercentileChartQueryDto,
  ): Promise<PercentileChartResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby details
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { dateOfBirth: true, gender: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    // Map enum to internal type
    const measurementType: MeasurementType =
      query.measurementType === MeasurementTypeEnum.WEIGHT
        ? 'weight'
        : query.measurementType === MeasurementTypeEnum.HEIGHT
          ? 'height'
          : 'headCircumference';

    // Normalize gender
    const gender: Gender =
      baby.gender === 'male' || baby.gender === 'female'
        ? baby.gender
        : 'male';

    // Generate percentile chart data
    const startMonth = query.startMonth ?? 0;
    const endMonth = query.endMonth ?? 24;
    const chartData = this.percentileService.generatePercentileChartData(
      measurementType,
      gender,
      startMonth,
      endMonth,
    );

    // Get baby's growth measurements
    const entries = await this.prisma.growthEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Map measurements to chart format
    const measurements = entries
      .map((entry) => {
        const ageInMonths = this.percentileService.calculateAgeInMonths(
          baby.dateOfBirth,
          entry.timestamp,
        );

        let value: number | null = null;
        let percentile: number | null = null;

        switch (measurementType) {
          case 'weight':
            // Convert grams to kg for chart display
            value = entry.weight !== null ? entry.weight / 1000 : null;
            percentile = entry.weightPercentile;
            break;
          case 'height':
            // Convert mm to cm for chart display
            value = entry.height !== null ? entry.height / 10 : null;
            percentile = entry.heightPercentile;
            break;
          case 'headCircumference':
            // Convert mm to cm for chart display
            value =
              entry.headCircumference !== null
                ? entry.headCircumference / 10
                : null;
            percentile = entry.headPercentile;
            break;
        }

        if (value === null) {
          return null;
        }

        return {
          ageMonths: Math.round(ageInMonths * 10) / 10,
          value: Math.round(value * 100) / 100,
          percentile,
        };
      })
      .filter(
        (m): m is { ageMonths: number; value: number; percentile: number | null } =>
          m !== null,
      );

    // Determine unit based on measurement type
    const unit =
      measurementType === 'weight'
        ? 'kg'
        : 'cm';

    return {
      measurementType: query.measurementType,
      gender: baby.gender,
      unit,
      data: chartData,
      measurements,
    };
  }

  /**
   * Calculate growth velocity between consecutive measurements
   * Validates: Requirements 6.5
   * 
   * Growth velocity is calculated as the change in measurement divided by the time interval.
   * For example, weight velocity = (weight2 - weight1) / days_between
   */
  async getGrowthVelocity(
    babyId: string,
    caregiverId: string,
    query: GrowthVelocityQueryDto,
  ): Promise<GrowthVelocityResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const timeUnit = query.timeUnit || VelocityTimeUnit.WEEK;

    // Get all growth measurements ordered by timestamp
    const entries = await this.prisma.growthEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Calculate velocity between consecutive measurements
    const velocityData: VelocityDataPointDto[] = [];

    for (let i = 1; i < entries.length; i++) {
      const prevEntry = entries[i - 1];
      const currEntry = entries[i];

      if (!prevEntry || !currEntry) continue;

      const velocity = this.calculateVelocityBetweenMeasurements(
        prevEntry,
        currEntry,
        timeUnit,
      );

      velocityData.push(velocity);
    }

    // Calculate summary statistics
    const summary = this.calculateVelocitySummary(velocityData, entries);

    // Generate unit description
    const unitDescription =
      timeUnit === VelocityTimeUnit.DAY
        ? 'grams/day for weight, mm/day for height and head circumference'
        : 'grams/week for weight, mm/week for height and head circumference';

    return {
      babyId,
      timeUnit,
      unitDescription,
      measurementCount: entries.length,
      velocityData,
      summary,
    };
  }

  /**
   * Calculate velocity between two consecutive measurements
   * Property 19: Growth Velocity Calculation
   * For any two consecutive growth measurements, the growth velocity should equal
   * the difference divided by the time interval.
   */
  private calculateVelocityBetweenMeasurements(
    prevEntry: GrowthEntry,
    currEntry: GrowthEntry,
    timeUnit: VelocityTimeUnit,
  ): VelocityDataPointDto {
    // Calculate days between measurements
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysBetween = Math.max(
      1,
      Math.round(
        (currEntry.timestamp.getTime() - prevEntry.timestamp.getTime()) / msPerDay,
      ),
    );

    // Time multiplier: convert from per-day to per-week if needed
    const timeMultiplier = timeUnit === VelocityTimeUnit.WEEK ? 7 : 1;

    // Calculate weight velocity (grams per time unit)
    let weightVelocity: number | null = null;
    let weightChange: number | null = null;
    if (prevEntry.weight !== null && currEntry.weight !== null) {
      weightChange = currEntry.weight - prevEntry.weight;
      weightVelocity = Math.round((weightChange / daysBetween) * timeMultiplier * 100) / 100;
    }

    // Calculate height velocity (mm per time unit)
    let heightVelocity: number | null = null;
    let heightChange: number | null = null;
    if (prevEntry.height !== null && currEntry.height !== null) {
      heightChange = currEntry.height - prevEntry.height;
      heightVelocity = Math.round((heightChange / daysBetween) * timeMultiplier * 100) / 100;
    }

    // Calculate head circumference velocity (mm per time unit)
    let headCircumferenceVelocity: number | null = null;
    let headCircumferenceChange: number | null = null;
    if (prevEntry.headCircumference !== null && currEntry.headCircumference !== null) {
      headCircumferenceChange = currEntry.headCircumference - prevEntry.headCircumference;
      headCircumferenceVelocity =
        Math.round((headCircumferenceChange / daysBetween) * timeMultiplier * 100) / 100;
    }

    return {
      fromDate: prevEntry.timestamp,
      toDate: currEntry.timestamp,
      daysBetween,
      weightVelocity,
      heightVelocity,
      headCircumferenceVelocity,
      weightChange,
      heightChange,
      headCircumferenceChange,
    };
  }

  /**
   * Calculate summary statistics for growth velocity
   */
  private calculateVelocitySummary(
    velocityData: VelocityDataPointDto[],
    entries: GrowthEntry[],
  ): VelocitySummaryDto {
    // Calculate average velocities
    const weightVelocities = velocityData
      .map((v) => v.weightVelocity)
      .filter((v): v is number => v !== null);
    const heightVelocities = velocityData
      .map((v) => v.heightVelocity)
      .filter((v): v is number => v !== null);
    const headVelocities = velocityData
      .map((v) => v.headCircumferenceVelocity)
      .filter((v): v is number => v !== null);

    const averageWeightVelocity =
      weightVelocities.length > 0
        ? Math.round(
            (weightVelocities.reduce((a, b) => a + b, 0) / weightVelocities.length) * 100,
          ) / 100
        : null;

    const averageHeightVelocity =
      heightVelocities.length > 0
        ? Math.round(
            (heightVelocities.reduce((a, b) => a + b, 0) / heightVelocities.length) * 100,
          ) / 100
        : null;

    const averageHeadCircumferenceVelocity =
      headVelocities.length > 0
        ? Math.round(
            (headVelocities.reduce((a, b) => a + b, 0) / headVelocities.length) * 100,
          ) / 100
        : null;

    // Calculate total changes (first to last measurement)
    let totalWeightChange: number | null = null;
    let totalHeightChange: number | null = null;
    let totalHeadCircumferenceChange: number | null = null;

    if (entries.length >= 2) {
      const firstEntry = entries[0];
      const lastEntry = entries[entries.length - 1];

      if (firstEntry && lastEntry) {
        if (firstEntry.weight !== null && lastEntry.weight !== null) {
          totalWeightChange = lastEntry.weight - firstEntry.weight;
        }
        if (firstEntry.height !== null && lastEntry.height !== null) {
          totalHeightChange = lastEntry.height - firstEntry.height;
        }
        if (firstEntry.headCircumference !== null && lastEntry.headCircumference !== null) {
          totalHeadCircumferenceChange =
            lastEntry.headCircumference - firstEntry.headCircumference;
        }
      }
    }

    return {
      averageWeightVelocity,
      averageHeightVelocity,
      averageHeadCircumferenceVelocity,
      totalWeightChange,
      totalHeightChange,
      totalHeadCircumferenceChange,
    };
  }
}
