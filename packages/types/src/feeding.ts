/**
 * Feeding Tracking Types
 */

import { PaginationMetaDto, StatisticsPeriod } from './api';

export type FeedingType = 'breastfeeding' | 'bottle' | 'pumping' | 'solid';
export type BreastSide = 'left' | 'right';
export type PumpSide = 'left' | 'right' | 'both';
export type BottleType = 'formula' | 'breastMilk' | 'water';

export interface FeedingResponse {
  id: string;
  babyId: string;
  caregiverId: string;
  type: FeedingType;
  timestamp: string;
  leftDuration: number | null;
  rightDuration: number | null;
  lastSide: BreastSide | null;
  amount: number | null;
  bottleType: BottleType | null;
  pumpedAmount: number | null;
  pumpSide: PumpSide | null;
  duration: number | null;
  foodType: string | null;
  reaction: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingListResponse {
  data: FeedingResponse[];
  meta: PaginationMetaDto;
}

export interface CreateFeedingDto {
  type: FeedingType;
  timestamp?: string;
  leftDuration?: number;
  rightDuration?: number;
  lastSide?: BreastSide;
  amount?: number;
  bottleType?: BottleType;
  pumpedAmount?: number;
  pumpSide?: PumpSide;
  duration?: number;
  foodType?: string;
  reaction?: string;
  notes?: string;
}

// Feeding suggestion response
export interface FeedingSuggestionResponse {
  suggestedNextSide: BreastSide | null;
  lastUsedSide: BreastSide | null;
  lastBreastfeedingTime: string | null;
  hasPreviousBreastfeeding: boolean;
}

// Feeding Statistics

export interface FeedingCountByType {
  breastfeeding: number;
  bottle: number;
  pumping: number;
  solid: number;
}

export interface FeedingStatisticsResponse {
  period: StatisticsPeriod;
  totalFeedings: number;
  byType: FeedingCountByType;
  averageBreastfeedingDuration: number | null;
  averageBottleAmount: number | null;
  averagePumpedAmount: number | null;
  lastFeeding: FeedingResponse | null;
  suggestedNextSide: 'left' | 'right' | null;
}
