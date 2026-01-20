/**
 * Sleep Tracking Types
 */

import { PaginationMetaDto, StatisticsPeriod } from './api';

export type SleepType = 'nap' | 'night';
export type SleepQuality = 'good' | 'fair' | 'poor';

export interface SleepResponse {
  id: string;
  babyId: string;
  caregiverId: string;
  startTime: string;
  endTime: string | null;
  sleepType: SleepType;
  duration: number | null;
  quality: SleepQuality | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SleepListResponse {
  data: SleepResponse[];
  meta: PaginationMetaDto;
}

export interface CreateSleepDto {
  startTime: string;
  endTime?: string;
  sleepType: SleepType;
  quality?: SleepQuality;
  notes?: string;
}

// Sleep Statistics

export interface DailySleepBreakdown {
  date: string;
  totalMinutes: number;
  napCount: number;
  napMinutes: number;
  nightMinutes: number;
  sessionCount: number;
}

export interface SleepStatisticsResponse {
  period: StatisticsPeriod;
  totalSleepMinutes: number;
  averageSleepMinutesPerDay: number;
  napCount: number;
  nightSleepMinutes: number;
  napMinutes: number;
  nightSleepCount: number;
  totalSessions: number;
  averageNapDuration: number | null;
  averageNightSleepDuration: number | null;
  currentWakeWindowMinutes: number;
  currentWakeWindowFormatted: string;
  lastSleep: SleepResponse | null;
  dailyBreakdown?: DailySleepBreakdown[];
  daysWithData: number;
}

// Wake Window
export interface WakeWindowResponse {
  babyId: string;
  wakeWindowMinutes: number;
  wakeWindowFormatted: string;
  wakeWindowStartTime: string;
  calculatedAt: string;
  lastSleep: SleepResponse | null;
  hasSleepHistory: boolean;
}

// Wake Window Timer (with age-appropriate recommendations)
export type WakeWindowStatus = 'well-rested' | 'approaching-tired' | 'overtired';

export interface WakeWindowTimerResponse {
  babyId: string;
  lastSleepEndTime: string | null;
  currentAwakeMinutes: number;
  currentAwakeFormatted: string;
  recommendedWakeWindowMinutes: number;
  minWakeWindowMinutes: number;
  maxWakeWindowMinutes: number;
  recommendedWakeWindowFormatted: string;
  suggestedNextSleepTime: string | null;
  minutesUntilNextSleep: number;
  minutesUntilNextSleepFormatted: string;
  status: WakeWindowStatus;
  percentageOfWakeWindow: number;
  babyAgeMonths: number;
  calculatedAt: string;
  lastSleep: SleepResponse | null;
  hasSleepHistory: boolean;
}
