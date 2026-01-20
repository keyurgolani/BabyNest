import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Baby, Timer, TimerType, TimerMetadata, TimerResult, SyncStatus, ThemePreference, AutoNightModeSettings } from "./types";

interface BabyState {
  // Baby profiles
  babies: Baby[];
  activeBabyId: string | null;

  // Active timers
  activeTimers: Map<TimerType, Timer>;

  // Sync state
  syncStatus: SyncStatus;
  pendingChanges: number;
  lastSyncTime: Date | null;

  // UI state
  darkMode: boolean;
  themePreference: ThemePreference;
  autoNightMode: AutoNightModeSettings;
  hapticEnabled: boolean;
}

interface BabyActions {
  // Baby profile actions
  setBabies: (babies: Baby[]) => void;
  addBaby: (baby: Baby) => void;
  updateBaby: (id: string, updates: Partial<Baby>) => void;
  removeBaby: (id: string) => void;
  setActiveBaby: (id: string | null) => void;

  // Timer actions
  startTimer: (type: TimerType, metadata?: TimerMetadata) => void;
  stopTimer: (type: TimerType) => TimerResult | null;
  pauseTimer: (type: TimerType) => void;
  resumeTimer: (type: TimerType) => void;
  updateTimerMetadata: (type: TimerType, metadata: Partial<TimerMetadata>) => void;
  getActiveTimer: (type: TimerType) => Timer | undefined;

  // Sync actions
  setSyncStatus: (status: SyncStatus) => void;
  incrementPendingChanges: () => void;
  decrementPendingChanges: (count?: number) => void;
  setLastSyncTime: (time: Date) => void;

  // UI actions
  setDarkMode: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  setThemePreference: (preference: ThemePreference) => void;
  setAutoNightMode: (settings: Partial<AutoNightModeSettings>) => void;
}

export type BabyStore = BabyState & BabyActions;

// Custom serializer for Map and Date objects
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const str = await AsyncStorage.getItem(name);
    if (!str) return null;
    
    const parsed = JSON.parse(str);
    
    // Restore dates
    if (parsed.state?.lastSyncTime) {
      parsed.state.lastSyncTime = new Date(parsed.state.lastSyncTime);
    }
    
    // Restore babies dates
    if (parsed.state?.babies) {
      parsed.state.babies = parsed.state.babies.map((baby: Baby) => ({
        ...baby,
        dateOfBirth: new Date(baby.dateOfBirth),
        createdAt: new Date(baby.createdAt),
        updatedAt: new Date(baby.updatedAt),
      }));
    }
    
    // Restore activeTimers as Map
    if (parsed.state?.activeTimers) {
      const entries = Object.entries(parsed.state.activeTimers).map(
        ([key, value]: [string, unknown]) => {
          const timer = value as Timer;
          return [
            key as TimerType,
            {
              ...timer,
              startTime: new Date(timer.startTime),
            },
          ];
        }
      );
      parsed.state.activeTimers = new Map(entries as [TimerType, Timer][]);
    } else if (parsed.state) {
      parsed.state.activeTimers = new Map();
    }
    
    return JSON.stringify(parsed);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const parsed = JSON.parse(value);
    
    // Convert Map to object for serialization
    if (parsed.state?.activeTimers instanceof Map) {
      parsed.state.activeTimers = Object.fromEntries(parsed.state.activeTimers);
    }
    
    await AsyncStorage.setItem(name, JSON.stringify(parsed));
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};

