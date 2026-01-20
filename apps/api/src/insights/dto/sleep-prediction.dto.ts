import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

/**
 * Query parameters for sleep prediction request
 */
export class SleepPredictionQueryDto {
  @ApiPropertyOptional({
    description: 'Number of days of sleep data to analyze (default: 7)',
    example: 7,
    minimum: 3,
    maximum: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(30)
  @Type(() => Number)
  analysisDays?: number;
}

/**
 * Individual sleep session data for pattern analysis
 */
export class SleepSessionDto {
  @ApiProperty({ description: 'Start time of the sleep session' })
  startTime: Date;

  @ApiProperty({ description: 'End time of the sleep session', nullable: true })
  endTime: Date | null;

  @ApiProperty({ description: 'Duration in minutes', nullable: true })
  duration: number | null;

  @ApiProperty({ description: 'Type of sleep (nap or night)' })
  sleepType: string;

  @ApiProperty({ description: 'Wake window before this sleep in minutes', nullable: true })
  wakeWindowBefore: number | null;
}

/**
 * Wake window statistics for pattern analysis
 */
export class WakeWindowStatsDto {
  @ApiProperty({ description: 'Average wake window duration in minutes' })
  averageMinutes: number;

  @ApiProperty({ description: 'Minimum wake window duration in minutes' })
  minMinutes: number;

  @ApiProperty({ description: 'Maximum wake window duration in minutes' })
  maxMinutes: number;

  @ApiProperty({ description: 'Number of wake windows analyzed' })
  count: number;

  @ApiProperty({ description: 'Formatted average wake window (e.g., "2h 15m")' })
  averageFormatted: string;
}

/**
 * Sleep pattern analysis data
 */
export class SleepPatternDataDto {
  @ApiProperty({ description: 'Baby ID' })
  babyId: string;

  @ApiProperty({ description: 'Baby name' })
  babyName: string;

  @ApiProperty({ description: 'Baby age in months' })
  babyAgeMonths: number;

  @ApiProperty({ description: 'Start date of analysis period' })
  analysisStartDate: Date;

  @ApiProperty({ description: 'End date of analysis period' })
  analysisEndDate: Date;

  @ApiProperty({ description: 'Number of days analyzed' })
  analysisDays: number;

  @ApiProperty({ description: 'Total sleep sessions in the period' })
  totalSessions: number;

  @ApiProperty({ description: 'Number of naps in the period' })
  napCount: number;

  @ApiProperty({ description: 'Number of night sleep sessions in the period' })
  nightSleepCount: number;

  @ApiProperty({ description: 'Average nap duration in minutes', nullable: true })
  averageNapDuration: number | null;

  @ApiProperty({ description: 'Average night sleep duration in minutes', nullable: true })
  averageNightSleepDuration: number | null;

  @ApiProperty({ description: 'Wake window statistics', type: WakeWindowStatsDto })
  wakeWindowStats: WakeWindowStatsDto;

  @ApiProperty({ description: 'Recent sleep sessions for pattern analysis', type: [SleepSessionDto] })
  recentSessions: SleepSessionDto[];

  @ApiProperty({ description: 'Current wake window in minutes' })
  currentWakeWindowMinutes: number;

  @ApiProperty({ description: 'Formatted current wake window' })
  currentWakeWindowFormatted: string;

  @ApiProperty({ description: 'Time when baby last woke up', nullable: true })
  lastWakeTime: Date | null;
}

/**
 * Sleep prediction response with AI-powered analysis
 * Validates: Requirements 10.1 - Sleep prediction based on pattern analysis
 */
export class SleepPredictionResponseDto {
  @ApiProperty({ description: 'Baby ID' })
  babyId: string;

  @ApiProperty({ description: 'Baby name' })
  babyName: string;

  @ApiProperty({ description: 'Predicted optimal nap time' })
  predictedNapTime: Date;

  @ApiProperty({ description: 'Confidence level of the prediction (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Recommended wake window in minutes based on age and patterns' })
  recommendedWakeWindowMinutes: number;

  @ApiProperty({ description: 'Formatted recommended wake window' })
  recommendedWakeWindowFormatted: string;

  @ApiProperty({ description: 'Current wake window in minutes' })
  currentWakeWindowMinutes: number;

  @ApiProperty({ description: 'Formatted current wake window' })
  currentWakeWindowFormatted: string;

  @ApiProperty({ description: 'Minutes until predicted nap time (negative if past)' })
  minutesUntilNap: number;

  @ApiProperty({ description: 'AI-generated reasoning for the prediction' })
  reasoning: string;

  @ApiProperty({ description: 'Sleep pattern data used for prediction', type: SleepPatternDataDto })
  patternData: SleepPatternDataDto;

  @ApiProperty({ description: 'Whether AI analysis was successfully generated' })
  aiAnalysisGenerated: boolean;

  @ApiProperty({ description: 'Error message if AI analysis failed', nullable: true })
  aiError: string | null;

  @ApiProperty({ description: 'Time taken for AI analysis in milliseconds', nullable: true })
  aiDurationMs: number | null;

  @ApiProperty({ description: 'Timestamp when the prediction was generated' })
  generatedAt: Date;
}
