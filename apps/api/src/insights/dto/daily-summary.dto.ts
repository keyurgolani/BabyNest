import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

/**
 * Query parameters for daily summary request
 */
export class DailySummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Date for the summary (ISO 8601 format). Defaults to today.',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}

/**
 * Feeding summary for the day
 */
export class DailyFeedingSummaryDto {
  @ApiProperty({ description: 'Total number of feedings' })
  count: number;

  @ApiProperty({ description: 'Total breastfeeding minutes' })
  totalMinutes: number;

  @ApiProperty({ description: 'Total bottle amount in ml' })
  totalMl: number;

  @ApiProperty({ description: 'Breakdown by feeding type' })
  byType: {
    breastfeeding: number;
    bottle: number;
    pumping: number;
    solid: number;
  };
}

/**
 * Sleep summary for the day
 */
export class DailySleepSummaryDto {
  @ApiProperty({ description: 'Total sleep minutes' })
  totalMinutes: number;

  @ApiProperty({ description: 'Number of naps' })
  napCount: number;

  @ApiProperty({ description: 'Total nap minutes' })
  napMinutes: number;

  @ApiProperty({ description: 'Night sleep minutes' })
  nightSleepMinutes: number;

  @ApiProperty({ description: 'Average nap duration in minutes', nullable: true })
  averageNapDuration: number | null;
}

/**
 * Diaper summary for the day
 */
export class DailyDiaperSummaryDto {
  @ApiProperty({ description: 'Total diaper changes' })
  total: number;

  @ApiProperty({ description: 'Wet diaper count' })
  wet: number;

  @ApiProperty({ description: 'Dirty diaper count' })
  dirty: number;

  @ApiProperty({ description: 'Mixed diaper count' })
  mixed: number;
}

/**
 * Activities summary for the day
 */
export class DailyActivitiesSummaryDto {
  @ApiProperty({ description: 'Total tummy time minutes' })
  tummyTimeMinutes: number;

  @ApiProperty({ description: 'Number of baths' })
  bathCount: number;

  @ApiProperty({ description: 'Total outdoor time minutes' })
  outdoorMinutes: number;
}

/**
 * Hourly activity breakdown entry
 */
export class HourlyBreakdownEntryDto {
  @ApiProperty({ description: 'Hour of the day (0-23)' })
  hour: number;

  @ApiProperty({ description: 'Number of feeding activities' })
  feeding: number;

  @ApiProperty({ description: 'Number of sleep activities' })
  sleep: number;

  @ApiProperty({ description: 'Number of diaper activities' })
  diaper: number;

  @ApiProperty({ description: 'Number of other activities' })
  activity: number;

  @ApiProperty({ description: 'Total activities in this hour' })
  total: number;
}

/**
 * Daily summary response
 */
export class DailySummaryResponseDto {
  @ApiProperty({ description: 'Baby ID' })
  babyId: string;

  @ApiProperty({ description: 'Baby name' })
  babyName: string;

  @ApiProperty({ description: 'Date of the summary' })
  date: string;

  @ApiProperty({ description: 'Feeding summary', type: DailyFeedingSummaryDto })
  feeding: DailyFeedingSummaryDto;

  @ApiProperty({ description: 'Sleep summary', type: DailySleepSummaryDto })
  sleep: DailySleepSummaryDto;

  @ApiProperty({ description: 'Diaper summary', type: DailyDiaperSummaryDto })
  diaper: DailyDiaperSummaryDto;

  @ApiProperty({ description: 'Activities summary', type: DailyActivitiesSummaryDto })
  activities: DailyActivitiesSummaryDto;

  @ApiProperty({ 
    description: 'Hourly breakdown of activities (24 entries)', 
    type: [HourlyBreakdownEntryDto] 
  })
  hourlyBreakdown: HourlyBreakdownEntryDto[];

  @ApiProperty({ description: 'Timestamp when the summary was generated' })
  generatedAt: Date;
}
