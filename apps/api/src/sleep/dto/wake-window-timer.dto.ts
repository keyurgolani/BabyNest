import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SleepResponseDto } from './sleep-response.dto';

/**
 * Wake window status indicating how tired the baby might be
 */
export enum WakeWindowStatus {
  WELL_RESTED = 'well-rested',
  APPROACHING_TIRED = 'approaching-tired',
  OVERTIRED = 'overtired',
}

/**
 * Response DTO for enhanced wake window timer calculation
 * Includes age-appropriate recommendations similar to Huckleberry's SweetSpot feature
 */
export class WakeWindowTimerResponseDto {
  @ApiProperty({
    description: 'Baby ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiPropertyOptional({
    description: 'When the baby last woke up (end time of last completed sleep)',
    example: '2024-01-15T08:30:00.000Z',
    nullable: true,
  })
  lastSleepEndTime: Date | null;

  @ApiProperty({
    description: 'How long the baby has been awake in minutes',
    example: 120,
  })
  currentAwakeMinutes: number;

  @ApiProperty({
    description: 'Current awake time formatted as hours and minutes',
    example: '2h 0m',
  })
  currentAwakeFormatted: string;

  @ApiProperty({
    description: 'Age-appropriate recommended wake window in minutes (midpoint of range)',
    example: 135,
  })
  recommendedWakeWindowMinutes: number;

  @ApiProperty({
    description: 'Minimum recommended wake window in minutes for baby\'s age',
    example: 120,
  })
  minWakeWindowMinutes: number;

  @ApiProperty({
    description: 'Maximum recommended wake window in minutes for baby\'s age',
    example: 150,
  })
  maxWakeWindowMinutes: number;

  @ApiProperty({
    description: 'Recommended wake window formatted as a range',
    example: '2h 0m - 2h 30m',
  })
  recommendedWakeWindowFormatted: string;

  @ApiPropertyOptional({
    description: 'Suggested time for the next sleep based on wake window',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  suggestedNextSleepTime: Date | null;

  @ApiProperty({
    description: 'Minutes until suggested next sleep (negative if overdue)',
    example: 30,
  })
  minutesUntilNextSleep: number;

  @ApiProperty({
    description: 'Time until next sleep formatted',
    example: '30m',
  })
  minutesUntilNextSleepFormatted: string;

  @ApiProperty({
    description: 'Status indicating how tired the baby might be',
    enum: WakeWindowStatus,
    example: WakeWindowStatus.WELL_RESTED,
  })
  status: WakeWindowStatus;

  @ApiProperty({
    description: 'Percentage of recommended wake window used (0-100+, can exceed 100 if overtired)',
    example: 75,
  })
  percentageOfWakeWindow: number;

  @ApiProperty({
    description: 'Baby\'s age in months used for wake window calculation',
    example: 6,
  })
  babyAgeMonths: number;

  @ApiProperty({
    description: 'Current timestamp used for calculation',
    example: '2024-01-15T10:30:00.000Z',
  })
  calculatedAt: Date;

  @ApiPropertyOptional({
    description: 'The last completed sleep entry (null if no sleep history)',
    type: SleepResponseDto,
    nullable: true,
  })
  lastSleep: SleepResponseDto | null;

  @ApiProperty({
    description: 'Whether there is any sleep history for this baby',
    example: true,
  })
  hasSleepHistory: boolean;
}
