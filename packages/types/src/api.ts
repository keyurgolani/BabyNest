/**
 * API response models
 * Validates: Requirements 12.3, 12.6
 */

import { DateRange } from './base';
import { FeedingEntry, FeedingType, SleepEntry, DiaperType } from './tracking';

/**
 * Paginated response wrapper
 * Validates: Requirements 12.6
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationMetaDto extends PaginationMeta {}


/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter parameters for list endpoints
 */
export interface FilterParams extends PaginationParams {
  startDate?: Date;
  endDate?: Date;
  caregiverId?: string;
}

/**
 * Statistics period for charts and insights
 */
export interface StatisticsPeriod {
  startDate: string;
  endDate: string;
}

export interface StatisticsQueryParams {
  startDate?: string;
  endDate?: string;
  periodDays?: number;
}

export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
}

export interface UploadResponse {
  url: string;
  thumbnailUrl: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

/**
 * Feeding statistics response
 * Validates: Requirements 3.7
 */
export interface FeedingStatistics {
  period: DateRange;
  totalFeedings: number;
  byType: Record<FeedingType, number>;
  averageDuration: number;
  averageAmount: number;
  lastFeeding: FeedingEntry | null;
  suggestedNextSide: 'left' | 'right' | null;
}

/**
 * Sleep statistics response
 * Validates: Requirements 4.3, 4.4, 4.6
 */
export interface SleepStatistics {
  period: DateRange;
  totalSleepMinutes: number;
  averageSleepMinutes: number;
  napCount: number;
  nightSleepMinutes: number;
  currentWakeWindow: number;
  lastSleep: SleepEntry | null;
}

/**
 * Diaper statistics response
 * Validates: Requirements 5.3, 5.4
 */
export interface DiaperStatistics {
  period: DateRange;
  totalChanges: number;
  byType: Record<DiaperType, number>;
  wetCount24h: number;
  hydrationAlert: boolean;
}

/**
 * Growth statistics response
 * Validates: Requirements 6.2, 6.5
 */
export interface GrowthStatistics {
  period: DateRange;
  latestWeight: number | null;
  latestHeight: number | null;
  latestHeadCircumference: number | null;
  weightPercentile: number | null;
  heightPercentile: number | null;
  headPercentile: number | null;
  weightVelocity: number | null;
  heightVelocity: number | null;
}

/**
 * Activity statistics response
 * Validates: Requirements 9.4, 9.5
 */
export interface ActivityStatistics {
  period: DateRange;
  totalActivities: number;
  totalDurationMinutes: number;
  byType: Record<string, number>;
  averageDailyMinutes: number;
}

/**
 * AI sleep prediction
 * Validates: Requirements 10.1
 */
export interface SleepPrediction {
  predictedNapTime: Date;
  confidence: number;
  basedOnWakeWindow: number;
  reasoning: string;
}

/**
 * Weekly summary from AI insights
 * Validates: Requirements 10.5
 */
export interface WeeklySummary {
  period: DateRange;
  sleepSummary: {
    averageNightSleep: number;
    averageNaps: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  feedingSummary: {
    averageFeedings: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  growthSummary: {
    weightChange: number;
    heightChange: number;
  };
  insights: string[];
  recommendations: string[];
}

/**
 * Anomaly detection result
 * Validates: Requirements 10.3
 */
export interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: Date;
  relatedEntryId: string | null;
}

/**
 * API error response format
 * Validates: Requirements 12.5
 */
export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
  requestId?: string;
  retryAfter?: number;
}

/**
 * API success response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: Date;
}
