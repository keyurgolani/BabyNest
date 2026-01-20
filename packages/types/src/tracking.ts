/**
 * Tracking entity types for BabyNest
 * These are the data models for all tracking features
 */

import { BaseEntry } from './base';
import { FeedingType, BreastSide, BottleType, PumpSide } from './feeding';
import { SleepType, SleepQuality } from './sleep';
import { DiaperType } from './diaper';
import { MilestoneCategory } from './milestone';
import { SymptomSeverity, VisitType } from './health';
import { ActivityType } from './activity';

export type {
  FeedingType, BreastSide, BottleType, PumpSide,
  SleepType, SleepQuality,
  DiaperType,
  MilestoneCategory,
  SymptomSeverity, VisitType,
  ActivityType
};

/**
 * Feeding entry
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export interface FeedingEntry extends BaseEntry {
  type: FeedingType;

  // Breastfeeding specific
  /** Duration on left breast in seconds */
  leftDuration: number | null;
  /** Duration on right breast in seconds */
  rightDuration: number | null;
  /** Last breast side used */
  lastSide: BreastSide | null;

  // Bottle specific
  /** Amount in ml */
  amount: number | null;
  /** Type of bottle content */
  bottleType: BottleType | null;

  // Pumping specific
  /** Amount pumped in ml */
  pumpedAmount: number | null;
  /** Side(s) pumped */
  pumpSide: PumpSide | null;

  // Solid food specific
  /** Type of solid food */
  foodType: string | null;
  /** Reaction to food */
  reaction: string | null;

  /** Additional notes */
  notes: string | null;
}

/**
 * Sleep entry
 * Validates: Requirements 4.1, 4.2, 4.5
 */
export interface SleepEntry extends BaseEntry {
  startTime: Date;
  /** null if ongoing */
  endTime: Date | null;
  /** Duration in minutes, calculated */
  duration: number | null;
  sleepType: SleepType;
  quality: SleepQuality | null;
  notes: string | null;
}

/**
 * Diaper entry
 * Validates: Requirements 5.1, 5.2
 */
export interface DiaperEntry extends BaseEntry {
  type: DiaperType;
  color: string | null;
  consistency: string | null;
  hasRash: boolean;
  notes: string | null;
}

/**
 * Growth measurement entry
 * Validates: Requirements 6.1, 6.2
 */
export interface GrowthEntry extends BaseEntry {
  /** Weight in grams */
  weight: number | null;
  /** Height in mm */
  height: number | null;
  /** Head circumference in mm */
  headCircumference: number | null;
  /** WHO percentile for weight */
  weightPercentile: number | null;
  /** WHO percentile for height */
  heightPercentile: number | null;
  /** WHO percentile for head circumference */
  headPercentile: number | null;
  notes: string | null;
}

/**
 * Milestone entry
 * Validates: Requirements 7.1, 7.2
 */
export interface MilestoneEntry extends BaseEntry {
  /** Reference to milestone definition */
  milestoneId: string;
  achievedDate: Date;
  photoUrl: string | null;
  notes: string | null;
}

/**
 * Milestone definition (static data)
 * Validates: Requirements 7.1, 7.3
 */
export interface MilestoneDefinition {
  id: string;
  category: MilestoneCategory;
  name: string;
  description: string;
  expectedAgeMonthsMin: number;
  expectedAgeMonthsMax: number;
}

/**
 * Medication entry
 * Validates: Requirements 8.1, 8.2
 */
export interface MedicationEntry extends BaseEntry {
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  nextDueAt: Date | null;
  notes: string | null;
}

/**
 * Vaccination entry
 * Validates: Requirements 8.3, 8.4
 */
export interface VaccinationEntry extends BaseEntry {
  vaccineName: string;
  provider: string | null;
  location: string | null;
  nextDueAt: Date | null;
  notes: string | null;
}

/**
 * Symptom entry
 * Validates: Requirements 8.5
 */
export interface SymptomEntry extends BaseEntry {
  symptomType: string;
  severity: SymptomSeverity;
  /** Temperature in Celsius */
  temperature: number | null;
  notes: string | null;
}

/**
 * Doctor visit entry
 * Validates: Requirements 8.6
 */
export interface DoctorVisitEntry extends BaseEntry {
  visitType: VisitType;
  provider: string;
  location: string | null;
  diagnosis: string | null;
  followUpDate: Date | null;
  notes: string | null;
}

/**
 * Activity entry
 * Validates: Requirements 9.1, 9.2, 9.3
 */
export interface ActivityEntry extends BaseEntry {
  activityType: ActivityType;
  /** Duration in minutes */
  duration: number | null;
  notes: string | null;
}