export const useBabyStore = create<BabyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      babies: [],
      activeBabyId: null,
      activeTimers: new Map(),
      syncStatus: "offline",
      pendingChanges: 0,
      lastSyncTime: null,
      darkMode: false,
      themePreference: "system",
      autoNightMode: {
        enabled: false,
        startTime: "20:00",
        endTime: "07:00",
      },
      hapticEnabled: true,

      // Baby profile actions
      setBabies: (babies) => set({ babies }),
      
      addBaby: (baby) =>
        set((state) => ({
          babies: [...state.babies, baby],
          activeBabyId: state.activeBabyId ?? baby.id,
        })),
      
      updateBaby: (id, updates) =>
        set((state) => ({
          babies: state.babies.map((baby) =>
            baby.id === id ? { ...baby, ...updates, updatedAt: new Date() } : baby
          ),
        })),
      
      removeBaby: (id) =>
        set((state) => ({
          babies: state.babies.filter((baby) => baby.id !== id),
          activeBabyId: state.activeBabyId === id 
            ? state.babies.find((b) => b.id !== id)?.id ?? null 
            : state.activeBabyId,
        })),
      
      setActiveBaby: (id) => set({ activeBabyId: id }),

      // Timer actions
      startTimer: (type, metadata = {}) =>
        set((state) => {
          const newTimers = new Map(state.activeTimers);
          newTimers.set(type, {
            type,
            startTime: new Date(),
            pausedDuration: 0,
            isPaused: false,
            metadata,
          });
          return { activeTimers: newTimers };
        }),
      
      stopTimer: (type) => {
        const state = get();
        const timer = state.activeTimers.get(type);
        
        if (!timer) return null;
        
        const endTime = new Date();
        const totalDuration = Math.floor(
          (endTime.getTime() - timer.startTime.getTime()) / 1000 - timer.pausedDuration
        );
        
        const result: TimerResult = {
          type: timer.type,
          startTime: timer.startTime,
          endTime,
          totalDuration,
          pausedDuration: timer.pausedDuration,
          metadata: timer.metadata,
        };
        
        set((state) => {
          const newTimers = new Map(state.activeTimers);
          newTimers.delete(type);
          return { activeTimers: newTimers };
        });
        
        return result;
      },
      
      pauseTimer: (type) =>
        set((state) => {
          const timer = state.activeTimers.get(type);
          if (!timer || timer.isPaused) return state;
          
          const newTimers = new Map(state.activeTimers);
          newTimers.set(type, {
            ...timer,
            isPaused: true,
          });
          return { activeTimers: newTimers };
        }),
      
      resumeTimer: (type) =>
        set((state) => {
          const timer = state.activeTimers.get(type);
          if (!timer || !timer.isPaused) return state;
          
          const newTimers = new Map(state.activeTimers);
          newTimers.set(type, {
            ...timer,
            isPaused: false,
          });
          return { activeTimers: newTimers };
        }),
      
      updateTimerMetadata: (type, metadata) =>
        set((state) => {
          const timer = state.activeTimers.get(type);
          if (!timer) return state;
          
          const newTimers = new Map(state.activeTimers);
          newTimers.set(type, {
            ...timer,
            metadata: { ...timer.metadata, ...metadata },
          });
          return { activeTimers: newTimers };
        }),
      
      getActiveTimer: (type) => get().activeTimers.get(type),

      // Sync actions
      setSyncStatus: (status) => set({ syncStatus: status }),
      
      incrementPendingChanges: () =>
        set((state) => ({ pendingChanges: state.pendingChanges + 1 })),
      
      decrementPendingChanges: (count = 1) =>
        set((state) => ({
          pendingChanges: Math.max(0, state.pendingChanges - count),
        })),
      
      setLastSyncTime: (time) => set({ lastSyncTime: time }),

      // UI actions
      setDarkMode: (enabled) => set({ darkMode: enabled }),
      
      setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
      
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      
      setThemePreference: (preference) => set({ themePreference: preference }),
      
      setAutoNightMode: (settings) =>
        set((state) => ({
          autoNightMode: { ...state.autoNightMode, ...settings },
        })),
    }),
    {
      name: "babynest-storage",
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        babies: state.babies,
        activeBabyId: state.activeBabyId,
        activeTimers: state.activeTimers,
        darkMode: state.darkMode,
        themePreference: state.themePreference,
        autoNightMode: state.autoNightMode,
        hapticEnabled: state.hapticEnabled,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useActiveBaby = () => {
  const babies = useBabyStore((state) => state.babies);
  const activeBabyId = useBabyStore((state) => state.activeBabyId);
  return babies.find((baby) => baby.id === activeBabyId) ?? null;
};

export const useActiveTimer = (type: TimerType) => {
  return useBabyStore((state) => state.activeTimers.get(type));
};

export const useSyncState = () => {
  return useBabyStore((state) => ({
    syncStatus: state.syncStatus,
    pendingChanges: state.pendingChanges,
    lastSyncTime: state.lastSyncTime,
  }));
};
