import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SleepResponseDto } from './sleep-response.dto';

/**
 * Response DTO for wake window calculation
 * Validates: Requirements 4.4
 * Property 11: Wake Window Calculation
 */
export class WakeWindowResponseDto {
  @ApiProperty({
    description: 'Baby ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Current wake window duration in minutes (time since last sleep ended)',
    example: 120,
  })
  wakeWindowMinutes: number;

  @ApiProperty({
    description: 'Current wake window duration formatted as hours and minutes',
    example: '2h 0m',
  })
  wakeWindowFormatted: string;

  @ApiProperty({
    description: 'Timestamp when the wake window started (end time of last sleep)',
    example: '2024-01-15T08:30:00.000Z',
  })
  wakeWindowStartTime: Date;

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
