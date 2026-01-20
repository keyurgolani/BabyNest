export interface WeeklySummaryQueryDto {
  startDate?: string;
  endDate?: string;
}

export interface SleepSummaryDto {
  totalSleepMinutes: number;
  averageSleepMinutesPerDay: number;
  napCount: number;
  napMinutes: number;
  nightSleepMinutes: number;
  averageNapDuration: number | null;
  averageNightSleepDuration: number | null;
}

export interface FeedingSummaryDto {
  totalFeedings: number;
  breastfeedingCount: number;
  bottleCount: number;
  pumpingCount: number;
  solidCount: number;
  averageBreastfeedingDuration: number | null;
  averageBottleAmount: number | null;
}

export interface DiaperSummaryDto {
  totalChanges: number;
  wetCount: number;
  dirtyCount: number;
  mixedCount: number;
  averageChangesPerDay: number;
}

export interface GrowthDataDto {
  hasMeasurements: boolean;
  latestWeight: number | null;
  latestHeight: number | null;
  latestHeadCircumference: number | null;
  weightPercentile: number | null;
  heightPercentile: number | null;
  headPercentile: number | null;
}

export interface ActivitiesSummaryDto {
  totalActivities: number;
  tummyTimeMinutes: number;
  bathCount: number;
  outdoorMinutes: number;
  playMinutes: number;
}

export interface WeeklyAggregatedDataDto {
  babyId: string;
  babyName: string;
  babyAgeMonths: number;
  weekStart: string;
  weekEnd: string;
  sleepSummary: SleepSummaryDto;
  feedingSummary: FeedingSummaryDto;
  diaperSummary: DiaperSummaryDto;
  growthData: GrowthDataDto;
  activitiesSummary: ActivitiesSummaryDto;
}

export interface WeeklySummaryResponseDto {
  babyId: string;
  babyName: string;
  weekStart: string;
  weekEnd: string;
  aggregatedData: WeeklyAggregatedDataDto;
  aiSummary: string;
  aiSummaryGenerated: boolean;
  aiError: string | null;
  aiDurationMs: number | null;
  generatedAt: string;
}

export interface SleepPredictionResponseDto {
  babyId: string;
  babyName: string;
  predictedNapTime: string;
  confidence: number;
  recommendedWakeWindowMinutes: number;
  recommendedWakeWindowFormatted: string;
  currentWakeWindowMinutes: number;
  currentWakeWindowFormatted: string;
  minutesUntilNap: number;
  reasoning: string;
  aiAnalysisGenerated: boolean;
  generatedAt: string;
}

export type AnomalySeverity = 'low' | 'medium' | 'high';
export type AnomalyCategory = 'sleep' | 'feeding' | 'diaper' | 'general';

export interface DetectedAnomalyDto {
  category: AnomalyCategory;
  severity: AnomalySeverity;
  title: string;
  description: string;
  observedValue: string;
  expectedValue: string;
  recommendation: string;
}

export interface AnomalyDetectionResponseDto {
  babyId: string;
  babyName: string;
  anomalies: DetectedAnomalyDto[];
  anomalyCount: number;
  hasHighSeverity: boolean;
  aiAnalysis: string;
  aiAnalysisGenerated: boolean;
  generatedAt: string;
}
