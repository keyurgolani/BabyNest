/**
 * Core entity types for BabyNest
 * These are the foundational data models used throughout the application
 */

/**
 * Baby profile
 * Validates: Requirements 1.1, 1.3, 1.4
 */
export interface Baby {
  id: string;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Caregiver (user) account
 * Validates: Requirements 2.1, 2.2
 */
export interface Caregiver {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Baby-Caregiver relationship for multi-user access
 * Validates: Requirements 2.3, 2.4
 */
export interface BabyCaregiver {
  caregiverId: string;
  role: 'primary' | 'secondary';
  invitedAt: Date;
  acceptedAt: Date | null;
}

/**
 * API key for programmatic access
 * Validates: Requirements 12.2
 */
export interface ApiKey {
  id: string;
  caregiverId: string;
  key: string;
  name: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

/**
 * Gender type for baby profiles
 */
export type Gender = 'male' | 'female' | 'other';

/**
 * Caregiver role in baby-caregiver relationship
 */
export type CaregiverRole = 'primary' | 'secondary';

// Frontend DTOs
export interface BabyResponseDto {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  photoUrl: string | null;
  age: {
    years: number;
    months: number;
    days: number;
  };
  createdAt: string;
  updatedAt: string;
  caregivers?: Array<{
    caregiverId: string;
    name: string;
    email: string;
    role: 'primary' | 'secondary' | 'viewer';
  }>;
}

export interface BabyListResponseDto {
  data: BabyResponseDto[];
  total: number;
}

export interface CreateBabyDto {
  name: string;
  dateOfBirth: string;
  gender: string;
  photoUrl?: string;
}
