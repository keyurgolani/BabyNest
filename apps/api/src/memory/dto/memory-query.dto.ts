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
  IsString,
} from 'class-validator';

import { MemoryEntryType } from './create-memory.dto';

/**
 * Sort fields for memory entries
 */
export enum MemorySortField {
  TAKEN_AT = 'takenAt',
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
 * Query DTO for listing memory entries
 */
export class MemoryQueryDto {
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
    enum: MemorySortField,
    default: MemorySortField.TAKEN_AT,
  })
  @IsOptional()
  @IsEnum(MemorySortField)
  sortBy?: MemorySortField;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @ApiPropertyOptional({
    description: 'Filter by memory entry type',
    enum: MemoryEntryType,
  })
  @IsOptional()
  @IsEnum(MemoryEntryType)
  entryType?: MemoryEntryType;

  @ApiPropertyOptional({
    description: 'Filter by start date (takenAt)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (takenAt)',
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
}

/**
 * Query DTO for timeline view
 */
export class MemoryTimelineQueryDto {
  @ApiPropertyOptional({
    description: 'Number of date groups to return',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Cursor for pagination (date string YYYY-MM-DD to start from)',
    example: '2024-06-01',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Filter by memory entry type',
    enum: MemoryEntryType,
  })
  @IsOptional()
  @IsEnum(MemoryEntryType)
  entryType?: MemoryEntryType;

  @ApiPropertyOptional({
    description: 'Filter by start date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
