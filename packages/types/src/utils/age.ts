/**
 * Age calculation utility for BabyNest
 * Validates: Requirements 1.2
 *
 * WHEN a caregiver views a baby profile THEN THE BabyNest_System
 * SHALL display the baby's current age in months and days
 */

/**
 * Age representation in months and days
 */
export interface Age {
  /** Age in complete months */
  months: number;
  /** Remaining days after complete months */
  days: number;
  /** Total age in days */
  totalDays: number;
}

/**
 * Calculate age in months and days from date of birth
 *
 * The calculation follows these rules:
 * - Months are calculated as complete calendar months
 * - Days are the remaining days after complete months
 * - If the current day of month is before the birth day, we're in a partial month
 * - Total days is the absolute difference in days
 *
 * @param dateOfBirth - The date of birth
 * @param referenceDate - The reference date to calculate age from (defaults to now)
 * @returns Age object with months, days, and totalDays
 *
 * @example
 * // Baby born on Jan 15, 2024, current date is Jul 20, 2024
 * calculateAge(new Date('2024-01-15'), new Date('2024-07-20'))
 * // Returns: { months: 6, days: 5, totalDays: 187 }
 */
export function calculateAge(dateOfBirth: Date, referenceDate: Date = new Date()): Age {
  const birth = new Date(dateOfBirth);
  const reference = new Date(referenceDate);

  // Normalize to start of day to avoid time-of-day issues
  birth.setHours(0, 0, 0, 0);
  reference.setHours(0, 0, 0, 0);

  // Handle future birth dates (return zeros)
  if (birth > reference) {
    return { months: 0, days: 0, totalDays: 0 };
  }

  // Calculate total days
  const diffTime = reference.getTime() - birth.getTime();
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Calculate months
  let months = (reference.getFullYear() - birth.getFullYear()) * 12;
  months += reference.getMonth() - birth.getMonth();

  // Adjust if the day of month hasn't been reached yet
  if (reference.getDate() < birth.getDate()) {
    months--;
  }

  // Calculate remaining days after complete months
  // Find the date that represents the start of the current partial month
  let lastMonthDate: Date;

  if (reference.getDate() >= birth.getDate()) {
    // We've passed the birth day this month
    lastMonthDate = new Date(reference.getFullYear(), reference.getMonth(), birth.getDate());
  } else {
    // We haven't reached the birth day this month, go back to previous month
    lastMonthDate = new Date(reference.getFullYear(), reference.getMonth() - 1, birth.getDate());

    // Handle edge case where birth day doesn't exist in previous month
    // (e.g., born on 31st, but previous month only has 30 days)
    if (lastMonthDate.getDate() !== birth.getDate()) {
      // The date rolled over to next month, so use the last day of the intended month
      lastMonthDate = new Date(reference.getFullYear(), reference.getMonth(), 0);
    }
  }

  lastMonthDate.setHours(0, 0, 0, 0);
  const days = Math.floor((reference.getTime() - lastMonthDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays: Math.max(0, totalDays),
  };
}

/**
 * Format age as a human-readable string
 *
 * @param age - The age object to format
 * @returns Formatted string like "6 months, 15 days" or "1 month, 1 day"
 */
export function formatAge(age: Age): string {
  const monthStr = age.months === 1 ? '1 month' : `${age.months} months`;
  const dayStr = age.days === 1 ? '1 day' : `${age.days} days`;

  if (age.months === 0 && age.days === 0) {
    return 'Newborn';
  }

  if (age.months === 0) {
    return dayStr;
  }

  if (age.days === 0) {
    return monthStr;
  }

  return `${monthStr}, ${dayStr}`;
}
