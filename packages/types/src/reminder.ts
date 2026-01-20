/**
 * Reminder Types
 */

import { PaginationMetaDto } from './api';

export enum ReminderType {
  FEED = 'feed',
  SLEEP = 'sleep',
  DIAPER = 'diaper',
  MEDICINE = 'medicine',
  CUSTOM = 'custom',
}

export interface Reminder {
  id: string;
  babyId: string;
  caregiverId: string;
  type: ReminderType;
  title: string;
  description: string | null;
  
  // Schedule
  intervalMinutes: number | null;
  basedOnLastEntry: boolean;
  scheduledTimes: string[]; // HH:MM format
  daysOfWeek: number[]; // 0-6, null means all days
  
  // State
  isActive: boolean;
  isSnoozed: boolean;
  snoozedUntil: Date | null;
  lastTriggeredAt: Date | null;
  nextTriggerAt: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface CreateReminderDto {
  type: ReminderType;
  title: string;
  description?: string;
  
  // Schedule - One strategy required
  intervalMinutes?: number;
  basedOnLastEntry?: boolean;
  scheduledTimes?: string[];
  daysOfWeek?: number[];
  
  isActive?: boolean;
}

export interface UpdateReminderDto {
  type?: ReminderType;
  title?: string;
  description?: string;
  
  intervalMinutes?: number | null;
  basedOnLastEntry?: boolean;
  scheduledTimes?: string[];
  daysOfWeek?: number[];
  
  isActive?: boolean;
  isSnoozed?: boolean;
  snoozedUntil?: Date | null;
}

export interface NextReminder {
  reminder: Reminder;
  dueAt: Date;
  timeRemainingMs: number;
}

export interface ReminderResponseDto extends Reminder {}

export interface ReminderListResponseDto {
  data: ReminderResponseDto[];
  meta: PaginationMetaDto;
}

export interface NextReminderResponse {
  reminder: {
    id: string;
    babyId: string;
    caregiverId: string;
    type: string;
    name: string;
    intervalMinutes: number | null;
    scheduledTimes: string[] | null;
    basedOnLastEntry: boolean;
    isEnabled: boolean;
    notifyAllCaregivers: boolean;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
  } | null;
  nextTriggerTime: string | null;
  minutesUntilTrigger: number | null;
  timeUntilTrigger: string | null;
}
