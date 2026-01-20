import {
  MedicationFrequency,
  calculateNextDueTime,
  getFrequencyIntervalHours,
  hasCalculableNextDue,
  getAllMedicationFrequencies,
} from './medication-due-time.util';

/**
 * Unit tests for medication due time calculation
 * Validates: Requirements 8.2
 */
describe('Medication Due Time Calculation', () => {
  const baseTime = new Date('2024-06-15T10:00:00.000Z');

  describe('calculateNextDueTime', () => {
    describe('frequencies with fixed intervals', () => {
      it('should calculate next due time for every_4_hours frequency', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.EVERY_4_HOURS);
        expect(result).toEqual(new Date('2024-06-15T14:00:00.000Z'));
      });

      it('should calculate next due time for every_6_hours frequency', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.EVERY_6_HOURS);
        expect(result).toEqual(new Date('2024-06-15T16:00:00.000Z'));
      });

      it('should calculate next due time for every_8_hours frequency', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.EVERY_8_HOURS);
        expect(result).toEqual(new Date('2024-06-15T18:00:00.000Z'));
      });

      it('should calculate next due time for every_12_hours frequency', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.EVERY_12_HOURS);
        expect(result).toEqual(new Date('2024-06-15T22:00:00.000Z'));
      });

      it('should calculate next due time for twice_daily frequency (12 hours)', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.TWICE_DAILY);
        expect(result).toEqual(new Date('2024-06-15T22:00:00.000Z'));
      });

      it('should calculate next due time for three_times_daily frequency (8 hours)', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.THREE_TIMES_DAILY);
        expect(result).toEqual(new Date('2024-06-15T18:00:00.000Z'));
      });

      it('should calculate next due time for four_times_daily frequency (6 hours)', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.FOUR_TIMES_DAILY);
        expect(result).toEqual(new Date('2024-06-15T16:00:00.000Z'));
      });

      it('should calculate next due time for daily frequency', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.DAILY);
        expect(result).toEqual(new Date('2024-06-16T10:00:00.000Z'));
      });

      it('should calculate next due time for weekly frequency', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.WEEKLY);
        expect(result).toEqual(new Date('2024-06-22T10:00:00.000Z'));
      });
    });

    describe('frequencies without fixed intervals', () => {
      it('should return null for once frequency', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.ONCE);
        expect(result).toBeNull();
      });

      it('should return null for as_needed frequency', () => {
        const result = calculateNextDueTime(baseTime, MedicationFrequency.AS_NEEDED);
        expect(result).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle midnight crossing correctly', () => {
        const lateNightTime = new Date('2024-06-15T23:00:00.000Z');
        const result = calculateNextDueTime(lateNightTime, MedicationFrequency.EVERY_4_HOURS);
        expect(result).toEqual(new Date('2024-06-16T03:00:00.000Z'));
      });

      it('should handle month boundary crossing', () => {
        const endOfMonth = new Date('2024-06-30T22:00:00.000Z');
        const result = calculateNextDueTime(endOfMonth, MedicationFrequency.EVERY_6_HOURS);
        expect(result).toEqual(new Date('2024-07-01T04:00:00.000Z'));
      });

      it('should handle year boundary crossing', () => {
        const endOfYear = new Date('2024-12-31T20:00:00.000Z');
        const result = calculateNextDueTime(endOfYear, MedicationFrequency.EVERY_8_HOURS);
        expect(result).toEqual(new Date('2025-01-01T04:00:00.000Z'));
      });
    });
  });

  describe('getFrequencyIntervalHours', () => {
    it('should return 4 hours for every_4_hours', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.EVERY_4_HOURS)).toBe(4);
    });

    it('should return 6 hours for every_6_hours', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.EVERY_6_HOURS)).toBe(6);
    });

    it('should return 8 hours for every_8_hours', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.EVERY_8_HOURS)).toBe(8);
    });

    it('should return 12 hours for every_12_hours', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.EVERY_12_HOURS)).toBe(12);
    });

    it('should return 12 hours for twice_daily', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.TWICE_DAILY)).toBe(12);
    });

    it('should return 8 hours for three_times_daily', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.THREE_TIMES_DAILY)).toBe(8);
    });

    it('should return 6 hours for four_times_daily', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.FOUR_TIMES_DAILY)).toBe(6);
    });

    it('should return 24 hours for daily', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.DAILY)).toBe(24);
    });

    it('should return 168 hours (7 days) for weekly', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.WEEKLY)).toBe(168);
    });

    it('should return null for once', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.ONCE)).toBeNull();
    });

    it('should return null for as_needed', () => {
      expect(getFrequencyIntervalHours(MedicationFrequency.AS_NEEDED)).toBeNull();
    });
  });

  describe('hasCalculableNextDue', () => {
    it('should return true for frequencies with fixed intervals', () => {
      expect(hasCalculableNextDue(MedicationFrequency.EVERY_4_HOURS)).toBe(true);
      expect(hasCalculableNextDue(MedicationFrequency.EVERY_6_HOURS)).toBe(true);
      expect(hasCalculableNextDue(MedicationFrequency.EVERY_8_HOURS)).toBe(true);
      expect(hasCalculableNextDue(MedicationFrequency.EVERY_12_HOURS)).toBe(true);
      expect(hasCalculableNextDue(MedicationFrequency.TWICE_DAILY)).toBe(true);
      expect(hasCalculableNextDue(MedicationFrequency.THREE_TIMES_DAILY)).toBe(true);
      expect(hasCalculableNextDue(MedicationFrequency.FOUR_TIMES_DAILY)).toBe(true);
      expect(hasCalculableNextDue(MedicationFrequency.DAILY)).toBe(true);
      expect(hasCalculableNextDue(MedicationFrequency.WEEKLY)).toBe(true);
    });

    it('should return false for frequencies without fixed intervals', () => {
      expect(hasCalculableNextDue(MedicationFrequency.ONCE)).toBe(false);
      expect(hasCalculableNextDue(MedicationFrequency.AS_NEEDED)).toBe(false);
    });
  });

  describe('getAllMedicationFrequencies', () => {
    it('should return all 11 frequency options', () => {
      const frequencies = getAllMedicationFrequencies();
      expect(frequencies).toHaveLength(11);
    });

    it('should include all expected frequencies', () => {
      const frequencies = getAllMedicationFrequencies();
      expect(frequencies).toContain(MedicationFrequency.ONCE);
      expect(frequencies).toContain(MedicationFrequency.TWICE_DAILY);
      expect(frequencies).toContain(MedicationFrequency.THREE_TIMES_DAILY);
      expect(frequencies).toContain(MedicationFrequency.FOUR_TIMES_DAILY);
      expect(frequencies).toContain(MedicationFrequency.EVERY_4_HOURS);
      expect(frequencies).toContain(MedicationFrequency.EVERY_6_HOURS);
      expect(frequencies).toContain(MedicationFrequency.EVERY_8_HOURS);
      expect(frequencies).toContain(MedicationFrequency.EVERY_12_HOURS);
      expect(frequencies).toContain(MedicationFrequency.DAILY);
      expect(frequencies).toContain(MedicationFrequency.WEEKLY);
      expect(frequencies).toContain(MedicationFrequency.AS_NEEDED);
    });
  });
});
