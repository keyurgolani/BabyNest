import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsEnum, IsBoolean, IsDateString, IsString } from 'class-validator';

import { VisitType } from './create-doctor-visit.dto';
import { BasePaginationQueryDto } from '../shared/pagination.dto';

/**
 * Sort fields for doctor visit entries
 */
export enum DoctorVisitSortField {
  TIMESTAMP = 'timestamp',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  VISIT_TYPE = 'visitType',
  FOLLOW_UP_DATE = 'followUpDate',
}

/**
 * Query DTO for listing doctor visit entries
 * Validates: Requirements 12.6
 */
export class DoctorVisitQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: DoctorVisitSortField,
    default: DoctorVisitSortField.TIMESTAMP,
  })
  @IsOptional()
  @IsEnum(DoctorVisitSortField)
  sortBy?: DoctorVisitSortField;

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
    description: 'Filter by visit type',
    enum: VisitType,
  })
  @IsOptional()
  @IsEnum(VisitType)
  visitType?: VisitType;

  @ApiPropertyOptional({
    description: 'Filter by provider name (partial match)',
    example: 'Dr. Smith',
  })
  @IsOptional()
  @IsString()
  provider?: string;

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
