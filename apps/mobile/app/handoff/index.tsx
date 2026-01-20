/**
 * Handoff Screen
 * Full-featured caregiver handoff screen with detailed information,
 * custom notes, activity timeline, and sharing options
 */

import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Share,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHaptics } from "../../src/hooks";
import {
  getHandoffSummaryService,
  type HandoffSummary,
  type LastActivitySummary,
  type HandoffAlert,
} from "../../src/services/HandoffSummaryService";
import { formatDuration } from "../../src/services/SleepPredictionService";
import { useActiveBaby, useBabyStore } from "../../src/store";

type IoniconsName = keyof typeof Ionicons.glyphMap;

/**
 * Get status color based on wake window status
 */
function getStatusColor(
  status: "well-rested" | "approaching-tired" | "overtired",
  darkMode: boolean
): { bg: string; text: string; icon: IoniconsName } {
  switch (status) {
    case "well-rested":
      return {
        bg: darkMode ? "bg-green-900/30" : "bg-green-50",
        text: darkMode ? "text-green-400" : "text-green-700",
        icon: "happy-outline",
      };
    case "approaching-tired":
      return {
        bg: darkMode ? "bg-yellow-900/30" : "bg-yellow-50",
        text: darkMode ? "text-yellow-400" : "text-yellow-700",
        icon: "time-outline",
      };
    case "overtired":
      return {
        bg: darkMode ? "bg-red-900/30" : "bg-red-50",
        text: darkMode ? "text-red-400" : "text-red-700",
        icon: "alert-circle-outline",
      };
  }
}

/**
 * Get alert severity color
 */
function getAlertBgColor(
  severity: "info" | "warning" | "urgent",
  darkMode: boolean
): string {
  switch (severity) {
    case "info":
      return darkMode ? "bg-blue-900/30" : "bg-blue-50";
    case "warning":
      return darkMode ? "bg-amber-900/30" : "bg-amber-50";
    case "urgent":
      return darkMode ? "bg-red-900/30" : "bg-red-50";
  }
}

function getAlertTextColor(
  severity: "info" | "warning" | "urgent",
  darkMode: boolean
): string {
  switch (severity) {
    case "info":
      return darkMode ? "text-blue-400" : "text-blue-700";
    case "warning":
      return darkMode ? "text-amber-400" : "text-amber-700";
    case "urgent":
      return darkMode ? "text-red-400" : "text-red-700";
  }
}

/**
 * Activity Timeline Item Component
 */
