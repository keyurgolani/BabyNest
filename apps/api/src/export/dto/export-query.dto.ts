import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

/**
 * Tracking categories available for CSV export
 * Validates: Requirements 13.3
 */
export enum ExportCategory {
  FEEDING = 'feeding',
  SLEEP = 'sleep',
  DIAPER = 'diaper',
  GROWTH = 'growth',
  MILESTONE = 'milestone',
  ACTIVITY = 'activity',
  MEDICATION = 'medication',
  VACCINATION = 'vaccination',
  SYMPTOM = 'symptom',
  DOCTOR_VISIT = 'doctor_visit',
}

/**
 * Query parameters for CSV export
 */
export class ExportQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering entries (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering entries (ISO 8601 format)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Query parameters for category-specific CSV export
 */
export class ExportCategoryQueryDto extends ExportQueryDto {
  @ApiProperty({
    description: 'Tracking category to export',
    enum: ExportCategory,
    example: ExportCategory.FEEDING,
  })
  @IsEnum(ExportCategory)
  category!: ExportCategory;
}
