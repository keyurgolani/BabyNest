import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
 * DTO for creating a medication entry
 * Validates: Requirements 8.1, 8.2
 */
export class CreateMedicationDto {
  @ApiProperty({
    description: 'Name of the medication',
    example: 'Infant Tylenol',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Dosage amount',
    example: '2.5',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  dosage: string;

  @ApiProperty({
    description: 'Unit of measurement for dosage',
    example: 'ml',
    minLength: 1,
    maxLength: 20,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  unit: string;

  @ApiProperty({
    description: 'Frequency of medication. The next due time will be automatically calculated based on this frequency.',
    enum: MedicationFrequency,
    example: MedicationFrequency.EVERY_4_HOURS,
    enumName: 'MedicationFrequency',
  })
  @IsEnum(MedicationFrequency)
  frequency: MedicationFrequency;

  @ApiPropertyOptional({
    description: 'Timestamp when the medication was administered (defaults to now)',
    example: '2024-06-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Next due time for the medication. If not provided, it will be automatically calculated based on the frequency and timestamp.',
    example: '2024-06-15T14:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  nextDueAt?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the medication',
    example: 'Given for fever after vaccination',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
