import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";

import {
  getSleepPredictionService,
  formatDuration,
  formatTimeUntilSleep,
  type WakeWindowStatus,
} from "../services/SleepPredictionService";
import { useActiveBaby, useBabyStore } from "../store";

/**
 * Wake window data structure (derived from SleepPrediction)
 */
interface WakeWindowData {
  lastSleepEndTime: Date | null;
  currentAwakeMinutes: number;
  recommendedWakeWindowMinutes: number;
  minWakeWindowMinutes: number;
  maxWakeWindowMinutes: number;
  suggestedNextSleepTime: Date | null;
  minutesUntilNextSleep: number;
  status: WakeWindowStatus;
  percentageOfWakeWindow: number;
  hasSleepHistory: boolean;
  personalizedWakeWindow: number | null;
}

/**
 * Get status color based on wake window status
 */
function getStatusColor(status: WakeWindowStatus, darkMode: boolean): {
  bg: string;
  text: string;
  progress: string;
  icon: string;
} {
  switch (status) {
    case "well-rested":
      return {
        bg: darkMode ? "bg-green-900/30" : "bg-green-50",
        text: darkMode ? "text-green-400" : "text-green-700",
        progress: darkMode ? "bg-green-500" : "bg-green-500",
        icon: "happy-outline",
      };
    case "approaching-tired":
      return {
        bg: darkMode ? "bg-yellow-900/30" : "bg-yellow-50",
        text: darkMode ? "text-yellow-400" : "text-yellow-700",
        progress: darkMode ? "bg-yellow-500" : "bg-yellow-500",
        icon: "time-outline",
      };
    case "overtired":
      return {
        bg: darkMode ? "bg-red-900/30" : "bg-red-50",
        text: darkMode ? "text-red-400" : "text-red-700",
        progress: darkMode ? "bg-red-500" : "bg-red-500",
        icon: "alert-circle-outline",
      };
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: WakeWindowStatus): string {
  switch (status) {
    case "well-rested":
      return "Well Rested";
    case "approaching-tired":
      return "Getting Tired";
    case "overtired":
      return "Overtired";
  }
}

interface WakeWindowCardProps {
  /**
   * Callback when the card is pressed
   */
  onPress?: () => void;
}

/**
 * Wake Window Card Component
 * Displays the current wake window with age-appropriate recommendations
 * Similar to Huckleberry's SweetSpot feature
 */
export function WakeWindowCard({ onPress }: WakeWindowCardProps) {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();

  const [wakeWindowData, setWakeWindowData] = useState<WakeWindowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Calculate wake window data using SleepPredictionService
   */
  const calculateWakeWindow = useCallback(async () => {
    if (!activeBaby) {
      setWakeWindowData(null);
      setIsLoading(false);
      return;
    }

    try {
      const service = getSleepPredictionService();
      const prediction = await service.getPrediction(activeBaby.id, activeBaby.dateOfBirth);

      if (!prediction) {
        setWakeWindowData(null);
        setIsLoading(false);
        return;
      }

      // Convert SleepPrediction to WakeWindowData format
      setWakeWindowData({
        lastSleepEndTime: prediction.lastSleepEndTime,
        currentAwakeMinutes: prediction.currentAwakeMinutes,
        recommendedWakeWindowMinutes: prediction.recommendedWakeWindow.averageMinutes,
        minWakeWindowMinutes: prediction.recommendedWakeWindow.minMinutes,
        maxWakeWindowMinutes: prediction.recommendedWakeWindow.maxMinutes,
        suggestedNextSleepTime: prediction.predictedSleepTime,
        minutesUntilNextSleep: prediction.minutesUntilSleep,
        status: prediction.status,
        percentageOfWakeWindow: prediction.percentageElapsed,
        hasSleepHistory: prediction.lastSleepEndTime !== null,
        personalizedWakeWindow: prediction.personalizedWakeWindow,
      });
    } catch (error) {
      console.error("[WakeWindowCard] Error calculating wake window:", error);
      setWakeWindowData(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  // Initial load and auto-refresh every minute
  useEffect(() => {
    calculateWakeWindow();

    // Refresh every minute
    const interval = setInterval(calculateWakeWindow, 60 * 1000);

    return () => clearInterval(interval);
  }, [calculateWakeWindow]);

  // Don't render if no active baby
  if (!activeBaby) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View
        className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <Text
          className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Loading...
        </Text>
      </View>
    );
  }

  // No data state
  if (!wakeWindowData) {
    return null;
  }

  const statusColors = getStatusColor(wakeWindowData.status, darkMode);
  const progressWidth = Math.min(wakeWindowData.percentageOfWakeWindow, 100);

  return (
    <Pressable
      onPress={onPress}
      className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
      accessibilityRole="button"
      accessibilityLabel={`Wake window timer. ${activeBaby.name} has been awake for ${formatDuration(wakeWindowData.currentAwakeMinutes)}. Status: ${getStatusLabel(wakeWindowData.status)}`}
      accessibilityHint="Tap for more sleep details"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Text className="text-xl mr-2">😴</Text>
          <Text
            className={`text-base font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Wake Window
          </Text>
        </View>
        <View
          className={`flex-row items-center px-2 py-1 rounded-full ${statusColors.bg}`}
        >
          <Ionicons
            name={statusColors.icon as keyof typeof Ionicons.glyphMap}
            size={14}
            color={darkMode ? statusColors.text.replace("text-", "#") : undefined}
            style={{ marginRight: 4 }}
          />
          <Text className={`text-xs font-medium ${statusColors.text}`}>
            {getStatusLabel(wakeWindowData.status)}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      {wakeWindowData.hasSleepHistory ? (
        <>
          {/* Time Awake */}
          <View className="mb-3">
            <Text
              className={`text-3xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {formatDuration(wakeWindowData.currentAwakeMinutes)}
            </Text>
            <Text
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              awake since{" "}
              {wakeWindowData.lastSleepEndTime?.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="mb-3">
            <View
              className={`h-3 rounded-full overflow-hidden ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              <View
                className={`h-full rounded-full ${statusColors.progress}`}
                style={{ width: `${progressWidth}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text
                className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                0m
              </Text>
              <Text
                className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                {formatDuration(wakeWindowData.recommendedWakeWindowMinutes)}
              </Text>
            </View>
          </View>

          {/* Next Sleep Suggestion */}
          <View
            className={`p-3 rounded-lg ${
              darkMode ? "bg-gray-700/50" : "bg-gray-50"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {wakeWindowData.minutesUntilNextSleep > 0
                    ? "Suggested nap in"
                    : "Nap time"}
                </Text>
                <Text
                  className={`text-lg font-semibold ${
                    wakeWindowData.minutesUntilNextSleep <= 0
                      ? statusColors.text
                      : darkMode
                      ? "text-white"
                      : "text-gray-900"
                  }`}
                >
                  {formatTimeUntilSleep(wakeWindowData.minutesUntilNextSleep)}
                </Text>
              </View>
              {wakeWindowData.suggestedNextSleepTime && (
                <View className="items-end">
                  <Text
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Target time
                  </Text>
                  <Text
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {wakeWindowData.suggestedNextSleepTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Recommended Range */}
          <Text
            className={`text-xs text-center mt-2 ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Recommended wake window: {formatDuration(wakeWindowData.minWakeWindowMinutes)} -{" "}
            {formatDuration(wakeWindowData.maxWakeWindowMinutes)}
            {wakeWindowData.personalizedWakeWindow && (
              <Text className={darkMode ? "text-fuchsia-400" : "text-fuchsia-600"}>
                {" "}• Personalized: ~{formatDuration(wakeWindowData.personalizedWakeWindow)}
              </Text>
            )}
          </Text>
        </>
      ) : (
        /* No Sleep History */
        <View className="items-center py-4">
          <Ionicons
            name="moon-outline"
            size={32}
            color={darkMode ? "#6b7280" : "#9ca3af"}
          />
          <Text
            className={`mt-2 text-center ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No sleep data yet
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Log a sleep session to see wake window recommendations
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default WakeWindowCard;
