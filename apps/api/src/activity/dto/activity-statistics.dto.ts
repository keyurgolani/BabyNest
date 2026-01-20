import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';

import { ActivityResponseDto } from './activity-response.dto';

/**
 * Query DTO for activity statistics
 * Validates: Requirements 9.4, 9.5
 */
export class ActivityStatisticsQueryDto {
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
 * Count and duration by activity type
 * Validates: Requirements 9.4
 */
export class ActivityCountByTypeDto {
  @ApiProperty({
    description: 'Number of tummy time entries',
    example: 10,
  })
  tummy_time: number;

  @ApiProperty({
    description: 'Number of bath entries',
    example: 5,
  })
  bath: number;

  @ApiProperty({
    description: 'Number of outdoor entries',
    example: 8,
  })
  outdoor: number;

  @ApiProperty({
    description: 'Number of play entries',
    example: 12,
  })
  play: number;
}

/**
 * Duration by activity type in minutes
 * Validates: Requirements 9.4
 */
export class ActivityDurationByTypeDto {
  @ApiProperty({
    description: 'Total tummy time duration in minutes',
    example: 150,
  })
  tummy_time: number;

  @ApiProperty({
    description: 'Total bath duration in minutes',
    example: 75,
  })
  bath: number;

  @ApiProperty({
    description: 'Total outdoor duration in minutes',
    example: 240,
  })
  outdoor: number;

  @ApiProperty({
    description: 'Total play duration in minutes',
    example: 180,
  })
  play: number;
}

/**
 * Average duration by activity type in minutes
 * Validates: Requirements 9.4
 */
export class ActivityAverageDurationByTypeDto {
  @ApiProperty({
    description: 'Average tummy time duration in minutes',
    example: 15,
    nullable: true,
  })
  tummy_time: number | null;

  @ApiProperty({
    description: 'Average bath duration in minutes',
    example: 15,
    nullable: true,
  })
  bath: number | null;

  @ApiProperty({
    description: 'Average outdoor duration in minutes',
    example: 30,
    nullable: true,
  })
  outdoor: number | null;

  @ApiProperty({
    description: 'Average play duration in minutes',
    example: 15,
    nullable: true,
  })
  play: number | null;
}

/**
 * Daily activity breakdown
 * Validates: Requirements 9.4
 */
export class DailyActivityBreakdownDto {
  @ApiProperty({
    description: 'Date for this breakdown (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'Total activity count for this day',
    example: 5,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Total activity duration in minutes for this day',
    example: 90,
  })
  totalDuration: number;

  @ApiProperty({
    description: 'Count by activity type for this day',
    type: ActivityCountByTypeDto,
  })
  countByType: ActivityCountByTypeDto;

  @ApiProperty({
    description: 'Duration by activity type in minutes for this day',
    type: ActivityDurationByTypeDto,
  })
  durationByType: ActivityDurationByTypeDto;
}

/**
 * Trend comparison between current and previous period
 * Validates: Requirements 9.5
 */
export class ActivityTrendDto {
  @ApiProperty({
    description: 'Total duration in current period (minutes)',
    example: 500,
  })
  currentPeriodDuration: number;

  @ApiProperty({
    description: 'Total duration in previous period (minutes)',
    example: 400,
  })
  previousPeriodDuration: number;

  @ApiProperty({
    description: 'Duration change (current - previous) in minutes',
    example: 100,
  })
  durationChange: number;

  @ApiProperty({
    description: 'Duration change percentage ((current - previous) / previous * 100)',
    example: 25,
    nullable: true,
  })
  durationChangePercent: number | null;

  @ApiProperty({
    description: 'Trend direction based on duration change',
    enum: ['increasing', 'decreasing', 'stable'],
    example: 'increasing',
  })
  trend: 'increasing' | 'decreasing' | 'stable';

  @ApiProperty({
    description: 'Total count in current period',
    example: 35,
  })
  currentPeriodCount: number;

  @ApiProperty({
    description: 'Total count in previous period',
    example: 30,
  })
  previousPeriodCount: number;

  @ApiProperty({
    description: 'Count change (current - previous)',
    example: 5,
  })
  countChange: number;
}

/**
 * Trend by activity type
 * Validates: Requirements 9.5
 */
export class ActivityTrendByTypeDto {
  @ApiProperty({
    description: 'Trend for tummy time activities',
    type: ActivityTrendDto,
  })
  tummy_time: ActivityTrendDto;

  @ApiProperty({
    description: 'Trend for bath activities',
    type: ActivityTrendDto,
  })
  bath: ActivityTrendDto;

  @ApiProperty({
    description: 'Trend for outdoor activities',
    type: ActivityTrendDto,
  })
  outdoor: ActivityTrendDto;

  @ApiProperty({
    description: 'Trend for play activities',
    type: ActivityTrendDto,
  })
  play: ActivityTrendDto;
}

/**
 * Response DTO for activity statistics
 * Validates: Requirements 9.4, 9.5
 * Property 27: Activity Statistics Calculation
 */
export class ActivityStatisticsDto {
  @ApiProperty({
    description: 'Date range for the statistics',
    type: DateRangeDto,
  })
  period: DateRangeDto;

  @ApiProperty({
    description: 'Total number of activity entries in the period',
    example: 35,
  })
  totalActivities: number;

  @ApiProperty({
    description: 'Total duration of all activities in minutes',
    example: 645,
  })
  totalDurationMinutes: number;

  @ApiProperty({
    description: 'Count of activities by type',
    type: ActivityCountByTypeDto,
  })
  countByType: ActivityCountByTypeDto;

  @ApiProperty({
    description: 'Total duration by activity type in minutes',
    type: ActivityDurationByTypeDto,
  })
  durationByType: ActivityDurationByTypeDto;

  @ApiProperty({
    description: 'Average duration by activity type in minutes',
    type: ActivityAverageDurationByTypeDto,
  })
  averageDurationByType: ActivityAverageDurationByTypeDto;

  @ApiPropertyOptional({
    description: 'Daily breakdown of activities (included when period is 30 days or less)',
    type: [DailyActivityBreakdownDto],
  })
  dailyBreakdown?: DailyActivityBreakdownDto[];

  @ApiProperty({
    description: 'Overall trend comparing current period to previous period of same length',
    type: ActivityTrendDto,
  })
  overallTrend: ActivityTrendDto;

  @ApiProperty({
    description: 'Trend by activity type',
    type: ActivityTrendByTypeDto,
  })
  trendByType: ActivityTrendByTypeDto;

  @ApiPropertyOptional({
    description: 'Most recent activity entry',
    type: ActivityResponseDto,
    nullable: true,
  })
  lastActivity: ActivityResponseDto | null;

  @ApiProperty({
    description: 'Number of days with activity data in the period',
    example: 7,
  })
  daysWithData: number;
}
