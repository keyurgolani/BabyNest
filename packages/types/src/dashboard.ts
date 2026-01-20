/**
 * Dashboard & Insight Types
 */

import { PaginationMetaDto } from './api';

// Dashboard summary
export interface DashboardSummaryResponse {
  babyId: string;
  babyName: string;
  date: string;
  feeding: {
    count: number;
    totalMinutes: number;
    totalMl: number;
    byType: {
      breastfeeding: number;
      bottle: number;
      pumping: number;
      solid: number;
    };
  };
  sleep: {
    totalMinutes: number;
    napCount: number;
    napMinutes: number;
    nightSleepMinutes: number;
    averageNapDuration: number | null;
  };
  diaper: {
    total: number;
    wet: number;
    dirty: number;
    mixed: number;
  };
  activities: {
    tummyTimeMinutes: number;
    bathCount: number;
    outdoorMinutes: number;
  };
  hourlyBreakdown: Array<{
    hour: number;
    feeding: number;
    sleep: number;
    diaper: number;
    activity: number;
    total: number;
  }>;
  generatedAt: string;
}

// Insight Types
export type InsightCadence = 'everytime' | 'daily' | 'weekly' | 'monthly';
export type InsightType = 'weekly_summary' | 'sleep_prediction' | 'anomaly' | 'daily_summary' | 'trend';

export interface InsightConfigResponse {
  id: string;
  babyId: string;
  cadence: InsightCadence;
  isEnabled: boolean;
  lastGenerated: string | null;
  nextGeneration: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigureInsightCadenceDto {
  cadence: InsightCadence;
  isEnabled?: boolean;
}

export interface GenerateAdhocInsightDto {
  type?: InsightType;
  startDate?: string;
  endDate?: string;
}

export interface GeneratedInsightResponse {
  id: string;
  babyId: string;
  type: InsightType;
  content: unknown;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
}

export interface InsightHistoryQueryParams {
  type?: InsightType;
  page?: number;
  pageSize?: number;
}

export interface InsightHistoryListResponse {
  data: GeneratedInsightResponse[];
  meta: PaginationMetaDto;
}

export interface WeeklySummaryResponse {
  babyId: string;
  babyName: string;
  babyAgeMonths: number;
  periodStart: string;
  periodEnd: string;
  aggregatedData: {
    sleepSummary: {
      totalSleepMinutes: number;
      averageSleepMinutesPerDay: number;
      napCount: number;
      nightSleepCount: number;
    };
    feedingSummary: {
      totalFeedings: number;
      breastfeedingCount: number;
      bottleCount: number;
      solidCount: number;
    };
    diaperSummary: {
      totalChanges: number;
      wetCount: number;
      dirtyCount: number;
      averageChangesPerDay: number;
    };
    activitiesSummary: {
      tummyTimeMinutes: number;
      bathCount: number;
      outdoorMinutes: number;
    };
  };
  aiInsights: string;
  aiInsightsGenerated: boolean;
  generatedAt: string;
}

export interface SleepPredictionResponse {
  babyId: string;
  babyName: string;
  babyAgeMonths: number;
  currentWakeWindow: {
    minutes: number;
    formatted: string;
    startTime: string;
  };
  recommendedWakeWindow: {
    minMinutes: number;
    maxMinutes: number;
    formatted: string;
  };
  predictedNapTime: string;
  confidence: 'high' | 'medium' | 'low';
  aiAnalysis: string;
  aiAnalysisGenerated: boolean;
  generatedAt: string;
}

export interface AnomalyDetectionResponse {
  babyId: string;
  babyName: string;
  analysisHours: number;
  anomalies: Array<{
    category: 'sleep' | 'feeding' | 'diaper';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    detectedAt: string;
    recommendation?: string;
  }>;
  aiAnalysis: string;
  aiAnalysisGenerated: boolean;
  generatedAt: string;
}

export interface TrendInsightsResponse {
  babyId: string;
  babyName: string;
  babyAgeMonths: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  periodStart: string;
  periodEnd: string;
  periodDays: number;
  aggregatedData: {
    sleep: {
      totalSleepMinutes: number;
      averageDailySleepMinutes: number;
      napCount: number;
      averageNapDuration: number | null;
      averageNightSleepDuration: number | null;
      averageWakeWindow: number | null;
      consistencyScore: number;
    };
    feeding: {
      totalFeedings: number;
      averageFeedingsPerDay: number;
      breastfeedingCount: number;
      bottleCount: number;
      solidCount: number;
      averageBottleAmount: number | null;
      totalBottleVolume: number;
      consistencyScore: number;
    };
    diaper: {
      totalChanges: number;
      averageChangesPerDay: number;
      wetCount: number;
      dirtyCount: number;
      mixedCount: number;
      wetToDirtyRatio: number | null;
    };
    growth: {
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
    };
    activity: {
      totalActivities: number;
      tummyTimeMinutes: number;
      averageDailyTummyTime: number;
      bathCount: number;
      outdoorMinutes: number;
      playMinutes: number;
    };
  };
  insights: Array<{
    category: string;
    title: string;
    description: string;
    trend: 'improving' | 'declining' | 'stable' | 'new';
    changePercent?: number;
    recommendation?: string;
    icon?: string;
  }>;
  aiSummary: string;
  aiSummaryGenerated: boolean;
  aiError?: string | null;
  aiDurationMs?: number | null;
  highlights: string[];
  areasOfConcern: string[];
  generatedAt: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'feeding' | 'sleep' | 'diaper' | 'activity' | 'medication';
  timestamp: string;
  details: string;
  icon?: string;
}

// Scheduled Reports
export enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface ScheduledReport {
  id: string;
  babyId: string;
  caregiverId: string;
  name: string;
  frequency: ReportFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  email: string;
  isActive: boolean;
  lastSentAt?: string;
  nextScheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledReportDto {
  name: string;
  frequency: ReportFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  email: string;
  isActive?: boolean;
}

export interface UpdateScheduledReportDto {
  name?: string;
  frequency?: ReportFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time?: string;
  email?: string;
  isActive?: boolean;
}