function TimelineItem({
  activity,
  darkMode,
}: {
  activity: LastActivitySummary;
  darkMode: boolean;
}) {
  return (
    <View className="flex-row items-start mb-3">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
          darkMode ? "bg-gray-700" : "bg-gray-100"
        }`}
      >
        <Text className="text-lg">{activity.emoji}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className={`font-medium capitalize ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {activity.type}
          </Text>
          <Text
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            {activity.timeAgoText}
          </Text>
        </View>
        <Text
          className={`text-sm mt-0.5 ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {activity.details}
        </Text>
        <Text
          className={`text-xs mt-0.5 ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {activity.timestamp.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

/**
 * Alert Card Component
 */
function AlertCard({
  alert,
  darkMode,
}: {
  alert: HandoffAlert;
  darkMode: boolean;
}) {
  return (
    <View
      className={`p-3 rounded-lg mb-2 ${getAlertBgColor(alert.severity, darkMode)}`}
    >
      <View className="flex-row items-center">
        <Text className="text-lg mr-2">{alert.emoji}</Text>
        <Text
          className={`flex-1 text-sm font-medium ${getAlertTextColor(
            alert.severity,
            darkMode
          )}`}
        >
          {alert.message}
        </Text>
      </View>
    </View>
  );
}

/**
 * Quick Tip Component
 */
function QuickTip({ tip, darkMode }: { tip: string; darkMode: boolean }) {
  return (
    <View className="flex-row items-start mb-2">
      <Ionicons
        name="bulb-outline"
        size={16}
        color={darkMode ? "#fbbf24" : "#f59e0b"}
        style={styles.tipIcon}
      />
      <Text
        className={`flex-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
      >
        {tip}
      </Text>
    </View>
  );
}

export default function HandoffScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const { successHaptic, lightHaptic } = useHaptics();

  const [summary, setSummary] = useState<HandoffSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customNotes, setCustomNotes] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [quickTips, setQuickTips] = useState<string[]>([]);

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
        8
      );
      setSummary(newSummary);
      setQuickTips(service.getQuickTips(newSummary));
    } catch (error) {
      console.error("[HandoffScreen] Error loading summary:", error);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(loadSummary, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadSummary]);

  /**
   * Handle share
   */
  const handleShare = async () => {
    if (!summary) return;

    lightHaptic();
    const service = getHandoffSummaryService();
    const shareText = service.generateShareableText(summary, customNotes);

    try {
      await Share.share({
        message: shareText,
        title: `Handoff for ${summary.babyName}`,
      });
      successHaptic();
    } catch (error) {
      console.error("[HandoffScreen] Error sharing:", error);
    }
  };

  /**
   * Handle copy to clipboard
   */
  const handleCopy = async () => {
    if (!summary) return;

    lightHaptic();
    const service = getHandoffSummaryService();
    const shareText = service.generateShareableText(summary, customNotes);

    try {
      await Clipboard.setStringAsync(shareText);
      setCopySuccess(true);
      successHaptic();
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("[HandoffScreen] Error copying:", error);
    }
  };

  // No baby selected state
  if (!activeBaby) {
    return (
      <SafeAreaView
        className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">🤝</Text>
          <Text
            className={`text-xl font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            No Baby Selected
          </Text>
          <Text
            className={`text-center mt-2 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Please select or add a baby profile to create a handoff summary.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView
        className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <View className="flex-1 items-center justify-center">
          <Text
            className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Loading handoff summary...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // No summary state
  if (!summary) {
    return (
      <SafeAreaView
        className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">📝</Text>
          <Text
            className={`text-xl font-semibold text-center ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            No Data Available
          </Text>
          <Text
            className={`text-center mt-2 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Start logging activities to generate a handoff summary.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const wakeWindowColors = summary.wakeWindow
    ? getStatusColor(summary.wakeWindow.status, darkMode)
    : null;

  // Build timeline from activities
  const timeline: LastActivitySummary[] = [];
  if (summary.lastFeeding) timeline.push(summary.lastFeeding);
  if (summary.lastSleep) timeline.push(summary.lastSleep);
  if (summary.lastDiaper) timeline.push(summary.lastDiaper);
  timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <SafeAreaView
      className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with baby name and time */}
          <View className="px-4 pt-4 pb-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {summary.babyName}
                </Text>
                <Text
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {summary.generatedAt.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  at{" "}
                  {summary.generatedAt.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <Pressable
                onPress={loadSummary}
                className={`p-2 rounded-lg ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
                style={styles.refreshButton}
                accessibilityRole="button"
                accessibilityLabel="Refresh summary"
              >
                <Ionicons
                  name="refresh-outline"
                  size={24}
                  color={darkMode ? "#9ca3af" : "#6b7280"}
                />
              </Pressable>
            </View>
          </View>

          {/* Wake Window Status Card */}
          {summary.wakeWindow && wakeWindowColors && (
            <View className="px-4 py-2">
              <View
                className={`p-4 rounded-xl ${wakeWindowColors.bg}`}
              >
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name={wakeWindowColors.icon}
                    size={24}
                    color={darkMode ? "#ffffff" : "#1f2937"}
                  />
                  <Text
                    className={`text-lg font-semibold ml-2 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Wake Window
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text
                      className={`text-3xl font-bold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {formatDuration(summary.wakeWindow.currentAwakeMinutes)}
                    </Text>
                    <Text className={`text-sm ${wakeWindowColors.text}`}>
                      {summary.wakeWindow.statusText}
                    </Text>
                  </View>
                  {summary.wakeWindow.suggestedNextNapText && (
                    <View className="items-end">
                      <Text
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Next nap suggested
                      </Text>
                      <Text
                        className={`text-lg font-semibold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {summary.wakeWindow.suggestedNextNapText}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Alerts Section */}
          {summary.alerts.length > 0 && (
            <View className="px-4 py-2">
              <Text
                className={`text-lg font-semibold mb-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                ⚠️ Heads Up
              </Text>
              {summary.alerts.map((alert, index) => (
                <AlertCard key={index} alert={alert} darkMode={darkMode} />
              ))}
            </View>
          )}

          {/* Activity Timeline */}
          <View className="px-4 py-2">
            <Text
              className={`text-lg font-semibold mb-3 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              📋 Recent Activities
            </Text>
            <View
              className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
              {timeline.length > 0 ? (
                timeline.map((activity, index) => (
                  <TimelineItem
                    key={`${activity.type}-${index}`}
                    activity={activity}
                    darkMode={darkMode}
                  />
                ))
              ) : (
                <Text
                  className={`text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No recent activities logged
                </Text>
              )}
            </View>
          </View>

          {/* Daily Summary */}
          <View className="px-4 py-2">
            <Text
              className={`text-lg font-semibold mb-3 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              📊 Today's Summary
            </Text>
            <View
              className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <View className="flex-row justify-between mb-3">
                <View className="items-center flex-1">
                  <Text className="text-2xl mb-1">🍼</Text>
                  <Text
                    className={`text-lg font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {summary.dailyTotals.feedingCount}
                  </Text>
                  <Text
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Feedings
                  </Text>
                  {summary.dailyTotals.totalFeedingMl > 0 && (
                    <Text
                      className={`text-[10px] ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {summary.dailyTotals.totalFeedingMl}ml
                    </Text>
                  )}
                </View>
                <View className="items-center flex-1">
                  <Text className="text-2xl mb-1">😴</Text>
                  <Text
                    className={`text-lg font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {formatDuration(summary.dailyTotals.totalSleepMinutes)}
                  </Text>
                  <Text
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Sleep
                  </Text>
                  {summary.dailyTotals.napCount > 0 && (
                    <Text
                      className={`text-[10px] ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {summary.dailyTotals.napCount} nap
                      {summary.dailyTotals.napCount !== 1 ? "s" : ""}
                    </Text>
                  )}
                </View>
                <View className="items-center flex-1">
                  <Text className="text-2xl mb-1">👶</Text>
                  <Text
                    className={`text-lg font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {summary.dailyTotals.diaperCount}
                  </Text>
                  <Text
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Diapers
                  </Text>
                  <Text
                    className={`text-[10px] ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    💧{summary.dailyTotals.wetDiaperCount} 💩
                    {summary.dailyTotals.dirtyDiaperCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Tips */}
          {quickTips.length > 0 && (
            <View className="px-4 py-2">
              <Text
                className={`text-lg font-semibold mb-3 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                💡 Quick Tips
              </Text>
              <View
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-amber-900/20" : "bg-amber-50"
                }`}
              >
                {quickTips.map((tip, index) => (
                  <QuickTip key={index} tip={tip} darkMode={darkMode} />
                ))}
              </View>
            </View>
          )}

          {/* Custom Notes */}
          <View className="px-4 py-2">
            <Text
              className={`text-lg font-semibold mb-3 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              💬 Notes for Next Caregiver
            </Text>
            <View
              className={`rounded-xl overflow-hidden ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <TextInput
                value={customNotes}
                onChangeText={setCustomNotes}
                placeholder="Add any notes for the next caregiver..."
                placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={`p-4 text-base ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
                style={styles.notesInput}
                accessibilityLabel="Notes for next caregiver"
                accessibilityHint="Enter any additional notes to include in the handoff"
              />
            </View>
          </View>

          {/* Bottom padding */}
          <View className="h-32" />
        </ScrollView>

        {/* Fixed Share Buttons */}
        <View
          className={`absolute bottom-0 left-0 right-0 p-4 ${
            darkMode ? "bg-gray-900" : "bg-gray-50"
          }`}
          style={styles.bottomBar}
        >
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleCopy}
              className={`flex-1 flex-row items-center justify-center py-4 rounded-xl ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
              style={styles.minHeight56}
              accessibilityRole="button"
              accessibilityLabel={copySuccess ? "Copied to clipboard" : "Copy to clipboard"}
            >
              <Ionicons
                name={copySuccess ? "checkmark-circle" : "copy-outline"}
                size={20}
                color={copySuccess ? "#10b981" : darkMode ? "#9ca3af" : "#6b7280"}
              />
              <Text
                className={`ml-2 font-medium ${
                  copySuccess
                    ? "text-green-500"
                    : darkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              >
                {copySuccess ? "Copied!" : "Copy"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              className={`flex-1 flex-row items-center justify-center py-4 rounded-xl ${
                darkMode ? "bg-fuchsia-600" : "bg-purple-600"
              }`}
              style={styles.minHeight56}
              accessibilityRole="button"
              accessibilityLabel="Share handoff summary"
            >
              <Ionicons name="share-outline" size={20} color="#ffffff" />
              <Text className="ml-2 font-medium text-white">Share</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  minHeight56: {
    minHeight: 56,
  },
  refreshButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  notesInput: {
    minHeight: 100,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
});
