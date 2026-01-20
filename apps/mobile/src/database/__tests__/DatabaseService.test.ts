/**
 * Tests for DatabaseService
 * Validates: Requirements 11.1
 */

import { DatabaseService, getDatabaseService, resetDatabaseService } from '../DatabaseService';
import type { LocalBaby, LocalFeedingEntry, LocalSleepEntry, LocalDiaperEntry } from '../types';

// Mock expo-sqlite
const mockRunAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockExecAsync = jest.fn();
const mockCloseAsync = jest.fn();

const mockDb = {
  runAsync: mockRunAsync,
  getFirstAsync: mockGetFirstAsync,
  getAllAsync: mockGetAllAsync,
  execAsync: mockExecAsync,
  closeAsync: mockCloseAsync,
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
}));

describe('DatabaseService', () => {
  let dbService: DatabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    resetDatabaseService();
    dbService = new DatabaseService();
  });

  afterEach(async () => {
    await dbService.close();
  });

  describe('initialization', () => {
    it('should initialize the database and create tables', async () => {
      await dbService.initialize();

      expect(mockExecAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
      expect(mockExecAsync).toHaveBeenCalledTimes(2); // PRAGMA + CREATE_TABLES_SQL
    });

    it('should not reinitialize if already initialized', async () => {
      await dbService.initialize();
      await dbService.initialize();

      // Should only be called once for PRAGMA and once for tables
      expect(mockExecAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Baby CRUD operations', () => {
    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should create a new baby profile', async () => {
      mockRunAsync.mockResolvedValue({ changes: 1 });

      const babyData = {
        name: 'Test Baby',
        dateOfBirth: '2024-01-15',
        gender: 'female' as const,
        photoUrl: null,
      };

      const result = await dbService.createBaby(babyData);

      expect(result).toMatchObject({
        name: 'Test Baby',
        dateOfBirth: '2024-01-15',
        gender: 'female',
        photoUrl: null,
        isDeleted: 0,
        localSyncStatus: 'pending',
        serverVersion: null,
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockRunAsync).toHaveBeenCalled();
    });

    it('should get a baby by ID', async () => {
      const mockBaby: LocalBaby = {
        id: 'test-id',
        name: 'Test Baby',
        dateOfBirth: '2024-01-15',
        gender: 'female',
        photoUrl: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        syncedAt: null,
        isDeleted: 0,
        localSyncStatus: 'pending',
        serverVersion: null,
      };

      mockGetFirstAsync.mockResolvedValue(mockBaby);

      const result = await dbService.getBaby('test-id');

      expect(result).toEqual(mockBaby);
      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM babies'),
        ['test-id']
      );
    });

    it('should return null for non-existent baby', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      const result = await dbService.getBaby('non-existent');

      expect(result).toBeNull();
    });

    it('should get all babies', async () => {
      const mockBabies: LocalBaby[] = [
        {
          id: 'baby-1',
          name: 'Baby One',
          dateOfBirth: '2024-01-15',
          gender: 'male',
          photoUrl: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          syncedAt: null,
          isDeleted: 0,
          localSyncStatus: 'synced',
          serverVersion: 1,
        },
        {
          id: 'baby-2',
          name: 'Baby Two',
          dateOfBirth: '2024-02-20',
          gender: 'female',
          photoUrl: 'https://example.com/photo.jpg',
          createdAt: '2024-02-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z',
          syncedAt: null,
          isDeleted: 0,
          localSyncStatus: 'pending',
          serverVersion: null,
        },
      ];

      mockGetAllAsync.mockResolvedValue(mockBabies);

      const result = await dbService.getAllBabies();

      expect(result).toEqual(mockBabies);
      expect(result).toHaveLength(2);
    });

    it('should update a baby profile', async () => {
      const existingBaby: LocalBaby = {
        id: 'test-id',
        name: 'Old Name',
        dateOfBirth: '2024-01-15',
        gender: 'female',
        photoUrl: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        syncedAt: '2024-01-01T00:00:00.000Z',
        isDeleted: 0,
        localSyncStatus: 'synced',
        serverVersion: 1,
      };

      mockGetFirstAsync.mockResolvedValue(existingBaby);
      mockRunAsync.mockResolvedValue({ changes: 1 });

      const result = await dbService.updateBaby('test-id', { name: 'New Name' });

      expect(result).toMatchObject({
        id: 'test-id',
        name: 'New Name',
        localSyncStatus: 'pending',
      });
      expect(result?.updatedAt).not.toBe(existingBaby.updatedAt);
    });

    it('should return null when updating non-existent baby', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      const result = await dbService.updateBaby('non-existent', { name: 'New Name' });

      expect(result).toBeNull();
    });

    it('should soft delete a baby', async () => {
      const existingBaby: LocalBaby = {
        id: 'test-id',
        name: 'Test Baby',
        dateOfBirth: '2024-01-15',
        gender: 'female',
        photoUrl: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        syncedAt: null,
        isDeleted: 0,
        localSyncStatus: 'pending',
        serverVersion: null,
      };

      mockGetFirstAsync.mockResolvedValue(existingBaby);
      mockRunAsync.mockResolvedValue({ changes: 1 });

      const result = await dbService.deleteBaby('test-id');

      expect(result).toBe(true);
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE babies SET isDeleted = 1'),
        expect.any(Array)
      );
    });

    it('should return false when deleting non-existent baby', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      const result = await dbService.deleteBaby('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('Feeding CRUD operations', () => {
    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should create a breastfeeding entry', async () => {
      mockRunAsync.mockResolvedValue({ changes: 1 });

      const feedingData = {
        babyId: 'baby-1',
        caregiverId: 'caregiver-1',
        timestamp: '2024-01-15T10:00:00.000Z',
        type: 'breastfeeding' as const,
        leftDuration: 600,
        rightDuration: 480,
        lastSide: 'right' as const,
        amount: null,
        bottleType: null,
        pumpedAmount: null,
        pumpSide: null,
        foodType: null,
        reaction: null,
        notes: 'Good feeding session',
      };

      const result = await dbService.createFeedingEntry(feedingData);

      expect(result).toMatchObject({
        babyId: 'baby-1',
        type: 'breastfeeding',
        leftDuration: 600,
        rightDuration: 480,
        lastSide: 'right',
        localSyncStatus: 'pending',
      });
      expect(result.id).toBeDefined();
    });

    it('should create a bottle feeding entry', async () => {
      mockRunAsync.mockResolvedValue({ changes: 1 });

      const feedingData = {
        babyId: 'baby-1',
        caregiverId: 'caregiver-1',
        timestamp: '2024-01-15T14:00:00.000Z',
        type: 'bottle' as const,
        leftDuration: null,
        rightDuration: null,
        lastSide: null,
        amount: 120,
        bottleType: 'formula' as const,
        pumpedAmount: null,
        pumpSide: null,
        foodType: null,
        reaction: null,
        notes: null,
      };

      const result = await dbService.createFeedingEntry(feedingData);

      expect(result).toMatchObject({
        type: 'bottle',
        amount: 120,
        bottleType: 'formula',
      });
    });

    it('should get feeding entries for a baby', async () => {
      const mockEntries: LocalFeedingEntry[] = [
        {
          id: 'feeding-1',
          babyId: 'baby-1',
          caregiverId: 'caregiver-1',
          timestamp: '2024-01-15T10:00:00.000Z',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
          syncedAt: null,
          isDeleted: 0,
          localSyncStatus: 'pending',
          serverVersion: null,
          type: 'breastfeeding',
          leftDuration: 600,
          rightDuration: 480,
          lastSide: 'right',
          amount: null,
          bottleType: null,
          pumpedAmount: null,
          pumpSide: null,
          foodType: null,
          reaction: null,
          notes: null,
        },
      ];

      mockGetAllAsync.mockResolvedValue(mockEntries);

      const result = await dbService.getFeedingEntries('baby-1');

      expect(result).toEqual(mockEntries);
      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM feeding_entries'),
        ['baby-1', 50]
      );
    });
  });

  describe('Sleep CRUD operations', () => {
    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should create a sleep entry', async () => {
      mockRunAsync.mockResolvedValue({ changes: 1 });

      const sleepData = {
        babyId: 'baby-1',
        caregiverId: 'caregiver-1',
        timestamp: '2024-01-15T13:00:00.000Z',
        startTime: '2024-01-15T13:00:00.000Z',
        endTime: '2024-01-15T14:30:00.000Z',
        duration: 90,
        sleepType: 'nap' as const,
        quality: 'good' as const,
        notes: 'Slept well',
      };

      const result = await dbService.createSleepEntry(sleepData);

      expect(result).toMatchObject({
        babyId: 'baby-1',
        sleepType: 'nap',
        duration: 90,
        quality: 'good',
        localSyncStatus: 'pending',
      });
    });

    it('should get sleep entries for a baby', async () => {
      const mockEntries: LocalSleepEntry[] = [
        {
          id: 'sleep-1',
          babyId: 'baby-1',
          caregiverId: 'caregiver-1',
          timestamp: '2024-01-15T13:00:00.000Z',
          createdAt: '2024-01-15T13:00:00.000Z',
          updatedAt: '2024-01-15T13:00:00.000Z',
          syncedAt: null,
          isDeleted: 0,
          localSyncStatus: 'pending',
          serverVersion: null,
          startTime: '2024-01-15T13:00:00.000Z',
          endTime: '2024-01-15T14:30:00.000Z',
          duration: 90,
          sleepType: 'nap',
          quality: 'good',
          notes: null,
        },
      ];

      mockGetAllAsync.mockResolvedValue(mockEntries);

      const result = await dbService.getSleepEntries('baby-1');

      expect(result).toEqual(mockEntries);
    });
  });

  describe('Diaper CRUD operations', () => {
    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should create a diaper entry', async () => {
      mockRunAsync.mockResolvedValue({ changes: 1 });

      const diaperData = {
        babyId: 'baby-1',
        caregiverId: 'caregiver-1',
        timestamp: '2024-01-15T08:00:00.000Z',
        type: 'wet' as const,
        color: null,
        consistency: null,
        hasRash: 0,
        notes: null,
      };

      const result = await dbService.createDiaperEntry(diaperData);

      expect(result).toMatchObject({
        babyId: 'baby-1',
        type: 'wet',
        hasRash: 0,
        localSyncStatus: 'pending',
      });
    });

    it('should get diaper entries for a baby', async () => {
      const mockEntries: LocalDiaperEntry[] = [
        {
          id: 'diaper-1',
          babyId: 'baby-1',
          caregiverId: 'caregiver-1',
          timestamp: '2024-01-15T08:00:00.000Z',
          createdAt: '2024-01-15T08:00:00.000Z',
          updatedAt: '2024-01-15T08:00:00.000Z',
          syncedAt: null,
          isDeleted: 0,
          localSyncStatus: 'pending',
          serverVersion: null,
          type: 'wet',
          color: null,
          consistency: null,
          hasRash: 0,
          notes: null,
        },
      ];

      mockGetAllAsync.mockResolvedValue(mockEntries);

      const result = await dbService.getDiaperEntries('baby-1');

      expect(result).toEqual(mockEntries);
    });
  });

  describe('Sync Queue operations', () => {
    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should add entries to sync queue when creating records', async () => {
      mockRunAsync.mockResolvedValue({ changes: 1 });

      await dbService.createBaby({
        name: 'Test Baby',
        dateOfBirth: '2024-01-15',
        gender: 'female',
        photoUrl: null,
      });

      // Should have called runAsync twice: once for baby insert, once for sync queue
      expect(mockRunAsync).toHaveBeenCalledTimes(2);
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sync_queue'),
        expect.any(Array)
      );
    });

    it('should get pending sync entries', async () => {
      const mockSyncEntries = [
        {
          id: 'sync-1',
          entityType: 'baby',
          entityId: 'baby-1',
          operation: 'create',
          data: '{}',
          timestamp: '2024-01-15T00:00:00.000Z',
          caregiverId: 'caregiver-1',
          retryCount: 0,
          lastError: null,
        },
      ];

      mockGetAllAsync.mockResolvedValue(mockSyncEntries);

      const result = await dbService.getPendingSyncEntries();

      expect(result).toEqual(mockSyncEntries);
    });

    it('should remove sync queue entry after successful sync', async () => {
      mockRunAsync.mockResolvedValue({ changes: 1 });

      await dbService.removeSyncQueueEntry('sync-1');

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM sync_queue'),
        ['sync-1']
      );
    });

    it('should update sync queue entry on error', async () => {
      mockRunAsync.mockResolvedValue({ changes: 1 });

      await dbService.updateSyncQueueEntryError('sync-1', 'Network error');

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sync_queue SET retryCount'),
        ['Network error', 'sync-1']
      );
    });

    it('should get pending sync count', async () => {
      mockGetFirstAsync.mockResolvedValue({ count: 5 });

      const result = await dbService.getPendingSyncCount();

      expect(result).toBe(5);
    });
  });

  describe('Utility operations', () => {
    beforeEach(async () => {
      await dbService.initialize();
    });

    it('should mark an entry as synced', async () => {
      mockRunAsync.mockResolvedValue({ changes: 1 });

      await dbService.markAsSynced('feeding', 'feeding-1', 1);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining("localSyncStatus = 'synced'"),
        expect.arrayContaining(['feeding-1'])
      );
    });

    it('should clear all data', async () => {
      mockExecAsync.mockResolvedValue(undefined);

      await dbService.clearAllData();

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM sync_queue')
      );
    });
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getDatabaseService();
      const instance2 = getDatabaseService();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getDatabaseService();
      resetDatabaseService();
      const instance2 = getDatabaseService();

      expect(instance1).not.toBe(instance2);
    });
  });
});
