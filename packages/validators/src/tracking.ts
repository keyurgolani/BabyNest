/**
 * Tracking entity Zod schemas for BabyNest
 * Validates: Requirements 17.1, 17.2
 */

import { z } from 'zod';

import { BaseEntrySchema } from './base';

// ============ Feeding Schemas ============

/**
 * Feeding type enum schema
 */
export const FeedingTypeSchema = z.enum(['breastfeeding', 'bottle', 'pumping', 'solid']);

/**
 * Breast side enum schema
 */
export const BreastSideSchema = z.enum(['left', 'right']);

/**
 * Bottle type enum schema
 */
export const BottleTypeSchema = z.enum(['formula', 'breastMilk', 'water']);

/**
 * Pump side enum schema
 */
export const PumpSideSchema = z.enum(['left', 'right', 'both']);

/**
 * Feeding entry schema
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export const FeedingEntrySchema = BaseEntrySchema.extend({
  type: FeedingTypeSchema,
  leftDuration: z.number().int().min(0).max(7200).nullable(),
  rightDuration: z.number().int().min(0).max(7200).nullable(),
  lastSide: BreastSideSchema.nullable(),
  amount: z.number().int().min(0).max(1000).nullable(),
  bottleType: BottleTypeSchema.nullable(),
  pumpedAmount: z.number().int().min(0).max(1000).nullable(),
  pumpSide: PumpSideSchema.nullable(),
  foodType: z.string().max(200).nullable(),
  reaction: z.string().max(500).nullable(),
  notes: z.string().max(1000).nullable(),
});

/**
 * Create feeding entry schema
 */
