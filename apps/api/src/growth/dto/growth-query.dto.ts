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

/**
 * Sort order options
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Sortable fields for growth entries
 */
export enum GrowthSortField {
  TIMESTAMP = 'timestamp',
  CREATED_AT = 'createdAt',
  WEIGHT = 'weight',
  HEIGHT = 'height',
  HEAD_CIRCUMFERENCE = 'headCircumference',
}

/**
 * Query parameters for filtering and paginating growth entries
 * Validates: Requirements 12.6
 */
export class GrowthQueryDto {
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
    enum: GrowthSortField,
    default: GrowthSortField.TIMESTAMP,
  })
  @IsOptional()
  @IsEnum(GrowthSortField)
  sortBy?: GrowthSortField = GrowthSortField.TIMESTAMP;

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

  @ApiPropertyOptional({
    description: 'Include converted measurements in both metric and imperial units',
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeConversions?: boolean = false;
}


/**
 * Query parameters for single growth entry retrieval
 * Validates: Requirements 6.4
 */
export class GrowthSingleQueryDto {
  @ApiPropertyOptional({
    description: 'Include converted measurements in both metric and imperial units',
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeConversions?: boolean = false;
}
