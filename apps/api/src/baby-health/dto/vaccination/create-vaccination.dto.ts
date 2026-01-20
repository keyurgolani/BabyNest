import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for creating a vaccination entry
 * Validates: Requirements 8.3
 */
export class CreateVaccinationDto {
  @ApiProperty({
    description: 'Name of the vaccine',
    example: 'DTaP (Diphtheria, Tetanus, Pertussis)',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  vaccineName: string;

  @ApiPropertyOptional({
    description: 'Timestamp when the vaccination was administered (defaults to now)',
    example: '2024-06-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Healthcare provider who administered the vaccine',
    example: 'Dr. Smith',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  provider?: string;

  @ApiPropertyOptional({
    description: 'Location where the vaccine was administered',
    example: 'City Pediatric Clinic',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({
    description: 'Next due date for follow-up vaccination',
    example: '2024-08-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  nextDueAt?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the vaccination',
    example: 'No adverse reactions observed',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
