/**
 * Haptics Hook
 * Provides haptic feedback utilities for the BabyNest app
 * Validates: Requirements 14.7 (haptic feedback for successful actions)
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useBabyStore } from "../store";

/**
 * Haptic feedback types for different interactions
 */
export type HapticFeedbackType =
  | "success" // For successful save operations
  | "warning" // For warnings or alerts
  | "error" // For errors
  | "light" // For light button presses (tab switches, selections)
  | "medium" // For medium interactions (timer start/stop)
  | "heavy"; // For heavy/important interactions

/**
 * Hook that provides haptic feedback functions
 * Respects user preference for haptic feedback (hapticEnabled in store)
 */
export function useHaptics() {
  const hapticEnabled = useBabyStore((state) => state.hapticEnabled);

  /**
   * Trigger haptic feedback based on type
   * Only triggers if haptics are enabled and platform supports it
   */
  const triggerHaptic = async (type: HapticFeedbackType = "light") => {
    // Skip if haptics are disabled or not on a native platform
    if (!hapticEnabled || Platform.OS === "web") {
      return;
    }

    try {
      switch (type) {
        case "success":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          break;
        case "warning":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          break;
        case "error":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          break;
        case "light":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Silently fail if haptics are not available
      console.debug("[useHaptics] Haptic feedback failed:", error);
    }
  };

  /**
   * Convenience methods for common haptic patterns
   */
  return {
    /**
     * Trigger haptic feedback with specified type
     */
    triggerHaptic,

    /**
     * Success haptic - use for successful save operations
     * (feeding saved, sleep saved, diaper logged, etc.)
     */
    successHaptic: () => triggerHaptic("success"),

    /**
     * Light haptic - use for button presses, tab switches, selections
     */
    lightHaptic: () => triggerHaptic("light"),

    /**
     * Medium haptic - use for timer start/stop, important actions
     */
    mediumHaptic: () => triggerHaptic("medium"),

    /**
     * Heavy haptic - use for significant actions
     */
    heavyHaptic: () => triggerHaptic("heavy"),

    /**
     * Warning haptic - use for warnings
     */
    warningHaptic: () => triggerHaptic("warning"),

    /**
     * Error haptic - use for errors
     */
    errorHaptic: () => triggerHaptic("error"),

    /**
     * Selection haptic - alias for light, good for selections
     */
    selectionHaptic: () => triggerHaptic("light"),
  };
}

export default useHaptics;
