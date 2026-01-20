/**
 * Parse a date string (YYYY-MM-DD) as a local date without timezone conversion
 * This prevents the off-by-one-day issue when dates are stored as UTC but displayed in local time
 * 
 * @param dateString - Date string in YYYY-MM-DD format or ISO string
 * @returns Date object representing the date at midnight local time
 */
export function parseLocalDate(dateString: string | Date): Date {
  // If already a Date object, extract the date part
  const dateStr = dateString.toString().split('T')[0];
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date string for use in HTML date input (YYYY-MM-DD)
 * Handles both Date objects and date strings
 * 
 * @param dateString - Date string or Date object
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateForInput(dateString: string | Date): string {
  return dateString.toString().split('T')[0];
}
