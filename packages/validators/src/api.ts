/**
 * API response Zod schemas
 * Validates: Requirements 12.3, 12.6
 */

import { z } from 'zod';

import { DateRangeSchema } from './base';
import { FeedingTypeSchema, DiaperTypeSchema, SleepEntrySchema, FeedingEntrySchema } from './tracking';

/**
 * Pagination metadata schema
 */
export const PaginationMetaSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  totalPages: z.number().int().min(0),
});

/**
 * Paginated result schema factory
 */
export function createPaginatedResultSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}

/**
 * Sort order enum schema
 */
export const SortOrderSchema = z.enum(['asc', 'desc']);

/**
 * Pagination query parameters schema
 */
export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: SortOrderSchema.optional().default('desc'),
});

/**
 * Filter parameters schema
 */
export const FilterParamsSchema = PaginationParamsSchema.extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  caregiverId: z.string().uuid().optional(),
});

/**
 * Feeding statistics schema
 * Validates: Requirements 3.7
 */
export const FeedingStatisticsSchema = z.object({
  period: DateRangeSchema,
  totalFeedings: z.number().int().min(0),
  byType: z.record(FeedingTypeSchema, z.number().int().min(0)),
  averageDuration: z.number().min(0),
  averageAmount: z.number().min(0),
  lastFeeding: FeedingEntrySchema.nullable(),
  suggestedNextSide: z.enum(['left', 'right']).nullable(),
});

/**
 * Sleep statistics schema
 * Validates: Requirements 4.3, 4.4, 4.6
 */
export const SleepStatisticsSchema = z.object({
  period: DateRangeSchema,
  totalSleepMinutes: z.number().int().min(0),
  averageSleepMinutes: z.number().min(0),
  napCount: z.number().int().min(0),
  nightSleepMinutes: z.number().int().min(0),
  currentWakeWindow: z.number().int().min(0),
  lastSleep: SleepEntrySchema.nullable(),
});

/**
 * Diaper statistics schema
 * Validates: Requirements 5.3, 5.4
 */
export const DiaperStatisticsSchema = z.object({
  period: DateRangeSchema,
  totalChanges: z.number().int().min(0),
  byType: z.record(DiaperTypeSchema, z.number().int().min(0)),
  wetCount24h: z.number().int().min(0),
  hydrationAlert: z.boolean(),
});

/**
 * Growth statistics schema
 * Validates: Requirements 6.2, 6.5
 */
export const GrowthStatisticsSchema = z.object({
  period: DateRangeSchema,
  latestWeight: z.number().nullable(),
  latestHeight: z.number().nullable(),
  latestHeadCircumference: z.number().nullable(),
  weightPercentile: z.number().min(0).max(100).nullable(),
  heightPercentile: z.number().min(0).max(100).nullable(),
  headPercentile: z.number().min(0).max(100).nullable(),
  weightVelocity: z.number().nullable(),
  heightVelocity: z.number().nullable(),
});

/**
 * Activity statistics schema
 * Validates: Requirements 9.4, 9.5
 */
export const ActivityStatisticsSchema = z.object({
  period: DateRangeSchema,
  totalActivities: z.number().int().min(0),
  totalDurationMinutes: z.number().int().min(0),
  byType: z.record(z.string(), z.number().int().min(0)),
  averageDailyMinutes: z.number().min(0),
});

/**
 * Sleep prediction schema
 * Validates: Requirements 10.1
 */
export const SleepPredictionSchema = z.object({
  predictedNapTime: z.coerce.date(),
  confidence: z.number().min(0).max(1),
  basedOnWakeWindow: z.number().int().min(0),
  reasoning: z.string(),
});

/**
 * Trend enum schema
 */
export const TrendSchema = z.enum(['improving', 'stable', 'declining']);
export const FeedingTrendSchema = z.enum(['increasing', 'stable', 'decreasing']);

/**
 * Weekly summary schema
 * Validates: Requirements 10.5
 */
export const WeeklySummarySchema = z.object({
  period: DateRangeSchema,
  sleepSummary: z.object({
    averageNightSleep: z.number().min(0),
    averageNaps: z.number().min(0),
    trend: TrendSchema,
  }),
  feedingSummary: z.object({
    averageFeedings: z.number().min(0),
    trend: FeedingTrendSchema,
  }),
  growthSummary: z.object({
    weightChange: z.number(),
    heightChange: z.number(),
  }),
  insights: z.array(z.string()),
  recommendations: z.array(z.string()),
});

/**
 * Anomaly severity enum schema
 */
export const AnomalySeveritySchema = z.enum(['low', 'medium', 'high']);

/**
 * Anomaly schema
 * Validates: Requirements 10.3
 */
export const AnomalySchema = z.object({
  type: z.string(),
  severity: AnomalySeveritySchema,
  description: z.string(),
  detectedAt: z.coerce.date(),
  relatedEntryId: z.string().uuid().nullable(),
});

/**
 * API error response schema
 * Validates: Requirements 12.5
 */
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
  retryAfter: z.number().int().optional(),
});

/**
 * API success response schema factory
 */
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema,
    timestamp: z.coerce.date(),
  });
}

// Type exports
export type PaginationParamsInput = z.infer<typeof PaginationParamsSchema>;
export type FilterParamsInput = z.infer<typeof FilterParamsSchema>;
