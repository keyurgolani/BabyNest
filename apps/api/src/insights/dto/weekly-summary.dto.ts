import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

/**
 * Query parameters for weekly summary request
 */
export class WeeklySummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Start date of the week (ISO 8601 format). Defaults to 7 days ago.',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date of the week (ISO 8601 format). Defaults to today.',
    example: '2024-01-07',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Sleep summary data for the week
 */
export class SleepSummaryDto {
  @ApiProperty({ description: 'Total sleep minutes for the week' })
  totalSleepMinutes: number;

  @ApiProperty({ description: 'Average sleep minutes per day' })
  averageSleepMinutesPerDay: number;

  @ApiProperty({ description: 'Total number of naps' })
  napCount: number;

  @ApiProperty({ description: 'Total nap minutes' })
  napMinutes: number;

  @ApiProperty({ description: 'Total night sleep minutes' })
  nightSleepMinutes: number;

  @ApiProperty({ description: 'Average nap duration in minutes', nullable: true })
  averageNapDuration: number | null;

  @ApiProperty({ description: 'Average night sleep duration in minutes', nullable: true })
  averageNightSleepDuration: number | null;
}

/**
 * Feeding summary data for the week
 */
export class FeedingSummaryDto {
  @ApiProperty({ description: 'Total number of feedings' })
  totalFeedings: number;

  @ApiProperty({ description: 'Number of breastfeeding sessions' })
  breastfeedingCount: number;

  @ApiProperty({ description: 'Number of bottle feedings' })
  bottleCount: number;

  @ApiProperty({ description: 'Number of pumping sessions' })
  pumpingCount: number;

  @ApiProperty({ description: 'Number of solid food feedings' })
  solidCount: number;

  @ApiProperty({ description: 'Average breastfeeding duration in seconds', nullable: true })
  averageBreastfeedingDuration: number | null;

  @ApiProperty({ description: 'Average bottle amount in ml', nullable: true })
  averageBottleAmount: number | null;
}

/**
 * Diaper summary data for the week
 */
export class DiaperSummaryDto {
  @ApiProperty({ description: 'Total number of diaper changes' })
  totalChanges: number;

  @ApiProperty({ description: 'Number of wet diapers' })
  wetCount: number;

  @ApiProperty({ description: 'Number of dirty diapers' })
  dirtyCount: number;

  @ApiProperty({ description: 'Number of mixed diapers' })
  mixedCount: number;

  @ApiProperty({ description: 'Average changes per day' })
  averageChangesPerDay: number;
}

/**
 * Growth data for the week
 */
export class GrowthDataDto {
  @ApiProperty({ description: 'Whether there are growth measurements in the period' })
  hasMeasurements: boolean;

  @ApiProperty({ description: 'Latest weight in grams', nullable: true })
  latestWeight: number | null;

  @ApiProperty({ description: 'Latest height in mm', nullable: true })
  latestHeight: number | null;

  @ApiProperty({ description: 'Latest head circumference in mm', nullable: true })
  latestHeadCircumference: number | null;

  @ApiProperty({ description: 'Weight percentile', nullable: true })
  weightPercentile: number | null;

  @ApiProperty({ description: 'Height percentile', nullable: true })
  heightPercentile: number | null;

  @ApiProperty({ description: 'Head circumference percentile', nullable: true })
  headPercentile: number | null;
}

/**
 * Activities summary data for the week
 */
export class ActivitiesSummaryDto {
  @ApiProperty({ description: 'Total number of activities' })
  totalActivities: number;

  @ApiProperty({ description: 'Total tummy time minutes' })
  tummyTimeMinutes: number;

  @ApiProperty({ description: 'Number of baths' })
  bathCount: number;

  @ApiProperty({ description: 'Total outdoor time minutes' })
  outdoorMinutes: number;

  @ApiProperty({ description: 'Total play time minutes' })
  playMinutes: number;
}

/**
 * Aggregated weekly data used for AI summary generation
 */
export class WeeklyAggregatedDataDto {
  @ApiProperty({ description: 'Baby ID' })
  babyId: string;

  @ApiProperty({ description: 'Baby name' })
  babyName: string;

  @ApiProperty({ description: 'Baby age in months' })
  babyAgeMonths: number;

  @ApiProperty({ description: 'Start date of the week' })
  weekStart: Date;

  @ApiProperty({ description: 'End date of the week' })
  weekEnd: Date;

  @ApiProperty({ description: 'Sleep summary', type: SleepSummaryDto })
  sleepSummary: SleepSummaryDto;

  @ApiProperty({ description: 'Feeding summary', type: FeedingSummaryDto })
  feedingSummary: FeedingSummaryDto;

  @ApiProperty({ description: 'Diaper summary', type: DiaperSummaryDto })
  diaperSummary: DiaperSummaryDto;

  @ApiProperty({ description: 'Growth data', type: GrowthDataDto })
  growthData: GrowthDataDto;

  @ApiProperty({ description: 'Activities summary', type: ActivitiesSummaryDto })
  activitiesSummary: ActivitiesSummaryDto;
}

/**
 * Weekly summary response with AI-generated insights
 */
export class WeeklySummaryResponseDto {
  @ApiProperty({ description: 'Baby ID' })
  babyId: string;

  @ApiProperty({ description: 'Baby name' })
  babyName: string;

  @ApiProperty({ description: 'Start date of the week' })
  weekStart: Date;

  @ApiProperty({ description: 'End date of the week' })
  weekEnd: Date;

  @ApiProperty({ description: 'Aggregated data for the week', type: WeeklyAggregatedDataDto })
  aggregatedData: WeeklyAggregatedDataDto;

  @ApiProperty({ description: 'AI-generated summary and insights' })
  aiSummary: string;

  @ApiProperty({ description: 'Whether AI summary was successfully generated' })
  aiSummaryGenerated: boolean;

  @ApiProperty({ description: 'Error message if AI summary generation failed', nullable: true })
  aiError: string | null;

  @ApiProperty({ description: 'Time taken to generate AI summary in milliseconds', nullable: true })
  aiDurationMs: number | null;

  @ApiProperty({ description: 'Timestamp when the summary was generated' })
  generatedAt: Date;
}
