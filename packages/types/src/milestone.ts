/**
 * Milestone Tracking Types
 */

import { PaginationMetaDto } from './api';

export type MilestoneCategory = 'motor' | 'cognitive' | 'social' | 'language';

export interface MilestoneDefinitionResponse {
  id: string;
  category: MilestoneCategory;
  name: string;
  description: string;
  expectedAgeMonthsMin: number;
  expectedAgeMonthsMax: number;
}

export interface MilestoneEntryResponse {
  id: string;
  babyId: string;
  caregiverId: string;
  milestoneId: string;
  achievedDate: string;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  isDeleted: boolean;
  milestone?: MilestoneDefinitionResponse;
}

export interface MilestoneWithStatus {
  definition: MilestoneDefinitionResponse;
  isAchieved: boolean;
  achievement: MilestoneEntryResponse | null;
  isUpcoming: boolean;
  isDelayed: boolean;
  achievedAgeMonths: number | null;
}

export interface MilestonesByCategoryResponse {
  babyId: string;
  babyAgeMonths: number;
  motor: MilestoneWithStatus[];
  cognitive: MilestoneWithStatus[];
  social: MilestoneWithStatus[];
  language: MilestoneWithStatus[];
  summary: {
    totalMilestones: number;
    achievedCount: number;
    upcomingCount: number;
    delayedCount: number;
  };
}

export interface MilestoneEntryListResponse {
  data: MilestoneEntryResponse[];
  meta: PaginationMetaDto;
}

export interface CreateMilestoneDto {
  milestoneId: string;
  achievedDate: string;
  photoUrl?: string;
  notes?: string;
}

export interface UpdateMilestoneDto {
  achievedDate?: string;
  photoUrl?: string;
  notes?: string;
}
