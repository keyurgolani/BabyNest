import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';

/**
 * Diaper types supported by the system
 * Validates: Requirements 5.1
 */
export enum DiaperType {
  WET = 'wet',
  DIRTY = 'dirty',
  MIXED = 'mixed',
  DRY = 'dry',
}

/**
 * DTO for creating a new diaper entry
 * Validates: Requirements 5.1, 5.2
 */
export class CreateDiaperDto {
  @ApiProperty({
    description: 'Type of diaper change (wet/dirty/mixed/dry)',
    enum: DiaperType,
    example: DiaperType.WET,
  })
  @IsEnum(DiaperType)
  type: DiaperType;

  @ApiPropertyOptional({
    description: 'Timestamp of the diaper change (defaults to now if not provided)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Color of the stool (for dirty/mixed diapers)',
    example: 'yellow',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({
    description: 'Consistency of the stool (for dirty/mixed diapers)',
    example: 'soft',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  consistency?: string;

  @ApiPropertyOptional({
    description: 'Whether the baby has a diaper rash',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasRash?: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes about the diaper change',
    example: 'Applied diaper cream',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
