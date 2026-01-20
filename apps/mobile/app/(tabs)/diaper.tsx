/**
 * Diaper Screen
 * Track diaper changes with quick-log buttons for tired parents
 * Validates: Requirements 5.1, 5.2, 5.5, 14.1, 14.7
 */

import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
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
import type { LocalDiaperEntry, DiaperType } from "../../src/database/types";
import { useHaptics } from "../../src/hooks";
import { useBabyStore, useActiveBaby } from "../../src/store";

// Diaper type options with icons for quick-log
// Validates: Requirements 5.1 (record type: wet/dirty/mixed)
const DIAPER_TYPES: { key: DiaperType; label: string; icon: string; color: string }[] = [
  { key: "wet", label: "Wet", icon: "💧", color: "bg-blue-500" },
  { key: "dirty", label: "Dirty", icon: "💩", color: "bg-amber-600" },
  { key: "mixed", label: "Mixed", icon: "🔄", color: "bg-purple-500" },
  { key: "dry", label: "Dry", icon: "✨", color: "bg-green-500" },
];

// Common color options for detailed logging
const COLOR_OPTIONS = [
  "Yellow",
  "Brown",
  "Green",
  "Black",
  "Orange",
  "Other",
];

// Common consistency options for detailed logging
const CONSISTENCY_OPTIONS = [
  "Soft",
  "Firm",
  "Watery",
  "Seedy",
  "Mucousy",
  "Other",
];

