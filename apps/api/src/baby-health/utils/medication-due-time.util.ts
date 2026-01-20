/**
 * Medication Due Time Calculation Utility
 * Validates: Requirements 8.2
 * 
 * Calculates the next due time for a medication based on its frequency
 * and the last administration time.
 */

/**
 * Enum for medication frequency options
 * These represent standard medication schedules
 */
export enum MedicationFrequency {
  ONCE = 'once',
  TWICE_DAILY = 'twice_daily',
  THREE_TIMES_DAILY = 'three_times_daily',
  FOUR_TIMES_DAILY = 'four_times_daily',
  EVERY_4_HOURS = 'every_4_hours',
  EVERY_6_HOURS = 'every_6_hours',
  EVERY_8_HOURS = 'every_8_hours',
  EVERY_12_HOURS = 'every_12_hours',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  AS_NEEDED = 'as_needed',
}

/**
 * Mapping of frequency to interval in milliseconds
 * For frequencies that don't have a fixed interval (once, as_needed), returns null
 */
const FREQUENCY_INTERVALS_MS: Record<MedicationFrequency, number | null> = {
  [MedicationFrequency.ONCE]: null, // One-time medication, no next dose
  [MedicationFrequency.TWICE_DAILY]: 12 * 60 * 60 * 1000, // 12 hours
  [MedicationFrequency.THREE_TIMES_DAILY]: 8 * 60 * 60 * 1000, // 8 hours
  [MedicationFrequency.FOUR_TIMES_DAILY]: 6 * 60 * 60 * 1000, // 6 hours
  [MedicationFrequency.EVERY_4_HOURS]: 4 * 60 * 60 * 1000, // 4 hours
  [MedicationFrequency.EVERY_6_HOURS]: 6 * 60 * 60 * 1000, // 6 hours
  [MedicationFrequency.EVERY_8_HOURS]: 8 * 60 * 60 * 1000, // 8 hours
  [MedicationFrequency.EVERY_12_HOURS]: 12 * 60 * 60 * 1000, // 12 hours
  [MedicationFrequency.DAILY]: 24 * 60 * 60 * 1000, // 24 hours
  [MedicationFrequency.WEEKLY]: 7 * 24 * 60 * 60 * 1000, // 7 days
  [MedicationFrequency.AS_NEEDED]: null, // No fixed schedule
};

/**
 * Calculate the next due time for a medication based on frequency
 * 
 * @param administrationTime - The time when the medication was administered
 * @param frequency - The medication frequency
 * @returns The next due time, or null if the frequency doesn't have a fixed schedule
 * 
 * @example
 * // For a medication given at 10:00 AM with every_4_hours frequency
 * const nextDue = calculateNextDueTime(new Date('2024-06-15T10:00:00Z'), MedicationFrequency.EVERY_4_HOURS);
 * // Returns: Date('2024-06-15T14:00:00Z')
 */
export function calculateNextDueTime(
  administrationTime: Date,
  frequency: MedicationFrequency,
): Date | null {
  const intervalMs = FREQUENCY_INTERVALS_MS[frequency];
  
  if (intervalMs === null) {
    // Frequencies like 'once' or 'as_needed' don't have a next due time
    return null;
  }
  
  return new Date(administrationTime.getTime() + intervalMs);
}

/**
 * Get the interval in hours for a given frequency
 * Useful for display purposes
 * 
 * @param frequency - The medication frequency
 * @returns The interval in hours, or null if no fixed interval
 */
export function getFrequencyIntervalHours(
  frequency: MedicationFrequency,
): number | null {
  const intervalMs = FREQUENCY_INTERVALS_MS[frequency];
  
  if (intervalMs === null) {
    return null;
  }
  
  return intervalMs / (60 * 60 * 1000);
}

/**
 * Check if a frequency has a calculable next due time
 * 
 * @param frequency - The medication frequency
 * @returns true if the frequency has a fixed schedule
 */
export function hasCalculableNextDue(frequency: MedicationFrequency): boolean {
  return FREQUENCY_INTERVALS_MS[frequency] !== null;
}

/**
 * Get all available medication frequencies
 * Useful for validation and UI dropdowns
 */
export function getAllMedicationFrequencies(): MedicationFrequency[] {
  return Object.values(MedicationFrequency);
}
