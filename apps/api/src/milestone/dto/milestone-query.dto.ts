import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';

import { MilestoneCategory } from './milestone-response.dto';

/**
 * Sort fields for milestone entries
 */
export enum MilestoneSortField {
  ACHIEVED_DATE = 'achievedDate',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Sort order
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Query DTO for listing milestone entries
 * Validates: Requirements 12.6
 */
export class MilestoneQueryDto {
  @ApiProperty({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: MilestoneSortField,
    default: MilestoneSortField.ACHIEVED_DATE,
  })
  @IsOptional()
  @IsEnum(MilestoneSortField)
  sortBy?: MilestoneSortField;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @ApiPropertyOptional({
    description: 'Filter by milestone category',
    enum: MilestoneCategory,
  })
  @IsOptional()
  @IsEnum(MilestoneCategory)
  category?: MilestoneCategory;

  @ApiPropertyOptional({
    description: 'Filter by start date (achieved date)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (achieved date)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Include soft-deleted entries',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean;

  @ApiPropertyOptional({
    description: 'Include milestone definition details in response',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDefinition?: boolean;
}

/**
 * Query DTO for getting milestones by category with status
 * Validates: Requirements 7.1, 7.4
 */
export class MilestonesByCategoryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by milestone category (returns all categories if not specified)',
    enum: MilestoneCategory,
  })
  @IsOptional()
  @IsEnum(MilestoneCategory)
  category?: MilestoneCategory;

  @ApiPropertyOptional({
    description: 'Only show milestones within age range (based on baby current age)',
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  ageAppropriate?: boolean;

  @ApiPropertyOptional({
    description: 'Include achieved milestones',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeAchieved?: boolean;

  @ApiPropertyOptional({
    description: 'Include upcoming milestones (not yet in expected age range)',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeUpcoming?: boolean;
}

/**
 * Query DTO for listing milestone definitions
 */
export class MilestoneDefinitionQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by milestone category',
    enum: MilestoneCategory,
  })
  @IsOptional()
  @IsEnum(MilestoneCategory)
  category?: MilestoneCategory;

  @ApiPropertyOptional({
    description: 'Filter by minimum expected age in months',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAgeMonths?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum expected age in months',
    example: 24,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAgeMonths?: number;
}
