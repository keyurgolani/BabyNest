/**
 * Core types for the BabyNest Zustand store
 */

export type TimerType = "breastfeeding" | "sleep" | "tummyTime" | "pumping";

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

/**
 * Theme preference options
 * - "system": Follow device system preference
 * - "light": Always use light mode
 * - "dark": Always use dark mode
 * - "auto": Auto-switch based on time of day
 */
export type ThemePreference = "system" | "light" | "dark" | "auto";

/**
 * Auto night mode settings
 */
export interface AutoNightModeSettings {
  /** Whether auto night mode is enabled (when themePreference is "auto") */
  enabled: boolean;
  /** Start time for dark mode (24h format, e.g., "20:00") */
  startTime: string;
  /** End time for dark mode (24h format, e.g., "07:00") */
  endTime: string;
}

export type Gender = "male" | "female" | "other";

export interface Baby {
  id: string;
  name: string;
  dateOfBirth: Date;
  gender: Gender;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimerMetadata {
  // Breastfeeding specific
  breastSide?: "left" | "right";
  // Sleep specific
  sleepType?: "nap" | "night";
  // General notes
  notes?: string;
}

export interface Timer {
  type: TimerType;
  startTime: Date;
  pausedDuration: number;
  isPaused: boolean;
  metadata: TimerMetadata;
}

export interface TimerResult {
  type: TimerType;
  startTime: Date;
  endTime: Date;
  totalDuration: number; // in seconds
  pausedDuration: number;
  metadata: TimerMetadata;
}
