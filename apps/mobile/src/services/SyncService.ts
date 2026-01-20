/**
 * Sync Service for BabyNest offline-first synchronization
 * Monitors network connectivity, processes sync queue, and pushes changes to server
 * Implements last-write-wins conflict resolution with caregiver attribution
 * Validates: Requirements 11.2, 11.3
 */

import type { SyncChange, SyncResult, SyncStatus, SyncConflict } from '@babynest/types';
import * as Network from 'expo-network';

import { ApiClient, ApiError, createApiClient } from './ApiClient';
import { getDatabaseService, DatabaseService } from '../database/DatabaseService';
import type { SyncQueueEntry, EntityType } from '../database/types';

/**
 * Configuration for the sync service
 */
export interface SyncServiceConfig {
  /** Maximum number of retries for failed sync operations */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff */
  baseDelayMs: number;
  /** Maximum delay in milliseconds for exponential backoff */
  maxDelayMs: number;
  /** Batch size for sync operations */
  batchSize: number;
  /** Interval in milliseconds for automatic sync checks */
  syncIntervalMs: number;
}

/**
 * Default sync service configuration
 */
const DEFAULT_CONFIG: SyncServiceConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  batchSize: 50,
  syncIntervalMs: 30000, // 30 seconds
};

/**
 * Sync event types for listeners
 */
export type SyncEventType = 
  | 'status_changed'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'entry_synced'
  | 'entry_failed'
  | 'network_changed'
  | 'conflict_resolved';

/**
 * Sync event data
 */
export interface SyncEvent {
  type: SyncEventType;
  data?: {
    status?: SyncStatus;
    isConnected?: boolean;
    syncedCount?: number;
    failedCount?: number;
    error?: string;
    entryId?: string;
    entityType?: string;
    conflict?: ConflictResolutionResult;
  };
}

/**
 * Result of conflict resolution
 * Validates: Requirements 11.3
 */
export interface ConflictResolutionResult {
  entityType: string;
  entityId: string;
  resolution: 'local' | 'server';
  winningTimestamp: Date;
  winningCaregiverId: string;
  losingTimestamp: Date;
  losingCaregiverId: string;
}

/**
 * Sync event listener type
 */
export type SyncEventListener = (event: SyncEvent) => void;

/**
 * Sync Service class for managing offline-first synchronization
 * Validates: Requirements 11.2
 */
export class SyncService {
  private config: SyncServiceConfig;
  private db: DatabaseService;
  private apiClient: ApiClient | null = null;
  private isOnline = false;
  private isSyncing = false;
  private syncStatus: SyncStatus = 'offline';
  private lastSyncTime: Date | null = null;
  private networkSubscription: Network.NetworkStateSubscription | null = null;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<SyncEventListener> = new Set();

  constructor(config: Partial<SyncServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.db = getDatabaseService();
  }

