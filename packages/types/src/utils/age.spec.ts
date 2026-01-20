/**
 * Unit tests for age calculation utility
 * Validates: Requirements 1.2
 */

import { calculateAge, formatAge, Age } from './age';

describe('calculateAge', () => {
  describe('basic calculations', () => {
    it('should return zeros for a baby born today', () => {
      const today = new Date();
      const age = calculateAge(today, today);

      expect(age.months).toBe(0);
      expect(age.days).toBe(0);
      expect(age.totalDays).toBe(0);
    });

    it('should calculate age correctly for a baby born 1 day ago', () => {
      const today = new Date('2024-07-15');
      const yesterday = new Date('2024-07-14');
      const age = calculateAge(yesterday, today);

      expect(age.months).toBe(0);
      expect(age.days).toBe(1);
      expect(age.totalDays).toBe(1);
    });

    it('should calculate age correctly for a baby born exactly 1 month ago', () => {
      const referenceDate = new Date('2024-07-15');
      const oneMonthAgo = new Date('2024-06-15');
      const age = calculateAge(oneMonthAgo, referenceDate);

      expect(age.months).toBe(1);
      expect(age.days).toBe(0);
      expect(age.totalDays).toBe(30);
    });

    it('should calculate age correctly for a baby born 6 months ago', () => {
      const referenceDate = new Date('2024-07-15');
      const sixMonthsAgo = new Date('2024-01-15');
      const age = calculateAge(sixMonthsAgo, referenceDate);

      expect(age.months).toBe(6);
      expect(age.days).toBe(0);
      // Jan 15 to Jul 15 = 181 days
      // Jan: 16 days (15-31), Feb: 29 days (leap year), Mar: 31, Apr: 30, May: 31, Jun: 30, Jul: 14 days (1-14)
      // 16 + 29 + 31 + 30 + 31 + 30 + 14 = 181
      expect(age.totalDays).toBe(181);
    });

    it('should calculate age correctly for a baby born 1 year ago', () => {
      const referenceDate = new Date('2024-07-15');
      const oneYearAgo = new Date('2023-07-15');
      const age = calculateAge(oneYearAgo, referenceDate);

      expect(age.months).toBe(12);
      expect(age.days).toBe(0);
      expect(age.totalDays).toBe(366); // 2024 is a leap year
    });
  });

  describe('partial month calculations', () => {
    it('should calculate remaining days when birth day has passed this month', () => {
      const referenceDate = new Date('2024-07-20');
      const birthDate = new Date('2024-06-15');
      const age = calculateAge(birthDate, referenceDate);

      expect(age.months).toBe(1);
      expect(age.days).toBe(5); // 20 - 15 = 5 days
    });

    it('should calculate remaining days when birth day has not passed this month', () => {
      const referenceDate = new Date('2024-07-10');
      const birthDate = new Date('2024-06-15');
      const age = calculateAge(birthDate, referenceDate);

      expect(age.months).toBe(0);
      // From Jun 15 to Jul 10: 15 days in June + 10 days in July = 25 days
      expect(age.days).toBe(25);
      expect(age.totalDays).toBe(25);
    });

    it('should handle birth on the 31st when current month has 30 days', () => {
      // Born Jan 31, reference is Apr 15
      const referenceDate = new Date('2024-04-15');
      const birthDate = new Date('2024-01-31');
      const age = calculateAge(birthDate, referenceDate);

      // Jan 31 to Apr 15:
      // Feb: 29 days (leap year), Mar: 31 days, Apr: 14 days (1-14)
      // Total: 29 + 31 + 14 = 74 days
      expect(age.months).toBe(2);
      expect(age.totalDays).toBe(74);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for future birth date', () => {
      const today = new Date('2024-07-15');
      const futureDate = new Date('2024-12-25');
      const age = calculateAge(futureDate, today);

      expect(age.months).toBe(0);
      expect(age.days).toBe(0);
      expect(age.totalDays).toBe(0);
    });

    it('should handle leap year correctly', () => {
      // Born Feb 29, 2024 (leap year), reference Mar 1, 2024
      const referenceDate = new Date('2024-03-01');
      const birthDate = new Date('2024-02-29');
      const age = calculateAge(birthDate, referenceDate);

      expect(age.months).toBe(0);
      expect(age.days).toBe(1);
      expect(age.totalDays).toBe(1);
    });

    it('should handle year boundary correctly', () => {
      // Born Dec 15, 2023, reference Jan 15, 2024
      const referenceDate = new Date('2024-01-15');
      const birthDate = new Date('2023-12-15');
      const age = calculateAge(birthDate, referenceDate);

      expect(age.months).toBe(1);
      expect(age.days).toBe(0);
      expect(age.totalDays).toBe(31);
    });

    it('should handle same day different years', () => {
      const referenceDate = new Date('2026-03-15');
      const birthDate = new Date('2024-03-15');
      const age = calculateAge(birthDate, referenceDate);

      expect(age.months).toBe(24);
      expect(age.days).toBe(0);
      // Mar 15, 2024 to Mar 15, 2026
      // 2024 (leap year): Mar 15 to Dec 31 = 292 days (17 + 30 + 31 + 30 + 31 + 31 + 30 + 31 + 30 + 31 = 292)
      // Actually: remaining days in 2024 from Mar 15 + all of 2025 + days in 2026 until Mar 15
      // 2024: 366 - 74 (Jan + Feb + 14 days of Mar) = 292 days remaining
      // 2025: 365 days
      // 2026: 74 days (Jan 31 + Feb 28 + 14 days of Mar = 73, but we want Mar 15 so 31 + 28 + 14 = 73)
      // Wait, let me recalculate: from Mar 15 2024 to Mar 15 2026
      // That's exactly 2 years = 365 + 365 = 730 days (2025 is not a leap year)
      expect(age.totalDays).toBe(730);
    });

    it('should handle birth on first day of month', () => {
      const referenceDate = new Date('2024-07-15');
      const birthDate = new Date('2024-07-01');
      const age = calculateAge(birthDate, referenceDate);

      expect(age.months).toBe(0);
      expect(age.days).toBe(14);
      expect(age.totalDays).toBe(14);
    });

    it('should handle birth on last day of month', () => {
      const referenceDate = new Date('2024-08-15');
      const birthDate = new Date('2024-07-31');
      const age = calculateAge(birthDate, referenceDate);

      expect(age.months).toBe(0);
      expect(age.days).toBe(15);
      expect(age.totalDays).toBe(15);
    });
  });

  describe('time normalization', () => {
    it('should ignore time of day in calculations', () => {
      // Use local dates to avoid timezone issues
      const birthDate = new Date(2024, 0, 15, 23, 59, 59, 999); // Jan 15, 2024 at 11:59:59 PM
      const referenceDate = new Date(2024, 0, 16, 0, 0, 0, 1); // Jan 16, 2024 at 12:00:00 AM
      const age = calculateAge(birthDate, referenceDate);

      expect(age.totalDays).toBe(1);
    });
  });

  describe('defaults', () => {
    it('should use current date as reference when not provided', () => {
      const today = new Date();
      const birthDate = new Date(today);
      birthDate.setMonth(birthDate.getMonth() - 3);

      const age = calculateAge(birthDate);

      // Should be approximately 3 months
      expect(age.months).toBeGreaterThanOrEqual(2);
      expect(age.months).toBeLessThanOrEqual(4);
    });
  });
});

describe('formatAge', () => {
  it('should format newborn correctly', () => {
    const age: Age = { months: 0, days: 0, totalDays: 0 };
    expect(formatAge(age)).toBe('Newborn');
  });

  it('should format days only correctly', () => {
    const age: Age = { months: 0, days: 15, totalDays: 15 };
    expect(formatAge(age)).toBe('15 days');
  });

  it('should format single day correctly', () => {
    const age: Age = { months: 0, days: 1, totalDays: 1 };
    expect(formatAge(age)).toBe('1 day');
  });

  it('should format months only correctly', () => {
    const age: Age = { months: 6, days: 0, totalDays: 180 };
    expect(formatAge(age)).toBe('6 months');
  });

  it('should format single month correctly', () => {
    const age: Age = { months: 1, days: 0, totalDays: 30 };
    expect(formatAge(age)).toBe('1 month');
  });

  it('should format months and days correctly', () => {
    const age: Age = { months: 6, days: 15, totalDays: 195 };
    expect(formatAge(age)).toBe('6 months, 15 days');
  });

  it('should format single month and single day correctly', () => {
    const age: Age = { months: 1, days: 1, totalDays: 31 };
    expect(formatAge(age)).toBe('1 month, 1 day');
  });
});
