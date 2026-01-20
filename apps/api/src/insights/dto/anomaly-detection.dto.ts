import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

/**
 * Query parameters for anomaly detection request
 */
export class AnomalyDetectionQueryDto {
  @ApiPropertyOptional({
    description: 'Number of hours of data to analyze (default: 48)',
    example: 48,
    minimum: 12,
    maximum: 168,
  })
  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(168)
  @Type(() => Number)
  analysisHours?: number;
}

/**
 * Severity level for detected anomalies
 */
export type AnomalySeverity = 'low' | 'medium' | 'high';

/**
 * Category of the detected anomaly
 */
export type AnomalyCategory = 'sleep' | 'feeding' | 'diaper' | 'general';

/**
 * Individual anomaly detected in tracking data
 */
export class DetectedAnomalyDto {
  @ApiProperty({ description: 'Category of the anomaly', enum: ['sleep', 'feeding', 'diaper', 'general'] })
  category: AnomalyCategory;

  @ApiProperty({ description: 'Severity level', enum: ['low', 'medium', 'high'] })
  severity: AnomalySeverity;

  @ApiProperty({ description: 'Title of the anomaly' })
  title: string;

  @ApiProperty({ description: 'Detailed description of the anomaly' })
  description: string;

  @ApiProperty({ description: 'Observed value or pattern' })
  observedValue: string;

  @ApiProperty({ description: 'Expected value or pattern' })
  expectedValue: string;

  @ApiProperty({ description: 'Recommendation for addressing the anomaly' })
  recommendation: string;
}

/**
 * Sleep data summary for anomaly analysis
 */
export class SleepAnomalyDataDto {
  @ApiProperty({ description: 'Total sleep minutes in the analysis period' })
  totalSleepMinutes: number;

  @ApiProperty({ description: 'Number of sleep sessions' })
  sessionCount: number;

  @ApiProperty({ description: 'Average session duration in minutes' })
  averageSessionDuration: number;

  @ApiProperty({ description: 'Longest gap between sleep sessions in minutes' })
  longestWakeWindow: number;

  @ApiProperty({ description: 'Expected daily sleep minutes for age' })
  expectedDailySleepMinutes: number;

  @ApiProperty({ description: 'Actual daily sleep minutes' })
  actualDailySleepMinutes: number;
}

/**
 * Feeding data summary for anomaly analysis
 */
export class FeedingAnomalyDataDto {
  @ApiProperty({ description: 'Total feedings in the analysis period' })
  totalFeedings: number;

  @ApiProperty({ description: 'Average feedings per day' })
  averageFeedingsPerDay: number;

  @ApiProperty({ description: 'Longest gap between feedings in minutes' })
  longestFeedingGap: number;

  @ApiProperty({ description: 'Expected feedings per day for age' })
  expectedFeedingsPerDay: number;
}

/**
 * Diaper data summary for anomaly analysis
 */
export class DiaperAnomalyDataDto {
  @ApiProperty({ description: 'Total diaper changes in the analysis period' })
  totalChanges: number;

  @ApiProperty({ description: 'Wet diaper count' })
  wetCount: number;

  @ApiProperty({ description: 'Dirty diaper count' })
  dirtyCount: number;

  @ApiProperty({ description: 'Average changes per day' })
  averageChangesPerDay: number;

  @ApiProperty({ description: 'Expected wet diapers per day for age' })
  expectedWetPerDay: number;
}

/**
 * Aggregated data used for anomaly detection
 */
export class AnomalyAnalysisDataDto {
  @ApiProperty({ description: 'Baby ID' })
  babyId: string;

  @ApiProperty({ description: 'Baby name' })
  babyName: string;

  @ApiProperty({ description: 'Baby age in months' })
  babyAgeMonths: number;

  @ApiProperty({ description: 'Start of analysis period' })
  analysisStart: Date;

  @ApiProperty({ description: 'End of analysis period' })
  analysisEnd: Date;

  @ApiProperty({ description: 'Hours analyzed' })
  analysisHours: number;

  @ApiProperty({ description: 'Sleep data summary', type: SleepAnomalyDataDto })
  sleepData: SleepAnomalyDataDto;

  @ApiProperty({ description: 'Feeding data summary', type: FeedingAnomalyDataDto })
  feedingData: FeedingAnomalyDataDto;

  @ApiProperty({ description: 'Diaper data summary', type: DiaperAnomalyDataDto })
  diaperData: DiaperAnomalyDataDto;
}

/**
 * Anomaly detection response with AI-powered analysis
 * Validates: Requirements 10.3 - Anomaly detection for unusual patterns
 */
export class AnomalyDetectionResponseDto {
  @ApiProperty({ description: 'Baby ID' })
  babyId: string;

  @ApiProperty({ description: 'Baby name' })
  babyName: string;

  @ApiProperty({ description: 'List of detected anomalies', type: [DetectedAnomalyDto] })
  anomalies: DetectedAnomalyDto[];

  @ApiProperty({ description: 'Total number of anomalies detected' })
  anomalyCount: number;

  @ApiProperty({ description: 'Whether any high severity anomalies were detected' })
  hasHighSeverity: boolean;

  @ApiProperty({ description: 'Analysis data used for detection', type: AnomalyAnalysisDataDto })
  analysisData: AnomalyAnalysisDataDto;

  @ApiProperty({ description: 'AI-generated analysis and recommendations' })
  aiAnalysis: string;

  @ApiProperty({ description: 'Whether AI analysis was successfully generated' })
  aiAnalysisGenerated: boolean;

  @ApiProperty({ description: 'Error message if AI analysis failed', nullable: true })
  aiError: string | null;

  @ApiProperty({ description: 'Time taken for AI analysis in milliseconds', nullable: true })
  aiDurationMs: number | null;

  @ApiProperty({ description: 'Timestamp when the analysis was generated' })
  generatedAt: Date;
}
