import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

import { DiaperType } from './create-diaper.dto';

/**
 * Sort order options
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Sortable fields for diaper entries
 */
export enum DiaperSortField {
  TIMESTAMP = 'timestamp',
  CREATED_AT = 'createdAt',
  TYPE = 'type',
}

/**
 * Query parameters for filtering and paginating diaper entries
 * Validates: Requirements 12.6
 */
export class DiaperQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by diaper type',
    enum: DiaperType,
    example: DiaperType.WET,
  })
  @IsOptional()
  @IsEnum(DiaperType)
  type?: DiaperType;

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
    description: 'Filter by diaper rash presence',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasRash?: boolean;

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
    enum: DiaperSortField,
    default: DiaperSortField.TIMESTAMP,
  })
  @IsOptional()
  @IsEnum(DiaperSortField)
  sortBy?: DiaperSortField = DiaperSortField.TIMESTAMP;

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
