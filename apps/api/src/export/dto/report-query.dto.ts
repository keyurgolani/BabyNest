import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsBoolean } from 'class-validator';

/**
 * Query parameters for PDF report generation
 * Validates: Requirements 13.1, 13.2
 */
export class ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for report data (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for report data (ISO 8601 format)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Include AI-generated summary in the report',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeAiSummary?: boolean;
}

/**
 * Baby profile summary for PDF report
 */
export interface BabyProfileSummary {
  name: string;
  dateOfBirth: Date;
  gender: string;
  ageMonths: number;
  ageDays: number;
}

/**
 * Growth data point for charts
 */
export interface GrowthDataPoint {
  date: Date;
  weight: number | null;
  height: number | null;
  headCircumference: number | null;
  weightPercentile: number | null;
  heightPercentile: number | null;
  headPercentile: number | null;
}

/**
 * Feeding summary for report
 */
export interface FeedingSummary {
  totalFeedings: number;
  breastfeedingCount: number;
  bottleCount: number;
  solidCount: number;
  pumpingCount: number;
  averageBreastfeedingDuration: number | null;
  averageBottleAmount: number | null;
}

/**
 * Sleep summary for report
 */
export interface SleepSummary {
  totalSleepMinutes: number;
  averageSleepPerDay: number;
  napCount: number;
  nightSleepCount: number;
  averageNapDuration: number | null;
  averageNightSleepDuration: number | null;
}

/**
 * Diaper summary for report
 */
export interface DiaperSummary {
  totalChanges: number;
  wetCount: number;
  dirtyCount: number;
  mixedCount: number;
  averagePerDay: number;
}

/**
 * Milestone achievement for report
 */
export interface MilestoneAchievement {
  name: string;
  category: string;
  achievedDate: Date;
  notes: string | null;
}

/**
 * Complete report data structure
 */
export interface ReportData {
  baby: BabyProfileSummary;
  period: {
    startDate: Date;
    endDate: Date;
  };
  growth: GrowthDataPoint[];
  feeding: FeedingSummary;
  sleep: SleepSummary;
  diaper: DiaperSummary;
  milestones: MilestoneAchievement[];
  generatedAt: Date;
}
