import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

import { ReminderType } from './create-reminder.dto';

/**
 * Sort order options
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Sortable fields for reminders
 */
export enum ReminderSortField {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  TYPE = 'type',
}

/**
 * Query parameters for filtering and paginating reminders
 */
export class ReminderQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by reminder type',
    enum: ReminderType,
    example: ReminderType.FEED,
  })
  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @ApiPropertyOptional({
    description: 'Filter by enabled status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isEnabled?: boolean;

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
    enum: ReminderSortField,
    default: ReminderSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ReminderSortField)
  sortBy?: ReminderSortField = ReminderSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Include soft-deleted reminders',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean = false;
}
