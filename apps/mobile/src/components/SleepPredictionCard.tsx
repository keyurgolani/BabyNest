/**
 * Sleep Prediction Card Component
 * Displays predicted optimal nap time prominently with countdown and confidence level
 * Similar to Huckleberry's "SweetSpot" feature
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";

import { useHaptics } from "../hooks";
import {
  getSleepPredictionService,
  formatDuration,
  formatTimeUntilSleep,
  type SleepPrediction,
  type WakeWindowStatus,
  type PredictionConfidence,
} from "../services/SleepPredictionService";
import { useActiveBaby, useBabyStore } from "../store";

/**
 * Get status color based on wake window status
 */
function getStatusColors(status: WakeWindowStatus, darkMode: boolean): {
  bg: string;
  text: string;
  progress: string;
  accent: string;
  iconColor: string;
} {
  switch (status) {
    case "well-rested":
      return {
        bg: darkMode ? "bg-green-900/30" : "bg-green-50",
        text: darkMode ? "text-green-400" : "text-green-700",
        progress: darkMode ? "bg-green-500" : "bg-green-500",
        accent: darkMode ? "border-green-500" : "border-green-500",
        iconColor: darkMode ? "#4ade80" : "#15803d",
      };
    case "approaching-tired":
      return {
        bg: darkMode ? "bg-yellow-900/30" : "bg-yellow-50",
        text: darkMode ? "text-yellow-400" : "text-yellow-700",
        progress: darkMode ? "bg-yellow-500" : "bg-yellow-500",
        accent: darkMode ? "border-yellow-500" : "border-yellow-500",
        iconColor: darkMode ? "#facc15" : "#a16207",
      };
    case "overtired":
      return {
        bg: darkMode ? "bg-red-900/30" : "bg-red-50",
        text: darkMode ? "text-red-400" : "text-red-700",
        progress: darkMode ? "bg-red-500" : "bg-red-500",
        accent: darkMode ? "border-red-500" : "border-red-500",
        iconColor: darkMode ? "#f87171" : "#b91c1c",
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

/**
 * Get status icon
 */
function getStatusIcon(status: WakeWindowStatus): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case "well-rested":
      return "happy-outline";
    case "approaching-tired":
      return "time-outline";
    case "overtired":
      return "alert-circle-outline";
  }
}

/**
 * Get confidence label and icon
 */
function getConfidenceInfo(confidence: PredictionConfidence): {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  switch (confidence) {
    case "high":
      return { label: "High confidence", icon: "checkmark-circle" };
    case "medium":
      return { label: "Medium confidence", icon: "ellipse-outline" };
    case "low":
      return { label: "Based on age guidelines", icon: "information-circle-outline" };
  }
}

interface SleepPredictionCardProps {
  /**
   * Callback when the Start Sleep button is pressed
   */
  onStartSleep?: () => void;
}

/**
 * Sleep Prediction Card Component
 * Shows the predicted optimal nap time prominently with countdown
 */
export function SleepPredictionCard({ onStartSleep }: SleepPredictionCardProps) {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const { lightHaptic, mediumHaptic } = useHaptics();

  const [prediction, setPrediction] = useState<SleepPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animation for the pulsing effect when approaching sleep time
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /**
   * Load sleep prediction
   */
  const loadPrediction = useCallback(async () => {
    if (!activeBaby) {
      setPrediction(null);
      setIsLoading(false);
      return;
    }

    try {
      const service = getSleepPredictionService();
      const result = await service.getPrediction(activeBaby.id, activeBaby.dateOfBirth);
      setPrediction(result);
    } catch (error) {
      console.error("[SleepPredictionCard] Error loading prediction:", error);
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  // Initial load and auto-refresh every minute
  useEffect(() => {
    loadPrediction();
    const interval = setInterval(loadPrediction, 60 * 1000);
    return () => clearInterval(interval);
  }, [loadPrediction]);

  // Pulse animation when approaching or past sleep time
  useEffect(() => {
    if (prediction && prediction.minutesUntilSleep <= 15) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [prediction, pulseAnim]);

  /**
   * Handle Start Sleep button press
   */
  const handleStartSleep = () => {
    mediumHaptic();
    if (onStartSleep) {
      onStartSleep();
    } else {
      router.push("/(tabs)/sleep");
    }
  };

  /**
   * Handle card press
   */
  const handleCardPress = () => {
    lightHaptic();
    router.push("/(tabs)/sleep");
  };

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
          Loading prediction...
        </Text>
      </View>
    );
  }

  // No prediction available
  if (!prediction) {
    return null;
  }

  const statusColors = getStatusColors(prediction.status, darkMode);
  const confidenceInfo = getConfidenceInfo(prediction.confidence);
  const progressWidth = Math.min(prediction.percentageElapsed, 100);
  const service = getSleepPredictionService();

  return (
    <Animated.View style={styles.animatedContainer}>
      <Pressable
        onPress={handleCardPress}
        className={`p-4 rounded-xl border-l-4 ${statusColors.accent} ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
        accessibilityRole="button"
        accessibilityLabel={`Sleep prediction. ${getStatusLabel(prediction.status)}. ${
          prediction.minutesUntilSleep > 0
            ? `Optimal sleep time in ${formatDuration(prediction.minutesUntilSleep)}`
            : `Optimal sleep time was ${formatDuration(Math.abs(prediction.minutesUntilSleep))} ago`
        }`}
        accessibilityHint="Tap for sleep tracking"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-xl mr-2">🎯</Text>
            <Text
              className={`text-base font-semibold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              SweetSpot Prediction
            </Text>
          </View>
          <View
            className={`flex-row items-center px-2 py-1 rounded-full ${statusColors.bg}`}
          >
            <Ionicons
              name={getStatusIcon(prediction.status)}
              size={14}
              color={statusColors.iconColor}
              style={styles.statusIcon}
            />
            <Text className={`text-xs font-medium ${statusColors.text}`}>
              {getStatusLabel(prediction.status)}
            </Text>
          </View>
        </View>

        {/* Main Prediction Display */}
        <View className="items-center py-4">
          {/* Countdown / Time Display */}
          <Text
            className={`text-4xl font-bold ${
              prediction.minutesUntilSleep <= 0
                ? statusColors.text
                : darkMode
                ? "text-white"
                : "text-gray-900"
            }`}
          >
            {formatTimeUntilSleep(prediction.minutesUntilSleep)}
          </Text>
          <Text
            className={`text-sm mt-1 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {prediction.minutesUntilSleep > 0
              ? `until optimal ${prediction.sleepType === "nap" ? "nap" : "bedtime"}`
              : `past optimal ${prediction.sleepType === "nap" ? "nap" : "bed"} time`}
          </Text>

          {/* Target Time */}
          <View
            className={`mt-3 px-4 py-2 rounded-full ${
              darkMode ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Target: {prediction.predictedSleepTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mb-3">
          <View
            className={`h-2 rounded-full overflow-hidden ${
              darkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <View
              className={`h-full rounded-full ${statusColors.progress}`}
              style={[styles.progressBar, { width: `${progressWidth}%` }]}
            />
          </View>
          <View className="flex-row justify-between mt-1">
            <Text
              className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
            >
              Awake: {formatDuration(prediction.currentAwakeMinutes)}
            </Text>
            <Text
              className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
            >
              {prediction.lastSleepEndTime
                ? `Since ${prediction.lastSleepEndTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "No recent sleep"}
            </Text>
          </View>
        </View>

        {/* Wake Window Guidance */}
        <View
          className={`p-3 rounded-lg mb-3 ${
            darkMode ? "bg-gray-700/50" : "bg-gray-50"
          }`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Age-appropriate wake window
              </Text>
              <Text
                className={`text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {service.getWakeWindowGuidance(
                  Math.floor(
                    (new Date().getTime() - new Date(activeBaby.dateOfBirth).getTime()) /
                      (1000 * 60 * 60 * 24 * 30)
                  )
                )}
              </Text>
            </View>
            {prediction.personalizedWakeWindow && (
              <View className="items-end">
                <Text
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Personalized
                </Text>
                <Text
                  className={`text-sm font-medium ${
                    darkMode ? "text-fuchsia-400" : "text-fuchsia-600"
                  }`}
                >
                  ~{formatDuration(prediction.personalizedWakeWindow)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Confidence Indicator */}
        <View className="flex-row items-center justify-center mb-3">
          <Ionicons
            name={confidenceInfo.icon}
            size={14}
            color={darkMode ? "#9ca3af" : "#6b7280"}
            style={styles.confidenceIcon}
          />
          <Text
            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            {confidenceInfo.label}
            {prediction.hasHistoricalData &&
              ` (${prediction.historicalDataPoints} data points)`}
          </Text>
        </View>

        {/* Start Sleep Button */}
        <Pressable
          onPress={handleStartSleep}
          className={`py-3 px-6 rounded-xl items-center justify-center ${
            prediction.status === "overtired"
              ? "bg-red-500"
              : prediction.status === "approaching-tired"
              ? "bg-yellow-500"
              : "bg-fuchsia-600"
          }`}
          style={styles.startSleepButton}
          accessibilityRole="button"
          accessibilityLabel="Start sleep tracking"
          accessibilityHint="Opens sleep tracking screen to log a nap or bedtime"
        >
          <View className="flex-row items-center">
            <Ionicons
              name="moon"
              size={18}
              color="white"
              style={styles.moonIcon}
            />
            <Text className="text-white font-semibold text-base">
              Start Sleep
            </Text>
          </View>
        </Pressable>

        {/* Status Message */}
        <Text
          className={`text-xs text-center mt-3 ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {service.getStatusMessage(prediction)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    transform: [{ scale: 1 }],
  },
  statusIcon: {
    marginRight: 4,
  },
  progressBar: {},
  confidenceIcon: {
    marginRight: 4,
  },
  startSleepButton: {
    minHeight: 48,
  },
  moonIcon: {
    marginRight: 8,
  },
});

export default SleepPredictionCard;
