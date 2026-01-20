/**
 * Local database entity types for BabyNest
 * These mirror the server schema with additional sync tracking fields
 * Validates: Requirements 11.1
 */

/**
 * Sync status for local records
 */
export type LocalSyncStatus = 'pending' | 'synced' | 'conflict' | 'error';

/**
 * Base interface for all local entities
 * Includes sync tracking fields
 */
export interface LocalBaseEntry {
  /** Unique identifier (UUID) */
  id: string;
  /** Foreign key to Baby */
  babyId: string;
  /** Who logged this entry */
  caregiverId: string;
  /** When the activity occurred (ISO string for SQLite) */
  timestamp: string;
  /** When the record was created (ISO string) */
  createdAt: string;
  /** Last modification time (ISO string) */
  updatedAt: string;
  /** Last sync time (ISO string, null if never synced) */
  syncedAt: string | null;
  /** Soft delete flag */
  isDeleted: number; // SQLite uses 0/1 for boolean
  /** Local sync status */
  localSyncStatus: LocalSyncStatus;
  /** Server version for conflict detection */
  serverVersion: number | null;
}

/**
 * Local Baby profile
 */
export interface LocalBaby {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  isDeleted: number;
  localSyncStatus: LocalSyncStatus;
  serverVersion: number | null;
}

/**
 * Feeding entry types
 */
export type FeedingType = 'breastfeeding' | 'bottle' | 'pumping' | 'solid';
export type BreastSide = 'left' | 'right';
export type BottleType = 'formula' | 'breastMilk' | 'water';
export type PumpSide = 'left' | 'right' | 'both';

/**
 * Local Feeding entry
 */
export interface LocalFeedingEntry extends LocalBaseEntry {
  type: FeedingType;
  /** Duration on left breast in seconds */
  leftDuration: number | null;
  /** Duration on right breast in seconds */
  rightDuration: number | null;
  /** Last breast side used */
  lastSide: BreastSide | null;
  /** Amount in ml */
  amount: number | null;
  /** Type of bottle content */
  bottleType: BottleType | null;
  /** Amount pumped in ml */
  pumpedAmount: number | null;
  /** Side(s) pumped */
  pumpSide: PumpSide | null;
  /** Type of solid food */
  foodType: string | null;
  /** Reaction to food */
  reaction: string | null;
  /** Additional notes */
  notes: string | null;
}

/**
 * Sleep entry types
 */
export type SleepType = 'nap' | 'night';
export type SleepQuality = 'good' | 'fair' | 'poor';

/**
 * Local Sleep entry
 */
export interface LocalSleepEntry extends LocalBaseEntry {
  startTime: string;
  /** null if ongoing */
  endTime: string | null;
  /** Duration in minutes, calculated */
  duration: number | null;
  sleepType: SleepType;
  quality: SleepQuality | null;
  notes: string | null;
}

/**
 * Diaper entry types
 */
export type DiaperType = 'wet' | 'dirty' | 'mixed' | 'dry';

/**
 * Local Diaper entry
 */
export interface LocalDiaperEntry extends LocalBaseEntry {
  type: DiaperType;
  color: string | null;
  consistency: string | null;
  hasRash: number; // SQLite boolean
  notes: string | null;
}

/**
 * Local Growth entry
 */
export interface LocalGrowthEntry extends LocalBaseEntry {
  /** Weight in grams */
  weight: number | null;
  /** Height in mm */
  height: number | null;
  /** Head circumference in mm */
  headCircumference: number | null;
  /** WHO percentile for weight */
  weightPercentile: number | null;
  /** WHO percentile for height */
  heightPercentile: number | null;
  /** WHO percentile for head circumference */
  headPercentile: number | null;
  notes: string | null;
}

/**
 * Local Milestone entry
 */
export interface LocalMilestoneEntry extends LocalBaseEntry {
  /** Reference to milestone definition */
  milestoneId: string;
  achievedDate: string;
  photoUrl: string | null;
  notes: string | null;
}

/**
 * Local Activity entry
 */
export type ActivityType = 'tummyTime' | 'bath' | 'outdoor' | 'play';

export interface LocalActivityEntry extends LocalBaseEntry {
  activityType: ActivityType;
  /** Duration in minutes */
  duration: number | null;
  notes: string | null;
}

/**
 * Local Medication entry
 */
export interface LocalMedicationEntry extends LocalBaseEntry {
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  nextDueAt: string | null;
  notes: string | null;
}

/**
 * Local Vaccination entry
 */
export interface LocalVaccinationEntry extends LocalBaseEntry {
  vaccineName: string;
  provider: string | null;
  location: string | null;
  nextDueAt: string | null;
  notes: string | null;
}

/**
 * Symptom severity types
 */
export type SymptomSeverity = 'mild' | 'moderate' | 'severe';

/**
 * Local Symptom entry
 */
export interface LocalSymptomEntry extends LocalBaseEntry {
  symptomType: string;
  severity: SymptomSeverity;
  /** Temperature in Celsius */
  temperature: number | null;
  notes: string | null;
}

/**
 * Doctor visit types
 */
export type VisitType = 'checkup' | 'sick' | 'emergency' | 'specialist';

/**
 * Local Doctor visit entry
 */
export interface LocalDoctorVisitEntry extends LocalBaseEntry {
  visitType: VisitType;
  provider: string;
  location: string | null;
  diagnosis: string | null;
  followUpDate: string | null;
  notes: string | null;
}

/**
 * Sync queue entry for tracking pending changes
 */
export interface SyncQueueEntry {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: string; // JSON stringified
  timestamp: string;
  caregiverId: string;
  retryCount: number;
  lastError: string | null;
}

/**
 * Entity type names for the database
 */
export type EntityType = 
  | 'baby'
  | 'feeding'
  | 'sleep'
  | 'diaper'
  | 'growth'
  | 'milestone'
  | 'activity'
  | 'medication'
  | 'vaccination'
  | 'symptom'
  | 'doctorVisit';