  /**
   * Initialize the sync service
   * Sets up network monitoring and API client
   */
  async initialize(): Promise<void> {
    // Initialize database
    await this.db.initialize();

    // Create API client
    this.apiClient = await createApiClient();

    // Check initial network state
    const networkState = await Network.getNetworkStateAsync();
    this.isOnline = networkState.isConnected ?? false;
    this.updateStatus(this.isOnline ? 'pending' : 'offline');

    // Subscribe to network state changes
    this.networkSubscription = Network.addNetworkStateListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      this.emit({
        type: 'network_changed',
        data: { isConnected: this.isOnline },
      });

      if (!wasOnline && this.isOnline) {
        // Just came online, trigger sync
        this.updateStatus('pending');
        this.processQueue();
      } else if (wasOnline && !this.isOnline) {
        // Just went offline
        this.updateStatus('offline');
      }
    });

    // Start periodic sync check
    this.startPeriodicSync();

    // Initial sync if online
    if (this.isOnline) {
      this.processQueue();
    }

    console.log('[SyncService] Initialized, online:', this.isOnline);
  }

  /**
   * Stop the sync service and clean up resources
   */
  async stop(): Promise<void> {
    if (this.networkSubscription) {
      this.networkSubscription.remove();
      this.networkSubscription = null;
    }

    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    this.listeners.clear();
    console.log('[SyncService] Stopped');
  }

  /**
   * Add an event listener
   */
  addEventListener(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: SyncEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: SyncEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[SyncService] Error in event listener:', error);
      }
    });
  }

  /**
   * Update sync status and emit event
   */
  private updateStatus(status: SyncStatus): void {
    if (this.syncStatus !== status) {
      this.syncStatus = status;
      this.emit({
        type: 'status_changed',
        data: { status },
      });
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Check if currently online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get pending sync count
   */
  async getPendingCount(): Promise<number> {
    return this.db.getPendingSyncCount();
  }

  /**
   * Set the API client (useful for testing or reconfiguration)
   */
  setApiClient(client: ApiClient): void {
    this.apiClient = client;
  }

  /**
   * Start periodic sync checks
   */
  private startPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.processQueue();
      }
    }, this.config.syncIntervalMs);
  }

  /**
   * Manually trigger a sync
   */
  async triggerSync(): Promise<void> {
    if (!this.isOnline) {
      console.log('[SyncService] Cannot sync while offline');
      return;
    }

    await this.processQueue();
  }

  /**
   * Process the sync queue
   * Validates: Requirements 11.2
   */
  async processQueue(): Promise<void> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress');
      return;
    }

    if (!this.apiClient) {
      console.log('[SyncService] No API client configured');
      return;
    }

    if (!this.isOnline) {
      console.log('[SyncService] Offline, skipping sync');
      return;
    }

    this.isSyncing = true;
    this.updateStatus('syncing');
    this.emit({ type: 'sync_started' });

    let syncedCount = 0;
    let failedCount = 0;

    try {
      // Get pending entries from sync queue
      const pendingEntries = await this.db.getPendingSyncEntries();
      
      if (pendingEntries.length === 0) {
        console.log('[SyncService] No pending entries to sync');
        this.updateStatus('synced');
        this.lastSyncTime = new Date();
        this.emit({
          type: 'sync_completed',
          data: { syncedCount: 0, failedCount: 0 },
        });
        return;
      }

      console.log(`[SyncService] Processing ${pendingEntries.length} pending entries`);

      // Process entries in batches
      for (let i = 0; i < pendingEntries.length; i += this.config.batchSize) {
        const batch = pendingEntries.slice(i, i + this.config.batchSize);
        const result = await this.processBatch(batch);
        syncedCount += result.synced;
        failedCount += result.failed;
      }

      this.lastSyncTime = new Date();
      
      // Update status based on results
      if (failedCount > 0 && syncedCount === 0) {
        this.updateStatus('error');
      } else if (failedCount > 0) {
        this.updateStatus('pending');
      } else {
        this.updateStatus('synced');
      }

      this.emit({
        type: 'sync_completed',
        data: { syncedCount, failedCount },
      });

      console.log(`[SyncService] Sync completed: ${syncedCount} synced, ${failedCount} failed`);
    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
      this.updateStatus('error');
      this.emit({
        type: 'sync_failed',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a batch of sync queue entries
   * Validates: Requirements 11.2, 11.3
   */
  private async processBatch(
    entries: SyncQueueEntry[]
  ): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    // Convert queue entries to sync changes
    const changes: SyncChange[] = entries.map((entry) => ({
      entityType: entry.entityType,
      entityId: entry.entityId,
      operation: entry.operation,
      data: JSON.parse(entry.data),
      timestamp: new Date(entry.timestamp),
      caregiverId: entry.caregiverId,
    }));

    try {
      // Push changes to server
      const result = await this.pushWithRetry(changes);

      if (result.success) {
        // Mark entries as synced and remove from queue
        for (const entry of entries) {
          try {
            await this.db.markAsSynced(
              entry.entityType as EntityType,
              entry.entityId
            );
            await this.db.removeSyncQueueEntry(entry.id);
            synced++;
            
            this.emit({
              type: 'entry_synced',
              data: { entryId: entry.entityId, entityType: entry.entityType },
            });
          } catch (error) {
            console.error(`[SyncService] Failed to mark entry as synced:`, error);
            failed++;
          }
        }
      } else {
        // Handle partial success or conflicts
        for (const entry of entries) {
          const conflict = result.conflicts.find(
            (c) => c.entityId === entry.entityId
          );
          
          if (conflict) {
            // Resolve conflict using last-write-wins with caregiver attribution
            const resolutionResult = await this.resolveConflict(conflict, entry);
            
            if (resolutionResult) {
              // Conflict resolved successfully
              await this.db.removeSyncQueueEntry(entry.id);
              synced++;
              
              this.emit({
                type: 'conflict_resolved',
                data: { 
                  entryId: entry.entityId, 
                  entityType: entry.entityType,
                  conflict: resolutionResult,
                },
              });
            } else {
              // Conflict resolution failed
              await this.db.updateSyncQueueEntryError(entry.id, 'Conflict resolution failed');
              failed++;
            }
          } else {
            // Entry was synced successfully
            await this.db.markAsSynced(
              entry.entityType as EntityType,
              entry.entityId
            );
            await this.db.removeSyncQueueEntry(entry.id);
            synced++;
          }
        }
      }
    } catch (error) {
      // Handle batch failure
      console.error('[SyncService] Batch sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      for (const entry of entries) {
        if (entry.retryCount < this.config.maxRetries) {
          await this.db.updateSyncQueueEntryError(entry.id, errorMessage);
        }
        failed++;
        
        this.emit({
          type: 'entry_failed',
          data: { 
            entryId: entry.entityId, 
            entityType: entry.entityType,
            error: errorMessage,
          },
        });
      }
    }

    return { synced, failed };
  }

  /**
   * Push changes to server with exponential backoff retry
   * Validates: Requirements 11.2, 17.4
   */
  private async pushWithRetry(changes: SyncChange[]): Promise<SyncResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const result = await this.apiClient!.pushChanges(changes, this.lastSyncTime);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateBackoffDelay(attempt);
        console.log(`[SyncService] Retry ${attempt + 1}/${this.config.maxRetries} after ${delay}ms`);
        
        await this.sleep(delay);
        
        // Check if still online before retrying
        if (!this.isOnline) {
          throw new Error('Network disconnected during sync');
        }
      }
    }

    throw lastError ?? new Error('Max retries exceeded');
  }

  /**
   * Calculate exponential backoff delay with jitter
   * Validates: Requirements 17.4
   */
  calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, attempt);
    
    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);
    
    // Add jitter (±25%)
    const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
    
    return Math.round(cappedDelay + jitter);
  }

  /**
   * Resolve a sync conflict using last-write-wins strategy with caregiver attribution
   * Validates: Requirements 11.3
   * 
   * @param conflict - The conflict details from the server
   * @param localEntry - The local sync queue entry
   * @returns ConflictResolutionResult if resolved, null if resolution failed
   */
  private async resolveConflict(
    conflict: SyncConflict,
    localEntry: SyncQueueEntry
  ): Promise<ConflictResolutionResult | null> {
    try {
      const localData = JSON.parse(localEntry.data);
      const localTimestamp = this.extractTimestamp(localData);
      const serverTimestamp = this.extractTimestamp(conflict.serverData);
      
      const localCaregiverId = this.extractCaregiverId(localData) || localEntry.caregiverId;
      const serverCaregiverId = this.extractCaregiverId(conflict.serverData) || 'unknown';

      // Apply last-write-wins: the most recent timestamp wins
      const resolution = this.applyLastWriteWins(
        localTimestamp,
        serverTimestamp,
        localData,
        conflict.serverData,
        localCaregiverId,
        serverCaregiverId
      );

      // Set the entity type from the conflict (more reliable than data)
      resolution.entityType = conflict.entityType;
      resolution.entityId = conflict.entityId;

      // Apply the winning data to local database
      await this.applyResolution(
        conflict.entityType as EntityType,
        conflict.entityId,
        resolution.resolvedData,
        resolution.resolution
      );

      console.log(
        `[SyncService] Conflict resolved for ${conflict.entityType}/${conflict.entityId}: ` +
        `${resolution.resolution} wins (${resolution.winningCaregiverId} at ${resolution.winningTimestamp.toISOString()})`
      );

      return resolution;
    } catch (error) {
      console.error(`[SyncService] Failed to resolve conflict:`, error);
      return null;
    }
  }

  /**
   * Apply last-write-wins conflict resolution strategy
   * The entry with the most recent timestamp wins, preserving caregiver attribution
   * Validates: Requirements 11.3
   * 
   * @param localTimestamp - Timestamp of local change
   * @param serverTimestamp - Timestamp of server change
   * @param localData - Local entity data
   * @param serverData - Server entity data
   * @param localCaregiverId - ID of caregiver who made local change
   * @param serverCaregiverId - ID of caregiver who made server change
   * @returns Resolution result with winning data and attribution
   */
  applyLastWriteWins(
    localTimestamp: Date,
    serverTimestamp: Date,
    localData: Record<string, unknown>,
    serverData: Record<string, unknown>,
    localCaregiverId: string,
    serverCaregiverId: string
  ): ConflictResolutionResult & { resolvedData: Record<string, unknown> } {
    // Compare timestamps - most recent wins
    const localWins = localTimestamp.getTime() >= serverTimestamp.getTime();
    
    // Extract entity ID from data
    const entityId = (localData.id as string) || (localData.entityId as string) || 
                     (serverData.id as string) || (serverData.entityId as string) || 'unknown';

    if (localWins) {
      return {
        entityType: 'unknown', // Will be set by caller with actual entity type
        entityId,
        resolution: 'local',
        winningTimestamp: localTimestamp,
        winningCaregiverId: localCaregiverId,
        losingTimestamp: serverTimestamp,
        losingCaregiverId: serverCaregiverId,
        resolvedData: localData,
      };
    } else {
      return {
        entityType: 'unknown', // Will be set by caller with actual entity type
        entityId,
        resolution: 'server',
        winningTimestamp: serverTimestamp,
        winningCaregiverId: serverCaregiverId,
        losingTimestamp: localTimestamp,
        losingCaregiverId: localCaregiverId,
        resolvedData: serverData,
      };
    }
  }

  /**
   * Extract timestamp from entity data
   * Looks for updatedAt, timestamp, or createdAt fields
   * 
   * @param data - Entity data object
   * @returns Extracted timestamp as Date
   */
  extractTimestamp(data: Record<string, unknown>): Date {
    // Try updatedAt first (most accurate for modifications)
    if (data.updatedAt) {
      return new Date(data.updatedAt as string | number);
    }
    // Fall back to timestamp field
    if (data.timestamp) {
      return new Date(data.timestamp as string | number);
    }
    // Fall back to createdAt
    if (data.createdAt) {
      return new Date(data.createdAt as string | number);
    }
    // Default to epoch if no timestamp found
    return new Date(0);
  }

  /**
   * Extract caregiver ID from entity data
   * 
   * @param data - Entity data object
   * @returns Caregiver ID or null if not found
   */
  extractCaregiverId(data: Record<string, unknown>): string | null {
    if (typeof data.caregiverId === 'string') {
      return data.caregiverId;
    }
    return null;
  }

  /**
   * Apply the resolved data to the local database
   * Updates the local entity with the winning data
   * 
   * @param entityType - Type of entity being resolved
   * @param entityId - ID of the entity
   * @param resolvedData - The winning data to apply
   * @param resolution - Whether local or server won
   */
  private async applyResolution(
    entityType: EntityType,
    entityId: string,
    resolvedData: Record<string, unknown>,
    resolution: 'local' | 'server'
  ): Promise<void> {
    if (resolution === 'server') {
      // Server won - update local database with server data
      await this.updateLocalEntity(entityType, entityId, resolvedData);
    }
    // If local won, no need to update local database - it already has the correct data
    // Just mark as synced
    await this.db.markAsSynced(entityType, entityId);
  }

  /**
   * Update a local entity with resolved data from server
   * 
   * @param entityType - Type of entity to update
   * @param entityId - ID of the entity
   * @param data - Data to apply
   */
  private async updateLocalEntity(
    entityType: EntityType,
    entityId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    // Update the entity based on its type
    switch (entityType) {
      case 'baby':
        await this.db.updateBaby(entityId, data as Parameters<DatabaseService['updateBaby']>[1]);
        break;
      case 'feeding':
        await this.db.updateFeedingEntry(entityId, data as Parameters<DatabaseService['updateFeedingEntry']>[1]);
        break;
      case 'sleep':
        await this.db.updateSleepEntry(entityId, data as Parameters<DatabaseService['updateSleepEntry']>[1]);
        break;
      case 'diaper':
        await this.db.updateDiaperEntry(entityId, data as Parameters<DatabaseService['updateDiaperEntry']>[1]);
        break;
      // Add other entity types as needed
      default:
        console.warn(`[SyncService] Unknown entity type for resolution: ${entityType}`);
    }
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let syncServiceInstance: SyncService | null = null;

/**
 * Get the singleton sync service instance
 */
export function getSyncService(): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
}

/**
 * Reset the sync service (for testing)
 */
export async function resetSyncService(): Promise<void> {
  if (syncServiceInstance) {
    await syncServiceInstance.stop();
    syncServiceInstance = null;
  }
}
