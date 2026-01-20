import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';

import { SymptomSeverity } from './create-symptom.dto';

/**
 * DTO for updating a symptom entry
 * Validates: Requirements 8.5
 */
export class UpdateSymptomDto {
  @ApiPropertyOptional({
    description: 'Type of symptom',
    example: 'fever',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  symptomType?: string;

  @ApiPropertyOptional({
    description: 'Severity of the symptom',
    enum: SymptomSeverity,
    example: 'mild',
  })
  @IsOptional()
  @IsEnum(SymptomSeverity)
  severity?: SymptomSeverity;

  @ApiPropertyOptional({
    description: 'Timestamp when the symptom was observed',
    example: '2024-06-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Temperature in Celsius (if applicable)',
    example: 38.5,
    minimum: 30,
    maximum: 45,
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number | null;

  @ApiPropertyOptional({
    description: 'Additional notes about the symptom',
    example: 'Started after dinner, seems uncomfortable',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
