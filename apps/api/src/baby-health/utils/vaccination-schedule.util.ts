/**
 * Vaccination Schedule Utility
 * Categorizes vaccinations as completed, upcoming, or overdue
 * Validates: Requirements 8.4
 */

/**
 * Vaccination status enum
 */
export enum VaccinationStatus {
  COMPLETED = 'completed',
  UPCOMING = 'upcoming',
  OVERDUE = 'overdue',
}

/**
 * Interface for vaccination entry with schedule fields
 */
export interface VaccinationScheduleEntry {
  id: string;
  vaccineName: string;
  timestamp: Date;
  nextDueAt: Date | null;
  provider: string | null;
  notes: string | null;
}

/**
 * Determine the status of a vaccination entry
 * 
 * Logic:
 * - COMPLETED: The vaccination has been administered (timestamp is set and represents administration date)
 *   For completed vaccinations, we check if there's a nextDueAt for follow-up
 * - UPCOMING: nextDueAt is in the future (scheduled but not yet due)
 * - OVERDUE: nextDueAt is in the past (scheduled but past due date)
 * 
 * Note: In this system, when a vaccination is logged with a timestamp, it means
 * the vaccination was administered. The nextDueAt field indicates when the next
 * dose or follow-up is due.
 * 
 * @param entry - The vaccination entry to categorize
 * @param referenceDate - The date to compare against (defaults to now)
 * @returns The vaccination status
 */
export function determineVaccinationStatus(
  entry: VaccinationScheduleEntry,
  referenceDate: Date = new Date(),
): VaccinationStatus {
  // If there's no nextDueAt, the vaccination is completed (no follow-up needed)
  if (!entry.nextDueAt) {
    return VaccinationStatus.COMPLETED;
  }

  const nextDueDate = new Date(entry.nextDueAt);
  const refDate = new Date(referenceDate);

  // Normalize dates to start of day for comparison (in UTC to avoid timezone issues)
  const nextDueDateNormalized = Date.UTC(
    nextDueDate.getUTCFullYear(),
    nextDueDate.getUTCMonth(),
    nextDueDate.getUTCDate(),
  );
  const refDateNormalized = Date.UTC(
    refDate.getUTCFullYear(),
    refDate.getUTCMonth(),
    refDate.getUTCDate(),
  );

  // If nextDueAt is in the future (strictly greater), it's upcoming
  if (nextDueDateNormalized > refDateNormalized) {
    return VaccinationStatus.UPCOMING;
  }

  // If nextDueAt is in the past or today, it's overdue
  return VaccinationStatus.OVERDUE;
}

/**
 * Categorize a list of vaccination entries by status
 * 
 * @param entries - List of vaccination entries
 * @param referenceDate - The date to compare against (defaults to now)
 * @returns Object with categorized vaccinations
 */
export function categorizeVaccinations<T extends VaccinationScheduleEntry>(
  entries: T[],
  referenceDate: Date = new Date(),
): {
  completed: T[];
  upcoming: T[];
  overdue: T[];
} {
  const result = {
    completed: [] as T[],
    upcoming: [] as T[],
    overdue: [] as T[],
  };

  for (const entry of entries) {
    const status = determineVaccinationStatus(entry, referenceDate);
    result[status].push(entry);
  }

  return result;
}
