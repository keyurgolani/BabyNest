/**
 * Diaper Tracking Types
 */

import { PaginationMetaDto, StatisticsPeriod } from './api';

export type DiaperType = 'wet' | 'dirty' | 'mixed' | 'dry';

export interface DiaperResponse {
  id: string;
  babyId: string;
  caregiverId: string;
  type: DiaperType;
  timestamp: string;
  color: string | null;
  consistency: string | null;
  hasRash: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiaperListResponse {
  data: DiaperResponse[];
  meta: PaginationMetaDto;
}

export interface CreateDiaperDto {
  type: DiaperType;
  timestamp?: string;
  color?: string;
  consistency?: string;
  hasRash?: boolean;
  notes?: string;
}

// Diaper Statistics

export interface DiaperCountByType {
  wet: number;
  dirty: number;
  mixed: number;
  dry: number;
}

export interface HydrationAlert {
  isAlert: boolean;
  wetCount24h: number;
  expectedMinimum: number;
  ageCategory: string;
  alertMessage: string | null;
}

export interface DailyDiaperBreakdown {
  date: string;
  totalChanges: number;
  wetCount: number;
  dirtyCount: number;
  mixedCount: number;
  dryCount: number;
}

export interface DiaperStatisticsResponse {
  period: StatisticsPeriod;
  totalChanges: number;
  byType: DiaperCountByType;
  hydrationAlert: HydrationAlert;
  lastDiaper: DiaperResponse | null;
  dailyBreakdown: DailyDiaperBreakdown[];
  daysWithData: number;
  averageChangesPerDay: number;
}
