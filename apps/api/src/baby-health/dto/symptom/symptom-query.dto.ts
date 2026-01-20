import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsEnum, IsBoolean, IsDateString, IsString } from 'class-validator';

import { SymptomSeverity } from './create-symptom.dto';
import { BasePaginationQueryDto } from '../shared/pagination.dto';

/**
 * Sort fields for symptom entries
 */
export enum SymptomSortField {
  TIMESTAMP = 'timestamp',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  SYMPTOM_TYPE = 'symptomType',
  SEVERITY = 'severity',
}

/**
 * Query DTO for listing symptom entries
 * Validates: Requirements 12.6
 */
export class SymptomQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: SymptomSortField,
    default: SymptomSortField.TIMESTAMP,
  })
  @IsOptional()
  @IsEnum(SymptomSortField)
  sortBy?: SymptomSortField;

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
    description: 'Filter by symptom type (partial match)',
    example: 'fever',
  })
  @IsOptional()
  @IsString()
  symptomType?: string;

  @ApiPropertyOptional({
    description: 'Filter by severity',
    enum: SymptomSeverity,
  })
  @IsOptional()
  @IsEnum(SymptomSeverity)
  severity?: SymptomSeverity;

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
