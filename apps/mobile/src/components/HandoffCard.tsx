/**
 * HandoffCard Component
 * Compact summary card for caregiver handoffs
 * Shows recent activities, wake window status, and share options
 */

import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, Share, StyleSheet } from "react-native";

import { useHaptics } from "../hooks";
import {
  getHandoffSummaryService,
  type HandoffSummary,
} from "../services/HandoffSummaryService";
import { formatDuration } from "../services/SleepPredictionService";
import { useActiveBaby, useBabyStore } from "../store";

/**
 * Get status color based on wake window status
 */
function getStatusColor(
  status: "well-rested" | "approaching-tired" | "overtired",
  darkMode: boolean
): { bg: string; text: string } {
  switch (status) {
    case "well-rested":
      return {
        bg: darkMode ? "bg-green-900/30" : "bg-green-50",
        text: darkMode ? "text-green-400" : "text-green-700",
      };
    case "approaching-tired":
      return {
        bg: darkMode ? "bg-yellow-900/30" : "bg-yellow-50",
        text: darkMode ? "text-yellow-400" : "text-yellow-700",
      };
    case "overtired":
      return {
        bg: darkMode ? "bg-red-900/30" : "bg-red-50",
        text: darkMode ? "text-red-400" : "text-red-700",
      };
  }
}

/**
 * Get alert severity color
 */
function getAlertColor(
  severity: "info" | "warning" | "urgent",
  darkMode: boolean
): string {
  switch (severity) {
    case "info":
      return darkMode ? "text-blue-400" : "text-blue-600";
    case "warning":
      return darkMode ? "text-amber-400" : "text-amber-600";
    case "urgent":
      return darkMode ? "text-red-400" : "text-red-600";
  }
}

interface HandoffCardProps {
  /**
   * Callback when the card is pressed (navigates to full handoff screen)
   */
  onPress?: () => void;
  /**
   * Whether to show the share button
   */
  showShareButton?: boolean;
}

/**
 * HandoffCard Component
 * Displays a compact summary of recent baby activities for caregiver handoffs
 */
