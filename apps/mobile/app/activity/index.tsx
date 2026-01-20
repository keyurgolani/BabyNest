/**
 * Activity Screen
 * Track tummy time, bath, outdoor, and play activities
 * Validates: Requirements 9.1, 9.2, 9.3, 14.1, 14.7
 */

import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDatabaseService } from "../../src/database/DatabaseService";
import type { LocalActivityEntry, ActivityType } from "../../src/database/types";
import { useHaptics } from "../../src/hooks";
import { useBabyStore, useActiveBaby, useActiveTimer } from "../../src/store";

// Activity type options
const ACTIVITY_TYPES: { key: ActivityType; label: string; icon: string; description: string; hasTimer: boolean }[] = [
  { key: "tummyTime", label: "Tummy Time", icon: "👶", description: "Strengthen muscles", hasTimer: true },
  { key: "bath", label: "Bath", icon: "🛁", description: "Bath time", hasTimer: false },
  { key: "outdoor", label: "Outdoor", icon: "🌳", description: "Outside activities", hasTimer: true },
  { key: "play", label: "Play", icon: "🎮", description: "Play time", hasTimer: true },
];

export default function ActivityScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const startTimer = useBabyStore((state) => state.startTimer);
  const stopTimer = useBabyStore((state) => state.stopTimer);
  const tummyTimeTimer = useActiveTimer("tummyTime");
  const { successHaptic, mediumHaptic } = useHaptics();

  // State
  const [selectedType, setSelectedType] = useState<ActivityType>("tummyTime");
  const [recentActivities, setRecentActivities] = useState<LocalActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Form state for non-timer activities
  const [manualDuration, setManualDuration] = useState("");
  const [notes, setNotes] = useState("");

  // Load recent activities
  const loadRecentActivities = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const activities = await db.getActivityEntries(activeBaby.id, 10);
      setRecentActivities(activities);
    } catch (error) {
      console.error("[ActivityScreen] Error loading activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadRecentActivities();
  }, [loadRecentActivities]);

  // Timer effect for tummy time (and other timed activities)
  useEffect(() => {
    if (tummyTimeTimer && !tummyTimeTimer.isPaused) {
      timerIntervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - tummyTimeTimer.startTime.getTime()) / 1000 -
            tummyTimeTimer.pausedDuration
        );
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [tummyTimeTimer]);

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format duration in minutes for display
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Start tummy time timer
  // Validates: Requirements 9.1 (start timer and record session)
  // Validates: Requirements 14.7 (haptic feedback)
  const handleStartTimer = () => {
    startTimer("tummyTime", { notes: selectedType });
    setElapsedTime(0);
    mediumHaptic(); // Haptic feedback for timer start
  };

  // Stop timer and save activity
  // Validates: Requirements 14.7 (haptic feedback for successful actions)
  const handleStopTimer = async () => {
    if (!tummyTimeTimer || !activeBaby) return;

    const timerResult = stopTimer("tummyTime");
    if (!timerResult) return;

    setIsSaving(true);

    try {
      const db = getDatabaseService();
      await db.initialize();

      const durationMinutes = Math.floor(timerResult.totalDuration / 60);

      await db.createActivityEntry({
        babyId: activeBaby.id,
        caregiverId: "local-user", // TODO: Get from auth store
        timestamp: timerResult.startTime.toISOString(),
        activityType: selectedType,
        duration: durationMinutes,
        notes: notes.trim() || null,
      });

      // Reset state
      setNotes("");
      setElapsedTime(0);
      await loadRecentActivities();

      successHaptic(); // Haptic feedback for successful save
      Alert.alert("Saved", `${getActivityLabel(selectedType)} saved! Duration: ${formatDuration(durationMinutes)}`);
    } catch (error) {
      console.error("[ActivityScreen] Error saving activity:", error);
      Alert.alert("Error", "Failed to save activity.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save activity without timer (bath, or manual entry)
  // Validates: Requirements 9.2 (record bath time with optional notes)
  // Validates: Requirements 9.3 (record outdoor time and play activities)
  // Validates: Requirements 14.7 (haptic feedback for successful actions)
  const handleSaveActivity = async () => {
    if (!activeBaby) return;

    const duration = manualDuration ? parseInt(manualDuration, 10) : null;
    
    if (selectedType !== "bath" && (!duration || duration <= 0)) {
      Alert.alert("Invalid Duration", "Please enter a valid duration in minutes.");
      return;
    }

    setIsSaving(true);

    try {
      const db = getDatabaseService();
      await db.initialize();

      await db.createActivityEntry({
        babyId: activeBaby.id,
        caregiverId: "local-user", // TODO: Get from auth store
        timestamp: new Date().toISOString(),
        activityType: selectedType,
        duration: duration,
        notes: notes.trim() || null,
      });

      // Reset state
      setNotes("");
      setManualDuration("");
      await loadRecentActivities();

      successHaptic(); // Haptic feedback for successful save
      Alert.alert("Saved", `${getActivityLabel(selectedType)} logged successfully!`);
    } catch (error) {
      console.error("[ActivityScreen] Error saving activity:", error);
      Alert.alert("Error", "Failed to save activity.");
    } finally {
      setIsSaving(false);
    }
  };

  // Get activity label
  const getActivityLabel = (type: ActivityType): string => {
    const activity = ACTIVITY_TYPES.find((a) => a.key === type);
    return activity?.label || type;
  };

  // Get activity icon
  const getActivityIcon = (type: ActivityType): string => {
    const activity = ACTIVITY_TYPES.find((a) => a.key === type);
    return activity?.icon || "🎯";
  };

  // Check if current activity type has timer
  const currentActivityHasTimer = ACTIVITY_TYPES.find((a) => a.key === selectedType)?.hasTimer ?? false;

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // No baby selected state
  if (!activeBaby) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">🎯</Text>
          <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            No Baby Selected
          </Text>
          <Text className={`text-center mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Please select or add a baby profile to start tracking activities.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Activities
          </Text>
          <Text className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Track {activeBaby.name}'s activities
          </Text>
        </View>

        {/* Activity Type Tabs */}
        {/* Validates: Requirements 14.1 (48x48dp minimum touch targets) */}
        <View className="px-4 py-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {ACTIVITY_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  onPress={() => {
                    // Don't allow switching while timer is running
                    if (tummyTimeTimer) {
                      Alert.alert("Timer Running", "Please stop the current timer before switching activities.");
                      return;
                    }
                    setSelectedType(type.key);
                    setManualDuration("");
                    setNotes("");
                  }}
                  className={`px-4 py-3 rounded-xl flex-row items-center ${
                    selectedType === type.key
                      ? "bg-emerald-600"
                      : darkMode
                      ? "bg-gray-800"
                      : "bg-white"
                  }`}
                  style={{ minHeight: 48, minWidth: 48 }}
                  accessibilityRole="tab"
                  accessibilityLabel={`${type.label} activity`}
                  accessibilityState={{ selected: selectedType === type.key }}
                  accessibilityHint={`Tap to switch to ${type.label.toLowerCase()} tracking`}
                >
                  <Text className="text-lg mr-2">{type.icon}</Text>
                  <Text
                    className={`font-medium ${
                      selectedType === type.key
                        ? "text-white"
                        : darkMode
                        ? "text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Activity Form */}
        <View className="px-4 py-2">
          {currentActivityHasTimer && !tummyTimeTimer ? (
            // Timer start state
            <TimerStartForm
              darkMode={darkMode}
              activityType={selectedType}
              onStartTimer={handleStartTimer}
            />
          ) : currentActivityHasTimer && tummyTimeTimer ? (
            // Timer running state
            <TimerRunningForm
              darkMode={darkMode}
              activityType={selectedType}
              elapsedTime={elapsedTime}
              notes={notes}
              isSaving={isSaving}
              onNotesChange={setNotes}
              onStopTimer={handleStopTimer}
              formatTime={formatTime}
            />
          ) : (
            // Manual entry form (for bath and other non-timer activities)
            <ManualEntryForm
              darkMode={darkMode}
              activityType={selectedType}
              duration={manualDuration}
              notes={notes}
              isSaving={isSaving}
              onDurationChange={setManualDuration}
              onNotesChange={setNotes}
              onSave={handleSaveActivity}
            />
          )}
        </View>

        {/* Recent Activities */}
        <View className="px-4 py-4">
          <Text className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Recent Activities
          </Text>

          {isLoading ? (
            <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Loading...
              </Text>
            </View>
          ) : recentActivities.length === 0 ? (
            <View className={`p-6 rounded-xl items-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className="text-3xl mb-2">📝</Text>
              <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No activity entries yet
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {recentActivities.map((entry) => (
                <View
                  key={entry.id}
                  className={`flex-row items-center p-4 rounded-xl ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      darkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <Text className="text-xl">{getActivityIcon(entry.activityType)}</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {getActivityLabel(entry.activityType)}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      {entry.duration && (
                        <>
                          <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {formatDuration(entry.duration)}
                          </Text>
                          <Text className={`text-sm mx-2 ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
                            •
                          </Text>
                        </>
                      )}
                      <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatTimestamp(entry.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}


/**
 * Timer Start Form Component
 * Shows button to start activity timer
 * Validates: Requirements 9.1, 14.1
 */
function TimerStartForm({
  darkMode,
  activityType,
  onStartTimer,
}: {
  darkMode: boolean;
  activityType: ActivityType;
  onStartTimer: () => void;
}) {
  const activity = ACTIVITY_TYPES.find((a) => a.key === activityType);

  return (
    <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <View className="items-center mb-4">
        <Text className="text-5xl mb-2">{activity?.icon || "🎯"}</Text>
        <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
          {activity?.label || "Activity"}
        </Text>
        <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {activity?.description || "Track activity"}
        </Text>
      </View>

      {/* Start Timer Button - 48x48dp minimum */}
      <Pressable
        onPress={onStartTimer}
        className="p-4 rounded-xl items-center bg-emerald-600 active:bg-emerald-700"
        style={{ minHeight: 56 }}
        accessibilityRole="button"
        accessibilityLabel={`Start ${activity?.label || "activity"} timer`}
        accessibilityHint={`Tap to start tracking ${activity?.label?.toLowerCase() || "activity"}`}
      >
        <View className="flex-row items-center">
          <Ionicons name="play" size={24} color="#ffffff" />
          <Text className="font-semibold text-white ml-2">
            Start {activity?.label || "Timer"}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}


/**
 * Timer Running Form Component
 * Shows active timer with stop button
 * Validates: Requirements 9.1, 14.1
 */
function TimerRunningForm({
  darkMode,
  activityType,
  elapsedTime,
  notes,
  isSaving,
  onNotesChange,
  onStopTimer,
  formatTime,
}: {
  darkMode: boolean;
  activityType: ActivityType;
  elapsedTime: number;
  notes: string;
  isSaving: boolean;
  onNotesChange: (notes: string) => void;
  onStopTimer: () => void;
  formatTime: (seconds: number) => string;
}) {
  const activity = ACTIVITY_TYPES.find((a) => a.key === activityType);

  return (
    <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Timer Display */}
      <View className="items-center mb-6">
        <View className="flex-row items-center mb-2">
          <Text className="text-3xl mr-2">{activity?.icon || "🎯"}</Text>
          <Text className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {activity?.label || "Activity"} in progress
          </Text>
        </View>
        <Text className="text-5xl font-bold text-emerald-600">
          {formatTime(elapsedTime)}
        </Text>
      </View>

      {/* Notes Input */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Notes (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Add notes about the activity..."
          placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
          multiline
          numberOfLines={3}
          className={`p-4 rounded-xl ${
            darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
          }`}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />
      </View>

      {/* Stop Button - 48x48dp minimum */}
      <Pressable
        onPress={onStopTimer}
        disabled={isSaving}
        className={`p-4 rounded-xl items-center flex-row justify-center ${
          isSaving ? "bg-gray-500" : "bg-red-500 active:bg-red-600"
        }`}
        style={{ minHeight: 56 }}
        accessibilityRole="button"
        accessibilityLabel={isSaving ? "Saving activity" : "Stop and save activity"}
        accessibilityHint="Tap to stop the timer and save the activity"
        accessibilityState={{ disabled: isSaving }}
      >
        <Ionicons name="stop" size={24} color="#ffffff" />
        <Text className="font-semibold text-white ml-2">
          {isSaving ? "Saving..." : "Stop & Save"}
        </Text>
      </Pressable>
    </View>
  );
}


/**
 * Manual Entry Form Component
 * For activities without timer (bath) or manual duration entry
 * Validates: Requirements 9.2, 9.3, 14.1
 */
function ManualEntryForm({
  darkMode,
  activityType,
  duration,
  notes,
  isSaving,
  onDurationChange,
  onNotesChange,
  onSave,
}: {
  darkMode: boolean;
  activityType: ActivityType;
  duration: string;
  notes: string;
  isSaving: boolean;
  onDurationChange: (duration: string) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
}) {
  const activity = ACTIVITY_TYPES.find((a) => a.key === activityType);
  const isBath = activityType === "bath";

  return (
    <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <View className="items-center mb-4">
        <Text className="text-5xl mb-2">{activity?.icon || "🎯"}</Text>
        <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
          Log {activity?.label || "Activity"}
        </Text>
      </View>

      {/* Duration Input (optional for bath) */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Duration (minutes){isBath ? " - optional" : ""}
        </Text>
        <TextInput
          value={duration}
          onChangeText={onDurationChange}
          placeholder={isBath ? "Optional" : "Enter duration in minutes"}
          placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
          keyboardType="numeric"
          className={`p-4 rounded-xl ${
            darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
          }`}
          style={{ minHeight: 48 }}
        />
      </View>

      {/* Notes Input */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Notes (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder={isBath ? "Water temperature, products used..." : "Add notes about the activity..."}
          placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
          multiline
          numberOfLines={3}
          className={`p-4 rounded-xl ${
            darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
          }`}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />
      </View>

      {/* Save Button - 48x48dp minimum */}
      <Pressable
        onPress={onSave}
        disabled={isSaving}
        className={`p-4 rounded-xl items-center ${
          isSaving ? "bg-gray-500" : "bg-emerald-600 active:bg-emerald-700"
        }`}
        style={{ minHeight: 56 }}
        accessibilityRole="button"
        accessibilityLabel={isSaving ? `Saving ${activity?.label || "activity"}` : `Save ${activity?.label || "activity"}`}
        accessibilityHint={`Tap to save the ${activity?.label?.toLowerCase() || "activity"} entry`}
        accessibilityState={{ disabled: isSaving }}
      >
        <Text className="font-semibold text-white">
          {isSaving ? "Saving..." : `Save ${activity?.label || "Activity"}`}
        </Text>
      </Pressable>
    </View>
  );
}
