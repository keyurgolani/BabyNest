/**
 * Age calculation utilities for baby profiles
 * Validates: Requirements 1.2 (display baby's current age in months and days)
 */

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalMonths: number;
  displayString: string;
  shortDisplayString: string;
}

/**
 * Calculate the age from a date of birth to a reference date
 * @param dateOfBirth - The baby's date of birth
 * @param referenceDate - The date to calculate age from (defaults to now)
 * @returns AgeResult with years, months, days, and formatted strings
 */
export function calculateAge(
  dateOfBirth: Date,
  referenceDate: Date = new Date()
): AgeResult {
  const dob = new Date(dateOfBirth);
  const ref = new Date(referenceDate);

  // Reset time components for accurate day calculation
  dob.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);

  // Calculate total days
  const totalDays = Math.floor(
    (ref.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate years, months, and days
  let years = ref.getFullYear() - dob.getFullYear();
  let months = ref.getMonth() - dob.getMonth();
  let days = ref.getDate() - dob.getDate();

  // Adjust for negative days
  if (days < 0) {
    months--;
    // Get the last day of the previous month
    const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  // Calculate total months
  const totalMonths = years * 12 + months;

  // Generate display strings
  const displayString = formatAgeDisplay(years, months, days);
  const shortDisplayString = formatAgeShort(years, months, days);

  return {
    years,
    months,
    days,
    totalDays,
    totalMonths,
    displayString,
    shortDisplayString,
  };
}

/**
 * Format age for full display (e.g., "1 year, 3 months, 15 days")
 */
function formatAgeDisplay(years: number, months: number, days: number): string {
  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  }

  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }

  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }

  return parts.join(", ");
}

/**
 * Format age for short display (e.g., "1y 3m" or "3m 15d" or "15d")
 */
function formatAgeShort(years: number, months: number, days: number): string {
  if (years > 0) {
    if (months > 0) {
      return `${years}y ${months}m`;
    }
    return `${years}y`;
  }

  if (months > 0) {
    if (days > 0 && months < 6) {
      return `${months}m ${days}d`;
    }
    return `${months}m`;
  }

  return `${days}d`;
}

/**
 * Get a human-readable age description for babies
 * (e.g., "Newborn", "3 weeks old", "2 months old")
 */
export function getAgeDescription(dateOfBirth: Date): string {
  const age = calculateAge(dateOfBirth);

  if (age.totalDays < 7) {
    return "Newborn";
  }

  if (age.totalDays < 28) {
    const weeks = Math.floor(age.totalDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} old`;
  }

  if (age.years === 0) {
    return `${age.months} ${age.months === 1 ? "month" : "months"} old`;
  }

  if (age.years === 1 && age.months === 0) {
    return "1 year old";
  }

  if (age.years >= 1) {
    if (age.months > 0) {
      return `${age.years} ${age.years === 1 ? "year" : "years"}, ${age.months} ${age.months === 1 ? "month" : "months"} old`;
    }
    return `${age.years} ${age.years === 1 ? "year" : "years"} old`;
  }

  return age.displayString;
}

/**
 * Format date of birth for display
 */
export function formatDateOfBirth(dateOfBirth: Date): string {
  return new Date(dateOfBirth).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