export function HandoffCard({ onPress, showShareButton = true }: HandoffCardProps) {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const { successHaptic, lightHaptic } = useHaptics();

  const [summary, setSummary] = useState<HandoffSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * Load handoff summary
   */
  const loadSummary = useCallback(async () => {
    if (!activeBaby) {
      setSummary(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const service = getHandoffSummaryService();
      const newSummary = await service.generateSummary(
        activeBaby.id,
        activeBaby.name,
        activeBaby.dateOfBirth,
        8 // Look back 8 hours
      );
      setSummary(newSummary);
    } catch (error) {
      console.error("[HandoffCard] Error loading summary:", error);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  // Load summary on mount and when baby changes
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(loadSummary, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadSummary]);

  /**
   * Handle share button press
   */
  const handleShare = async () => {
    if (!summary) return;

    lightHaptic();
    const service = getHandoffSummaryService();
    const shareText = service.generateShareableText(summary);

    try {
      await Share.share({
        message: shareText,
        title: `Handoff for ${summary.babyName}`,
      });
      successHaptic();
    } catch (error) {
      console.error("[HandoffCard] Error sharing:", error);
    }
  };

  /**
   * Handle copy to clipboard
   */
  const handleCopy = async () => {
    if (!summary) return;

    lightHaptic();
    const service = getHandoffSummaryService();
    const shareText = service.generateShareableText(summary);

    try {
      await Clipboard.setStringAsync(shareText);
      setCopySuccess(true);
      successHaptic();
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("[HandoffCard] Error copying:", error);
    }
  };

  /**
   * Handle card press - navigate to full handoff screen
   */
  const handlePress = () => {
    lightHaptic();
    if (onPress) {
      onPress();
    } else {
      router.push("/handoff");
    }
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
          Loading...
        </Text>
      </View>
    );
  }

  // No summary state
  if (!summary) {
    return null;
  }

  const wakeWindowColors = summary.wakeWindow
    ? getStatusColor(summary.wakeWindow.status, darkMode)
    : null;

  return (
    <Pressable
      onPress={handlePress}
      className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
      accessibilityRole="button"
      accessibilityLabel={`Handoff summary for ${summary.babyName}`}
      accessibilityHint="Tap for detailed handoff information"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Text className="text-xl mr-2">🤝</Text>
          <Text
            className={`text-base font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Handoff Summary
          </Text>
        </View>
        {showShareButton && (
          <View className="flex-row">
            <Pressable
              onPress={handleCopy}
              className={`p-2 rounded-lg mr-1 ${
                darkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={copySuccess ? "Copied!" : "Copy to clipboard"}
            >
              <Ionicons
                name={copySuccess ? "checkmark" : "copy-outline"}
                size={20}
                color={copySuccess ? "#10b981" : darkMode ? "#9ca3af" : "#6b7280"}
              />
            </Pressable>
            <Pressable
              onPress={handleShare}
              className={`p-2 rounded-lg ${
                darkMode ? "bg-fuchsia-600" : "bg-purple-600"
              }`}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Share handoff summary"
            >
              <Ionicons name="share-outline" size={20} color="#ffffff" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Quick Stats Row */}
      <View className="flex-row justify-between mb-3">
        {/* Last Feeding */}
        <View className="items-center flex-1">
          <Text className="text-lg mb-1">🍼</Text>
          <Text
            className={`text-sm font-medium ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {summary.lastFeeding?.timeAgoText ?? "—"}
          </Text>
          <Text
            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Fed
          </Text>
        </View>

        {/* Last Sleep */}
        <View className="items-center flex-1">
          <Text className="text-lg mb-1">😴</Text>
          <Text
            className={`text-sm font-medium ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {summary.lastSleep?.timeAgoText ?? "—"}
          </Text>
          <Text
            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Woke
          </Text>
        </View>

        {/* Last Diaper */}
        <View className="items-center flex-1">
          <Text className="text-lg mb-1">👶</Text>
          <Text
            className={`text-sm font-medium ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {summary.lastDiaper?.timeAgoText ?? "—"}
          </Text>
          <Text
            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Diaper
          </Text>
        </View>
      </View>

      {/* Wake Window Status */}
      {summary.wakeWindow && wakeWindowColors && (
        <View
          className={`p-3 rounded-lg mb-3 ${wakeWindowColors.bg}`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-sm mr-2">⏰</Text>
              <Text
                className={`text-sm font-medium ${wakeWindowColors.text}`}
              >
                Awake {formatDuration(summary.wakeWindow.currentAwakeMinutes)}
              </Text>
              <Text
                className={`text-sm ml-2 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                ({summary.wakeWindow.statusText})
              </Text>
            </View>
            {summary.wakeWindow.suggestedNextNapText && (
              <Text
                className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Nap {summary.wakeWindow.suggestedNextNapText}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Alerts */}
      {summary.alerts.length > 0 && (
        <View
          className={`p-3 rounded-lg ${
            darkMode ? "bg-amber-900/20" : "bg-amber-50"
          }`}
        >
          {summary.alerts.slice(0, 2).map((alert, index) => (
            <View
              key={index}
              className={`flex-row items-center ${index > 0 ? "mt-1" : ""}`}
            >
              <Text className="text-sm mr-2">{alert.emoji}</Text>
              <Text
                className={`text-sm flex-1 ${getAlertColor(alert.severity, darkMode)}`}
              >
                {alert.message}
              </Text>
            </View>
          ))}
          {summary.alerts.length > 2 && (
            <Text
              className={`text-xs mt-1 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              +{summary.alerts.length - 2} more
            </Text>
          )}
        </View>
      )}

      {/* View More Link */}
      <View className="flex-row items-center justify-center mt-3">
        <Text
          className={`text-sm ${
            darkMode ? "text-fuchsia-400" : "text-purple-600"
          }`}
        >
          View full handoff details
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={darkMode ? "#e879f9" : "#9333ea"}
          style={styles.chevronIcon}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  chevronIcon: {
    marginLeft: 4,
  },
});

export default HandoffCard;
