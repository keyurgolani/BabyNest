import {
  VaccinationStatus,
  determineVaccinationStatus,
  categorizeVaccinations,
  VaccinationScheduleEntry,
} from './vaccination-schedule.util';

describe('Vaccination Schedule Utility', () => {
  /**
   * Tests for vaccination schedule categorization
   * Validates: Requirements 8.4
   */

  // Helper to create dates relative to a reference date
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  };

  describe('determineVaccinationStatus', () => {
    const referenceDate = new Date('2024-06-15T10:00:00.000Z');
    
    const baseEntry: VaccinationScheduleEntry = {
      id: 'test-id',
      vaccineName: 'DTaP',
      timestamp: new Date('2024-06-15T10:00:00.000Z'),
      nextDueAt: null,
      provider: 'Dr. Smith',
      notes: null,
    };

    describe('COMPLETED status', () => {
      it('should return COMPLETED when nextDueAt is null', () => {
        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          nextDueAt: null,
        };

        const status = determineVaccinationStatus(entry, referenceDate);

        expect(status).toBe(VaccinationStatus.COMPLETED);
      });

      it('should return COMPLETED for vaccination with no follow-up needed', () => {
        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          vaccineName: 'Single Dose Vaccine',
          nextDueAt: null,
        };

        const status = determineVaccinationStatus(entry, referenceDate);

        expect(status).toBe(VaccinationStatus.COMPLETED);
      });
    });

    describe('UPCOMING status', () => {
      it('should return UPCOMING when nextDueAt is in the future', () => {
        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          nextDueAt: addDays(referenceDate, 60), // 60 days in the future
        };

        const status = determineVaccinationStatus(entry, referenceDate);

        expect(status).toBe(VaccinationStatus.UPCOMING);
      });

      it('should return UPCOMING when nextDueAt is tomorrow', () => {
        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          nextDueAt: addDays(referenceDate, 1), // tomorrow
        };

        const status = determineVaccinationStatus(entry, referenceDate);

        expect(status).toBe(VaccinationStatus.UPCOMING);
      });

      it('should return UPCOMING when nextDueAt is far in the future', () => {
        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          nextDueAt: addDays(referenceDate, 365), // 1 year in the future
        };

        const status = determineVaccinationStatus(entry, referenceDate);

        expect(status).toBe(VaccinationStatus.UPCOMING);
      });
    });

    describe('OVERDUE status', () => {
      it('should return OVERDUE when nextDueAt is in the past', () => {
        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          nextDueAt: addDays(referenceDate, -14), // 2 weeks ago
        };

        const status = determineVaccinationStatus(entry, referenceDate);

        expect(status).toBe(VaccinationStatus.OVERDUE);
      });

      it('should return OVERDUE when nextDueAt is today (same day)', () => {
        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          nextDueAt: new Date('2024-06-15T00:00:00.000Z'), // same day
        };

        const status = determineVaccinationStatus(entry, referenceDate);

        expect(status).toBe(VaccinationStatus.OVERDUE);
      });

      it('should return OVERDUE when nextDueAt was yesterday', () => {
        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          nextDueAt: addDays(referenceDate, -1), // yesterday
        };

        const status = determineVaccinationStatus(entry, referenceDate);

        expect(status).toBe(VaccinationStatus.OVERDUE);
      });

      it('should return OVERDUE when nextDueAt is far in the past', () => {
        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          nextDueAt: addDays(referenceDate, -365), // 1 year ago
        };

        const status = determineVaccinationStatus(entry, referenceDate);

        expect(status).toBe(VaccinationStatus.OVERDUE);
      });
    });

    describe('edge cases', () => {
      it('should use current date when referenceDate is not provided', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          nextDueAt: futureDate,
        };

        const status = determineVaccinationStatus(entry);

        expect(status).toBe(VaccinationStatus.UPCOMING);
      });

      it('should handle date comparison at day boundaries correctly', () => {
        // Reference date at end of day
        const refDate = new Date('2024-06-15T23:59:59.999Z');
        // Next day at midnight (should be upcoming)
        const nextDay = new Date('2024-06-16T00:00:00.000Z');
        
        const entry: VaccinationScheduleEntry = {
          ...baseEntry,
          nextDueAt: nextDay,
        };

        const status = determineVaccinationStatus(entry, refDate);

        expect(status).toBe(VaccinationStatus.UPCOMING);
      });
    });
  });

  describe('categorizeVaccinations', () => {
    const referenceDate = new Date('2024-06-15T10:00:00.000Z');

    const completedVaccination: VaccinationScheduleEntry = {
      id: 'completed-1',
      vaccineName: 'Hepatitis B',
      timestamp: new Date('2024-01-15T10:00:00.000Z'),
      nextDueAt: null,
      provider: 'Dr. Smith',
      notes: null,
    };

    const upcomingVaccination: VaccinationScheduleEntry = {
      id: 'upcoming-1',
      vaccineName: 'DTaP',
      timestamp: new Date('2024-06-15T10:00:00.000Z'),
      nextDueAt: new Date('2024-08-15T00:00:00.000Z'), // 2 months after reference
      provider: 'Dr. Smith',
      notes: null,
    };

    const overdueVaccination: VaccinationScheduleEntry = {
      id: 'overdue-1',
      vaccineName: 'MMR',
      timestamp: new Date('2024-01-15T10:00:00.000Z'),
      nextDueAt: new Date('2024-05-15T00:00:00.000Z'), // 1 month before reference
      provider: 'Dr. Smith',
      notes: null,
    };

    it('should categorize vaccinations correctly', () => {
      const entries = [completedVaccination, upcomingVaccination, overdueVaccination];

      const result = categorizeVaccinations(entries, referenceDate);

      expect(result.completed).toHaveLength(1);
      expect(result.upcoming).toHaveLength(1);
      expect(result.overdue).toHaveLength(1);

      expect(result.completed[0].id).toBe('completed-1');
      expect(result.upcoming[0].id).toBe('upcoming-1');
      expect(result.overdue[0].id).toBe('overdue-1');
    });

    it('should handle empty array', () => {
      const result = categorizeVaccinations([], referenceDate);

      expect(result.completed).toHaveLength(0);
      expect(result.upcoming).toHaveLength(0);
      expect(result.overdue).toHaveLength(0);
    });

    it('should handle all completed vaccinations', () => {
      const entries = [
        completedVaccination,
        { ...completedVaccination, id: 'completed-2', vaccineName: 'Polio' },
      ];

      const result = categorizeVaccinations(entries, referenceDate);

      expect(result.completed).toHaveLength(2);
      expect(result.upcoming).toHaveLength(0);
      expect(result.overdue).toHaveLength(0);
    });

    it('should handle all upcoming vaccinations', () => {
      const entries = [
        upcomingVaccination,
        { ...upcomingVaccination, id: 'upcoming-2', vaccineName: 'Polio' },
      ];

      const result = categorizeVaccinations(entries, referenceDate);

      expect(result.completed).toHaveLength(0);
      expect(result.upcoming).toHaveLength(2);
      expect(result.overdue).toHaveLength(0);
    });

    it('should handle all overdue vaccinations', () => {
      const entries = [
        overdueVaccination,
        { ...overdueVaccination, id: 'overdue-2', vaccineName: 'Polio' },
      ];

      const result = categorizeVaccinations(entries, referenceDate);

      expect(result.completed).toHaveLength(0);
      expect(result.upcoming).toHaveLength(0);
      expect(result.overdue).toHaveLength(2);
    });

    it('should preserve entry properties in categorized results', () => {
      const entries = [completedVaccination];

      const result = categorizeVaccinations(entries, referenceDate);

      expect(result.completed[0]).toEqual(completedVaccination);
    });

    it('should use current date when referenceDate is not provided', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const entries: VaccinationScheduleEntry[] = [
        {
          id: 'future-1',
          vaccineName: 'Future Vaccine',
          timestamp: new Date(),
          nextDueAt: futureDate,
          provider: 'Dr. Smith',
          notes: null,
        },
      ];

      const result = categorizeVaccinations(entries);

      expect(result.upcoming).toHaveLength(1);
    });
  });
});
