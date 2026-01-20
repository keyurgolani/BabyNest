import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsEnum, IsBoolean, IsDateString, IsString } from 'class-validator';

import { BasePaginationQueryDto } from '../shared/pagination.dto';

/**
 * Sort fields for medication entries
 */
export enum MedicationSortField {
  TIMESTAMP = 'timestamp',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  NEXT_DUE_AT = 'nextDueAt',
}

/**
 * Query DTO for listing medication entries
 * Validates: Requirements 12.6
 */
export class MedicationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: MedicationSortField,
    default: MedicationSortField.TIMESTAMP,
  })
  @IsOptional()
  @IsEnum(MedicationSortField)
  sortBy?: MedicationSortField;

  @ApiPropertyOptional({
    description: 'Filter by start date (timestamp)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (timestamp)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by medication name (partial match)',
    example: 'Tylenol',
  })
  @IsOptional()
  @IsString()
  name?: string;

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
