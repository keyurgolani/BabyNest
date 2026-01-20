import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';

import { SleepResponseDto } from './sleep-response.dto';

/**
 * Query DTO for sleep statistics
 * Validates: Requirements 4.3, 4.6
 */
export class SleepStatisticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for statistics calculation (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for statistics calculation (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Time period in days for statistics (7, 14, or 30 days). Overrides startDate if provided.',
    example: 7,
    enum: [7, 14, 30],
  })
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(30)
  @Type(() => Number)
  periodDays?: number;
}

/**
 * Date range for statistics
 */
export class DateRangeDto {
  @ApiProperty({
    description: 'Start date of the statistics period',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date of the statistics period',
    example: '2024-01-31T23:59:59.999Z',
  })
  endDate: Date;
}

/**
 * Daily sleep breakdown
 */
export class DailySleepBreakdownDto {
  @ApiProperty({
    description: 'Date for this breakdown (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'Total sleep minutes for this day',
    example: 720,
  })
  totalMinutes: number;

  @ApiProperty({
    description: 'Number of naps for this day',
    example: 3,
  })
  napCount: number;

  @ApiProperty({
    description: 'Total nap minutes for this day',
    example: 180,
  })
  napMinutes: number;

  @ApiProperty({
    description: 'Total night sleep minutes for this day',
    example: 540,
  })
  nightMinutes: number;

  @ApiProperty({
    description: 'Number of sleep sessions for this day',
    example: 4,
  })
  sessionCount: number;
}

/**
 * Response DTO for sleep statistics
 * Validates: Requirements 4.3, 4.6
 * Property 12: Sleep Statistics Calculation
 */
export class SleepStatisticsDto {
  @ApiProperty({
    description: 'Date range for the statistics',
    type: DateRangeDto,
  })
  period: DateRangeDto;

  @ApiProperty({
    description: 'Total sleep minutes in the period',
    example: 5040,
  })
  totalSleepMinutes: number;

  @ApiProperty({
    description: 'Average sleep minutes per day',
    example: 720,
  })
  averageSleepMinutesPerDay: number;

  @ApiProperty({
    description: 'Number of naps in the period',
    example: 21,
  })
  napCount: number;

  @ApiProperty({
    description: 'Total night sleep minutes in the period',
    example: 3780,
  })
  nightSleepMinutes: number;

  @ApiProperty({
    description: 'Total nap minutes in the period',
    example: 1260,
  })
  napMinutes: number;

  @ApiProperty({
    description: 'Number of night sleep sessions in the period',
    example: 7,
  })
  nightSleepCount: number;

  @ApiProperty({
    description: 'Total number of sleep sessions in the period',
    example: 28,
  })
  totalSessions: number;

  @ApiProperty({
    description: 'Average nap duration in minutes',
    example: 60,
    nullable: true,
  })
  averageNapDuration: number | null;

  @ApiProperty({
    description: 'Average night sleep duration in minutes',
    example: 540,
    nullable: true,
  })
  averageNightSleepDuration: number | null;

  @ApiProperty({
    description: 'Current wake window in minutes (time since last sleep ended)',
    example: 120,
  })
  currentWakeWindowMinutes: number;

  @ApiProperty({
    description: 'Current wake window formatted as hours and minutes',
    example: '2h 0m',
  })
  currentWakeWindowFormatted: string;

  @ApiPropertyOptional({
    description: 'Most recent sleep entry',
    type: SleepResponseDto,
    nullable: true,
  })
  lastSleep: SleepResponseDto | null;

  @ApiPropertyOptional({
    description: 'Daily breakdown of sleep (optional, included when period is 30 days or less)',
    type: [DailySleepBreakdownDto],
  })
  dailyBreakdown?: DailySleepBreakdownDto[];

  @ApiProperty({
    description: 'Number of days with sleep data in the period',
    example: 7,
  })
  daysWithData: number;
}
