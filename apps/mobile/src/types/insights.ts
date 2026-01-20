/**
 * Types for AI-powered trend insights
 * Mirrors the backend DTOs for type safety
 */

export type TrendPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TrendCategory = 'sleep' | 'feeding' | 'diaper' | 'growth' | 'activity' | 'overall';

export interface TrendInsightItem {
  category: TrendCategory;
  title: string;
  description: string;
  trend: 'improving' | 'declining' | 'stable' | 'new';
  changePercent?: number;
  recommendation?: string;
  icon?: string;
}

export interface SleepTrendData {
  totalSleepMinutes: number;
  averageDailySleepMinutes: number;
  napCount: number;
  averageNapDuration: number | null;
  averageNightSleepDuration: number | null;
  averageWakeWindow: number | null;
  consistencyScore: number;
  comparisonToPrevious?: {
    sleepChange: number;
    napCountChange: number;
    consistencyChange: number;
  };
}

export interface FeedingTrendData {
  totalFeedings: number;
  averageFeedingsPerDay: number;
  breastfeedingCount: number;
  bottleCount: number;
  solidCount: number;
  averageBottleAmount: number | null;
  totalBottleVolume: number;
  consistencyScore: number;
  comparisonToPrevious?: {
    feedingCountChange: number;
    bottleVolumeChange: number;
  };
}

export interface DiaperTrendData {
  totalChanges: number;
  averageChangesPerDay: number;
  wetCount: number;
  dirtyCount: number;
  mixedCount: number;
  wetToDirtyRatio: number | null;
  comparisonToPrevious?: {
    totalChange: number;
    wetChange: number;
    dirtyChange: number;
  };
}

export interface GrowthTrendData {
  hasMeasurements: boolean;
  startWeight?: number | null;
  endWeight?: number | null;
  weightGain?: number | null;
  startHeight?: number | null;
  endHeight?: number | null;
  heightGain?: number | null;
  weightPercentile?: number | null;
  heightPercentile?: number | null;
  headPercentile?: number | null;
}

export interface ActivityTrendData {
  totalActivities: number;
  tummyTimeMinutes: number;
  averageDailyTummyTime: number;
  bathCount: number;
  outdoorMinutes: number;
  playMinutes: number;
  comparisonToPrevious?: {
    tummyTimeChange: number;
    outdoorTimeChange: number;
  };
}

export interface TrendAggregatedData {
  sleep: SleepTrendData;
  feeding: FeedingTrendData;
  diaper: DiaperTrendData;
  growth: GrowthTrendData;
  activity: ActivityTrendData;
}

export interface TrendInsightsResponse {
  babyId: string;
  babyName: string;
  babyAgeMonths: number;
  period: TrendPeriod;
  periodStart: string;
  periodEnd: string;
  periodDays: number;
  aggregatedData: TrendAggregatedData;
  insights: TrendInsightItem[];
  aiSummary: string;
  aiSummaryGenerated: boolean;
  aiError?: string | null;
  aiDurationMs?: number | null;
  highlights: string[];
  areasOfConcern: string[];
  generatedAt: string;
}

export interface TrendInsightsQuery {
  startDate?: string;
  endDate?: string;
}
