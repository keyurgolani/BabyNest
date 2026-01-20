/**
 * Reminders Screen
 * List and manage reminders for feeding, sleep, diaper, etc.
 * Simple UI for tired parents!
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDatabaseService } from "../../src/database/DatabaseService";
import {
  cancelReminderNotification,
  scheduleIntervalReminder,
  scheduleFixedTimeReminders,
  requestNotificationPermissions,
  hasNotificationPermissions,
} from "../../src/services/NotificationService";
import type { LocalReminder, ReminderType } from "../../src/services/NotificationService";
import { useBabyStore, useActiveBaby } from "../../src/store";

// Reminder type display info
const REMINDER_TYPE_INFO: Record<ReminderType, { emoji: string; label: string; color: string }> = {
  feeding: { emoji: "🍼", label: "Feeding", color: "bg-amber-100 dark:bg-amber-900/50" },
  sleep: { emoji: "😴", label: "Sleep", color: "bg-blue-100 dark:bg-blue-900/50" },
  diaper: { emoji: "🧷", label: "Diaper", color: "bg-green-100 dark:bg-green-900/50" },
  medication: { emoji: "💊", label: "Medication", color: "bg-purple-100 dark:bg-purple-900/50" },
  custom: { emoji: "⏰", label: "Custom", color: "bg-gray-100 dark:bg-gray-700" },
};

/**
 * Generate a UUID v4
 */
function _generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format interval for display
 */
