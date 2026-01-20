/**
 * Base entry interface for all tracking entities
 * All tracking entries extend this base interface
 * Validates: Requirements 2.5, 11.1, 17.1
 */
export interface BaseEntry {
  /** Unique identifier (UUID) */
  id: string;
  /** Foreign key to Baby */
  babyId: string;
  /** Who logged this entry */
  caregiverId: string;
  /** When the activity occurred */
  timestamp: Date;
  /** When the record was created */
  createdAt: Date;
  /** Last modification time */
  updatedAt: Date;
  /** Last sync time (null if pending) */
  syncedAt: Date | null;
  /** Soft delete flag */
  isDeleted: boolean;
}

/**
 * Date range for filtering and statistics
 */
export interface DateRange {
  start: Date;
  end: Date;
}
