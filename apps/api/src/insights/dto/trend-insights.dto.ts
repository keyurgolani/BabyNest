/**
 * Trend Insights DTOs
 * DTOs for AI-powered daily, weekly, monthly, and yearly trend analysis
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Trend period types
 */
export type TrendPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Trend category for insights
 */
export type TrendCategory = 'sleep' | 'feeding' | 'diaper' | 'growth' | 'activity' | 'overall';

/**
 * Query DTO for trend insights
 */
export class TrendInsightsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for the trend analysis (ISO string)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the trend analysis (ISO string)',
    example: '2026-01-16',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

/**
 * Individual trend insight item
 */
export class TrendInsightItemDto {
  @ApiProperty({ description: 'Category of the insight' })
  category: TrendCategory;

  @ApiProperty({ description: 'Title of the insight' })
  title: string;

  @ApiProperty({ description: 'Detailed description of the insight' })
  description: string;

  @ApiProperty({ description: 'Trend direction: improving, declining, stable, or new' })
  trend: 'improving' | 'declining' | 'stable' | 'new';

  @ApiPropertyOptional({ description: 'Percentage change if applicable' })
  changePercent?: number;

  @ApiPropertyOptional({ description: 'Recommendation based on the insight' })
  recommendation?: string;

  @ApiPropertyOptional({ description: 'Emoji icon for the insight' })
  icon?: string;
}

/**
 * Sleep trend data
 */
export class SleepTrendDataDto {
  @ApiProperty({ description: 'Total sleep minutes in the period' })
  totalSleepMinutes: number;

  @ApiProperty({ description: 'Average daily sleep minutes' })
  averageDailySleepMinutes: number;

  @ApiProperty({ description: 'Total number of naps' })
  napCount: number;

  @ApiProperty({ description: 'Average nap duration in minutes' })
  averageNapDuration: number | null;

  @ApiProperty({ description: 'Average night sleep duration in minutes' })
  averageNightSleepDuration: number | null;

  @ApiProperty({ description: 'Average wake window in minutes' })
  averageWakeWindow: number | null;

  @ApiProperty({ description: 'Sleep consistency score (0-100)' })
  consistencyScore: number;

  @ApiPropertyOptional({ description: 'Comparison to previous period' })
  comparisonToPrevious?: {
    sleepChange: number;
    napCountChange: number;
    consistencyChange: number;
  };
}

/**
 * Feeding trend data
 */
export class FeedingTrendDataDto {
  @ApiProperty({ description: 'Total number of feedings' })
  totalFeedings: number;

  @ApiProperty({ description: 'Average feedings per day' })
  averageFeedingsPerDay: number;

  @ApiProperty({ description: 'Breastfeeding count' })
  breastfeedingCount: number;

  @ApiProperty({ description: 'Bottle feeding count' })
  bottleCount: number;

  @ApiProperty({ description: 'Solid food count' })
  solidCount: number;

  @ApiProperty({ description: 'Average bottle amount in ml' })
  averageBottleAmount: number | null;

  @ApiProperty({ description: 'Total bottle volume in ml' })
  totalBottleVolume: number;

  @ApiProperty({ description: 'Feeding consistency score (0-100)' })
  consistencyScore: number;

  @ApiPropertyOptional({ description: 'Comparison to previous period' })
  comparisonToPrevious?: {
    feedingCountChange: number;
    bottleVolumeChange: number;
  };
}

/**
 * Diaper trend data
 */
export class DiaperTrendDataDto {
  @ApiProperty({ description: 'Total diaper changes' })
  totalChanges: number;

  @ApiProperty({ description: 'Average changes per day' })
  averageChangesPerDay: number;

  @ApiProperty({ description: 'Wet diaper count' })
  wetCount: number;

  @ApiProperty({ description: 'Dirty diaper count' })
  dirtyCount: number;

  @ApiProperty({ description: 'Mixed diaper count' })
  mixedCount: number;

  @ApiProperty({ description: 'Wet to dirty ratio' })
  wetToDirtyRatio: number | null;

  @ApiPropertyOptional({ description: 'Comparison to previous period' })
  comparisonToPrevious?: {
    totalChange: number;
    wetChange: number;
    dirtyChange: number;
  };
}

/**
 * Growth trend data
 */
export class GrowthTrendDataDto {
  @ApiProperty({ description: 'Whether growth measurements exist' })
  hasMeasurements: boolean;

