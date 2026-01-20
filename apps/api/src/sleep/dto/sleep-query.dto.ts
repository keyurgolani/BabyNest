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

import { SleepType } from './create-sleep.dto';

/**
 * Sort order options
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Sortable fields for sleep entries
 */
export enum SleepSortField {
  START_TIME = 'startTime',
  END_TIME = 'endTime',
  CREATED_AT = 'createdAt',
  DURATION = 'duration',
  SLEEP_TYPE = 'sleepType',
}

/**
 * Query parameters for filtering and paginating sleep entries
 * Validates: Requirements 12.6
 */
export class SleepQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by sleep type',
    enum: SleepType,
    example: SleepType.NAP,
  })
  @IsOptional()
  @IsEnum(SleepType)
  sleepType?: SleepType;

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

  @ApiPropertyOptional({
    description: 'Filter for ongoing sleep sessions only',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  ongoingOnly?: boolean = false;

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
    enum: SleepSortField,
    default: SleepSortField.START_TIME,
  })
  @IsOptional()
  @IsEnum(SleepSortField)
  sortBy?: SleepSortField = SleepSortField.START_TIME;

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
