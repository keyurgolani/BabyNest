import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';

import { MedicationFrequency } from '../../utils/medication-due-time.util';

/**
 * DTO for updating a medication entry
 * Validates: Requirements 8.1, 8.2
 */
export class UpdateMedicationDto {
  @ApiPropertyOptional({
    description: 'Name of the medication',
    example: 'Infant Tylenol',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Dosage amount',
    example: '2.5',
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  dosage?: string;

  @ApiPropertyOptional({
    description: 'Unit of measurement for dosage',
    example: 'ml',
    minLength: 1,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({
    description: 'Frequency of medication. If changed, the next due time will be recalculated.',
    enum: MedicationFrequency,
    example: MedicationFrequency.EVERY_4_HOURS,
    enumName: 'MedicationFrequency',
  })
  @IsOptional()
  @IsEnum(MedicationFrequency)
  frequency?: MedicationFrequency;

  @ApiPropertyOptional({
    description: 'Timestamp when the medication was administered',
    example: '2024-06-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Next due time for the medication. If not provided when updating timestamp or frequency, it will be automatically recalculated.',
    example: '2024-06-15T14:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  nextDueAt?: string | null;

  @ApiPropertyOptional({
    description: 'Additional notes about the medication',
    example: 'Given for fever after vaccination',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
