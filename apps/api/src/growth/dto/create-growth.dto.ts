import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for creating a new growth entry
 * Validates: Requirements 6.1
 * 
 * At least one measurement (weight, height, or headCircumference) must be provided.
 * All measurements are stored in metric units:
 * - weight: grams (e.g., 3500 = 3.5 kg)
 * - height: millimeters (e.g., 500 = 50 cm)
 * - headCircumference: millimeters (e.g., 350 = 35 cm)
 */
export class CreateGrowthDto {
  @ApiPropertyOptional({
    description: 'Timestamp of the measurement (defaults to now if not provided)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Weight in grams (e.g., 3500 = 3.5 kg)',
    example: 3500,
    minimum: 500,
    maximum: 50000,
  })
  @IsOptional()
  @IsInt()
  @Min(500, { message: 'Weight must be at least 500 grams (0.5 kg)' })
  @Max(50000, { message: 'Weight must be at most 50000 grams (50 kg)' })
  weight?: number;

  @ApiPropertyOptional({
    description: 'Height/length in millimeters (e.g., 500 = 50 cm)',
    example: 500,
    minimum: 200,
    maximum: 1500,
  })
  @IsOptional()
  @IsInt()
  @Min(200, { message: 'Height must be at least 200 mm (20 cm)' })
  @Max(1500, { message: 'Height must be at most 1500 mm (150 cm)' })
  height?: number;

  @ApiPropertyOptional({
    description: 'Head circumference in millimeters (e.g., 350 = 35 cm)',
    example: 350,
    minimum: 200,
    maximum: 700,
  })
  @IsOptional()
  @IsInt()
  @Min(200, { message: 'Head circumference must be at least 200 mm (20 cm)' })
  @Max(700, { message: 'Head circumference must be at most 700 mm (70 cm)' })
  headCircumference?: number;

  @ApiPropertyOptional({
    description: 'Additional notes about the measurement',
    example: 'Measured at pediatrician visit',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
