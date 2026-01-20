import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

import { ActivityType } from './create-activity.dto';

/**
 * Sort order options
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Sortable fields for activity entries
 */
export enum ActivitySortField {
  TIMESTAMP = 'timestamp',
  CREATED_AT = 'createdAt',
  DURATION = 'duration',
  ACTIVITY_TYPE = 'activityType',
}

/**
 * Query parameters for filtering and paginating activity entries
 * Validates: Requirements 12.6
 */
export class ActivityQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by activity type',
    enum: ActivityType,
    example: ActivityType.TUMMY_TIME,
  })
  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType;

  @ApiPropertyOptional({
    description: 'Filter by start date (inclusive)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (inclusive)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Page number (1-indexed) - required for pagination',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    description: 'Number of items per page - required for pagination',
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
    enum: ActivitySortField,
    default: ActivitySortField.TIMESTAMP,
  })
  @IsOptional()
  @IsEnum(ActivitySortField)
  sortBy?: ActivitySortField = ActivitySortField.TIMESTAMP;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Include soft-deleted entries',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean = false;
}
