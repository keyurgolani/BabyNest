import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

import { SleepType, SleepQuality } from './create-sleep.dto';

/**
 * DTO for updating a sleep entry
 * Validates: Requirements 4.1, 4.2, 4.5
 */
export class UpdateSleepDto {
  @ApiPropertyOptional({
    description: 'Start time of the sleep session',
    example: '2024-01-15T20:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time of the sleep session (null if ongoing)',
    example: '2024-01-16T06:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Type of sleep (nap or night sleep)',
    enum: SleepType,
    example: SleepType.NIGHT,
  })
  @IsOptional()
  @IsEnum(SleepType)
  sleepType?: SleepType;

  @ApiPropertyOptional({
    description: 'Quality of sleep',
    enum: SleepQuality,
    example: SleepQuality.GOOD,
  })
  @IsOptional()
  @IsEnum(SleepQuality)
  quality?: SleepQuality;

  @ApiPropertyOptional({
    description: 'Notes about sleep conditions and disturbances',
    example: 'Woke up once for feeding, went back to sleep easily',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
