import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsEnum, IsBoolean, IsDateString, IsString } from 'class-validator';

import { VaccinationStatusDto } from './vaccination-response.dto';
import { BasePaginationQueryDto } from '../shared/pagination.dto';

/**
 * Sort fields for vaccination entries
 */
export enum VaccinationSortField {
  TIMESTAMP = 'timestamp',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  VACCINE_NAME = 'vaccineName',
  NEXT_DUE_AT = 'nextDueAt',
}

/**
 * Query DTO for listing vaccination entries
 * Validates: Requirements 8.4, 12.6
 */
export class VaccinationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: VaccinationSortField,
    default: VaccinationSortField.TIMESTAMP,
  })
  @IsOptional()
  @IsEnum(VaccinationSortField)
  sortBy?: VaccinationSortField;

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
    description: 'Filter by vaccine name (partial match)',
    example: 'DTaP',
  })
  @IsOptional()
  @IsString()
  vaccineName?: string;

  @ApiPropertyOptional({
    description: 'Filter by vaccination status (completed, upcoming, overdue)',
    enum: VaccinationStatusDto,
    example: VaccinationStatusDto.UPCOMING,
  })
  @IsOptional()
  @IsEnum(VaccinationStatusDto)
  status?: VaccinationStatusDto;

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
