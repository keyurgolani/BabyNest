/**
 * Authentication Zod schemas
 * Validates: Requirements 2.1, 2.2, 12.2
 */

import { z } from 'zod';

import { CaregiverRoleSchema } from './core';

/**
 * Email validation schema
 */
export const EmailSchema = z.string().email().max(255);

/**
 * Password validation schema
 * Minimum 8 characters, at least one uppercase, one lowercase, one number
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Login request schema
 */
export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Registration request schema
 */
export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().min(1).max(100),
});

/**
 * Auth tokens response schema
 */
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
});

/**
 * Refresh token request schema
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

/**
 * Caregiver invitation request schema
 * Validates: Requirements 2.3
 */
export const InvitationRequestSchema = z.object({
  email: EmailSchema,
  babyId: z.string().uuid(),
  role: CaregiverRoleSchema.optional().default('secondary'),
});

/**
 * Invitation response schema
 */
export const InvitationResponseSchema = z.object({
  invitationId: z.string().uuid(),
  invitationLink: z.string().url(),
  expiresAt: z.coerce.date(),
});

/**
 * Accept invitation request schema
 */
export const AcceptInvitationRequestSchema = z.object({
  token: z.string().min(1),
});

/**
 * JWT payload schema
 */
export const JwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  iat: z.number().int(),
  exp: z.number().int(),
});

/**
 * Create API key request schema
 */
export const CreateApiKeyRequestSchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.coerce.date().optional(),
});

/**
 * API key response schema
 */
export const ApiKeyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  key: z.string().optional(),
  lastUsedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
});

// Type exports
export type LoginRequestInput = z.infer<typeof LoginRequestSchema>;
export type RegisterRequestInput = z.infer<typeof RegisterRequestSchema>;
export type InvitationRequestInput = z.infer<typeof InvitationRequestSchema>;
export type CreateApiKeyRequestInput = z.infer<typeof CreateApiKeyRequestSchema>;