export default function DiaperScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const { successHaptic } = useHaptics();

  // State
  const [recentDiapers, setRecentDiapers] = useState<LocalDiaperEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);

  // Detailed form state
  // Validates: Requirements 5.2 (optional notes about color, consistency, rash)
  const [selectedType, setSelectedType] = useState<DiaperType | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedConsistency, setSelectedConsistency] = useState<string | null>(null);
  const [hasRash, setHasRash] = useState(false);
  const [notes, setNotes] = useState("");

  // Daily statistics
  const [todayStats, setTodayStats] = useState<{ wet: number; dirty: number; mixed: number; dry: number; total: number }>({
    wet: 0,
    dirty: 0,
    mixed: 0,
    dry: 0,
    total: 0,
  });

  // Retrospective logging state
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTimestamp, setCustomTimestamp] = useState(new Date());

  // Load recent diaper entries
  const loadRecentDiapers = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const diapers = await db.getDiaperEntries(activeBaby.id, 20);
      setRecentDiapers(diapers);
      
      // Calculate today's statistics
      // Validates: Requirements 5.3 (display daily counts by type)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDiapers = diapers.filter((d) => {
        const diaperDate = new Date(d.timestamp);
        return diaperDate >= today;
      });
      
      const stats = {
        wet: todayDiapers.filter((d) => d.type === "wet").length,
        dirty: todayDiapers.filter((d) => d.type === "dirty").length,
        mixed: todayDiapers.filter((d) => d.type === "mixed").length,
        dry: todayDiapers.filter((d) => d.type === "dry").length,
        total: todayDiapers.length,
      };
      setTodayStats(stats);
    } catch (error) {
      console.error("[DiaperScreen] Error loading diapers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadRecentDiapers();
  }, [loadRecentDiapers]);

  // Quick-log diaper change (one-tap)
  // Validates: Requirements 5.5 (quick-log buttons for one-tap recording)
  // Validates: Requirements 14.7 (haptic feedback for successful actions)
  const handleQuickLog = async (type: DiaperType) => {
    if (!activeBaby) return;
    setIsSaving(true);

    try {
      const db = getDatabaseService();
      await db.initialize();

      // Use custom timestamp if enabled, otherwise use current time
      const timestamp = useCustomTime ? customTimestamp.toISOString() : new Date().toISOString();
      await db.createDiaperEntry({
        babyId: activeBaby.id,
        caregiverId: "local-user", // TODO: Get from auth store
        timestamp,
        type,
        color: null,
        consistency: null,
        hasRash: 0,
        notes: null,
      });

      // Reset custom time after saving
      if (useCustomTime) {
        setUseCustomTime(false);
        setCustomTimestamp(new Date());
      }
      await loadRecentDiapers();
      
      successHaptic(); // Haptic feedback for quick-log success
      // Brief feedback for quick-log
      Alert.alert("Logged!", `${type.charAt(0).toUpperCase() + type.slice(1)} diaper recorded`);
    } catch (error) {
      console.error("[DiaperScreen] Error quick-logging diaper:", error);
      Alert.alert("Error", "Failed to log diaper change.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save detailed diaper entry
  // Validates: Requirements 5.1, 5.2 (record type with optional details)
  // Validates: Requirements 14.7 (haptic feedback for successful actions)
  const handleSaveDetailed = async () => {
    if (!activeBaby || !selectedType) {
      Alert.alert("Missing Type", "Please select a diaper type.");
      return;
    }
    setIsSaving(true);

    try {
      const db = getDatabaseService();
      await db.initialize();

      // Use custom timestamp if enabled, otherwise use current time
      const timestamp = useCustomTime ? customTimestamp.toISOString() : new Date().toISOString();
      await db.createDiaperEntry({
        babyId: activeBaby.id,
        caregiverId: "local-user", // TODO: Get from auth store
        timestamp,
        type: selectedType,
        color: selectedColor,
        consistency: selectedConsistency,
        hasRash: hasRash ? 1 : 0,
        notes: notes.trim() || null,
      });

      // Reset form
      setSelectedType(null);
      setSelectedColor(null);
      setSelectedConsistency(null);
      setHasRash(false);
      setNotes("");
      setShowDetailedForm(false);
      // Reset custom time after saving
      if (useCustomTime) {
        setUseCustomTime(false);
        setCustomTimestamp(new Date());
      }

      await loadRecentDiapers();
      successHaptic(); // Haptic feedback for successful save
      Alert.alert("Saved", "Diaper entry saved successfully!");
    } catch (error) {
      console.error("[DiaperScreen] Error saving diaper:", error);
      Alert.alert("Error", "Failed to save diaper entry.");
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

  // Get icon for diaper type
  const getDiaperIcon = (type: DiaperType): string => {
    const found = DIAPER_TYPES.find((t) => t.key === type);
    return found?.icon || "🧷";
  };

  // Get color class for diaper type
  const getDiaperColor = (type: DiaperType): string => {
    const found = DIAPER_TYPES.find((t) => t.key === type);
    return found?.color || "bg-gray-500";
  };

  // Format diaper entry for display
  const formatDiaperEntry = (entry: LocalDiaperEntry): string => {
    const parts: string[] = [entry.type.charAt(0).toUpperCase() + entry.type.slice(1)];
    if (entry.color) parts.push(entry.color);
    if (entry.consistency) parts.push(entry.consistency);
    if (entry.hasRash) parts.push("Rash");
    return parts.join(" • ");
  };

  // No baby selected state
  if (!activeBaby) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">🧷</Text>
          <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            No Baby Selected
          </Text>
          <Text className={`text-center mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Please select or add a baby profile to start tracking diapers.
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
            Diaper
          </Text>
          <Text className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Track {activeBaby.name}'s diaper changes
          </Text>
        </View>

        {/* Today's Summary */}
        {/* Validates: Requirements 5.3 (display daily counts by type) */}
        <View className="px-4 py-6">
          <View className={`p-6 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border border-muted`}>
            <Text className={`text-sm font-bold mb-6 uppercase tracking-wider text-center ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
              Today's Summary
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-3xl mb-1">💧</Text>
                <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-foreground"}`}>
                  {todayStats.wet}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl mb-1">💩</Text>
                <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-foreground"}`}>
                  {todayStats.dirty}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl mb-1">🔄</Text>
                <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-foreground"}`}>
                  {todayStats.mixed}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl mb-1">✨</Text>
                <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-foreground"}`}>
                  {todayStats.dry}
                </Text>
              </View>
              <View className="items-center bg-muted/30 px-3 rounded-xl">
                <Text className="text-3xl mb-1">📊</Text>
                <Text className={`text-xl font-black ${darkMode ? "text-white" : "text-foreground"}`}>
                  {todayStats.total}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Custom Time Toggle for Quick Log */}
        <View className="px-4 py-3">
          <Pressable
            onPress={() => {
              setUseCustomTime(!useCustomTime);
              if (!useCustomTime) {
                setCustomTimestamp(new Date());
              }
            }}
            className={`flex-row items-center justify-between p-4 rounded-2xl border-2 ${
              useCustomTime
                ? "bg-primary/10 border-primary"
                : darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-muted"
            }`}
            style={{ minHeight: 56 }}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={useCustomTime ? "time" : "time-outline"}
                size={20}
                color={useCustomTime ? "#8b5cf6" : darkMode ? "#9ca3af" : "#6b7280"}
              />
              <Text
                className={`ml-3 font-medium ${
                  useCustomTime
                    ? "text-primary"
                    : darkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              >
                {useCustomTime ? "Logging for a different time" : "Log for a different time?"}
              </Text>
            </View>
            <View
              className={`w-6 h-6 rounded-full items-center justify-center ${
                useCustomTime ? "bg-primary" : darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              {useCustomTime && (
                <Ionicons name="checkmark" size={16} color="#ffffff" />
              )}
            </View>
          </Pressable>

          {/* Date Time Picker */}
          {useCustomTime && (
            <View className="mt-4">
              <DateTimePicker
                value={customTimestamp}
                onChange={setCustomTimestamp}
                darkMode={darkMode}
                label="When did this diaper change happen?"
                maximumDate={new Date()}
              />
            </View>
          )}
        </View>

        {/* Quick-Log Buttons */}
        {/* Validates: Requirements 5.5, 14.1 (quick-log with 48x48dp touch targets) */}
        <View className="px-4 pb-2">
          <Text className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-foreground"}`}>
            Quick Log
          </Text>
          <View className="flex-row flex-wrap gap-4">
            {DIAPER_TYPES.map((type) => (
              <Pressable
                key={type.key}
                onPress={() => handleQuickLog(type.key)}
                disabled={isSaving}
                className={`flex-1 min-w-[45%] p-6 rounded-3xl items-center shadow-sm active:scale-95 transition-transform ${
                  isSaving ? "opacity-50" : ""
                } ${type.color}`}
                style={{ minHeight: 100, minWidth: 48 }}
                accessibilityRole="button"
                accessibilityLabel={`Quick log ${type.label.toLowerCase()} diaper`}
                accessibilityHint={`Tap to quickly log a ${type.label.toLowerCase()} diaper change`}
                accessibilityState={{ disabled: isSaving }}
              >
                <View className="bg-white/20 w-12 h-12 rounded-full items-center justify-center mb-2">
                    <Text className="text-2xl">{type.icon}</Text>
                </View>
                <Text className="font-bold text-lg text-white">{type.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Detailed Log Toggle */}
        <View className="px-4 py-3">
          <Pressable
            onPress={() => setShowDetailedForm(!showDetailedForm)}
            className={`flex-row items-center justify-center p-3 rounded-xl ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
            style={{ minHeight: 48 }}
            accessibilityRole="button"
            accessibilityLabel={showDetailedForm ? "Hide detailed log form" : "Show detailed log form"}
            accessibilityHint="Tap to toggle the detailed diaper logging form"
            accessibilityState={{ expanded: showDetailedForm }}
          >
            <Ionicons
              name={showDetailedForm ? "chevron-up" : "chevron-down"}
              size={20}
              color={darkMode ? "#9ca3af" : "#6b7280"}
            />
            <Text className={`ml-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {showDetailedForm ? "Hide" : "Show"} Detailed Log
            </Text>
          </Pressable>
        </View>

        {/* Detailed Logging Form */}
        {/* Validates: Requirements 5.2 (optional notes about color, consistency, rash) */}
        {showDetailedForm && (
          <DetailedDiaperForm
            darkMode={darkMode}
            selectedType={selectedType}
            selectedColor={selectedColor}
            selectedConsistency={selectedConsistency}
            hasRash={hasRash}
            notes={notes}
            isSaving={isSaving}
            onTypeChange={setSelectedType}
            onColorChange={setSelectedColor}
            onConsistencyChange={setSelectedConsistency}
            onRashChange={setHasRash}
            onNotesChange={setNotes}
            onSave={handleSaveDetailed}
          />
        )}

        {/* Recent Diaper History */}
        <View className="px-4 py-4">
          <Text className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Recent Changes
          </Text>

          {isLoading ? (
            <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Loading...
              </Text>
            </View>
          ) : recentDiapers.length === 0 ? (
            <View className={`p-6 rounded-xl items-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className="text-3xl mb-2">📝</Text>
              <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No diaper entries yet
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {recentDiapers.map((entry) => (
                <View
                  key={entry.id}
                  className={`flex-row items-center p-4 rounded-xl ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${getDiaperColor(entry.type)}`}
                  >
                    <Text className="text-xl">{getDiaperIcon(entry.type)}</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {formatDiaperEntry(entry)}
                      </Text>
                      {entry.hasRash === 1 && (
                        <View className="ml-2 px-2 py-0.5 rounded-full bg-red-100">
                          <Text className="text-xs text-red-700">Rash</Text>
                        </View>
                      )}
                    </View>
                    <Text className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {formatTimestamp(entry.timestamp)}
                    </Text>
                    {entry.notes && (
                      <Text className={`text-sm mt-1 italic ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {entry.notes}
                      </Text>
                    )}
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
 * Detailed Diaper Form Component
 * For logging additional details like color, consistency, and rash
 * Validates: Requirements 5.2, 14.1
 */
function DetailedDiaperForm({
  darkMode,
  selectedType,
  selectedColor,
  selectedConsistency,
  hasRash,
  notes,
  isSaving,
  onTypeChange,
  onColorChange,
  onConsistencyChange,
  onRashChange,
  onNotesChange,
  onSave,
}: {
  darkMode: boolean;
  selectedType: DiaperType | null;
  selectedColor: string | null;
  selectedConsistency: string | null;
  hasRash: boolean;
  notes: string;
  isSaving: boolean;
  onTypeChange: (type: DiaperType | null) => void;
  onColorChange: (color: string | null) => void;
  onConsistencyChange: (consistency: string | null) => void;
  onRashChange: (hasRash: boolean) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
}) {
  return (
    <View className={`mx-4 p-6 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border border-muted`}>
      {/* Diaper Type Selection */}
      <View className="mb-6">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Diaper Type *
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {DIAPER_TYPES.map((type) => (
            <Pressable
              key={type.key}
              onPress={() => onTypeChange(selectedType === type.key ? null : type.key)}
              className={`px-4 py-3 rounded-2xl flex-row items-center transition-all ${
                selectedType === type.key
                  ? type.color
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-background border border-muted"
              }`}
              style={{ minHeight: 48 }}
            >
              <Text className="text-xl mr-2">{type.icon}</Text>
              <Text
                className={`font-bold ${
                  selectedType === type.key
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

      {/* Color Selection (for dirty/mixed) */}
      {(selectedType === "dirty" || selectedType === "mixed") && (
        <View className="mb-6">
          <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
            Color (optional)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
            <View className="flex-row gap-2 pr-4">
              {COLOR_OPTIONS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => onColorChange(selectedColor === color ? null : color)}
                  className={`px-4 py-2 rounded-xl border-2 transition-all ${
                    selectedColor === color
                      ? "bg-amber-600 border-amber-600"
                      : darkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-background border-muted"
                  }`}
                  style={{ minHeight: 48 }}
                >
                  <Text
                    className={`font-medium ${
                      selectedColor === color
                        ? "text-white"
                        : darkMode
                        ? "text-gray-300"
                        : "text-foreground"
                    }`}
                  >
                    {color}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Consistency Selection (for dirty/mixed) */}
      {(selectedType === "dirty" || selectedType === "mixed") && (
        <View className="mb-6">
          <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
            Consistency (optional)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
            <View className="flex-row gap-2 pr-4">
              {CONSISTENCY_OPTIONS.map((consistency) => (
                <Pressable
                  key={consistency}
                  onPress={() => onConsistencyChange(selectedConsistency === consistency ? null : consistency)}
                  className={`px-4 py-2 rounded-xl border-2 transition-all ${
                    selectedConsistency === consistency
                      ? "bg-amber-600 border-amber-600"
                      : darkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-background border-muted"
                  }`}
                  style={{ minHeight: 48 }}
                >
                  <Text
                    className={`font-medium ${
                      selectedConsistency === consistency
                        ? "text-white"
                        : darkMode
                        ? "text-gray-300"
                        : "text-foreground"
                    }`}
                  >
                    {consistency}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Diaper Rash Toggle */}
      <View className="mb-6">
        <Pressable
          onPress={() => onRashChange(!hasRash)}
          className={`flex-row items-center justify-between p-4 rounded-2xl border-2 transition-all ${
            hasRash
              ? "bg-red-500 border-red-500"
              : darkMode
              ? "bg-gray-700 border-gray-600"
              : "bg-background border-muted"
          }`}
          style={{ minHeight: 64 }}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3">
                <Text className="text-xl">🩹</Text>
            </View>
            <Text
              className={`font-bold text-lg ${
                hasRash ? "text-white" : darkMode ? "text-gray-300" : "text-foreground"
              }`}
            >
              Diaper Rash
            </Text>
          </View>
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${
              hasRash ? "bg-white" : darkMode ? "bg-gray-600" : "bg-muted"
            }`}
          >
            {hasRash && (
              <Ionicons name="checkmark" size={20} color="#ef4444" />
            )}
          </View>
        </Pressable>
      </View>

      {/* Notes Input */}
      <View className="mb-6">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Notes (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Add any notes..."
          placeholderTextColor={darkMode ? "#6b7280" : "#D6D3D1"}
          multiline
          numberOfLines={3}
          className={`p-5 rounded-2xl text-base font-medium ${
            darkMode ? "bg-gray-700 text-white" : "bg-background text-foreground border-2 border-muted focus:border-primary"
          }`}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
      </View>

      {/* Save Button */}
      <Pressable
        onPress={onSave}
        disabled={isSaving || !selectedType}
        className={`p-4 rounded-2xl items-center shadow-lg transition-all ${
          isSaving || !selectedType
            ? "bg-gray-400"
            : "bg-teal-600 active:bg-teal-700 shadow-teal-600/30"
        }`}
        style={{ minHeight: 64 }}
      >
        <Text className="font-bold text-lg text-white">
          {isSaving ? "Saving..." : "Save Detailed Entry"}
        </Text>
      </Pressable>
    </View>
  );
}