export const CreateFeedingEntrySchema = z.object({
  type: FeedingTypeSchema,
  timestamp: z.coerce.date().optional(),
  leftDuration: z.number().int().min(0).max(7200).optional().nullable(),
  rightDuration: z.number().int().min(0).max(7200).optional().nullable(),
  lastSide: BreastSideSchema.optional().nullable(),
  amount: z.number().int().min(0).max(1000).optional().nullable(),
  bottleType: BottleTypeSchema.optional().nullable(),
  pumpedAmount: z.number().int().min(0).max(1000).optional().nullable(),
  pumpSide: PumpSideSchema.optional().nullable(),
  foodType: z.string().max(200).optional().nullable(),
  reaction: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ============ Sleep Schemas ============

/**
 * Sleep type enum schema
 */
export const SleepTypeSchema = z.enum(['nap', 'night']);

/**
 * Sleep quality enum schema
 */
export const SleepQualitySchema = z.enum(['good', 'fair', 'poor']);

/**
 * Sleep entry schema
 * Validates: Requirements 4.1, 4.2, 4.5
 */
export const SleepEntrySchema = BaseEntrySchema.extend({
  startTime: z.coerce.date(),
  endTime: z.coerce.date().nullable(),
  duration: z.number().int().min(0).nullable(),
  sleepType: SleepTypeSchema,
  quality: SleepQualitySchema.nullable(),
  notes: z.string().max(1000).nullable(),
});

/**
 * Create sleep entry schema
 */
export const CreateSleepEntrySchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
  sleepType: SleepTypeSchema,
  quality: SleepQualitySchema.optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ============ Diaper Schemas ============

/**
 * Diaper type enum schema
 */
export const DiaperTypeSchema = z.enum(['wet', 'dirty', 'mixed', 'dry']);

/**
 * Diaper entry schema
 * Validates: Requirements 5.1, 5.2
 */
export const DiaperEntrySchema = BaseEntrySchema.extend({
  type: DiaperTypeSchema,
  color: z.string().max(50).nullable(),
  consistency: z.string().max(50).nullable(),
  hasRash: z.boolean(),
  notes: z.string().max(1000).nullable(),
});

/**
 * Create diaper entry schema
 */
export const CreateDiaperEntrySchema = z.object({
  type: DiaperTypeSchema,
  timestamp: z.coerce.date().optional(),
  color: z.string().max(50).optional().nullable(),
  consistency: z.string().max(50).optional().nullable(),
  hasRash: z.boolean().optional().default(false),
  notes: z.string().max(1000).optional().nullable(),
});

// ============ Growth Schemas ============

/**
 * Growth entry schema
 * Validates: Requirements 6.1, 6.2
 */
export const GrowthEntrySchema = BaseEntrySchema.extend({
  weight: z.number().int().min(500).max(50000).nullable(), // grams
  height: z.number().int().min(200).max(2000).nullable(), // mm
  headCircumference: z.number().int().min(200).max(800).nullable(), // mm
  weightPercentile: z.number().min(0).max(100).nullable(),
  heightPercentile: z.number().min(0).max(100).nullable(),
  headPercentile: z.number().min(0).max(100).nullable(),
  notes: z.string().max(1000).nullable(),
});

/**
 * Create growth entry schema
 */
export const CreateGrowthEntrySchema = z.object({
  timestamp: z.coerce.date().optional(),
  weight: z.number().int().min(500).max(50000).optional().nullable(),
  height: z.number().int().min(200).max(2000).optional().nullable(),
  headCircumference: z.number().int().min(200).max(800).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ============ Milestone Schemas ============

/**
 * Milestone category enum schema
 */
export const MilestoneCategorySchema = z.enum(['social', 'language', 'cognitive', 'movement']);

/**
 * Milestone definition schema
 * Validates: Requirements 7.1, 7.3
 */
export const MilestoneDefinitionSchema = z.object({
  id: z.string().uuid(),
  category: MilestoneCategorySchema,
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  expectedAgeMonthsMin: z.number().int().min(0).max(72),
  expectedAgeMonthsMax: z.number().int().min(0).max(72),
});

/**
 * Milestone entry schema
 * Validates: Requirements 7.1, 7.2
 */
export const MilestoneEntrySchema = BaseEntrySchema.extend({
  milestoneId: z.string().uuid(),
  achievedDate: z.coerce.date(),
  photoUrl: z.string().url().nullable(),
  notes: z.string().max(1000).nullable(),
});

/**
 * Create milestone entry schema
 */
export const CreateMilestoneEntrySchema = z.object({
  milestoneId: z.string().uuid(),
  achievedDate: z.coerce.date(),
  photoUrl: z.string().url().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ============ Health Schemas ============

/**
 * Medication entry schema
 * Validates: Requirements 8.1, 8.2
 */
export const MedicationEntrySchema = BaseEntrySchema.extend({
  name: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  unit: z.string().min(1).max(50),
  frequency: z.string().min(1).max(100),
  nextDueAt: z.coerce.date().nullable(),
  notes: z.string().max(1000).nullable(),
});

/**
 * Create medication entry schema
 */
export const CreateMedicationEntrySchema = z.object({
  name: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  unit: z.string().min(1).max(50),
  frequency: z.string().min(1).max(100),
  timestamp: z.coerce.date().optional(),
  nextDueAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

/**
 * Vaccination entry schema
 * Validates: Requirements 8.3, 8.4
 */
export const VaccinationEntrySchema = BaseEntrySchema.extend({
  vaccineName: z.string().min(1).max(200),
  provider: z.string().max(200).nullable(),
  location: z.string().max(200).nullable(),
  nextDueAt: z.coerce.date().nullable(),
  notes: z.string().max(1000).nullable(),
});

/**
 * Create vaccination entry schema
 */
export const CreateVaccinationEntrySchema = z.object({
  vaccineName: z.string().min(1).max(200),
  timestamp: z.coerce.date().optional(),
  provider: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  nextDueAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

/**
 * Symptom severity enum schema
 */
export const SymptomSeveritySchema = z.enum(['mild', 'moderate', 'severe']);

/**
 * Symptom entry schema
 * Validates: Requirements 8.5
 */
export const SymptomEntrySchema = BaseEntrySchema.extend({
  symptomType: z.string().min(1).max(200),
  severity: SymptomSeveritySchema,
  temperature: z.number().min(30).max(45).nullable(), // Celsius
  notes: z.string().max(1000).nullable(),
});

/**
 * Create symptom entry schema
 */
export const CreateSymptomEntrySchema = z.object({
  symptomType: z.string().min(1).max(200),
  severity: SymptomSeveritySchema,
  timestamp: z.coerce.date().optional(),
  temperature: z.number().min(30).max(45).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

/**
 * Visit type enum schema
 */
export const VisitTypeSchema = z.enum(['checkup', 'sick', 'emergency', 'specialist']);

/**
 * Doctor visit entry schema
 * Validates: Requirements 8.6
 */
export const DoctorVisitEntrySchema = BaseEntrySchema.extend({
  visitType: VisitTypeSchema,
  provider: z.string().min(1).max(200),
  location: z.string().max(200).nullable(),
  diagnosis: z.string().max(1000).nullable(),
  followUpDate: z.coerce.date().nullable(),
  notes: z.string().max(1000).nullable(),
});

/**
 * Create doctor visit entry schema
 */
export const CreateDoctorVisitEntrySchema = z.object({
  visitType: VisitTypeSchema,
  provider: z.string().min(1).max(200),
  timestamp: z.coerce.date().optional(),
  location: z.string().max(200).optional().nullable(),
  diagnosis: z.string().max(1000).optional().nullable(),
  followUpDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ============ Activity Schemas ============

/**
 * Activity type enum schema
 */
export const ActivityTypeSchema = z.enum(['tummyTime', 'bath', 'outdoor', 'play']);

/**
 * Activity entry schema
 * Validates: Requirements 9.1, 9.2, 9.3
 */
export const ActivityEntrySchema = BaseEntrySchema.extend({
  activityType: ActivityTypeSchema,
  duration: z.number().int().min(0).max(1440).nullable(), // minutes
  notes: z.string().max(1000).nullable(),
});

/**
 * Create activity entry schema
 */
export const CreateActivityEntrySchema = z.object({
  activityType: ActivityTypeSchema,
  timestamp: z.coerce.date().optional(),
  duration: z.number().int().min(0).max(1440).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// Type exports
export type FeedingEntryInput = z.infer<typeof CreateFeedingEntrySchema>;
export type SleepEntryInput = z.infer<typeof CreateSleepEntrySchema>;
export type DiaperEntryInput = z.infer<typeof CreateDiaperEntrySchema>;
export type GrowthEntryInput = z.infer<typeof CreateGrowthEntrySchema>;
export type MilestoneEntryInput = z.infer<typeof CreateMilestoneEntrySchema>;
export type MedicationEntryInput = z.infer<typeof CreateMedicationEntrySchema>;
export type VaccinationEntryInput = z.infer<typeof CreateVaccinationEntrySchema>;
export type SymptomEntryInput = z.infer<typeof CreateSymptomEntrySchema>;
export type DoctorVisitEntryInput = z.infer<typeof CreateDoctorVisitEntrySchema>;
export type ActivityEntryInput = z.infer<typeof CreateActivityEntrySchema>;
