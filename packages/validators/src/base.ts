/**
 * Base entry Zod schema for all tracking entities
 * Validates: Requirements 2.5, 11.1, 17.1
 */

import { z } from 'zod';

/**
 * Base entry schema - all tracking entries extend this
 */
export const BaseEntrySchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  caregiverId: z.string().uuid(),
  timestamp: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  syncedAt: z.coerce.date().nullable(),
  isDeleted: z.boolean().default(false),
});

/**
 * Date range schema for filtering and statistics
 */
export const DateRangeSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
}).refine(
  (data) => data.start <= data.end,
  { message: 'Start date must be before or equal to end date' }
);

// Type exports
export type BaseEntryInput = z.infer<typeof BaseEntrySchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;
