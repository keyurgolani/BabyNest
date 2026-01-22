/**
 * Photo Import Types
 * Types for importing baby tracking data from photos of handwritten logs
 */

/**
 * Extracted feeding entry from photo
 */
export interface ExtractedFeeding {
  type: 'breastfeeding' | 'bottle' | 'pumping' | 'solid';
  timestamp: string;
  leftDuration?: number;
  rightDuration?: number;
  amount?: number;
  bottleType?: 'formula' | 'breastMilk' | 'water';
  foodType?: string;
  notes?: string;
  confidence?: number;
}

/**
 * Extracted sleep entry from photo
 */
export interface ExtractedSleep {
  startTime: string;
  endTime?: string;
  sleepType: 'nap' | 'night';
  quality?: 'good' | 'fair' | 'poor';
  notes?: string;
  confidence?: number;
}

/**
 * Extracted diaper entry from photo
 */
export interface ExtractedDiaper {
  type: 'wet' | 'dirty' | 'mixed' | 'dry';
  timestamp: string;
  color?: string;
  consistency?: string;
  hasRash?: boolean;
  notes?: string;
  confidence?: number;
}

/**
 * Extracted medication entry from photo
 */
export interface ExtractedMedication {
  timestamp: string;
  name: string;
  dosage?: number;
  unit?: string;
  notes?: string;
  confidence?: number;
}

/**
 * Extracted symptom/temperature entry from photo
 */
export interface ExtractedSymptom {
  timestamp: string;
  symptomType: string;
  severity?: 'mild' | 'moderate' | 'severe';
  temperature?: number;
  notes?: string;
  confidence?: number;
}

/**
 * Extracted activity entry from photo
 */
export interface ExtractedActivity {
  timestamp: string;
  activityType: string;
  duration?: number;
  notes?: string;
  confidence?: number;
}

/**
 * Response from photo analysis endpoint
 */
export interface PhotoAnalysisResponse {
  success: boolean;
  error?: string;
  rawText?: string;
  feedings: ExtractedFeeding[];
  sleepEntries: ExtractedSleep[];
  diaperEntries: ExtractedDiaper[];
  medications: ExtractedMedication[];
  symptoms: ExtractedSymptom[];
  activities: ExtractedActivity[];
  overallConfidence?: number;
  warnings?: string[];
}

/**
 * Request to confirm and import extracted entries
 */
export interface ConfirmImportRequest {
  feedings: ExtractedFeeding[];
  sleepEntries: ExtractedSleep[];
  diaperEntries: ExtractedDiaper[];
  medications: ExtractedMedication[];
  symptoms: ExtractedSymptom[];
  activities: ExtractedActivity[];
}

/**
 * Response from import confirmation
 */
export interface ImportResultResponse {
  success: boolean;
  feedingsImported: number;
  sleepEntriesImported: number;
  diaperEntriesImported: number;
  medicationsImported: number;
  symptomsImported: number;
  activitiesImported: number;
  errors?: string[];
}
