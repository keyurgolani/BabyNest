import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';

import { VisitType } from './create-doctor-visit.dto';

/**
 * DTO for updating a doctor visit entry
 * Validates: Requirements 8.6
 */
export class UpdateDoctorVisitDto {
  @ApiPropertyOptional({
    description: 'Type of visit',
    enum: VisitType,
    example: 'checkup',
  })
  @IsOptional()
  @IsEnum(VisitType)
  visitType?: VisitType;

  @ApiPropertyOptional({
    description: 'Healthcare provider name',
    example: 'Dr. Sarah Johnson',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  provider?: string;

  @ApiPropertyOptional({
    description: 'Timestamp of the visit',
    example: '2024-06-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Location of the visit',
    example: 'City Pediatric Clinic',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string | null;

  @ApiPropertyOptional({
    description: 'Diagnosis or findings from the visit',
    example: 'Healthy development, no concerns',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosis?: string | null;

  @ApiPropertyOptional({
    description: 'Follow-up appointment date',
    example: '2024-09-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: string | null;

  @ApiPropertyOptional({
    description: 'Additional notes about the visit',
    example: 'Weight and height on track. Next vaccines due at 6 months.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
