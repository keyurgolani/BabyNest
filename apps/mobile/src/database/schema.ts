/**
 * SQLite schema definitions for BabyNest local database
 * Mirrors the server schema with sync tracking fields
 * Validates: Requirements 11.1
 */

/**
 * SQL statements to create all tables
 */
export const CREATE_TABLES_SQL = `
-- Baby profiles table
CREATE TABLE IF NOT EXISTS babies (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  dateOfBirth TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  photoUrl TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending' CHECK (localSyncStatus IN ('pending', 'synced', 'conflict', 'error')),
  serverVersion INTEGER
);

-- Feeding entries table
CREATE TABLE IF NOT EXISTS feeding_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  type TEXT NOT NULL CHECK (type IN ('breastfeeding', 'bottle', 'pumping', 'solid')),
  leftDuration INTEGER,
  rightDuration INTEGER,
  lastSide TEXT CHECK (lastSide IN ('left', 'right') OR lastSide IS NULL),
  amount INTEGER,
  bottleType TEXT CHECK (bottleType IN ('formula', 'breastMilk', 'water') OR bottleType IS NULL),
  pumpedAmount INTEGER,
  pumpSide TEXT CHECK (pumpSide IN ('left', 'right', 'both') OR pumpSide IS NULL),
  foodType TEXT,
  reaction TEXT,
  notes TEXT,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Sleep entries table
CREATE TABLE IF NOT EXISTS sleep_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  startTime TEXT NOT NULL,
  endTime TEXT,
  duration INTEGER,
  sleepType TEXT NOT NULL CHECK (sleepType IN ('nap', 'night')),
  quality TEXT CHECK (quality IN ('good', 'fair', 'poor') OR quality IS NULL),
  notes TEXT,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Diaper entries table
CREATE TABLE IF NOT EXISTS diaper_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  type TEXT NOT NULL CHECK (type IN ('wet', 'dirty', 'mixed', 'dry')),
  color TEXT,
  consistency TEXT,
  hasRash INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Growth entries table
CREATE TABLE IF NOT EXISTS growth_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  weight INTEGER,
  height INTEGER,
  headCircumference INTEGER,
  weightPercentile REAL,
  heightPercentile REAL,
  headPercentile REAL,
  notes TEXT,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Milestone entries table
CREATE TABLE IF NOT EXISTS milestone_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  milestoneId TEXT NOT NULL,
  achievedDate TEXT NOT NULL,
  photoUrl TEXT,
  notes TEXT,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Memory entries table (Photo Journal)
CREATE TABLE IF NOT EXISTS memory_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  title TEXT,
  note TEXT,
  photoUrl TEXT NOT NULL,
  thumbnailUrl TEXT,
  entryType TEXT NOT NULL CHECK (entryType IN ('photo', 'milestone', 'first', 'note')),
  linkedEntryId TEXT,
  linkedEntryType TEXT,
  takenAt TEXT NOT NULL,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Activity entries table
CREATE TABLE IF NOT EXISTS activity_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  activityType TEXT NOT NULL CHECK (activityType IN ('tummyTime', 'bath', 'outdoor', 'play')),
  duration INTEGER,
  notes TEXT,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Medication entries table
CREATE TABLE IF NOT EXISTS medication_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  unit TEXT NOT NULL,
  frequency TEXT NOT NULL,
  nextDueAt TEXT,
  notes TEXT,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Vaccination entries table
CREATE TABLE IF NOT EXISTS vaccination_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  vaccineName TEXT NOT NULL,
  provider TEXT,
  location TEXT,
  nextDueAt TEXT,
  notes TEXT,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Symptom entries table
CREATE TABLE IF NOT EXISTS symptom_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  symptomType TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  temperature REAL,
  notes TEXT,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Doctor visit entries table
CREATE TABLE IF NOT EXISTS doctor_visit_entries (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedAt TEXT,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  visitType TEXT NOT NULL CHECK (visitType IN ('checkup', 'sick', 'emergency', 'specialist')),
  provider TEXT NOT NULL,
  location TEXT,
  diagnosis TEXT,
  followUpDate TEXT,
  notes TEXT,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY NOT NULL,
  babyId TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feeding', 'sleep', 'diaper', 'medication', 'custom')),
  name TEXT NOT NULL,
  intervalMinutes INTEGER,
  scheduledTimes TEXT,
  basedOnLastEntry INTEGER NOT NULL DEFAULT 0,
  isEnabled INTEGER NOT NULL DEFAULT 1,
  notifyAllCaregivers INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  localSyncStatus TEXT NOT NULL DEFAULT 'pending',
  serverVersion INTEGER,
  FOREIGN KEY (babyId) REFERENCES babies(id) ON DELETE CASCADE
);

-- Sync queue table for tracking pending changes
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  entityType TEXT NOT NULL,
  entityId TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  data TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  caregiverId TEXT NOT NULL,
  retryCount INTEGER NOT NULL DEFAULT 0,
  lastError TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feeding_babyId ON feeding_entries(babyId);
CREATE INDEX IF NOT EXISTS idx_feeding_timestamp ON feeding_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_feeding_sync ON feeding_entries(localSyncStatus);

CREATE INDEX IF NOT EXISTS idx_sleep_babyId ON sleep_entries(babyId);
CREATE INDEX IF NOT EXISTS idx_sleep_timestamp ON sleep_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_sleep_sync ON sleep_entries(localSyncStatus);

CREATE INDEX IF NOT EXISTS idx_diaper_babyId ON diaper_entries(babyId);
CREATE INDEX IF NOT EXISTS idx_diaper_timestamp ON diaper_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_diaper_sync ON diaper_entries(localSyncStatus);

CREATE INDEX IF NOT EXISTS idx_growth_babyId ON growth_entries(babyId);
CREATE INDEX IF NOT EXISTS idx_milestone_babyId ON milestone_entries(babyId);
CREATE INDEX IF NOT EXISTS idx_memory_babyId ON memory_entries(babyId);
CREATE INDEX IF NOT EXISTS idx_memory_takenAt ON memory_entries(takenAt);
CREATE INDEX IF NOT EXISTS idx_activity_babyId ON activity_entries(babyId);
CREATE INDEX IF NOT EXISTS idx_medication_babyId ON medication_entries(babyId);
CREATE INDEX IF NOT EXISTS idx_vaccination_babyId ON vaccination_entries(babyId);
CREATE INDEX IF NOT EXISTS idx_symptom_babyId ON symptom_entries(babyId);
CREATE INDEX IF NOT EXISTS idx_doctor_visit_babyId ON doctor_visit_entries(babyId);

CREATE INDEX IF NOT EXISTS idx_reminders_babyId ON reminders(babyId);
CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON reminders(babyId, isEnabled, isDeleted);

CREATE INDEX IF NOT EXISTS idx_sync_queue_entityType ON sync_queue(entityType);
CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);
`;

/**
 * Table names mapping for entity types
 */
export const TABLE_NAMES = {
  baby: 'babies',
  feeding: 'feeding_entries',
  sleep: 'sleep_entries',
  diaper: 'diaper_entries',
  growth: 'growth_entries',
  milestone: 'milestone_entries',
  memory: 'memory_entries',
  activity: 'activity_entries',
  medication: 'medication_entries',
  vaccination: 'vaccination_entries',
  symptom: 'symptom_entries',
  doctorVisit: 'doctor_visit_entries',
  reminder: 'reminders',
  syncQueue: 'sync_queue',
} as const;

/**
 * Database version for migrations
 */
export const DATABASE_VERSION = 1;

/**
 * Database name
 */
export const DATABASE_NAME = 'babynest.db';
