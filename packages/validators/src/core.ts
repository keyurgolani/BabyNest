/**
 * Core entity Zod schemas for BabyNest
 * Validates: Requirements 17.1, 17.2
 */

import { z } from 'zod';

/**
 * Gender enum schema
 */
export const GenderSchema = z.enum(['male', 'female', 'other']);

/**
 * Caregiver role enum schema
 */
export const CaregiverRoleSchema = z.enum(['primary', 'secondary']);

/**
 * Baby profile schema
 * Validates: Requirements 1.1, 1.3, 1.4
 */
export const BabySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date(),
  gender: GenderSchema,
  photoUrl: z.string().url().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Baby creation schema (without auto-generated fields)
 */
export const CreateBabySchema = z.object({
  name: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date(),
  gender: GenderSchema,
  photoUrl: z.string().url().optional().nullable(),
});

/**
 * Baby update schema (all fields optional)
 */
export const UpdateBabySchema = CreateBabySchema.partial();

/**
 * Caregiver schema
 * Validates: Requirements 2.1, 2.2
 */
export const CaregiverSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  name: z.string().min(1).max(100),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Baby-Caregiver relationship schema
 * Validates: Requirements 2.3, 2.4
 */
export const BabyCaregiverSchema = z.object({
  babyId: z.string().uuid(),
  caregiverId: z.string().uuid(),
  role: CaregiverRoleSchema,
  invitedAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable(),
});

/**
 * API key schema
 * Validates: Requirements 12.2
 */
export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  caregiverId: z.string().uuid(),
  key: z.string(),
  name: z.string().min(1).max(100),
  lastUsedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
});

// Type exports inferred from schemas
export type BabyInput = z.infer<typeof CreateBabySchema>;
export type BabyUpdateInput = z.infer<typeof UpdateBabySchema>;
