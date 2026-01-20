/**
 * Quick Log Store for BabyNest
 * Tracks last entries and provides quick logging functions with undo support
 * Validates: Requirements for one-tap logging from FAB
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { FeedingType, DiaperType, BottleType, BreastSide, EntityType } from "../database/types";

/**
 * Last feeding entry info for "repeat last" functionality
 */
export interface LastFeedingInfo {
  type: FeedingType;
  amount?: number | null;
  bottleType?: BottleType | null;
  lastSide?: BreastSide | null;
  timestamp: string;
}

/**
 * Last diaper entry info
 */
export interface LastDiaperInfo {
  type: DiaperType;
  timestamp: string;
}

/**
 * Undoable entry info - stores what was just logged for undo
 */
export interface UndoableEntry {
  id: string;
  entityType: EntityType;
  description: string;
  timestamp: string;
}

/**
 * Toast notification state with optional undo action
 */
export interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error" | "info";
  icon?: string;
  canUndo?: boolean;
}

interface QuickLogState {
  // Last entries for "repeat last" functionality
  lastFeeding: LastFeedingInfo | null;
  lastDiaper: LastDiaperInfo | null;
  
  // Undo stack (most recent entry that can be undone)
  undoableEntry: UndoableEntry | null;
  
  // Toast notification state
  toast: ToastState;
  
  // FAB expanded state
  isExpanded: boolean;
}

interface QuickLogActions {
  // Update last entries
  setLastFeeding: (info: LastFeedingInfo) => void;
  setLastDiaper: (info: LastDiaperInfo) => void;
  
  // Undo actions
  setUndoableEntry: (entry: UndoableEntry | null) => void;
  clearUndoableEntry: () => void;
  
  // Toast actions
  showToast: (message: string, type?: ToastState["type"], icon?: string, canUndo?: boolean) => void;
  hideToast: () => void;
  
  // FAB state
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
}

export type QuickLogStore = QuickLogState & QuickLogActions;

// Custom storage for persisting last entries
const quickLogStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const str = await AsyncStorage.getItem(name);
    return str;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};

export const useQuickLogStore = create<QuickLogStore>()(
  persist(
    (set) => ({
      // Initial state
      lastFeeding: null,
      lastDiaper: null,
      undoableEntry: null,
      toast: {
        visible: false,
        message: "",
        type: "success",
        icon: undefined,
        canUndo: false,
      },
      isExpanded: false,

      // Actions
      setLastFeeding: (info) => set({ lastFeeding: info }),
      
      setLastDiaper: (info) => set({ lastDiaper: info }),
      
      setUndoableEntry: (entry) => set({ undoableEntry: entry }),
      
      clearUndoableEntry: () => set({ undoableEntry: null }),
      
      showToast: (message, type = "success", icon, canUndo = false) =>
        set({
          toast: {
            visible: true,
            message,
            type,
            icon,
            canUndo,
          },
        }),
      
      hideToast: () =>
        set((state) => ({
          toast: {
            ...state.toast,
            visible: false,
            canUndo: false,
          },
        })),
      
      setExpanded: (expanded) => set({ isExpanded: expanded }),
      
      toggleExpanded: () =>
        set((state) => ({ isExpanded: !state.isExpanded })),
    }),
    {
      name: "babynest-quicklog-storage",
      storage: createJSONStorage(() => quickLogStorage),
      partialize: (state) => ({
        lastFeeding: state.lastFeeding,
        lastDiaper: state.lastDiaper,
      }),
    }
  )
);

// Selector hooks
export const useLastFeeding = () => useQuickLogStore((state) => state.lastFeeding);
export const useLastDiaper = () => useQuickLogStore((state) => state.lastDiaper);
export const useToast = () => useQuickLogStore((state) => state.toast);
export const useQuickLogExpanded = () => useQuickLogStore((state) => state.isExpanded);
export const useUndoableEntry = () => useQuickLogStore((state) => state.undoableEntry);
