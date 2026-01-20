/**
 * Quick Log Toast Component
 * Shows brief confirmation messages after quick logging actions with undo support
 * Validates: Requirements for feedback after quick log actions
 */

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";

import { getDatabaseService } from "../database/DatabaseService";
import { useHaptics } from "../hooks";
import { useBabyStore } from "../store";
import { useQuickLogStore, useToast, useUndoableEntry } from "../store/quickLogStore";

const TOAST_DURATION = 4000; // Extended to 4 seconds for undo opportunity
const ANIMATION_DURATION = 250;

type IoniconsName = keyof typeof Ionicons.glyphMap;

/**
 * Get icon name based on toast type and custom icon
 */
function getIconName(type: string, customIcon?: string): IoniconsName {
  if (customIcon) {
    return customIcon as IoniconsName;
  }
  switch (type) {
    case "success":
      return "checkmark-circle";
    case "error":
      return "alert-circle";
    case "info":
      return "information-circle";
    default:
      return "checkmark-circle";
  }
}

/**
 * Get icon color based on toast type
 */
function getIconColor(type: string, _darkMode: boolean): string {
  switch (type) {
    case "success":
      return "#22c55e"; // green-500
    case "error":
      return "#ef4444"; // red-500
    case "info":
      return "#3b82f6"; // blue-500
    default:
      return "#22c55e";
  }
}

/**
 * QuickLogToast Component
 * Displays a toast notification that auto-dismisses with optional undo button
 */
export function QuickLogToast() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const toast = useToast();
  const hideToast = useQuickLogStore((state) => state.hideToast);
  const undoableEntry = useUndoableEntry();
  const clearUndoableEntry = useQuickLogStore((state) => state.clearUndoableEntry);
  const showToast = useQuickLogStore((state) => state.showToast);
  const { mediumHaptic, successHaptic } = useHaptics();
  
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle toast visibility changes
  useEffect(() => {
    if (toast.visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate in
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.back(1.5)),
      });
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION });

      // Auto-hide after duration (longer if undo is available)
      const duration = toast.canUndo ? TOAST_DURATION : 2500;
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toast.visible, toast.message, toast.canUndo]);

  const handleDismiss = useCallback(() => {
    // Animate out
    translateY.value = withTiming(100, {
      duration: ANIMATION_DURATION,
      easing: Easing.in(Easing.ease),
    });
    opacity.value = withTiming(0, { duration: ANIMATION_DURATION }, () => {
      runOnJS(hideToast)();
    });
  }, [hideToast]);

  /**
   * Handle undo action - deletes the last logged entry
   */
  const handleUndo = useCallback(async () => {
    if (!undoableEntry) return;
    
    mediumHaptic();
    
    try {
      const db = getDatabaseService();
      await db.initialize();
      
      // Delete based on entity type
      switch (undoableEntry.entityType) {
        case "feeding":
          await db.deleteFeedingEntry(undoableEntry.id);
          break;
        case "sleep":
          await db.deleteSleepEntry(undoableEntry.id);
          break;
        case "diaper":
          await db.deleteDiaperEntry(undoableEntry.id);
          break;
        case "activity":
          await db.deleteActivityEntry(undoableEntry.id);
          break;
        default:
          console.warn("[QuickLogToast] Unknown entity type for undo:", undoableEntry.entityType);
          return;
      }
      
      // Clear the undoable entry
      clearUndoableEntry();
      
      // Show confirmation
      successHaptic();
      handleDismiss();
      
      // Show undo confirmation after a brief delay
      setTimeout(() => {
        showToast("↩️ Entry removed", "info");
      }, 300);
      
    } catch (error) {
      console.error("[QuickLogToast] Error undoing entry:", error);
      showToast("Failed to undo", "error");
    }
  }, [undoableEntry, mediumHaptic, successHaptic, clearUndoableEntry, handleDismiss, showToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toast.visible && opacity.value === 0) {
    return null;
  }

  const iconName = getIconName(toast.type, toast.icon);
  const iconColor = getIconColor(toast.type, darkMode);
  const showUndoButton = toast.canUndo && undoableEntry;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 160, // Above FAB and tab bar
          left: 16,
          right: 16,
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <View
        className={`flex-row items-center px-4 py-3 rounded-xl shadow-lg ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        }}
        accessibilityRole="alert"
        accessibilityLabel={toast.message}
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
        <Text
          className={`flex-1 ml-3 text-base font-medium ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
          numberOfLines={2}
        >
          {toast.message}
        </Text>
        
        {/* Undo Button */}
        {showUndoButton && (
          <Pressable
            onPress={handleUndo}
            className={`ml-2 px-3 py-2 rounded-lg ${
              darkMode ? "bg-gray-700 active:bg-gray-600" : "bg-gray-100 active:bg-gray-200"
            }`}
            style={{ minWidth: 60, minHeight: 36 }}
            accessibilityRole="button"
            accessibilityLabel="Undo last entry"
            accessibilityHint="Removes the entry you just logged"
          >
            <Text
              className={`text-sm font-semibold text-center ${
                darkMode ? "text-fuchsia-400" : "text-fuchsia-600"
              }`}
            >
              Undo
            </Text>
          </Pressable>
        )}
        
        {/* Close Button */}
        <Pressable
          onPress={handleDismiss}
          className="ml-2 p-1"
          style={{ minWidth: 32, minHeight: 32 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <Ionicons
            name="close"
            size={20}
            color={darkMode ? "#9ca3af" : "#6b7280"}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default QuickLogToast;
