import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';

import { DiaperType } from './create-diaper.dto';

/**
 * DTO for updating a diaper entry
 * Validates: Requirements 5.1, 5.2
 */
export class UpdateDiaperDto {
  @ApiPropertyOptional({
    description: 'Type of diaper change (wet/dirty/mixed/dry)',
    enum: DiaperType,
    example: DiaperType.WET,
  })
  @IsOptional()
  @IsEnum(DiaperType)
  type?: DiaperType;

  @ApiPropertyOptional({
    description: 'Timestamp of the diaper change',
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