function formatInterval(minutes: number): string {
  if (minutes < 60) {
    return `Every ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `Every ${hours} hr${hours > 1 ? "s" : ""}`;
  }
  return `Every ${hours}h ${remainingMinutes}m`;
}

/**
 * Format scheduled times for display
 */
function formatScheduledTimes(times: string[] | null): string {
  if (!times || times.length === 0) return "";
  
  // Parse times if it's a string (from SQLite JSON)
  let parsedTimes = times;
  if (typeof times === 'string') {
    try {
      parsedTimes = JSON.parse(times);
    } catch {
      return "";
    }
  }
  
  if (parsedTimes.length <= 3) {
    return parsedTimes.join(", ");
  }
  return `${parsedTimes.slice(0, 2).join(", ")} +${parsedTimes.length - 2} more`;
}

interface ReminderCardProps {
  reminder: LocalReminder;
  darkMode: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onPress: () => void;
  onDelete: () => void;
}

/**
 * Reminder card component
 */
function ReminderCard({ reminder, darkMode, onToggle, onPress, onDelete }: ReminderCardProps) {
  const typeInfo = REMINDER_TYPE_INFO[reminder.type];
  
  // Parse scheduled times if needed
  let scheduledTimes = reminder.scheduledTimes;
  if (typeof scheduledTimes === 'string') {
    try {
      scheduledTimes = JSON.parse(scheduledTimes);
    } catch {
      scheduledTimes = null;
    }
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDelete}
      className={`p-4 rounded-xl mb-3 ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}
      style={styles.minHeight80}
      accessibilityRole="button"
      accessibilityLabel={`${reminder.name} reminder`}
    >
      <View className="flex-row items-center">
        {/* Icon */}
        <View
          className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
            darkMode ? typeInfo.color.replace("bg-", "bg-").replace("-100", "-900/50") : typeInfo.color
          }`}
        >
          <Text className="text-2xl">{typeInfo.emoji}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className={`font-semibold text-base ${
              darkMode ? "text-white" : "text-gray-900"
            } ${!reminder.isEnabled ? "opacity-50" : ""}`}
          >
            {reminder.name}
          </Text>
          <Text
            className={`text-sm mt-0.5 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            } ${!reminder.isEnabled ? "opacity-50" : ""}`}
          >
            {reminder.intervalMinutes
              ? formatInterval(reminder.intervalMinutes)
              : formatScheduledTimes(scheduledTimes)}
            {reminder.basedOnLastEntry && " • After last entry"}
          </Text>
        </View>

        {/* Toggle */}
        <Switch
          value={reminder.isEnabled}
          onValueChange={(value) => onToggle(reminder.id, value)}
          trackColor={{ false: "#767577", true: darkMode ? "#c026d3" : "#9333ea" }}
          thumbColor={reminder.isEnabled ? "#ffffff" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
        />
      </View>
    </Pressable>
  );
}

export default function RemindersScreen() {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();

  // State
  const [reminders, setReminders] = useState<LocalReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  // Check notification permissions
  const checkPermissions = useCallback(async () => {
    const granted = await hasNotificationPermissions();
    setHasPermissions(granted);
  }, []);

  // Request notification permissions
  const handleRequestPermissions = async () => {
    const granted = await requestNotificationPermissions();
    setHasPermissions(granted);
    if (!granted) {
      Alert.alert(
        "Permissions Required",
        "Please enable notifications in your device settings to receive reminders.",
      );
    }
  };

  // Load reminders from database
  const loadReminders = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const entries = await dbInstance.getAllAsync<LocalReminder>(
        `SELECT * FROM reminders WHERE babyId = ? AND isDeleted = 0 ORDER BY createdAt DESC`,
        [activeBaby.id]
      );
      setReminders(entries);
    } catch (error) {
      console.error("[RemindersScreen] Error loading reminders:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    checkPermissions();
    loadReminders();
  }, [checkPermissions, loadReminders]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReminders();
  }, [loadReminders]);

  // Toggle reminder enabled state
  const handleToggleReminder = async (id: string, enabled: boolean) => {
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const now = new Date().toISOString();

      await dbInstance.runAsync(
        `UPDATE reminders SET isEnabled = ?, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
        [enabled ? 1 : 0, now, id]
      );

      // Update local state
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isEnabled: enabled } : r))
      );

      // Update notifications
      const reminder = reminders.find((r) => r.id === id);
      if (reminder) {
        if (enabled) {
          // Schedule notification
          if (reminder.intervalMinutes) {
            await scheduleIntervalReminder(
              { ...reminder, isEnabled: true },
              undefined,
              activeBaby?.name
            );
          } else if (reminder.scheduledTimes) {
            await scheduleFixedTimeReminders(
              { ...reminder, isEnabled: true },
              activeBaby?.name
            );
          }
        } else {
          // Cancel notification
          await cancelReminderNotification(id);
        }
      }
    } catch (error) {
      console.error("[RemindersScreen] Error toggling reminder:", error);
      Alert.alert("Error", "Failed to update reminder.");
    }
  };

  // Delete reminder
  const handleDeleteReminder = (reminder: LocalReminder) => {
    Alert.alert(
      "Delete Reminder",
      `Are you sure you want to delete "${reminder.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const db = getDatabaseService();
              await db.initialize();
              const dbInstance = await db["getDb"]();
              const now = new Date().toISOString();

              await dbInstance.runAsync(
                `UPDATE reminders SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
                [now, reminder.id]
              );

              // Cancel notification
              await cancelReminderNotification(reminder.id);

              // Update local state
              setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
            } catch (error) {
              console.error("[RemindersScreen] Error deleting reminder:", error);
              Alert.alert("Error", "Failed to delete reminder.");
            }
          },
        },
      ]
    );
  };

  // No baby selected state
  if (!activeBaby) {
    return (
      <SafeAreaView
        className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">⏰</Text>
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
            Please select or add a baby profile to set up reminders.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      edges={["bottom"]}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Reminders
          </Text>
          <Text
            className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Never miss a feeding or diaper change
          </Text>
        </View>

        {/* Notification Permission Banner */}
        {!hasPermissions && (
          <View className="px-4 py-3">
            <Pressable
              onPress={handleRequestPermissions}
              className={`p-4 rounded-xl flex-row items-center ${
                darkMode ? "bg-amber-900/30" : "bg-amber-50"
              }`}
            >
              <Ionicons
                name="notifications-off-outline"
                size={24}
                color={darkMode ? "#fbbf24" : "#d97706"}
              />
              <View className="flex-1 ml-3">
                <Text
                  className={`font-semibold ${
                    darkMode ? "text-amber-300" : "text-amber-700"
                  }`}
                >
                  Enable Notifications
                </Text>
                <Text
                  className={`text-sm ${
                    darkMode ? "text-amber-200" : "text-amber-600"
                  }`}
                >
                  Tap to allow reminders to notify you
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={darkMode ? "#fbbf24" : "#d97706"}
              />
            </Pressable>
          </View>
        )}

        {/* Add Reminder Button */}
        <View className="px-4 py-3">
          <Pressable
            onPress={() => router.push("/reminders/edit")}
            className="bg-fuchsia-600 active:bg-fuchsia-700 p-4 rounded-xl flex-row items-center justify-center"
            style={styles.minHeight56}
          >
            <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">
              Add Reminder
            </Text>
          </Pressable>
        </View>

        {/* Quick Add Buttons */}
        <View className="px-4 py-2">
          <Text
            className={`text-sm font-medium mb-2 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Quick Add
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {(["feeding", "sleep", "diaper", "medication"] as ReminderType[]).map((type) => {
              const info = REMINDER_TYPE_INFO[type];
              return (
                <Pressable
                  key={type}
                  onPress={() => router.push(`/reminders/edit?type=${type}`)}
                  className={`mr-2 px-4 py-3 rounded-xl flex-row items-center ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                  style={styles.minHeight48}
                >
                  <Text className="text-lg mr-2">{info.emoji}</Text>
                  <Text
                    className={`font-medium ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {info.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Reminders List */}
        <View className="px-4 py-3">
          <Text
            className={`text-lg font-semibold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Active Reminders
          </Text>

          {isLoading ? (
            <View
              className={`p-4 rounded-xl ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <Text
                className={`text-center ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Loading...
              </Text>
            </View>
          ) : reminders.length === 0 ? (
            <View
              className={`p-6 rounded-xl items-center ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <Text className="text-4xl mb-2">⏰</Text>
              <Text
                className={`text-center ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No reminders set up yet.{"\n"}Tap the button above to add one.
              </Text>
            </View>
          ) : (
            reminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                darkMode={darkMode}
                onToggle={handleToggleReminder}
                onPress={() => router.push(`/reminders/edit?id=${reminder.id}`)}
                onDelete={() => handleDeleteReminder(reminder)}
              />
            ))
          )}
        </View>

        {/* Tips */}
        <View className="px-4 py-3">
          <View
            className={`p-4 rounded-xl ${
              darkMode ? "bg-fuchsia-900/30" : "bg-fuchsia-50"
            }`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="bulb-outline"
                size={20}
                color={darkMode ? "#e879f9" : "#c026d3"}
              />
              <Text
                className={`font-semibold ml-2 ${
                  darkMode ? "text-fuchsia-300" : "text-fuchsia-700"
                }`}
              >
                Tip for Tired Parents
              </Text>
            </View>
            <Text
              className={`text-sm ${
                darkMode ? "text-fuchsia-200" : "text-fuchsia-600"
              }`}
            >
              Set up "based on last entry" reminders to automatically adjust
              notification times when you log feedings or diaper changes.
            </Text>
          </View>
        </View>

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  minHeight48: {
    minHeight: 48,
  },
  minHeight56: {
    minHeight: 56,
  },
  minHeight80: {
    minHeight: 80,
  },
});
