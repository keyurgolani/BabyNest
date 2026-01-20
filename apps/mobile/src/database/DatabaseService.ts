/**
 * Database service for BabyNest local SQLite database
 * Provides initialization and CRUD operations for offline-first support
 * Validates: Requirements 11.1
 */

import * as SQLite from 'expo-sqlite';

import { CREATE_TABLES_SQL, DATABASE_NAME, TABLE_NAMES } from './schema';
import type {
  LocalBaby,
  LocalFeedingEntry,
  LocalSleepEntry,
  LocalDiaperEntry,
  LocalActivityEntry,
  SyncQueueEntry,
  EntityType,
} from './types';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Database service class for managing local SQLite database
 */
export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize the database and create tables
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      
      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON;');
      
      // Create all tables
      await this.db.execAsync(CREATE_TABLES_SQL);
      
      this.isInitialized = true;
      console.log('[DatabaseService] Database initialized successfully');
    } catch (error) {
      console.error('[DatabaseService] Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Get the database instance, initializing if needed
   */
  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db || !this.isInitialized) {
      await this.initialize();
    }
    return this.db!;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }

  // ==================== Baby CRUD Operations ====================

  /**
   * Create a new baby profile
   */
  async createBaby(baby: Omit<LocalBaby, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'isDeleted' | 'localSyncStatus' | 'serverVersion'>): Promise<LocalBaby> {
    const db = await this.getDb();
    const now = getCurrentTimestamp();
    const id = generateUUID();

    const newBaby: LocalBaby = {
      id,
      ...baby,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      isDeleted: 0,
      localSyncStatus: 'pending',
      serverVersion: null,
    };

    await db.runAsync(
      `INSERT INTO ${TABLE_NAMES.baby} (id, name, dateOfBirth, gender, photoUrl, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newBaby.id, newBaby.name, newBaby.dateOfBirth, newBaby.gender, newBaby.photoUrl, newBaby.createdAt, newBaby.updatedAt, newBaby.syncedAt, newBaby.isDeleted, newBaby.localSyncStatus, newBaby.serverVersion]
    );

    // Add to sync queue
    await this.addToSyncQueue('baby', id, 'create', newBaby, baby.name); // Using name as caregiverId placeholder

    return newBaby;
  }

  /**
   * Get a baby by ID
   */
  async getBaby(id: string): Promise<LocalBaby | null> {
    const db = await this.getDb();
    const result = await db.getFirstAsync<LocalBaby>(
      `SELECT * FROM ${TABLE_NAMES.baby} WHERE id = ? AND isDeleted = 0`,
      [id]
    );
    return result || null;
  }

  /**
   * Get all babies
   */
  async getAllBabies(): Promise<LocalBaby[]> {
    const db = await this.getDb();
    return db.getAllAsync<LocalBaby>(
      `SELECT * FROM ${TABLE_NAMES.baby} WHERE isDeleted = 0 ORDER BY createdAt DESC`
    );
  }

  /**
   * Update a baby profile
   */
  async updateBaby(id: string, updates: Partial<Omit<LocalBaby, 'id' | 'createdAt'>>): Promise<LocalBaby | null> {
    const db = await this.getDb();
    const existing = await this.getBaby(id);
    if (!existing) return null;

    const updatedBaby: LocalBaby = {
      ...existing,
      ...updates,
      updatedAt: getCurrentTimestamp(),
      localSyncStatus: 'pending',
    };

    await db.runAsync(
      `UPDATE ${TABLE_NAMES.baby} 
       SET name = ?, dateOfBirth = ?, gender = ?, photoUrl = ?, updatedAt = ?, localSyncStatus = ?
       WHERE id = ?`,
      [updatedBaby.name, updatedBaby.dateOfBirth, updatedBaby.gender, updatedBaby.photoUrl, updatedBaby.updatedAt, updatedBaby.localSyncStatus, id]
    );

    // Add to sync queue
    await this.addToSyncQueue('baby', id, 'update', updatedBaby, existing.name);

    return updatedBaby;
  }

  /**
   * Soft delete a baby (marks as deleted)
   */
  async deleteBaby(id: string): Promise<boolean> {
    const db = await this.getDb();
    const existing = await this.getBaby(id);
    if (!existing) return false;

    const now = getCurrentTimestamp();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.baby} SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
      [now, id]
    );

    // Add to sync queue
    await this.addToSyncQueue('baby', id, 'delete', { id }, existing.name);

    return true;
  }

  // ==================== Feeding CRUD Operations ====================

  /**
   * Create a new feeding entry
   */
  async createFeedingEntry(entry: Omit<LocalFeedingEntry, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'isDeleted' | 'localSyncStatus' | 'serverVersion'>): Promise<LocalFeedingEntry> {
    const db = await this.getDb();
    const now = getCurrentTimestamp();
    const id = generateUUID();

    const newEntry: LocalFeedingEntry = {
      id,
      ...entry,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      isDeleted: 0,
      localSyncStatus: 'pending',
      serverVersion: null,
    };

    await db.runAsync(
      `INSERT INTO ${TABLE_NAMES.feeding} (id, babyId, caregiverId, timestamp, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, type, leftDuration, rightDuration, lastSide, amount, bottleType, pumpedAmount, pumpSide, foodType, reaction, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newEntry.id, newEntry.babyId, newEntry.caregiverId, newEntry.timestamp, newEntry.createdAt, newEntry.updatedAt, newEntry.syncedAt, newEntry.isDeleted, newEntry.localSyncStatus, newEntry.serverVersion, newEntry.type, newEntry.leftDuration, newEntry.rightDuration, newEntry.lastSide, newEntry.amount, newEntry.bottleType, newEntry.pumpedAmount, newEntry.pumpSide, newEntry.foodType, newEntry.reaction, newEntry.notes]
    );

    await this.addToSyncQueue('feeding', id, 'create', newEntry, entry.caregiverId);

    return newEntry;
  }

  /**
   * Get feeding entries for a baby
   */
  async getFeedingEntries(babyId: string, limit = 50): Promise<LocalFeedingEntry[]> {
    const db = await this.getDb();
    return db.getAllAsync<LocalFeedingEntry>(
      `SELECT * FROM ${TABLE_NAMES.feeding} WHERE babyId = ? AND isDeleted = 0 ORDER BY timestamp DESC LIMIT ?`,
      [babyId, limit]
    );
  }

  /**
   * Get a feeding entry by ID
   */
  async getFeedingEntry(id: string): Promise<LocalFeedingEntry | null> {
    const db = await this.getDb();
    const result = await db.getFirstAsync<LocalFeedingEntry>(
      `SELECT * FROM ${TABLE_NAMES.feeding} WHERE id = ? AND isDeleted = 0`,
      [id]
    );
    return result || null;
  }

  /**
   * Update a feeding entry
   */
  async updateFeedingEntry(id: string, updates: Partial<Omit<LocalFeedingEntry, 'id' | 'createdAt' | 'babyId'>>): Promise<LocalFeedingEntry | null> {
    const db = await this.getDb();
    const existing = await this.getFeedingEntry(id);
    if (!existing) return null;

    const updatedEntry: LocalFeedingEntry = {
      ...existing,
      ...updates,
      updatedAt: getCurrentTimestamp(),
      localSyncStatus: 'pending',
    };

    await db.runAsync(
      `UPDATE ${TABLE_NAMES.feeding} 
       SET caregiverId = ?, timestamp = ?, updatedAt = ?, localSyncStatus = ?, type = ?, leftDuration = ?, rightDuration = ?, lastSide = ?, amount = ?, bottleType = ?, pumpedAmount = ?, pumpSide = ?, foodType = ?, reaction = ?, notes = ?
       WHERE id = ?`,
      [updatedEntry.caregiverId, updatedEntry.timestamp, updatedEntry.updatedAt, updatedEntry.localSyncStatus, updatedEntry.type, updatedEntry.leftDuration, updatedEntry.rightDuration, updatedEntry.lastSide, updatedEntry.amount, updatedEntry.bottleType, updatedEntry.pumpedAmount, updatedEntry.pumpSide, updatedEntry.foodType, updatedEntry.reaction, updatedEntry.notes, id]
    );

    await this.addToSyncQueue('feeding', id, 'update', updatedEntry, existing.caregiverId);

    return updatedEntry;
  }

  /**
   * Delete a feeding entry
   */
  async deleteFeedingEntry(id: string): Promise<boolean> {
    const db = await this.getDb();
    const existing = await this.getFeedingEntry(id);
    if (!existing) return false;

    const now = getCurrentTimestamp();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.feeding} SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
      [now, id]
    );

    await this.addToSyncQueue('feeding', id, 'delete', { id }, existing.caregiverId);

    return true;
  }

  // ==================== Sleep CRUD Operations ====================

  /**
   * Create a new sleep entry
   */
  async createSleepEntry(entry: Omit<LocalSleepEntry, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'isDeleted' | 'localSyncStatus' | 'serverVersion'>): Promise<LocalSleepEntry> {
    const db = await this.getDb();
    const now = getCurrentTimestamp();
    const id = generateUUID();

    const newEntry: LocalSleepEntry = {
      id,
      ...entry,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      isDeleted: 0,
      localSyncStatus: 'pending',
      serverVersion: null,
    };

    await db.runAsync(
      `INSERT INTO ${TABLE_NAMES.sleep} (id, babyId, caregiverId, timestamp, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, startTime, endTime, duration, sleepType, quality, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newEntry.id, newEntry.babyId, newEntry.caregiverId, newEntry.timestamp, newEntry.createdAt, newEntry.updatedAt, newEntry.syncedAt, newEntry.isDeleted, newEntry.localSyncStatus, newEntry.serverVersion, newEntry.startTime, newEntry.endTime, newEntry.duration, newEntry.sleepType, newEntry.quality, newEntry.notes]
    );

    await this.addToSyncQueue('sleep', id, 'create', newEntry, entry.caregiverId);

    return newEntry;
  }

  /**
   * Get sleep entries for a baby
   */
  async getSleepEntries(babyId: string, limit = 50): Promise<LocalSleepEntry[]> {
    const db = await this.getDb();
    return db.getAllAsync<LocalSleepEntry>(
      `SELECT * FROM ${TABLE_NAMES.sleep} WHERE babyId = ? AND isDeleted = 0 ORDER BY timestamp DESC LIMIT ?`,
      [babyId, limit]
    );
  }

  /**
   * Get a sleep entry by ID
   */
  async getSleepEntry(id: string): Promise<LocalSleepEntry | null> {
    const db = await this.getDb();
    const result = await db.getFirstAsync<LocalSleepEntry>(
      `SELECT * FROM ${TABLE_NAMES.sleep} WHERE id = ? AND isDeleted = 0`,
      [id]
    );
    return result || null;
  }

  /**
   * Update a sleep entry
   */
  async updateSleepEntry(id: string, updates: Partial<Omit<LocalSleepEntry, 'id' | 'createdAt' | 'babyId'>>): Promise<LocalSleepEntry | null> {
    const db = await this.getDb();
    const existing = await this.getSleepEntry(id);
    if (!existing) return null;

    const updatedEntry: LocalSleepEntry = {
      ...existing,
      ...updates,
      updatedAt: getCurrentTimestamp(),
      localSyncStatus: 'pending',
    };

    await db.runAsync(
      `UPDATE ${TABLE_NAMES.sleep} 
       SET caregiverId = ?, timestamp = ?, updatedAt = ?, localSyncStatus = ?, startTime = ?, endTime = ?, duration = ?, sleepType = ?, quality = ?, notes = ?
       WHERE id = ?`,
      [updatedEntry.caregiverId, updatedEntry.timestamp, updatedEntry.updatedAt, updatedEntry.localSyncStatus, updatedEntry.startTime, updatedEntry.endTime, updatedEntry.duration, updatedEntry.sleepType, updatedEntry.quality, updatedEntry.notes, id]
    );

    await this.addToSyncQueue('sleep', id, 'update', updatedEntry, existing.caregiverId);

    return updatedEntry;
  }

  /**
   * Delete a sleep entry
   */
  async deleteSleepEntry(id: string): Promise<boolean> {
    const db = await this.getDb();
    const existing = await this.getSleepEntry(id);
    if (!existing) return false;

    const now = getCurrentTimestamp();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.sleep} SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
      [now, id]
    );

    await this.addToSyncQueue('sleep', id, 'delete', { id }, existing.caregiverId);

    return true;
  }

  // ==================== Diaper CRUD Operations ====================

  /**
   * Create a new diaper entry
   */
  async createDiaperEntry(entry: Omit<LocalDiaperEntry, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'isDeleted' | 'localSyncStatus' | 'serverVersion'>): Promise<LocalDiaperEntry> {
    const db = await this.getDb();
    const now = getCurrentTimestamp();
    const id = generateUUID();

    const newEntry: LocalDiaperEntry = {
      id,
      ...entry,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      isDeleted: 0,
      localSyncStatus: 'pending',
      serverVersion: null,
    };

    await db.runAsync(
      `INSERT INTO ${TABLE_NAMES.diaper} (id, babyId, caregiverId, timestamp, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, type, color, consistency, hasRash, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newEntry.id, newEntry.babyId, newEntry.caregiverId, newEntry.timestamp, newEntry.createdAt, newEntry.updatedAt, newEntry.syncedAt, newEntry.isDeleted, newEntry.localSyncStatus, newEntry.serverVersion, newEntry.type, newEntry.color, newEntry.consistency, newEntry.hasRash, newEntry.notes]
    );

    await this.addToSyncQueue('diaper', id, 'create', newEntry, entry.caregiverId);

    return newEntry;
  }

  /**
   * Get diaper entries for a baby
   */
  async getDiaperEntries(babyId: string, limit = 50): Promise<LocalDiaperEntry[]> {
    const db = await this.getDb();
    return db.getAllAsync<LocalDiaperEntry>(
      `SELECT * FROM ${TABLE_NAMES.diaper} WHERE babyId = ? AND isDeleted = 0 ORDER BY timestamp DESC LIMIT ?`,
      [babyId, limit]
    );
  }

  /**
   * Get a diaper entry by ID
   */
  async getDiaperEntry(id: string): Promise<LocalDiaperEntry | null> {
    const db = await this.getDb();
    const result = await db.getFirstAsync<LocalDiaperEntry>(
      `SELECT * FROM ${TABLE_NAMES.diaper} WHERE id = ? AND isDeleted = 0`,
      [id]
    );
    return result || null;
  }

  /**
   * Update a diaper entry
   */
  async updateDiaperEntry(id: string, updates: Partial<Omit<LocalDiaperEntry, 'id' | 'createdAt' | 'babyId'>>): Promise<LocalDiaperEntry | null> {
    const db = await this.getDb();
    const existing = await this.getDiaperEntry(id);
    if (!existing) return null;

    const updatedEntry: LocalDiaperEntry = {
      ...existing,
      ...updates,
      updatedAt: getCurrentTimestamp(),
      localSyncStatus: 'pending',
    };

    await db.runAsync(
      `UPDATE ${TABLE_NAMES.diaper} 
       SET caregiverId = ?, timestamp = ?, updatedAt = ?, localSyncStatus = ?, type = ?, color = ?, consistency = ?, hasRash = ?, notes = ?
       WHERE id = ?`,
      [updatedEntry.caregiverId, updatedEntry.timestamp, updatedEntry.updatedAt, updatedEntry.localSyncStatus, updatedEntry.type, updatedEntry.color, updatedEntry.consistency, updatedEntry.hasRash, updatedEntry.notes, id]
    );

    await this.addToSyncQueue('diaper', id, 'update', updatedEntry, existing.caregiverId);

    return updatedEntry;
  }

  /**
   * Delete a diaper entry
   */
  async deleteDiaperEntry(id: string): Promise<boolean> {
    const db = await this.getDb();
    const existing = await this.getDiaperEntry(id);
    if (!existing) return false;

    const now = getCurrentTimestamp();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.diaper} SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
      [now, id]
    );

    await this.addToSyncQueue('diaper', id, 'delete', { id }, existing.caregiverId);

    return true;
  }

  // ==================== Activity CRUD Operations ====================

  /**
   * Create a new activity entry
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  async createActivityEntry(entry: Omit<LocalActivityEntry, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'isDeleted' | 'localSyncStatus' | 'serverVersion'>): Promise<LocalActivityEntry> {
    const db = await this.getDb();
    const now = getCurrentTimestamp();
    const id = generateUUID();

    const newEntry: LocalActivityEntry = {
      id,
      ...entry,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      isDeleted: 0,
      localSyncStatus: 'pending',
      serverVersion: null,
    };

    await db.runAsync(
      `INSERT INTO ${TABLE_NAMES.activity} (id, babyId, caregiverId, timestamp, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, activityType, duration, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newEntry.id, newEntry.babyId, newEntry.caregiverId, newEntry.timestamp, newEntry.createdAt, newEntry.updatedAt, newEntry.syncedAt, newEntry.isDeleted, newEntry.localSyncStatus, newEntry.serverVersion, newEntry.activityType, newEntry.duration, newEntry.notes]
    );

    await this.addToSyncQueue('activity', id, 'create', newEntry, entry.caregiverId);

    return newEntry;
  }

  /**
   * Get activity entries for a baby
   */
  async getActivityEntries(babyId: string, limit = 50): Promise<LocalActivityEntry[]> {
    const db = await this.getDb();
    return db.getAllAsync<LocalActivityEntry>(
      `SELECT * FROM ${TABLE_NAMES.activity} WHERE babyId = ? AND isDeleted = 0 ORDER BY timestamp DESC LIMIT ?`,
      [babyId, limit]
    );
  }

  /**
   * Get an activity entry by ID
   */
  async getActivityEntry(id: string): Promise<LocalActivityEntry | null> {
    const db = await this.getDb();
    const result = await db.getFirstAsync<LocalActivityEntry>(
      `SELECT * FROM ${TABLE_NAMES.activity} WHERE id = ? AND isDeleted = 0`,
      [id]
    );
    return result || null;
  }

  /**
   * Update an activity entry
   */
  async updateActivityEntry(id: string, updates: Partial<Omit<LocalActivityEntry, 'id' | 'createdAt' | 'babyId'>>): Promise<LocalActivityEntry | null> {
    const db = await this.getDb();
    const existing = await this.getActivityEntry(id);
    if (!existing) return null;

    const updatedEntry: LocalActivityEntry = {
      ...existing,
      ...updates,
      updatedAt: getCurrentTimestamp(),
      localSyncStatus: 'pending',
    };

    await db.runAsync(
      `UPDATE ${TABLE_NAMES.activity} 
       SET caregiverId = ?, timestamp = ?, updatedAt = ?, localSyncStatus = ?, activityType = ?, duration = ?, notes = ?
       WHERE id = ?`,
      [updatedEntry.caregiverId, updatedEntry.timestamp, updatedEntry.updatedAt, updatedEntry.localSyncStatus, updatedEntry.activityType, updatedEntry.duration, updatedEntry.notes, id]
    );

    await this.addToSyncQueue('activity', id, 'update', updatedEntry, existing.caregiverId);

    return updatedEntry;
  }

  /**
   * Delete an activity entry
   */
  async deleteActivityEntry(id: string): Promise<boolean> {
    const db = await this.getDb();
    const existing = await this.getActivityEntry(id);
    if (!existing) return false;

    const now = getCurrentTimestamp();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.activity} SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
      [now, id]
    );

    await this.addToSyncQueue('activity', id, 'delete', { id }, existing.caregiverId);

    return true;
  }

  // ==================== Sync Queue Operations ====================

  /**
   * Add an entry to the sync queue
   */
  async addToSyncQueue(
    entityType: EntityType,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    data: Record<string, unknown>,
    caregiverId: string
  ): Promise<void> {
    const db = await this.getDb();
    const id = generateUUID();
    const now = getCurrentTimestamp();

    await db.runAsync(
      `INSERT INTO ${TABLE_NAMES.syncQueue} (id, entityType, entityId, operation, data, timestamp, caregiverId, retryCount, lastError)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, entityType, entityId, operation, JSON.stringify(data), now, caregiverId, 0, null]
    );
  }

  /**
   * Get all pending sync queue entries
   */
  async getPendingSyncEntries(): Promise<SyncQueueEntry[]> {
    const db = await this.getDb();
    return db.getAllAsync<SyncQueueEntry>(
      `SELECT * FROM ${TABLE_NAMES.syncQueue} ORDER BY timestamp ASC`
    );
  }

  /**
   * Remove a sync queue entry after successful sync
   */
  async removeSyncQueueEntry(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM ${TABLE_NAMES.syncQueue} WHERE id = ?`, [id]);
  }

  /**
   * Update sync queue entry on failure
   */
  async updateSyncQueueEntryError(id: string, error: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE ${TABLE_NAMES.syncQueue} SET retryCount = retryCount + 1, lastError = ? WHERE id = ?`,
      [error, id]
    );
  }

  /**
   * Get count of pending sync entries
   */
  async getPendingSyncCount(): Promise<number> {
    const db = await this.getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.syncQueue}`
    );
    return result?.count ?? 0;
  }

  // ==================== Utility Operations ====================

  /**
   * Mark an entry as synced
   */
  async markAsSynced(entityType: EntityType, entityId: string, serverVersion?: number): Promise<void> {
    const db = await this.getDb();
    const tableName = TABLE_NAMES[entityType];
    const now = getCurrentTimestamp();

    await db.runAsync(
      `UPDATE ${tableName} SET syncedAt = ?, localSyncStatus = 'synced', serverVersion = ? WHERE id = ?`,
      [now, serverVersion ?? null, entityId]
    );
  }

  /**
   * Get entries pending sync for a specific entity type
   */
  async getPendingEntries(entityType: EntityType): Promise<unknown[]> {
    const db = await this.getDb();
    const tableName = TABLE_NAMES[entityType];
    return db.getAllAsync(
      `SELECT * FROM ${tableName} WHERE localSyncStatus = 'pending' AND isDeleted = 0`
    );
  }

  /**
   * Clear all data (for testing or logout)
   */
  async clearAllData(): Promise<void> {
    const db = await this.getDb();
    
    // Delete in order to respect foreign keys
    await db.execAsync(`
      DELETE FROM ${TABLE_NAMES.syncQueue};
      DELETE FROM ${TABLE_NAMES.feeding};
      DELETE FROM ${TABLE_NAMES.sleep};
      DELETE FROM ${TABLE_NAMES.diaper};
      DELETE FROM ${TABLE_NAMES.growth};
      DELETE FROM ${TABLE_NAMES.milestone};
      DELETE FROM ${TABLE_NAMES.activity};
      DELETE FROM ${TABLE_NAMES.medication};
      DELETE FROM ${TABLE_NAMES.vaccination};
      DELETE FROM ${TABLE_NAMES.symptom};
      DELETE FROM ${TABLE_NAMES.doctorVisit};
      DELETE FROM ${TABLE_NAMES.baby};
    `);
  }
}

// Singleton instance
let databaseServiceInstance: DatabaseService | null = null;

/**
 * Get the singleton database service instance
 */
export function getDatabaseService(): DatabaseService {
  if (!databaseServiceInstance) {
    databaseServiceInstance = new DatabaseService();
  }
  return databaseServiceInstance;
}

/**
 * Reset the database service (for testing)
 */
export function resetDatabaseService(): void {
  if (databaseServiceInstance) {
    databaseServiceInstance.close();
    databaseServiceInstance = null;
  }
}
