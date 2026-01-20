/**
 * Sync Zod schemas for offline-first operation
 * Validates: Requirements 11.1, 11.2, 11.3
 */

import { z } from 'zod';

/**
 * Sync operation enum schema
 */
export const SyncOperationSchema = z.enum(['create', 'update', 'delete']);

/**
 * Sync resolution enum schema
 */
export const SyncResolutionSchema = z.enum(['local', 'server']);

/**
 * Sync status enum schema
 */
export const SyncStatusSchema = z.enum(['synced', 'syncing', 'pending', 'error', 'offline']);

/**
 * Sync change schema
 * Validates: Requirements 11.2
 */
export const SyncChangeSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
  operation: SyncOperationSchema,
  data: z.record(z.unknown()),
  timestamp: z.coerce.date(),
  caregiverId: z.string().uuid(),
});

/**
 * Sync payload schema
 * Validates: Requirements 11.2
 */
export const SyncPayloadSchema = z.object({
  deviceId: z.string().min(1),
  lastSyncTime: z.coerce.date(),
  changes: z.array(SyncChangeSchema),
});

/**
 * Sync conflict schema
 * Validates: Requirements 11.3
 */
export const SyncConflictSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
  localData: z.record(z.unknown()),
  serverData: z.record(z.unknown()),
  resolution: SyncResolutionSchema,
  resolvedData: z.record(z.unknown()),
});

/**
 * Sync result schema
 * Validates: Requirements 11.2, 11.3
 */
export const SyncResultSchema = z.object({
  success: z.boolean(),
  syncedCount: z.number().int().min(0),
  conflicts: z.array(SyncConflictSchema),
  serverTime: z.coerce.date(),
});

/**
 * Sync state schema
 */
export const SyncStateSchema = z.object({
  status: SyncStatusSchema,
  pendingChanges: z.number().int().min(0),
  lastSyncTime: z.coerce.date().nullable(),
  error: z.string().nullable(),
});

// Type exports
export type SyncChangeInput = z.infer<typeof SyncChangeSchema>;
export type SyncPayloadInput = z.infer<typeof SyncPayloadSchema>;
export type SyncResultInput = z.infer<typeof SyncResultSchema>;