  @ApiPropertyOptional({ description: 'Weight at start of period (grams)' })
  startWeight?: number | null;

  @ApiPropertyOptional({ description: 'Weight at end of period (grams)' })
  endWeight?: number | null;

  @ApiPropertyOptional({ description: 'Weight gain in grams' })
  weightGain?: number | null;

  @ApiPropertyOptional({ description: 'Height at start of period (mm)' })
  startHeight?: number | null;

  @ApiPropertyOptional({ description: 'Height at end of period (mm)' })
  endHeight?: number | null;

  @ApiPropertyOptional({ description: 'Height gain in mm' })
  heightGain?: number | null;

  @ApiPropertyOptional({ description: 'Current weight percentile' })
  weightPercentile?: number | null;

  @ApiPropertyOptional({ description: 'Current height percentile' })
  heightPercentile?: number | null;

  @ApiPropertyOptional({ description: 'Current head circumference percentile' })
  headPercentile?: number | null;
}

/**
 * Activity trend data
 */
export class ActivityTrendDataDto {
  @ApiProperty({ description: 'Total activities logged' })
  totalActivities: number;

  @ApiProperty({ description: 'Total tummy time minutes' })
  tummyTimeMinutes: number;

  @ApiProperty({ description: 'Average daily tummy time minutes' })
  averageDailyTummyTime: number;

  @ApiProperty({ description: 'Bath count' })
  bathCount: number;

  @ApiProperty({ description: 'Outdoor time minutes' })
  outdoorMinutes: number;

  @ApiProperty({ description: 'Play time minutes' })
  playMinutes: number;

  @ApiPropertyOptional({ description: 'Comparison to previous period' })
  comparisonToPrevious?: {
    tummyTimeChange: number;
    outdoorTimeChange: number;
  };
}

/**
 * Aggregated trend data for the period
 */
export class TrendAggregatedDataDto {
  @ApiProperty({ description: 'Sleep trend data' })
  sleep: SleepTrendDataDto;

  @ApiProperty({ description: 'Feeding trend data' })
  feeding: FeedingTrendDataDto;

  @ApiProperty({ description: 'Diaper trend data' })
  diaper: DiaperTrendDataDto;

  @ApiProperty({ description: 'Growth trend data' })
  growth: GrowthTrendDataDto;

  @ApiProperty({ description: 'Activity trend data' })
  activity: ActivityTrendDataDto;
}


/**
 * Response DTO for trend insights
 */
export class TrendInsightsResponseDto {
  @ApiProperty({ description: 'Baby ID' })
  babyId: string;

  @ApiProperty({ description: 'Baby name' })
  babyName: string;

  @ApiProperty({ description: 'Baby age in months' })
  babyAgeMonths: number;

  @ApiProperty({ description: 'Trend period type' })
  period: TrendPeriod;

  @ApiProperty({ description: 'Start date of the analysis period' })
  periodStart: Date;

  @ApiProperty({ description: 'End date of the analysis period' })
  periodEnd: Date;

  @ApiProperty({ description: 'Number of days in the period' })
  periodDays: number;

  @ApiProperty({ description: 'Aggregated trend data' })
  aggregatedData: TrendAggregatedDataDto;

  @ApiProperty({ description: 'AI-generated insights', type: [TrendInsightItemDto] })
  insights: TrendInsightItemDto[];

  @ApiProperty({ description: 'AI-generated summary text' })
  aiSummary: string;

  @ApiProperty({ description: 'Whether AI summary was successfully generated' })
  aiSummaryGenerated: boolean;

  @ApiPropertyOptional({ description: 'Error message if AI generation failed' })
  aiError?: string | null;

  @ApiPropertyOptional({ description: 'AI generation duration in milliseconds' })
  aiDurationMs?: number | null;

  @ApiProperty({ description: 'Key highlights for the period' })
  highlights: string[];

  @ApiProperty({ description: 'Areas that may need attention' })
  areasOfConcern: string[];

  @ApiProperty({ description: 'Timestamp when the insights were generated' })
  generatedAt: Date;
}

/**
 * Prompt data for AI trend analysis
 */
export interface TrendPromptData {
  babyName: string;
  babyAgeMonths: number;
  period: TrendPeriod;
  periodStart: string;
  periodEnd: string;
  periodDays: number;
  sleepSummary: string;
  feedingSummary: string;
  diaperSummary: string;
  growthSummary: string;
  activitySummary: string;
  previousPeriodComparison: string;
}
