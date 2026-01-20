import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import { useBabyStore } from "../store";
import type { ThemePreference } from "../store/types";

/**
 * Check if current time is within the night mode window
 * Handles overnight ranges (e.g., 20:00 to 07:00)
 */
function isWithinNightWindow(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight range (e.g., 20:00 to 07:00)
  if (startMinutes > endMinutes) {
    // Night mode spans midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Normal range within same day
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

/**
 * Custom hook for theme management with system preference detection and auto night mode
 * Validates: Requirements 14.3 (Support dark mode with system preference detection)
 * 
 * This hook:
 * 1. Detects system color scheme preference
 * 2. Applies the appropriate theme based on user preference (system/light/dark/auto)
 * 3. Updates darkMode state when system preference changes (if using "system" preference)
 * 4. Auto-switches to dark mode during configured night hours (if using "auto" preference)
 */
export function useTheme() {
  const systemColorScheme = useColorScheme();
  const darkMode = useBabyStore((state) => state.darkMode);
  const themePreference = useBabyStore((state) => state.themePreference);
  const autoNightMode = useBabyStore((state) => state.autoNightMode);
  const setDarkMode = useBabyStore((state) => state.setDarkMode);
  const setThemePreference = useBabyStore((state) => state.setThemePreference);
  const setAutoNightMode = useBabyStore((state) => state.setAutoNightMode);

  // Track if we're in night window for auto mode
  const [isNightTime, setIsNightTime] = useState(() => 
    isWithinNightWindow(autoNightMode.startTime, autoNightMode.endTime)
  );

  // Update night time status periodically when using auto mode
  useEffect(() => {
    if (themePreference !== "auto") return;

    // Check immediately
    setIsNightTime(isWithinNightWindow(autoNightMode.startTime, autoNightMode.endTime));

    // Check every minute
    const interval = setInterval(() => {
      setIsNightTime(isWithinNightWindow(autoNightMode.startTime, autoNightMode.endTime));
    }, 60000);

    return () => clearInterval(interval);
  }, [themePreference, autoNightMode.startTime, autoNightMode.endTime]);

  // Update darkMode based on theme preference and system color scheme
  useEffect(() => {
    let shouldBeDark: boolean;

    switch (themePreference) {
      case "dark":
        shouldBeDark = true;
        break;
      case "light":
        shouldBeDark = false;
        break;
      case "auto":
        // Use time-based switching
        shouldBeDark = isNightTime;
        break;
      case "system":
      default:
        // Follow system preference, default to light if system preference is null
        shouldBeDark = systemColorScheme === "dark";
        break;
    }

    // Only update if the value actually changed
    if (darkMode !== shouldBeDark) {
      setDarkMode(shouldBeDark);
    }
  }, [themePreference, systemColorScheme, darkMode, setDarkMode, isNightTime]);

  return {
    /** Current dark mode state (resolved from preference + system) */
    darkMode,
    /** User's theme preference setting */
    themePreference,
    /** Auto night mode settings */
    autoNightMode,
    /** System color scheme from device */
    systemColorScheme,
    /** Set the theme preference */
    setThemePreference,
    /** Update auto night mode settings */
    setAutoNightMode,
    /** Check if currently using system preference */
    isUsingSystemTheme: themePreference === "system",
    /** Check if currently using auto night mode */
    isUsingAutoNightMode: themePreference === "auto",
    /** Whether it's currently night time (for auto mode) */
    isNightTime,
  };
}

/**
 * Hook to get the current theme preference options for UI display
 */
export function useThemeOptions(): Array<{
  value: ThemePreference;
  label: string;
  description: string;
  icon: string;
}> {
  return [
    {
      value: "system",
      label: "System",
      description: "Follow device settings",
      icon: "phone-portrait-outline",
    },
    {
      value: "light",
      label: "Light",
      description: "Always use light mode",
      icon: "sunny-outline",
    },
    {
      value: "dark",
      label: "Dark",
      description: "Always use dark mode",
      icon: "moon-outline",
    },
    {
      value: "auto",
      label: "Auto Night",
      description: "Dark mode during night hours",
      icon: "time-outline",
    },
  ];
}
