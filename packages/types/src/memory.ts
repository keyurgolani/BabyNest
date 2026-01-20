/**
 * Memory / Photo Journal Types
 */

import { PaginationMetaDto } from './api';

export enum MemoryEntryType {
  PHOTO = 'photo',
  MILESTONE = 'milestone',
  FIRST = 'first',
  NOTE = 'note',
}

export enum LinkedEntryType {
  FEEDING = 'feeding',
  SLEEP = 'sleep',
  DIAPER = 'diaper',
  GROWTH = 'growth',
  MILESTONE = 'milestone',
}

export interface Memory {
  id: string;
  babyId: string;
  caregiverId: string;
  title: string | null;
  note: string | null;
  photoUrl: string;
  thumbnailUrl: string | null;
  entryType: MemoryEntryType;
  linkedEntryId: string | null;
  linkedEntryType: LinkedEntryType | null;
  takenAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface CreateMemoryDto {
  title?: string;
  note?: string;
  photoUrl: string;
  thumbnailUrl?: string;
  entryType?: MemoryEntryType;
  linkedEntryId?: string;
  linkedEntryType?: LinkedEntryType;
  takenAt?: string | Date; // API accepts ISO string
}

export interface UpdateMemoryDto {
  title?: string;
  note?: string;
  photoUrl?: string;
  entryType?: MemoryEntryType;
  linkedEntryId?: string;
  linkedEntryType?: LinkedEntryType;
  takenAt?: string | Date; // API accepts ISO string
}

export interface MemoryResponseDto extends Memory {}

export interface MemoryListResponseDto {
  data: MemoryResponseDto[];
  meta: PaginationMetaDto;
}

/**
 * A group of memories for a specific date in timeline view
 */
export interface MemoryDateGroupDto {
  date: string;
  count: number;
  memories: MemoryResponseDto[];
}

/**
 * Response DTO for timeline view of memories
 */
export interface MemoryTimelineResponseDto {
  babyId: string;
  totalMemories: number;
  groups: MemoryDateGroupDto[];
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * Query parameters for timeline endpoint
 */
export interface MemoryTimelineQueryDto {
  cursor?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}
