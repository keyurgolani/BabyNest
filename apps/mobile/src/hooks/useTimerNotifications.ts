/**
 * Timer Notifications Hook
 * Manages persistent notifications for running timers
 * Validates: Requirements 14.6 (persistent notification when timer is running)
 */

import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";

import {
  showTimerNotification,
  dismissTimerNotification,
  requestNotificationPermissions,
  setupNotificationResponseHandler,
} from "../services/NotificationService";
import { useBabyStore } from "../store";
import type { TimerType, Timer } from "../store/types";

// Update interval for notifications (30 seconds)
const NOTIFICATION_UPDATE_INTERVAL = 30000;

/**
 * Hook to manage timer notifications
 * - Shows notification when timer starts
 * - Updates notification periodically with elapsed time
 * - Dismisses notification when timer stops
 * - Handles app state changes (background/foreground)
 */
export function useTimerNotifications() {
  const activeTimers = useBabyStore((state) => state.activeTimers);
  const previousTimersRef = useRef<Map<TimerType, Timer>>(new Map());
  const updateIntervalsRef = useRef<Map<TimerType, NodeJS.Timeout>>(new Map());
  const notificationListenerRef = useRef<ReturnType<typeof setupNotificationResponseHandler> | null>(null);

  // Request permissions on mount
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Set up notification tap handler
  useEffect(() => {
    notificationListenerRef.current = setupNotificationResponseHandler((timerType) => {
      // When user taps notification, the app will open
      // The navigation to the correct screen can be handled by the app's navigation
      console.debug(`[useTimerNotifications] User tapped ${timerType} notification`);
    });

    return () => {
      notificationListenerRef.current?.remove();
    };
  }, []);

  // Start periodic notification updates for a timer
  const startNotificationUpdates = useCallback((timerType: TimerType, timer: Timer) => {
    // Clear any existing interval
    const existingInterval = updateIntervalsRef.current.get(timerType);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Show initial notification
    showTimerNotification(timerType, timer.startTime, {
      breastSide: timer.metadata.breastSide,
      sleepType: timer.metadata.sleepType,
    });

    // Set up periodic updates
    const interval = setInterval(() => {
      showTimerNotification(timerType, timer.startTime, {
        breastSide: timer.metadata.breastSide,
        sleepType: timer.metadata.sleepType,
      });
    }, NOTIFICATION_UPDATE_INTERVAL);

    updateIntervalsRef.current.set(timerType, interval);
  }, []);

  // Stop notification updates for a timer
  const stopNotificationUpdates = useCallback((timerType: TimerType) => {
    const interval = updateIntervalsRef.current.get(timerType);
    if (interval) {
      clearInterval(interval);
      updateIntervalsRef.current.delete(timerType);
    }
    dismissTimerNotification(timerType);
  }, []);

  // Track timer changes and manage notifications
  useEffect(() => {
    const timerTypes: TimerType[] = ["breastfeeding", "sleep", "tummyTime", "pumping"];

    timerTypes.forEach((timerType) => {
      const currentTimer = activeTimers.get(timerType);
      const previousTimer = previousTimersRef.current.get(timerType);

      // Timer started
      if (currentTimer && !previousTimer) {
        startNotificationUpdates(timerType, currentTimer);
      }
      // Timer stopped
      else if (!currentTimer && previousTimer) {
        stopNotificationUpdates(timerType);
      }
      // Timer metadata changed (e.g., breast side switched)
      else if (currentTimer && previousTimer) {
        const metadataChanged =
          currentTimer.metadata.breastSide !== previousTimer.metadata.breastSide ||
          currentTimer.metadata.sleepType !== previousTimer.metadata.sleepType;
        
        if (metadataChanged) {
          // Update notification with new metadata
          showTimerNotification(timerType, currentTimer.startTime, {
            breastSide: currentTimer.metadata.breastSide,
            sleepType: currentTimer.metadata.sleepType,
          });
        }
      }
    });

    // Update previous timers reference
    previousTimersRef.current = new Map(activeTimers);
  }, [activeTimers, startNotificationUpdates, stopNotificationUpdates]);

  // Handle app state changes - update notifications when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        // Update all active timer notifications when going to background
        activeTimers.forEach((timer, timerType) => {
          showTimerNotification(timerType, timer.startTime, {
            breastSide: timer.metadata.breastSide,
            sleepType: timer.metadata.sleepType,
          });
        });
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [activeTimers]);

  // Cleanup on unmount
  useEffect(() => {
    // Capture ref value at effect setup time
    const intervalsMap = updateIntervalsRef.current;
    return () => {
      // Clear all intervals using captured reference
      intervalsMap.forEach((interval) => clearInterval(interval));
      intervalsMap.clear();
    };
  }, []);
}

export default useTimerNotifications;
