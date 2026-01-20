import { useBabyStore } from "../babyStore";
import type { Baby } from "../types";

// Reset store before each test
beforeEach(() => {
  useBabyStore.setState({
    babies: [],
    activeBabyId: null,
    activeTimers: new Map(),
    syncStatus: "offline",
    pendingChanges: 0,
    lastSyncTime: null,
    darkMode: false,
    hapticEnabled: true,
  });
});

describe("BabyStore", () => {
  describe("Baby Profile Management", () => {
    const mockBaby: Baby = {
      id: "baby-1",
      name: "Test Baby",
      dateOfBirth: new Date("2024-01-15"),
      gender: "female",
      photoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should add a baby and set as active if first baby", () => {
      const { addBaby } = useBabyStore.getState();
      addBaby(mockBaby);

      const state = useBabyStore.getState();
      expect(state.babies).toHaveLength(1);
      expect(state.babies[0]!.id).toBe("baby-1");
      expect(state.activeBabyId).toBe("baby-1");
    });

    it("should update a baby profile", () => {
      const { addBaby, updateBaby } = useBabyStore.getState();
      addBaby(mockBaby);
      updateBaby("baby-1", { name: "Updated Baby" });

      const state = useBabyStore.getState();
      expect(state.babies[0]!.name).toBe("Updated Baby");
    });

    it("should remove a baby and update active baby", () => {
      const { addBaby, removeBaby } = useBabyStore.getState();
      addBaby(mockBaby);
      addBaby({ ...mockBaby, id: "baby-2", name: "Second Baby" });

      removeBaby("baby-1");

      const state = useBabyStore.getState();
      expect(state.babies).toHaveLength(1);
      expect(state.activeBabyId).toBe("baby-2");
    });

    it("should set active baby", () => {
      const { addBaby, setActiveBaby } = useBabyStore.getState();
      addBaby(mockBaby);
      addBaby({ ...mockBaby, id: "baby-2", name: "Second Baby" });

      setActiveBaby("baby-2");

      const state = useBabyStore.getState();
      expect(state.activeBabyId).toBe("baby-2");
    });
  });

  describe("Timer Management", () => {
    it("should start a timer", () => {
      const { startTimer } = useBabyStore.getState();
      startTimer("breastfeeding", { breastSide: "left" });

      const state = useBabyStore.getState();
      const timer = state.activeTimers.get("breastfeeding");

      expect(timer).toBeDefined();
      expect(timer!.type).toBe("breastfeeding");
      expect(timer!.metadata.breastSide).toBe("left");
      expect(timer!.isPaused).toBe(false);
    });

    it("should stop a timer and return result", () => {
      const { startTimer, stopTimer } = useBabyStore.getState();
      startTimer("sleep", { sleepType: "nap" });

      // Wait a bit to ensure duration > 0
      const result = stopTimer("sleep");

      expect(result).toBeDefined();
      expect(result!.type).toBe("sleep");
      expect(result!.metadata.sleepType).toBe("nap");
      expect(result!.totalDuration).toBeGreaterThanOrEqual(0);

      const state = useBabyStore.getState();
      expect(state.activeTimers.get("sleep")).toBeUndefined();
    });

    it("should return null when stopping non-existent timer", () => {
      const { stopTimer } = useBabyStore.getState();
      const result = stopTimer("tummyTime");
      expect(result).toBeNull();
    });

    it("should update timer metadata", () => {
      const { startTimer, updateTimerMetadata } = useBabyStore.getState();
      startTimer("breastfeeding", { breastSide: "left" });
      updateTimerMetadata("breastfeeding", { breastSide: "right" });

      const state = useBabyStore.getState();
      const timer = state.activeTimers.get("breastfeeding");
      expect(timer?.metadata.breastSide).toBe("right");
    });
  });

  describe("Sync State Management", () => {
    it("should update sync status", () => {
      const { setSyncStatus } = useBabyStore.getState();
      setSyncStatus("syncing");

      const state = useBabyStore.getState();
      expect(state.syncStatus).toBe("syncing");
    });

    it("should increment and decrement pending changes", () => {
      const { incrementPendingChanges, decrementPendingChanges } =
        useBabyStore.getState();

      incrementPendingChanges();
      incrementPendingChanges();
      expect(useBabyStore.getState().pendingChanges).toBe(2);

      decrementPendingChanges();
      expect(useBabyStore.getState().pendingChanges).toBe(1);

      decrementPendingChanges(5); // Should not go below 0
      expect(useBabyStore.getState().pendingChanges).toBe(0);
    });

    it("should set last sync time", () => {
      const { setLastSyncTime } = useBabyStore.getState();
      const syncTime = new Date();
      setLastSyncTime(syncTime);

      const state = useBabyStore.getState();
      expect(state.lastSyncTime).toEqual(syncTime);
    });
  });

  describe("UI State Management", () => {
    it("should toggle dark mode", () => {
      const { toggleDarkMode } = useBabyStore.getState();

      expect(useBabyStore.getState().darkMode).toBe(false);

      toggleDarkMode();
      expect(useBabyStore.getState().darkMode).toBe(true);

      toggleDarkMode();
      expect(useBabyStore.getState().darkMode).toBe(false);
    });

    it("should set dark mode directly", () => {
      const { setDarkMode } = useBabyStore.getState();
      setDarkMode(true);
      expect(useBabyStore.getState().darkMode).toBe(true);
    });

    it("should set haptic enabled", () => {
      const { setHapticEnabled } = useBabyStore.getState();
      setHapticEnabled(false);
      expect(useBabyStore.getState().hapticEnabled).toBe(false);
    });
  });
});
