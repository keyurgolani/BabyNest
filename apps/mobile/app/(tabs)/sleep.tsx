/**
 * Sleep Screen
 * Track naps and night sleep with wake window calculations
 * Validates: Requirements 4.1, 4.2, 4.4, 14.1, 14.7
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

import { DateTimePicker } from "../../src/components";
import { getDatabaseService } from "../../src/database/DatabaseService";
import type { LocalSleepEntry, SleepType, SleepQuality } from "../../src/database/types";
import { useHaptics } from "../../src/hooks";
import { useBabyStore, useActiveBaby, useActiveTimer } from "../../src/store";

// Sleep type options
const SLEEP_TYPES: { key: SleepType; label: string; icon: string; description: string }[] = [
  { key: "nap", label: "Nap", icon: "☀️", description: "Daytime sleep" },
  { key: "night", label: "Night Sleep", icon: "🌙", description: "Nighttime sleep" },
];

// Sleep quality options
const SLEEP_QUALITIES: { key: SleepQuality; label: string; icon: string }[] = [
  { key: "good", label: "Good", icon: "😊" },
  { key: "fair", label: "Fair", icon: "😐" },
  { key: "poor", label: "Poor", icon: "😔" },
];

export default function SleepScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const startTimer = useBabyStore((state) => state.startTimer);
  const stopTimer = useBabyStore((state) => state.stopTimer);
  const _updateTimerMetadata = useBabyStore((state) => state.updateTimerMetadata);
  const sleepTimer = useActiveTimer("sleep");
  const { successHaptic, mediumHaptic } = useHaptics();

  // State
  const [recentSleeps, setRecentSleeps] = useState<LocalSleepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sleep tracking state
  const [selectedSleepType, setSelectedSleepType] = useState<SleepType>("nap");
  const [selectedQuality, setSelectedQuality] = useState<SleepQuality | null>(null);
  const [notes, setNotes] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wakeWindow, setWakeWindow] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wakeWindowIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual/retrospective logging state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualStartTime, setManualStartTime] = useState(new Date());
  const [manualEndTime, setManualEndTime] = useState(new Date());
  const [manualSleepType, setManualSleepType] = useState<SleepType>("nap");
  const [manualQuality, setManualQuality] = useState<SleepQuality | null>(null);
  const [manualNotes, setManualNotes] = useState("");

  // Load recent sleep entries
  const loadRecentSleeps = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const sleeps = await db.getSleepEntries(activeBaby.id, 10);
      setRecentSleeps(sleeps);
    } catch (error) {
      console.error("[SleepScreen] Error loading sleep entries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadRecentSleeps();
  }, [loadRecentSleeps]);

  // Calculate wake window (time since last sleep ended)
  // Validates: Requirements 4.4 (calculate and display current wake window)
  const calculateWakeWindow = useCallback(() => {
    // Find the most recent completed sleep entry
    const lastCompletedSleep = recentSleeps.find((sleep) => sleep.endTime !== null);
    
    if (lastCompletedSleep && lastCompletedSleep.endTime) {
      const endTime = new Date(lastCompletedSleep.endTime);
      const now = new Date();
      const diffMs = now.getTime() - endTime.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      setWakeWindow(diffMinutes);
    } else {
      setWakeWindow(null);
    }
  }, [recentSleeps]);

  // Update wake window periodically
  useEffect(() => {
    calculateWakeWindow();
    
    // Update wake window every minute
    wakeWindowIntervalRef.current = setInterval(() => {
      calculateWakeWindow();
    }, 60000);

    return () => {
      if (wakeWindowIntervalRef.current) {
        clearInterval(wakeWindowIntervalRef.current);
      }
    };
  }, [calculateWakeWindow]);

  // Timer effect for sleep tracking
  useEffect(() => {
    if (sleepTimer && !sleepTimer.isPaused) {
      timerIntervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - sleepTimer.startTime.getTime()) / 1000 -
            sleepTimer.pausedDuration
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
  }, [sleepTimer]);

  // Restore sleep type from timer metadata if timer is running
  useEffect(() => {
    if (sleepTimer?.metadata?.sleepType) {
      setSelectedSleepType(sleepTimer.metadata.sleepType);
    }
  }, [sleepTimer]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format wake window for display
  const formatWakeWindow = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

  // Start sleep timer
  // Validates: Requirements 4.1 (record start time and sleep type)
  // Validates: Requirements 14.7 (haptic feedback)
  const handleStartSleep = (sleepType: SleepType) => {
    setSelectedSleepType(sleepType);
    startTimer("sleep", { sleepType });
    setElapsedTime(0);
    mediumHaptic(); // Haptic feedback for timer start
  };

  // Stop sleep timer and save
  // Validates: Requirements 4.2 (calculate and store total duration)
  // Validates: Requirements 14.7 (haptic feedback for successful actions)
  const handleStopSleep = async () => {
    if (!sleepTimer || !activeBaby) return;

    const timerResult = stopTimer("sleep");
    if (!timerResult) return;

    setIsSaving(true);

    try {
      const db = getDatabaseService();
      await db.initialize();

      const startTime = timerResult.startTime.toISOString();
      const endTime = timerResult.endTime.toISOString();
      const durationMinutes = Math.floor(timerResult.totalDuration / 60);

      await db.createSleepEntry({
        babyId: activeBaby.id,
        caregiverId: "local-user", // TODO: Get from auth store
        timestamp: startTime,
        startTime,
        endTime,
        duration: durationMinutes,
        sleepType: selectedSleepType,
        quality: selectedQuality,
        notes: notes.trim() || null,
      });

      // Reset state
      setNotes("");
      setSelectedQuality(null);
      setElapsedTime(0);
      await loadRecentSleeps();

      successHaptic(); // Haptic feedback for successful save
      Alert.alert("Saved", `Sleep entry saved! Duration: ${formatDuration(durationMinutes)}`);
    } catch (error) {
      console.error("[SleepScreen] Error saving sleep entry:", error);
      Alert.alert("Error", "Failed to save sleep entry.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save manually entered sleep (retrospective logging)
  const handleSaveManualSleep = async () => {
    if (!activeBaby) return;

    // Validate times
    if (manualEndTime <= manualStartTime) {
      Alert.alert("Invalid Times", "End time must be after start time.");
      return;
    }

    setIsSaving(true);

    try {
      const db = getDatabaseService();
      await db.initialize();

      const startTime = manualStartTime.toISOString();
      const endTime = manualEndTime.toISOString();
      const durationMinutes = Math.floor(
        (manualEndTime.getTime() - manualStartTime.getTime()) / 60000
      );

      await db.createSleepEntry({
        babyId: activeBaby.id,
        caregiverId: "local-user",
        timestamp: startTime,
        startTime,
        endTime,
        duration: durationMinutes,
        sleepType: manualSleepType,
        quality: manualQuality,
        notes: manualNotes.trim() || null,
      });

      // Reset manual entry form
      setShowManualEntry(false);
      setManualStartTime(new Date());
      setManualEndTime(new Date());
      setManualSleepType("nap");
      setManualQuality(null);
      setManualNotes("");

      await loadRecentSleeps();

      successHaptic();
      Alert.alert("Saved", `Sleep entry saved! Duration: ${formatDuration(durationMinutes)}`);
    } catch (error) {
      console.error("[SleepScreen] Error saving manual sleep entry:", error);
      Alert.alert("Error", "Failed to save sleep entry.");
    } finally {
      setIsSaving(false);
    }
  };

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

  // Format sleep entry for display
  const formatSleepEntry = (entry: LocalSleepEntry): string => {
    if (entry.duration) {
      return formatDuration(entry.duration);
    }
    return "In progress";
  };

  // Get icon for sleep type
  const getSleepIcon = (sleepType: SleepType): string => {
    return sleepType === "nap" ? "☀️" : "🌙";
  };

  // No baby selected state
  if (!activeBaby) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">😴</Text>
          <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            No Baby Selected
          </Text>
          <Text className={`text-center mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Please select or add a baby profile to start tracking sleep.
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
            Sleep
          </Text>
          <Text className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Track {activeBaby.name}'s sleep
          </Text>
        </View>

        {/* Wake Window Display */}
        {/* Validates: Requirements 4.4 (display current wake window) */}
        {!sleepTimer && wakeWindow !== null && (
          <View className="px-4 py-3">
            <View className={`p-4 rounded-xl ${darkMode ? "bg-indigo-900/30" : "bg-indigo-50"}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${darkMode ? "bg-indigo-800" : "bg-indigo-100"}`}>
                    <Text className="text-lg">⏰</Text>
                  </View>
                  <View className="ml-3">
                    <Text className={`text-sm ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}>
                      Wake Window
                    </Text>
                    <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-indigo-900"}`}>
                      {formatWakeWindow(wakeWindow)}
                    </Text>
                  </View>
                </View>
                <Text className={`text-sm ${darkMode ? "text-indigo-400" : "text-indigo-500"}`}>
                  since last sleep
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Sleep Timer Section */}
        <View className="px-4 py-2">
          {!sleepTimer && !showManualEntry ? (
            // Start state - show sleep type selection
            <>
              <SleepTypeSelector
                darkMode={darkMode}
                onStartSleep={handleStartSleep}
              />
              {/* Manual Entry Toggle */}
              <Pressable
                onPress={() => {
                  setShowManualEntry(true);
                  // Set default times: end = now, start = 1 hour ago
                  const now = new Date();
                  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                  setManualEndTime(now);
                  setManualStartTime(oneHourAgo);
                }}
                className={`mt-4 flex-row items-center justify-center p-4 rounded-2xl border-2 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-muted"
                }`}
                style={{ minHeight: 56 }}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={darkMode ? "#9ca3af" : "#6b7280"}
                />
                <Text
                  className={`ml-3 font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Log past sleep manually
                </Text>
              </Pressable>
            </>
          ) : sleepTimer ? (
            // Timer running state
            <SleepTimerRunning
              darkMode={darkMode}
              sleepType={selectedSleepType}
              elapsedTime={elapsedTime}
              selectedQuality={selectedQuality}
              notes={notes}
              isSaving={isSaving}
              onQualityChange={setSelectedQuality}
              onNotesChange={setNotes}
              onStopSleep={handleStopSleep}
              formatTime={formatTime}
            />
          ) : (
            // Manual entry form
            <ManualSleepEntry
              darkMode={darkMode}
              startTime={manualStartTime}
              endTime={manualEndTime}
              sleepType={manualSleepType}
              quality={manualQuality}
              notes={manualNotes}
              isSaving={isSaving}
              onStartTimeChange={setManualStartTime}
              onEndTimeChange={setManualEndTime}
              onSleepTypeChange={setManualSleepType}
              onQualityChange={setManualQuality}
              onNotesChange={setManualNotes}
              onSave={handleSaveManualSleep}
              onCancel={() => setShowManualEntry(false)}
            />
          )}
        </View>

        {/* Recent Sleep History */}
        {/* Validates: Requirements 4.3 (display sleep history) */}
        <View className="px-4 py-4">
          <Text className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Recent Sleep
          </Text>

          {isLoading ? (
            <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Loading...
              </Text>
            </View>
          ) : recentSleeps.length === 0 ? (
            <View className={`p-6 rounded-xl items-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className="text-3xl mb-2">📝</Text>
              <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No sleep entries yet
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {recentSleeps.map((entry) => (
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
                    <Text className="text-xl">{getSleepIcon(entry.sleepType)}</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {entry.sleepType === "nap" ? "Nap" : "Night Sleep"}
                      </Text>
                      {entry.quality && (
                        <View className={`ml-2 px-2 py-0.5 rounded-full ${
                          entry.quality === "good" 
                            ? "bg-green-100" 
                            : entry.quality === "fair" 
                            ? "bg-yellow-100" 
                            : "bg-red-100"
                        }`}>
                          <Text className={`text-xs ${
                            entry.quality === "good" 
                              ? "text-green-700" 
                              : entry.quality === "fair" 
                              ? "text-yellow-700" 
                              : "text-red-700"
                          }`}>
                            {entry.quality}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatSleepEntry(entry)}
                      </Text>
                      <Text className={`text-sm mx-2 ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
                        •
                      </Text>
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
 * Sleep Type Selector Component
 * Shows buttons to start nap or night sleep
 * Validates: Requirements 4.1, 14.1
 */
function SleepTypeSelector({
  darkMode,
  onStartSleep,
}: {
  darkMode: boolean;
  onStartSleep: (sleepType: SleepType) => void;
}) {
  return (
    <View className={`p-6 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
      <Text className={`text-center mb-6 font-medium ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
        Start tracking sleep
      </Text>

      <View className="flex-row gap-4">
        {SLEEP_TYPES.map((type) => (
          // Validates: Requirements 14.1 (48x48dp minimum touch targets)
          <Pressable
            key={type.key}
            onPress={() => onStartSleep(type.key)}
            className={`flex-1 p-6 rounded-2xl items-center border-2 ${
              darkMode 
                ? "bg-gray-700 border-gray-600 active:bg-gray-600" 
                : "bg-background border-muted active:bg-muted"
            }`}
            style={{ minHeight: 140 }}
            accessibilityRole="button"
            accessibilityLabel={`Start ${type.label.toLowerCase()}`}
            accessibilityHint={`Tap to start tracking ${type.description.toLowerCase()}`}
          >
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                type.key === 'nap' ? 'bg-orange-100' : 'bg-indigo-100'
            }`}>
                <Text className="text-4xl">{type.icon}</Text>
            </View>
            <Text className={`font-bold text-lg mb-1 ${darkMode ? "text-white" : "text-foreground"}`}>
              {type.label}
            </Text>
            <Text className={`text-xs text-center ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
              {type.description}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}


/**
 * Sleep Timer Running Component
 * Shows active timer with stop button and quality selection
 * Validates: Requirements 4.1, 4.2, 14.1
 */
function SleepTimerRunning({
  darkMode,
  sleepType,
  elapsedTime,
  selectedQuality,
  notes,
  isSaving,
  onQualityChange,
  onNotesChange,
  onStopSleep,
  formatTime,
}: {
  darkMode: boolean;
  sleepType: SleepType;
  elapsedTime: number;
  selectedQuality: SleepQuality | null;
  notes: string;
  isSaving: boolean;
  onQualityChange: (quality: SleepQuality | null) => void;
  onNotesChange: (notes: string) => void;
  onStopSleep: () => void;
  formatTime: (seconds: number) => string;
}) {
  return (
    <View className={`p-6 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md`}>
      {/* Timer Display */}
      <View className="items-center py-8">
         <View className="relative w-72 h-72 items-center justify-center rounded-full bg-background border-[16px] border-muted">
             {/* Sleepy visual ring */}
             <View className={`absolute inset-2 rounded-full border-[16px] opacity-20 ${
                 sleepType === 'nap' ? 'border-orange-400' : 'border-indigo-500'
             }`} />
             
             <View className="items-center">
                <Text className="text-4xl mb-2">
                    {sleepType === "nap" ? "☀️" : "🌙"}
                </Text>
                <Text className={`text-lg font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {sleepType === "nap" ? "Nap" : "Night Sleep"}
                </Text>
                <Text className="text-6xl font-black text-foreground tracking-tighter">
                    {formatTime(elapsedTime)}
                </Text>
                <Text className={`text-sm font-bold mt-2 animate-pulse ${
                    sleepType === 'nap' ? 'text-orange-500' : 'text-indigo-500'
                }`}>
                    Sleeping...
                </Text>
             </View>
        </View>
      </View>

      {/* Sleep Quality Selection */}
      <View className="mb-6">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Quality
        </Text>
        <View className="flex-row gap-3">
          {SLEEP_QUALITIES.map((quality) => (
            <Pressable
              key={quality.key}
              onPress={() => onQualityChange(selectedQuality === quality.key ? null : quality.key)}
              className={`flex-1 p-3 rounded-2xl items-center border-2 transition-all ${
                selectedQuality === quality.key
                  ? "bg-indigo-500 border-indigo-500"
                  : darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-background border-muted"
              }`}
              style={{ minHeight: 64 }}
            >
              <Text className="text-2xl mb-1">{quality.icon}</Text>
              <Text
                className={`text-xs font-bold ${
                  selectedQuality === quality.key
                    ? "text-white"
                    : darkMode
                    ? "text-gray-300"
                    : "text-foreground"
                }`}
              >
                {quality.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Notes Input */}
      <View className="mb-8">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Notes (Optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="How was the sleep?"
          placeholderTextColor={darkMode ? "#6b7280" : "#D6D3D1"}
          multiline
          numberOfLines={3}
          className={`p-5 rounded-2xl text-base font-medium ${
            darkMode ? "bg-gray-700 text-white" : "bg-background text-foreground border-2 border-muted focus:border-indigo-500"
          }`}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
      </View>

      {/* Stop Button */}
      <Pressable
        onPress={onStopSleep}
        disabled={isSaving}
        className={`p-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-indigo-500/20 ${
          isSaving ? "bg-gray-400" : "bg-indigo-500 active:bg-indigo-600"
        }`}
        style={{ minHeight: 64 }}
      >
        <Ionicons name="stop" size={24} color="#ffffff" />
        <Text className="font-bold text-lg text-white ml-2">
          {isSaving ? "Saving..." : "Wake & Save"}
        </Text>
      </Pressable>
    </View>
  );
}


/**
 * Manual Sleep Entry Component
 * For logging past sleep sessions with custom start/end times
 * Validates: Requirements 4.1, 4.2, 14.1
 */
function ManualSleepEntry({
  darkMode,
  startTime,
  endTime,
  sleepType,
  quality,
  notes,
  isSaving,
  onStartTimeChange,
  onEndTimeChange,
  onSleepTypeChange,
  onQualityChange,
  onNotesChange,
  onSave,
  onCancel,
}: {
  darkMode: boolean;
  startTime: Date;
  endTime: Date;
  sleepType: SleepType;
  quality: SleepQuality | null;
  notes: string;
  isSaving: boolean;
  onStartTimeChange: (date: Date) => void;
  onEndTimeChange: (date: Date) => void;
  onSleepTypeChange: (type: SleepType) => void;
  onQualityChange: (quality: SleepQuality | null) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  // Calculate duration for display
  const durationMinutes = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 60000));
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <View className={`p-6 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-foreground"}`}>
          Log Past Sleep
        </Text>
        <Pressable onPress={onCancel} style={{ padding: 8 }}>
          <Ionicons name="close" size={24} color={darkMode ? "#9ca3af" : "#6b7280"} />
        </Pressable>
      </View>

      {/* Sleep Type Selection */}
      <View className="mb-6">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Sleep Type
        </Text>
        <View className="flex-row gap-3">
          {SLEEP_TYPES.map((type) => (
            <Pressable
              key={type.key}
              onPress={() => onSleepTypeChange(type.key)}
              className={`flex-1 p-4 rounded-2xl items-center border-2 ${
                sleepType === type.key
                  ? type.key === "nap"
                    ? "bg-orange-500 border-orange-500"
                    : "bg-indigo-500 border-indigo-500"
                  : darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-background border-muted"
              }`}
              style={{ minHeight: 80 }}
            >
              <Text className="text-2xl mb-1">{type.icon}</Text>
              <Text
                className={`font-bold ${
                  sleepType === type.key
                    ? "text-white"
                    : darkMode
                    ? "text-gray-300"
                    : "text-foreground"
                }`}
              >
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Start Time */}
      <DateTimePicker
        value={startTime}
        onChange={onStartTimeChange}
        darkMode={darkMode}
        label="Sleep started"
        maximumDate={endTime}
      />

      {/* End Time */}
      <DateTimePicker
        value={endTime}
        onChange={onEndTimeChange}
        darkMode={darkMode}
        label="Woke up"
        minimumDate={startTime}
        maximumDate={new Date()}
      />

      {/* Duration Display */}
      <View className={`p-4 rounded-2xl mb-4 ${darkMode ? "bg-gray-700" : "bg-indigo-50"}`}>
        <View className="flex-row items-center justify-center">
          <Ionicons
            name="time-outline"
            size={20}
            color={darkMode ? "#a5b4fc" : "#6366f1"}
          />
          <Text className={`ml-2 font-bold text-lg ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}>
            Duration: {durationText}
          </Text>
        </View>
      </View>

      {/* Sleep Quality Selection */}
      <View className="mb-6">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Quality (Optional)
        </Text>
        <View className="flex-row gap-3">
          {SLEEP_QUALITIES.map((q) => (
            <Pressable
              key={q.key}
              onPress={() => onQualityChange(quality === q.key ? null : q.key)}
              className={`flex-1 p-3 rounded-2xl items-center border-2 ${
                quality === q.key
                  ? "bg-indigo-500 border-indigo-500"
                  : darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-background border-muted"
              }`}
              style={{ minHeight: 64 }}
            >
              <Text className="text-2xl mb-1">{q.icon}</Text>
              <Text
                className={`text-xs font-bold ${
                  quality === q.key
                    ? "text-white"
                    : darkMode
                    ? "text-gray-300"
                    : "text-foreground"
                }`}
              >
                {q.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Notes Input */}
      <View className="mb-6">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Notes (Optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="How was the sleep?"
          placeholderTextColor={darkMode ? "#6b7280" : "#D6D3D1"}
          multiline
          numberOfLines={3}
          className={`p-5 rounded-2xl text-base font-medium ${
            darkMode ? "bg-gray-700 text-white" : "bg-background text-foreground border-2 border-muted"
          }`}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={onCancel}
          className={`flex-1 p-4 rounded-2xl items-center border-2 ${
            darkMode ? "border-gray-600" : "border-muted"
          }`}
          style={{ minHeight: 56 }}
        >
          <Text className={`font-bold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          disabled={isSaving || durationMinutes <= 0}
          className={`flex-1 p-4 rounded-2xl items-center shadow-lg shadow-indigo-500/20 ${
            isSaving || durationMinutes <= 0
              ? "bg-gray-400"
              : "bg-indigo-500 active:bg-indigo-600"
          }`}
          style={{ minHeight: 56 }}
        >
          <Text className="font-bold text-white">
            {isSaving ? "Saving..." : "Save Sleep"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
