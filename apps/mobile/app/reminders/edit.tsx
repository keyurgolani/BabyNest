/**
 * Edit/Add Reminder Screen
 * Create or edit a reminder with simple UI for tired parents
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDatabaseService } from "../../src/database/DatabaseService";
import {
  scheduleIntervalReminder,
  scheduleFixedTimeReminders,
  cancelReminderNotification,
} from "../../src/services/NotificationService";
import type { LocalReminder, ReminderType } from "../../src/services/NotificationService";
import { useBabyStore, useActiveBaby } from "../../src/store";

// Reminder type options
const REMINDER_TYPES: { value: ReminderType; label: string; emoji: string }[] = [
  { value: "feeding", label: "Feeding", emoji: "🍼" },
  { value: "sleep", label: "Sleep", emoji: "😴" },
  { value: "diaper", label: "Diaper", emoji: "🧷" },
  { value: "medication", label: "Medication", emoji: "💊" },
  { value: "custom", label: "Custom", emoji: "⏰" },
];

// Common interval presets (in minutes)
const INTERVAL_PRESETS = [
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
  { label: "Custom", value: -1 },
];

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


export default function EditReminderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();

  const isEditing = !!params.id;

  // Form state
  const [type, setType] = useState<ReminderType>(
    (params.type as ReminderType) || "feeding"
  );
  const [name, setName] = useState("");
  const [useInterval, setUseInterval] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(180);
  const [customInterval, setCustomInterval] = useState("");
  const [scheduledTimes, setScheduledTimes] = useState<string[]>([]);
  const [basedOnLastEntry, setBasedOnLastEntry] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [notifyAllCaregivers, setNotifyAllCaregivers] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newTime, setNewTime] = useState("08:00");

  // Load existing reminder if editing
  const loadReminder = useCallback(async () => {
    if (!params.id || !activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const reminder = await dbInstance.getFirstAsync<LocalReminder>(
        `SELECT * FROM reminders WHERE id = ? AND babyId = ?`,
        [params.id, activeBaby.id]
      );

      if (reminder) {
        setType(reminder.type);
        setName(reminder.name);
        setBasedOnLastEntry(!!reminder.basedOnLastEntry);
        setIsEnabled(!!reminder.isEnabled);
        setNotifyAllCaregivers(!!reminder.notifyAllCaregivers);

        if (reminder.intervalMinutes) {
          setUseInterval(true);
          setIntervalMinutes(reminder.intervalMinutes);
          if (!INTERVAL_PRESETS.find((p) => p.value === reminder.intervalMinutes)) {
            setCustomInterval(String(reminder.intervalMinutes));
          }
        } else if (reminder.scheduledTimes) {
          setUseInterval(false);
          let times = reminder.scheduledTimes;
          if (typeof times === "string") {
            try {
              times = JSON.parse(times);
            } catch {
              times = [];
            }
          }
          setScheduledTimes(times as string[]);
        }
      }
    } catch (error) {
      console.error("[EditReminderScreen] Error loading reminder:", error);
      Alert.alert("Error", "Failed to load reminder.");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, activeBaby]);

  useEffect(() => {
    if (isEditing) {
      loadReminder();
    } else {
      // Set default name based on type
      const typeInfo = REMINDER_TYPES.find((t) => t.value === type);
      setName(`${typeInfo?.label || "Custom"} reminder`);
    }
  }, [isEditing, loadReminder, type]);

  // Update name when type changes (only for new reminders)
  useEffect(() => {
    if (!isEditing) {
      const typeInfo = REMINDER_TYPES.find((t) => t.value === type);
      setName(`${typeInfo?.label || "Custom"} reminder`);
    }
  }, [type, isEditing]);


  // Handle save
  const handleSave = async () => {
    if (!activeBaby) return;
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name for the reminder.");
      return;
    }

    // Validate interval or schedule
    let finalInterval: number | null = null;
    let finalSchedule: string[] | null = null;

    if (useInterval) {
      if (intervalMinutes === -1) {
        // Custom interval
        const custom = parseInt(customInterval, 10);
        if (isNaN(custom) || custom < 15) {
          Alert.alert("Error", "Please enter a valid interval (minimum 15 minutes).");
          return;
        }
        finalInterval = custom;
      } else {
        finalInterval = intervalMinutes;
      }
    } else {
      if (scheduledTimes.length === 0) {
        Alert.alert("Error", "Please add at least one scheduled time.");
        return;
      }
      finalSchedule = scheduledTimes.sort();
    }

    setIsSaving(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const now = new Date().toISOString();

      const reminderData: LocalReminder = {
        id: params.id || generateUUID(),
        babyId: activeBaby.id,
        caregiverId: "local-user",
        type,
        name: name.trim(),
        intervalMinutes: finalInterval,
        scheduledTimes: finalSchedule,
        basedOnLastEntry: useInterval ? basedOnLastEntry : false,
        isEnabled,
        notifyAllCaregivers,
        createdAt: isEditing ? now : now,
        updatedAt: now,
        isDeleted: false,
      };

      if (isEditing) {
        await dbInstance.runAsync(
          `UPDATE reminders SET type = ?, name = ?, intervalMinutes = ?, scheduledTimes = ?, basedOnLastEntry = ?, isEnabled = ?, notifyAllCaregivers = ?, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
          [
            reminderData.type,
            reminderData.name,
            reminderData.intervalMinutes,
            reminderData.scheduledTimes ? JSON.stringify(reminderData.scheduledTimes) : null,
            reminderData.basedOnLastEntry ? 1 : 0,
            reminderData.isEnabled ? 1 : 0,
            reminderData.notifyAllCaregivers ? 1 : 0,
            now,
            reminderData.id,
          ]
        );
      } else {
        await dbInstance.runAsync(
          `INSERT INTO reminders (id, babyId, caregiverId, type, name, intervalMinutes, scheduledTimes, basedOnLastEntry, isEnabled, notifyAllCaregivers, createdAt, updatedAt, isDeleted, localSyncStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reminderData.id,
            reminderData.babyId,
            reminderData.caregiverId,
            reminderData.type,
            reminderData.name,
            reminderData.intervalMinutes,
            reminderData.scheduledTimes ? JSON.stringify(reminderData.scheduledTimes) : null,
            reminderData.basedOnLastEntry ? 1 : 0,
            reminderData.isEnabled ? 1 : 0,
            reminderData.notifyAllCaregivers ? 1 : 0,
            now,
            now,
            0,
            "pending",
          ]
        );
      }

      // Schedule notifications if enabled
      if (isEnabled) {
        // Cancel existing notification first
        await cancelReminderNotification(reminderData.id);

        if (finalInterval) {
          await scheduleIntervalReminder(reminderData, undefined, activeBaby.name);
        } else if (finalSchedule) {
          await scheduleFixedTimeReminders(reminderData, activeBaby.name);
        }
      }

      router.back();
    } catch (error) {
      console.error("[EditReminderScreen] Error saving reminder:", error);
      Alert.alert("Error", "Failed to save reminder.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add scheduled time
  const handleAddTime = () => {
    if (!scheduledTimes.includes(newTime)) {
      setScheduledTimes([...scheduledTimes, newTime].sort());
    }
    setShowTimePicker(false);
  };

  // Remove scheduled time
  const handleRemoveTime = (time: string) => {
    setScheduledTimes(scheduledTimes.filter((t) => t !== time));
  };


  // No baby selected
  if (!activeBaby) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">⏰</Text>
          <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            No Baby Selected
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={darkMode ? "text-gray-400" : "text-gray-500"}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedType = REMINDER_TYPES.find((t) => t.value === type);

  return (
    <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`} edges={["bottom"]}>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Reminder Type */}
        <View className="py-4">
          <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Reminder Type
          </Text>
          <Pressable
            onPress={() => setShowTypePicker(true)}
            className={`p-4 rounded-xl flex-row items-center justify-between ${darkMode ? "bg-gray-800" : "bg-white"}`}
            style={{ minHeight: 56 }}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">{selectedType?.emoji}</Text>
              <Text className={darkMode ? "text-white" : "text-gray-900"}>{selectedType?.label}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={darkMode ? "#9ca3af" : "#6b7280"} />
          </Pressable>
        </View>

        {/* Reminder Name */}
        <View className="py-2">
          <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Reminder Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Feeding reminder"
            placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
            className={`p-4 rounded-xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
            style={{ minHeight: 48 }}
          />
        </View>

        {/* Schedule Type Toggle */}
        <View className="py-4">
          <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Schedule Type
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setUseInterval(true)}
              className={`flex-1 p-4 rounded-xl items-center ${
                useInterval
                  ? "bg-fuchsia-600"
                  : darkMode ? "bg-gray-800" : "bg-white"
              }`}
              style={{ minHeight: 56 }}
            >
              <Ionicons
                name="repeat-outline"
                size={24}
                color={useInterval ? "#ffffff" : darkMode ? "#9ca3af" : "#6b7280"}
              />
              <Text className={`mt-1 font-medium ${useInterval ? "text-white" : darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Interval
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setUseInterval(false)}
              className={`flex-1 p-4 rounded-xl items-center ${
                !useInterval
                  ? "bg-fuchsia-600"
                  : darkMode ? "bg-gray-800" : "bg-white"
              }`}
              style={{ minHeight: 56 }}
            >
              <Ionicons
                name="time-outline"
                size={24}
                color={!useInterval ? "#ffffff" : darkMode ? "#9ca3af" : "#6b7280"}
              />
              <Text className={`mt-1 font-medium ${!useInterval ? "text-white" : darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Fixed Times
              </Text>
            </Pressable>
          </View>
        </View>


        {/* Interval Settings */}
        {useInterval && (
          <View className="py-2">
            <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Remind Every
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {INTERVAL_PRESETS.map((preset) => (
                <Pressable
                  key={preset.value}
                  onPress={() => setIntervalMinutes(preset.value)}
                  className={`px-4 py-3 rounded-xl ${
                    intervalMinutes === preset.value
                      ? "bg-fuchsia-600"
                      : darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                  style={{ minHeight: 48 }}
                >
                  <Text className={intervalMinutes === preset.value ? "text-white font-semibold" : darkMode ? "text-white" : "text-gray-900"}>
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Custom interval input */}
            {intervalMinutes === -1 && (
              <View className="mt-3 flex-row items-center">
                <TextInput
                  value={customInterval}
                  onChangeText={setCustomInterval}
                  placeholder="Minutes"
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  keyboardType="number-pad"
                  className={`flex-1 p-4 rounded-xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
                  style={{ minHeight: 48 }}
                />
                <Text className={`ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>minutes</Text>
              </View>
            )}

            {/* Based on last entry toggle */}
            <View className={`mt-4 p-4 rounded-xl flex-row items-center justify-between ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <View className="flex-1 mr-4">
                <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                  Based on last entry
                </Text>
                <Text className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Start countdown after logging a {type}
                </Text>
              </View>
              <Switch
                value={basedOnLastEntry}
                onValueChange={setBasedOnLastEntry}
                trackColor={{ false: "#767577", true: darkMode ? "#c026d3" : "#9333ea" }}
                thumbColor={basedOnLastEntry ? "#ffffff" : "#f4f3f4"}
              />
            </View>
          </View>
        )}

        {/* Fixed Times Settings */}
        {!useInterval && (
          <View className="py-2">
            <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Scheduled Times
            </Text>
            
            {/* Time list */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              {scheduledTimes.map((time) => (
                <View
                  key={time}
                  className={`flex-row items-center px-3 py-2 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
                >
                  <Text className={darkMode ? "text-white" : "text-gray-900"}>{time}</Text>
                  <Pressable onPress={() => handleRemoveTime(time)} className="ml-2 p-1">
                    <Ionicons name="close-circle" size={18} color={darkMode ? "#ef4444" : "#dc2626"} />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Add time button */}
            <Pressable
              onPress={() => setShowTimePicker(true)}
              className={`p-4 rounded-xl flex-row items-center justify-center border-2 border-dashed ${
                darkMode ? "border-gray-700" : "border-gray-300"
              }`}
              style={{ minHeight: 56 }}
            >
              <Ionicons name="add-circle-outline" size={24} color={darkMode ? "#9ca3af" : "#6b7280"} />
              <Text className={`ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Add Time</Text>
            </Pressable>
          </View>
        )}


        {/* Enable Toggle */}
        <View className={`my-4 p-4 rounded-xl flex-row items-center justify-between ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <View className="flex-1 mr-4">
            <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
              Enabled
            </Text>
            <Text className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Turn on to receive notifications
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={setIsEnabled}
            trackColor={{ false: "#767577", true: darkMode ? "#c026d3" : "#9333ea" }}
            thumbColor={isEnabled ? "#ffffff" : "#f4f3f4"}
          />
        </View>

        {/* Save Button */}
        <View className="py-4">
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className={`p-4 rounded-xl items-center ${
              isSaving ? "bg-gray-500" : "bg-fuchsia-600 active:bg-fuchsia-700"
            }`}
            style={{ minHeight: 56 }}
          >
            <Text className="text-white font-semibold text-lg">
              {isSaving ? "Saving..." : isEditing ? "Update Reminder" : "Create Reminder"}
            </Text>
          </Pressable>
        </View>

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>

      {/* Type Picker Modal */}
      <Modal visible={showTypePicker} animationType="slide" transparent onRequestClose={() => setShowTypePicker(false)}>
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowTypePicker(false)} />
          <View className={`rounded-t-3xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Select Reminder Type
            </Text>
            {REMINDER_TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => { setType(t.value); setShowTypePicker(false); }}
                className={`p-4 rounded-xl mb-2 flex-row items-center ${
                  type === t.value ? "bg-fuchsia-600" : darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
                style={{ minHeight: 56 }}
              >
                <Text className="text-2xl mr-3">{t.emoji}</Text>
                <Text className={type === t.value ? "text-white font-semibold" : darkMode ? "text-white" : "text-gray-900"}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} animationType="slide" transparent onRequestClose={() => setShowTimePicker(false)}>
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowTimePicker(false)} />
          <View className={`rounded-t-3xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Add Scheduled Time
            </Text>
            <TextInput
              value={newTime}
              onChangeText={setNewTime}
              placeholder="HH:MM (24-hour)"
              placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
              className={`p-4 rounded-xl mb-4 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
              style={{ minHeight: 48 }}
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowTimePicker(false)}
                className={`flex-1 p-4 rounded-xl items-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                style={{ minHeight: 56 }}
              >
                <Text className={darkMode ? "text-gray-300" : "text-gray-700"}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddTime}
                className="flex-1 p-4 rounded-xl items-center bg-fuchsia-600"
                style={{ minHeight: 56 }}
              >
                <Text className="text-white font-semibold">Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
