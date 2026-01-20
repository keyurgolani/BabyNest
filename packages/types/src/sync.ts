/**
 * Sync models for offline-first operation
 * Validates: Requirements 11.1, 11.2, 11.3
 */

/**
 * Sync operation types
 */
export type SyncOperation = 'create' | 'update' | 'delete';

/**
 * Sync conflict resolution strategy
 */
export type SyncResolution = 'local' | 'server';

/**
 * Sync payload for push/pull operations
 * Validates: Requirements 11.2
 */
export interface SyncPayload {
  deviceId: string;
  lastSyncTime: Date;
  changes: SyncChange[];
}

/**
 * Individual sync change
 * Validates: Requirements 11.2
 */
export interface SyncChange {
  entityType: string;
  entityId: string;
  operation: SyncOperation;
  data: Record<string, unknown>;
  timestamp: Date;
  caregiverId: string;
}

/**
 * Sync result returned from server
 * Validates: Requirements 11.2, 11.3
 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  conflicts: SyncConflict[];
  serverTime: Date;
}

/**
 * Sync conflict details
 * Validates: Requirements 11.3
 */
export interface SyncConflict {
  entityType: string;
  entityId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  resolution: SyncResolution;
  resolvedData: Record<string, unknown>;
}

/**
 * Sync status for UI display
 * Validates: Requirements 11.4
 */
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error' | 'offline';

/**
 * Sync state for the application
 */
export interface SyncState {
  status: SyncStatus;
  pendingChanges: number;
  lastSyncTime: Date | null;
  error: string | null;
}
