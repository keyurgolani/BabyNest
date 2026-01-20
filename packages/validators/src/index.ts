/**
 * @babynest/validators
 * Shared Zod schemas for BabyNest application
 * 
 * This package contains all the validation schemas used across
 * the frontend and backend of the BabyNest baby tracking application.
 * 
 * Validates: Requirements 17.1, 17.2
 */

// Re-export zod for convenience
export { z } from 'zod';

// Base schemas
export * from './base';

// Core entity schemas
export * from './core';

// Tracking entity schemas
export * from './tracking';

// API response schemas
export * from './api';

// Sync schemas
export * from './sync';

// Authentication schemas
export * from './auth';
