/**
 * Activity Tracking Types
 */

import { PaginationMetaDto, StatisticsPeriod } from './api';

// Activity types - matching backend enum values
export type ActivityType = "tummy_time" | "bath" | "outdoor" | "play";

// Activity response from API
export interface ActivityResponse {
  id: string;
  babyId: string;
  caregiverId: string;
  activityType: ActivityType;
  startTime: string | null;
  endTime: string | null;
  duration: number | null; // in minutes
  notes: string | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  isDeleted: boolean;
}

// Activity list response from API
export interface ActivityListResponse {
  data: ActivityResponse[];
  meta: PaginationMetaDto;
}

// Create activity DTO
export interface CreateActivityDto {
  activityType: ActivityType;
  startTime?: string;
  endTime?: string;
  duration?: number; // in minutes
  notes?: string;
}

// Activity Statistics

export interface ActivityStatisticsResponse {
  period: StatisticsPeriod;
  totalActivities: number;
  byType: Record<ActivityType, number>;
  totalDurationMinutes: number;
  averageDurationMinutes: number | null;
  lastActivity: ActivityResponse | null;
}
