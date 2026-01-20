/**
 * Feeding Screen
 * Track breastfeeding, bottle feeding, pumping, and solid foods
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 14.1, 14.7
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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DateTimePicker } from "../../src/components";
import { getDatabaseService } from "../../src/database/DatabaseService";
import type { LocalFeedingEntry, FeedingType, BreastSide, BottleType, PumpSide } from "../../src/database/types";
import { useHaptics } from "../../src/hooks";
import { useBabyStore, useActiveBaby, useActiveTimer } from "../../src/store";

// Feeding type tabs
const FEEDING_TYPES: { key: FeedingType; label: string; icon: string }[] = [
  { key: "breastfeeding", label: "Breast", icon: "🤱" },
  { key: "bottle", label: "Bottle", icon: "🍼" },
  { key: "pumping", label: "Pump", icon: "💧" },
  { key: "solid", label: "Solid", icon: "🥣" },
];

// Bottle type options
const BOTTLE_TYPES: { key: BottleType; label: string }[] = [
  { key: "breastMilk", label: "Breast Milk" },
  { key: "formula", label: "Formula" },
  { key: "water", label: "Water" },
];

// Pump side options
const PUMP_SIDES: { key: PumpSide; label: string }[] = [
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "both", label: "Both" },
];

export default function FeedScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const startTimer = useBabyStore((state) => state.startTimer);
  const stopTimer = useBabyStore((state) => state.stopTimer);
  const updateTimerMetadata = useBabyStore((state) => state.updateTimerMetadata);
  const breastfeedingTimer = useActiveTimer("breastfeeding");
  const { successHaptic, mediumHaptic, lightHaptic } = useHaptics();

  // State
  const [selectedType, setSelectedType] = useState<FeedingType>("breastfeeding");
  const [recentFeedings, setRecentFeedings] = useState<LocalFeedingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Breastfeeding state
  const [currentSide, setCurrentSide] = useState<BreastSide>("left");
  const [leftDuration, setLeftDuration] = useState(0);
  const [rightDuration, setRightDuration] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Bottle state
  const [bottleAmount, setBottleAmount] = useState("");
  const [bottleType, setBottleType] = useState<BottleType>("breastMilk");

  // Pumping state
  const [pumpAmount, setPumpAmount] = useState("");
  const [pumpSide, setPumpSide] = useState<PumpSide>("both");

  // Solid food state
  const [foodType, setFoodType] = useState("");
  const [foodReaction, setFoodReaction] = useState("");

  // Notes (shared)
  const [notes, setNotes] = useState("");

  // Retrospective logging state
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTimestamp, setCustomTimestamp] = useState(new Date());

  // Manual breastfeeding entry state (for logging without timer)
  const [showManualBreastfeeding, setShowManualBreastfeeding] = useState(false);
  const [manualLeftDuration, setManualLeftDuration] = useState("");
  const [manualRightDuration, setManualRightDuration] = useState("");
  const [manualLastSide, setManualLastSide] = useState<BreastSide>("left");

  // Load recent feedings
  const loadRecentFeedings = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const feedings = await db.getFeedingEntries(activeBaby.id, 10);
      setRecentFeedings(feedings);
    } catch (error) {
      console.error("[FeedScreen] Error loading feedings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadRecentFeedings();
  }, [loadRecentFeedings]);

  // Timer effect for breastfeeding
  useEffect(() => {
    if (breastfeedingTimer && !breastfeedingTimer.isPaused) {
      timerIntervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - breastfeedingTimer.startTime.getTime()) / 1000 -
            breastfeedingTimer.pausedDuration
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
  }, [breastfeedingTimer]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start breastfeeding timer
  // Validates: Requirements 3.1 (start timer and record breast side)
  // Validates: Requirements 14.7 (haptic feedback)
  const handleStartBreastfeeding = (side: BreastSide) => {
    setCurrentSide(side);
    startTimer("breastfeeding", { breastSide: side });
    setElapsedTime(0);
    mediumHaptic(); // Haptic feedback for timer start
  };

  // Switch breast side during feeding
  // Validates: Requirements 3.2 (pause current timer and start other side)
  // Validates: Requirements 14.7 (haptic feedback)
  const handleSwitchSide = () => {
    if (!breastfeedingTimer) return;

    const newSide: BreastSide = currentSide === "left" ? "right" : "left";
    
    // Save current side duration
    if (currentSide === "left") {
      setLeftDuration((prev) => prev + elapsedTime);
    } else {
      setRightDuration((prev) => prev + elapsedTime);
    }

    // Switch side
    setCurrentSide(newSide);
    updateTimerMetadata("breastfeeding", { breastSide: newSide });
    
    // Reset elapsed for new side
    stopTimer("breastfeeding");
    startTimer("breastfeeding", { breastSide: newSide });
    setElapsedTime(0);
    lightHaptic(); // Haptic feedback for side switch
  };

  // Stop breastfeeding and save
  // Validates: Requirements 3.3 (save total duration per side and timestamp)
  const handleStopBreastfeeding = async () => {
    if (!breastfeedingTimer || !activeBaby) return;

    // Calculate final durations
    let finalLeftDuration = leftDuration;
    let finalRightDuration = rightDuration;

    if (currentSide === "left") {
      finalLeftDuration += elapsedTime;
    } else {
      finalRightDuration += elapsedTime;
    }

    stopTimer("breastfeeding");

    // Save to database
    await saveFeeding({
      type: "breastfeeding",
      leftDuration: finalLeftDuration > 0 ? finalLeftDuration : null,
      rightDuration: finalRightDuration > 0 ? finalRightDuration : null,
      lastSide: currentSide,
    });

    // Reset state
    setLeftDuration(0);
    setRightDuration(0);
    setElapsedTime(0);
    setCurrentSide("left");
  };

  // Save manual breastfeeding entry (without timer)
  const handleSaveManualBreastfeeding = async () => {
    if (!activeBaby) return;

    const leftSecs = manualLeftDuration ? parseInt(manualLeftDuration, 10) * 60 : 0;
    const rightSecs = manualRightDuration ? parseInt(manualRightDuration, 10) * 60 : 0;

    if (leftSecs <= 0 && rightSecs <= 0) {
      Alert.alert("Invalid Duration", "Please enter at least one duration.");
      return;
    }

    await saveFeeding({
      type: "breastfeeding",
      leftDuration: leftSecs > 0 ? leftSecs : null,
      rightDuration: rightSecs > 0 ? rightSecs : null,
      lastSide: manualLastSide,
    });

    // Reset manual entry state
    setShowManualBreastfeeding(false);
    setManualLeftDuration("");
    setManualRightDuration("");
    setManualLastSide("left");
  };

  // Save bottle feeding
  // Validates: Requirements 3.4 (record amount, type, and duration)
  const handleSaveBottle = async () => {
    if (!activeBaby) return;
    const amount = parseFloat(bottleAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount in ml.");
      return;
    }

    await saveFeeding({
      type: "bottle",
      amount,
      bottleType,
    });

    // Reset state
    setBottleAmount("");
    setBottleType("breastMilk");
  };

  // Save pumping session
  // Validates: Requirements 3.5 (record duration, amount, and breast side)
  const handleSavePumping = async () => {
    if (!activeBaby) return;
    const amount = parseFloat(pumpAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount in ml.");
      return;
    }

    await saveFeeding({
      type: "pumping",
      pumpedAmount: amount,
      pumpSide,
    });

    // Reset state
    setPumpAmount("");
    setPumpSide("both");
  };

  // Save solid food
  // Validates: Requirements 3.6 (record food type, amount, and reaction notes)
  const handleSaveSolid = async () => {
    if (!activeBaby) return;
    if (!foodType.trim()) {
      Alert.alert("Missing Food Type", "Please enter what food was given.");
      return;
    }

    await saveFeeding({
      type: "solid",
      foodType: foodType.trim(),
      reaction: foodReaction.trim() || null,
    });

    // Reset state
    setFoodType("");
    setFoodReaction("");
  };

  // Generic save feeding function
  // Validates: Requirements 14.7 (haptic feedback for successful actions)
  const saveFeeding = async (data: Partial<LocalFeedingEntry>) => {
    if (!activeBaby) return;
    setIsSaving(true);

    try {
      const db = getDatabaseService();
      await db.initialize();
      
      // Use custom timestamp if enabled, otherwise use current time
      const timestamp = useCustomTime ? customTimestamp.toISOString() : new Date().toISOString();
      await db.createFeedingEntry({
        babyId: activeBaby.id,
        caregiverId: "local-user", // TODO: Get from auth store
        timestamp,
        type: data.type!,
        leftDuration: data.leftDuration ?? null,
        rightDuration: data.rightDuration ?? null,
        lastSide: data.lastSide ?? null,
        amount: data.amount ?? null,
        bottleType: data.bottleType ?? null,
        pumpedAmount: data.pumpedAmount ?? null,
        pumpSide: data.pumpSide ?? null,
        foodType: data.foodType ?? null,
        reaction: data.reaction ?? null,
        notes: notes.trim() || null,
      });

      // Clear notes and reload
      setNotes("");
      // Reset custom time after saving
      if (useCustomTime) {
        setUseCustomTime(false);
        setCustomTimestamp(new Date());
      }
      await loadRecentFeedings();
      
      successHaptic(); // Haptic feedback for successful save
      Alert.alert("Saved", "Feeding entry saved successfully!");
    } catch (error) {
      console.error("[FeedScreen] Error saving feeding:", error);
      Alert.alert("Error", "Failed to save feeding entry.");
    } finally {
      setIsSaving(false);
    }
  };

  // Get suggested next side based on last feeding
  // Validates: Requirements 3.8 (suggest next breast side)
  const getSuggestedSide = (): BreastSide => {
    const lastBreastfeeding = recentFeedings.find((f) => f.type === "breastfeeding");
    if (lastBreastfeeding?.lastSide) {
      return lastBreastfeeding.lastSide === "left" ? "right" : "left";
    }
    return "left";
  };

  // Format feeding entry for display
  const formatFeedingEntry = (entry: LocalFeedingEntry): string => {
    switch (entry.type) {
      case "breastfeeding": {
        const parts: string[] = [];
        if (entry.leftDuration) parts.push(`L: ${formatTime(entry.leftDuration)}`);
        if (entry.rightDuration) parts.push(`R: ${formatTime(entry.rightDuration)}`);
        return parts.join(" • ") || "Breastfeeding";
      }
      case "bottle":
        return `${entry.amount}ml ${entry.bottleType === "breastMilk" ? "Breast Milk" : entry.bottleType === "formula" ? "Formula" : "Water"}`;
      case "pumping":
        return `${entry.pumpedAmount}ml (${entry.pumpSide})`;
      case "solid":
        return entry.foodType || "Solid food";
      default:
        return "Feeding";
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

  // Get icon for feeding type
  const getFeedingIcon = (type: FeedingType): string => {
    switch (type) {
      case "breastfeeding": return "🤱";
      case "bottle": return "🍼";
      case "pumping": return "💧";
      case "solid": return "🥣";
      default: return "🍽️";
    }
  };

  const suggestedSide = getSuggestedSide();

  // No baby selected state
  if (!activeBaby) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">🍼</Text>
          <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            No Baby Selected
          </Text>
          <Text className={`text-center mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Please select or add a baby profile to start tracking feedings.
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
            Feeding
          </Text>
          <Text className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Track {activeBaby.name}'s feedings
          </Text>
        </View>

        {/* Feeding Type Tabs */}
        {/* Validates: Requirements 14.1 (48x48dp minimum touch targets) */}
        <View className="px-4 py-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible pl-2">
            <View className="flex-row gap-3 pr-8">
              {FEEDING_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  onPress={() => setSelectedType(type.key)}
                  className={`px-6 py-4 rounded-2xl flex-row items-center shadow-sm border-2 transition-all ${
                    selectedType === type.key
                      ? "bg-primary border-primary scale-[1.02]"
                      : darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-transparent"
                  }`}
                  style={styles.minHeight56}
                  accessibilityRole="tab"
                  accessibilityLabel={`${type.label} feeding`}
                  accessibilityState={{ selected: selectedType === type.key }}
                >
                  <Text className="text-xl mr-3">{type.icon}</Text>
                  <Text
                    className={`font-bold text-base ${
                      selectedType === type.key
                        ? "text-white"
                        : darkMode
                        ? "text-gray-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Feeding Form */}
        <View className="px-4 py-2">
          {selectedType === "breastfeeding" && (
            <BreastfeedingForm
              darkMode={darkMode}
              isTimerRunning={!!breastfeedingTimer}
              currentSide={currentSide}
              elapsedTime={elapsedTime}
              leftDuration={leftDuration}
              rightDuration={rightDuration}
              suggestedSide={suggestedSide}
              onStartTimer={handleStartBreastfeeding}
              onSwitchSide={handleSwitchSide}
              onStopTimer={handleStopBreastfeeding}
              formatTime={formatTime}
              showManualEntry={showManualBreastfeeding}
              onToggleManualEntry={() => setShowManualBreastfeeding(!showManualBreastfeeding)}
              manualLeftDuration={manualLeftDuration}
              manualRightDuration={manualRightDuration}
              manualLastSide={manualLastSide}
              onManualLeftChange={setManualLeftDuration}
              onManualRightChange={setManualRightDuration}
              onManualLastSideChange={setManualLastSide}
              onSaveManual={handleSaveManualBreastfeeding}
              isSaving={isSaving}
              useCustomTime={useCustomTime}
              customTimestamp={customTimestamp}
              onToggleCustomTime={() => {
                setUseCustomTime(!useCustomTime);
                if (!useCustomTime) setCustomTimestamp(new Date());
              }}
              onCustomTimestampChange={setCustomTimestamp}
            />
          )}

          {selectedType === "bottle" && (
            <BottleForm
              darkMode={darkMode}
              amount={bottleAmount}
              bottleType={bottleType}
              onAmountChange={setBottleAmount}
              onBottleTypeChange={setBottleType}
              onSave={handleSaveBottle}
              isSaving={isSaving}
            />
          )}

          {selectedType === "pumping" && (
            <PumpingForm
              darkMode={darkMode}
              amount={pumpAmount}
              pumpSide={pumpSide}
              onAmountChange={setPumpAmount}
              onPumpSideChange={setPumpSide}
              onSave={handleSavePumping}
              isSaving={isSaving}
            />
          )}

          {selectedType === "solid" && (
            <SolidFoodForm
              darkMode={darkMode}
              foodType={foodType}
              reaction={foodReaction}
              onFoodTypeChange={setFoodType}
              onReactionChange={setFoodReaction}
              onSave={handleSaveSolid}
              isSaving={isSaving}
            />
          )}

          {/* Custom Time Toggle - Only show when timer is not running */}
          {selectedType !== "breastfeeding" || !breastfeedingTimer ? (
            <View className="mt-4">
              {/* Toggle Button */}
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
                style={styles.minHeight56}
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
                    label="When did this feeding happen?"
                    maximumDate={new Date()}
                  />
                </View>
              )}
            </View>
          ) : null}

          {/* Notes Input */}
          <View className="mt-4">
            <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes..."
              placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
              multiline
              numberOfLines={3}
              className={`p-4 rounded-xl ${
                darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
              }`}
              style={styles.notesInput}
            />
          </View>
        </View>

        {/* Recent Feedings */}
        {/* Validates: Requirements 3.7 (display timeline with feeding type icons) */}
        <View className="px-4 py-4">
          <Text className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Recent Feedings
          </Text>

          {isLoading ? (
            <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Loading...
              </Text>
            </View>
          ) : recentFeedings.length === 0 ? (
            <View className={`p-6 rounded-xl items-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className="text-3xl mb-2">📝</Text>
              <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No feeding entries yet
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {recentFeedings.map((entry) => (
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
                    <Text className="text-xl">{getFeedingIcon(entry.type)}</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {formatFeedingEntry(entry)}
                    </Text>
                    <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {formatTimestamp(entry.timestamp)}
                    </Text>
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
 * Breastfeeding Form Component
 * Timer with left/right side switching, plus manual entry option
 * Validates: Requirements 3.1, 3.2, 3.3, 14.1
 */
function BreastfeedingForm({
  darkMode,
  isTimerRunning,
  currentSide,
  elapsedTime,
  leftDuration,
  rightDuration,
  suggestedSide,
  onStartTimer,
  onSwitchSide,
  onStopTimer,
  formatTime,
  showManualEntry,
  onToggleManualEntry,
  manualLeftDuration,
  manualRightDuration,
  manualLastSide,
  onManualLeftChange,
  onManualRightChange,
  onManualLastSideChange,
  onSaveManual,
  isSaving,
  useCustomTime,
  customTimestamp,
  onToggleCustomTime,
  onCustomTimestampChange,
}: {
  darkMode: boolean;
  isTimerRunning: boolean;
  currentSide: BreastSide;
  elapsedTime: number;
  leftDuration: number;
  rightDuration: number;
  suggestedSide: BreastSide;
  onStartTimer: (side: BreastSide) => void;
  onSwitchSide: () => void;
  onStopTimer: () => void;
  formatTime: (seconds: number) => string;
  showManualEntry: boolean;
  onToggleManualEntry: () => void;
  manualLeftDuration: string;
  manualRightDuration: string;
  manualLastSide: BreastSide;
  onManualLeftChange: (value: string) => void;
  onManualRightChange: (value: string) => void;
  onManualLastSideChange: (side: BreastSide) => void;
  onSaveManual: () => void;
  isSaving: boolean;
  useCustomTime: boolean;
  customTimestamp: Date;
  onToggleCustomTime: () => void;
  onCustomTimestampChange: (date: Date) => void;
}) {
  // Calculate total durations including current elapsed time
  const totalLeft = leftDuration + (currentSide === "left" ? elapsedTime : 0);
  const totalRight = rightDuration + (currentSide === "right" ? elapsedTime : 0);

  // Manual entry form
  if (showManualEntry && !isTimerRunning) {
    return (
      <View className={`p-6 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-foreground"}`}>
            Log Past Breastfeeding
          </Text>
          <Pressable onPress={onToggleManualEntry} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={darkMode ? "#9ca3af" : "#6b7280"} />
          </Pressable>
        </View>

        {/* Custom Time Picker */}
        <Pressable
          onPress={onToggleCustomTime}
          className={`flex-row items-center justify-between p-4 rounded-2xl border-2 mb-4 ${
            useCustomTime
              ? "bg-primary/10 border-primary"
              : darkMode
              ? "bg-gray-700 border-gray-600"
              : "bg-background border-muted"
          }`}
          style={styles.minHeight56}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={useCustomTime ? "time" : "time-outline"}
              size={20}
              color={useCustomTime ? "#8b5cf6" : darkMode ? "#9ca3af" : "#6b7280"}
            />
            <Text
              className={`ml-3 font-medium ${
                useCustomTime ? "text-primary" : darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {useCustomTime ? "Custom time selected" : "Use current time"}
            </Text>
          </View>
          <View
            className={`w-6 h-6 rounded-full items-center justify-center ${
              useCustomTime ? "bg-primary" : darkMode ? "bg-gray-600" : "bg-gray-200"
            }`}
          >
            {useCustomTime && <Ionicons name="checkmark" size={16} color="#ffffff" />}
          </View>
        </Pressable>

        {useCustomTime && (
          <DateTimePicker
            value={customTimestamp}
            onChange={onCustomTimestampChange}
            darkMode={darkMode}
            label="When did this feeding happen?"
            maximumDate={new Date()}
          />
        )}

        {/* Duration Inputs */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className={`text-sm font-bold mb-2 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
              Left (minutes)
            </Text>
            <TextInput
              value={manualLeftDuration}
              onChangeText={onManualLeftChange}
              placeholder="0"
              placeholderTextColor={darkMode ? "#6b7280" : "#D6D3D1"}
              keyboardType="numeric"
              className={`p-4 rounded-2xl text-center text-xl font-bold ${
                darkMode ? "bg-gray-700 text-white" : "bg-background text-foreground border-2 border-muted"
              }`}
            />
          </View>
          <View className="flex-1">
            <Text className={`text-sm font-bold mb-2 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
              Right (minutes)
            </Text>
            <TextInput
              value={manualRightDuration}
              onChangeText={onManualRightChange}
              placeholder="0"
              placeholderTextColor={darkMode ? "#6b7280" : "#D6D3D1"}
              keyboardType="numeric"
              className={`p-4 rounded-2xl text-center text-xl font-bold ${
                darkMode ? "bg-gray-700 text-white" : "bg-background text-foreground border-2 border-muted"
              }`}
            />
          </View>
        </View>

        {/* Last Side Selection */}
        <View className="mb-6">
          <Text className={`text-sm font-bold mb-2 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
            Last side used
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => onManualLastSideChange("left")}
              className={`flex-1 p-3 rounded-2xl items-center border-2 ${
                manualLastSide === "left"
                  ? "bg-primary border-primary"
                  : darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-background border-muted"
              }`}
              style={styles.minHeight48}
            >
              <Text className={`font-bold ${manualLastSide === "left" ? "text-white" : darkMode ? "text-gray-300" : "text-foreground"}`}>
                Left
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onManualLastSideChange("right")}
              className={`flex-1 p-3 rounded-2xl items-center border-2 ${
                manualLastSide === "right"
                  ? "bg-primary border-primary"
                  : darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-background border-muted"
              }`}
              style={styles.minHeight48}
            >
              <Text className={`font-bold ${manualLastSide === "right" ? "text-white" : darkMode ? "text-gray-300" : "text-foreground"}`}>
                Right
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={onToggleManualEntry}
            className={`flex-1 p-4 rounded-2xl items-center border-2 ${darkMode ? "border-gray-600" : "border-muted"}`}
            style={styles.minHeight56}
          >
            <Text className={`font-bold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onSaveManual}
            disabled={isSaving}
            className={`flex-1 p-4 rounded-2xl items-center shadow-lg shadow-primary/30 ${
              isSaving ? "bg-gray-400" : "bg-primary active:bg-primary/80"
            }`}
            style={styles.minHeight56}
          >
            <Text className="font-bold text-white">{isSaving ? "Saving..." : "Save"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!isTimerRunning) {
    // Start state - show side selection buttons
    return (
      <View className={`p-6 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        <Text className={`text-center mb-6 font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Suggested: Start with <Text className="font-bold text-primary">{suggestedSide}</Text> side
        </Text>
        
        <View className="flex-row gap-4">
          {/* Left Side Button */}
          <Pressable
            onPress={() => onStartTimer("left")}
            className={`flex-1 p-6 rounded-2xl items-center border-2 ${
              suggestedSide === "left"
                ? "bg-primary border-primary"
                : darkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-background border-muted"
            }`}
            style={styles.minHeight120}
            accessibilityRole="button"
          >
            <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${
               suggestedSide === "left" ? "bg-white/20" : "bg-muted"
            }`}>
                <Text className="text-2xl">L</Text>
            </View>
            <Text
              className={`font-bold text-lg ${
                suggestedSide === "left" ? "text-white" : darkMode ? "text-white" : "text-foreground"
              }`}
            >
              Left
            </Text>
          </Pressable>

          {/* Right Side Button */}
          <Pressable
            onPress={() => onStartTimer("right")}
            className={`flex-1 p-6 rounded-2xl items-center border-2 ${
              suggestedSide === "right"
                ? "bg-primary border-primary"
                : darkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-background border-muted"
            }`}
            style={styles.minHeight120}
            accessibilityRole="button"
          >
             <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${
               suggestedSide === "right" ? "bg-white/20" : "bg-muted"
            }`}>
                <Text className="text-2xl">R</Text>
            </View>
            <Text
              className={`font-bold text-lg ${
                suggestedSide === "right" ? "text-white" : darkMode ? "text-white" : "text-foreground"
              }`}
            >
              Right
            </Text>
          </Pressable>
        </View>

        {/* Manual Entry Toggle */}
        <Pressable
          onPress={onToggleManualEntry}
          className={`mt-4 flex-row items-center justify-center p-4 rounded-2xl border-2 ${
            darkMode ? "bg-gray-700 border-gray-600" : "bg-background border-muted"
          }`}
          style={styles.minHeight56}
        >
          <Ionicons name="time-outline" size={20} color={darkMode ? "#9ca3af" : "#6b7280"} />
          <Text className={`ml-3 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Log past feeding manually
          </Text>
        </Pressable>
      </View>
    );
  }

  // Timer running state
  return (
    <View className={`p-6 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md`}>
      {/* Current Timer Display */}
      <View className="items-center py-8">
        <View className="relative w-64 h-64 items-center justify-center rounded-full bg-background border-[16px] border-muted">
             {/* Simple visual ring for now, SVG would be better but keeping it simple for native views without extra deps */}
             <View className="absolute inset-2 rounded-full border-[16px] border-primary opacity-20" />
             
             <View className="items-center">
                <Text className={`text-lg font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {currentSide === "left" ? "Left" : "Right"} Side
                </Text>
                <Text className="text-6xl font-black text-foreground tracking-tighter">
                {formatTime(elapsedTime)}
                </Text>
                <Text className="text-primary font-bold mt-2 animate-pulse">
                    Tracking...
                </Text>
             </View>
        </View>
      </View>

      {/* Duration Summary */}
      <View className="flex-row justify-center gap-4 mb-8">
        <View className="items-center bg-muted/50 px-6 py-3 rounded-2xl flex-1">
          <Text className={`text-xs font-bold mb-1 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Left</Text>
          <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-foreground"}`}>
            {formatTime(totalLeft)}
          </Text>
        </View>
        <View className="items-center bg-muted/50 px-6 py-3 rounded-2xl flex-1">
          <Text className={`text-xs font-bold mb-1 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Right</Text>
          <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-foreground"}`}>
            {formatTime(totalRight)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-4">
        {/* Switch Side Button */}
        <Pressable
          onPress={onSwitchSide}
          className={`flex-1 p-4 rounded-2xl items-center border-2 border-primary bg-transparent active:bg-primary/10`}
          style={styles.minHeight64}
        >
          <Text className={`font-bold text-lg text-primary`}>
            Switch Side
          </Text>
        </Pressable>

        {/* Stop Button */}
        <Pressable
          onPress={onStopTimer}
          className="flex-1 p-4 rounded-2xl items-center bg-primary active:bg-primary/80 shadow-lg shadow-primary/30"
          style={styles.minHeight64}
        >
          <Text className="font-bold text-lg text-white">Save Log</Text>
        </Pressable>
      </View>
    </View>
  );
}


/**
 * Bottle Feeding Form Component
 * Validates: Requirements 3.4, 14.1
 */
function BottleForm({
  darkMode,
  amount,
  bottleType,
  onAmountChange,
  onBottleTypeChange,
  onSave,
  isSaving,
}: {
  darkMode: boolean;
  amount: string;
  bottleType: BottleType;
  onAmountChange: (value: string) => void;
  onBottleTypeChange: (type: BottleType) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Amount Input */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Amount (ml)
        </Text>
        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          placeholder="Enter amount in ml"
          placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
          keyboardType="numeric"
          className={`p-4 rounded-xl ${
            darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
          }`}
          style={styles.minHeight48}
        />
      </View>

      {/* Bottle Type Selection */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Type
        </Text>
        <View className="flex-row gap-2">
          {BOTTLE_TYPES.map((type) => (
            <Pressable
              key={type.key}
              onPress={() => onBottleTypeChange(type.key)}
              className={`flex-1 p-3 rounded-xl items-center ${
                bottleType === type.key
                  ? "bg-fuchsia-600"
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-gray-100"
              }`}
              style={styles.minHeight48}
            >
              <Text
                className={`font-medium text-center ${
                  bottleType === type.key
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
      </View>

      {/* Save Button - 48x48dp minimum */}
      <Pressable
        onPress={onSave}
        disabled={isSaving}
        className={`p-4 rounded-xl items-center ${
          isSaving ? "bg-gray-500" : "bg-fuchsia-600 active:bg-fuchsia-700"
        }`}
        style={styles.minHeight56}
        accessibilityRole="button"
        accessibilityLabel={isSaving ? "Saving bottle feeding" : "Save bottle feeding"}
        accessibilityHint="Tap to save the bottle feeding entry"
        accessibilityState={{ disabled: isSaving }}
      >
        <Text className="font-semibold text-white">
          {isSaving ? "Saving..." : "Save Bottle Feeding"}
        </Text>
      </Pressable>
    </View>
  );
}


/**
 * Pumping Form Component
 * Validates: Requirements 3.5, 14.1
 */
function PumpingForm({
  darkMode,
  amount,
  pumpSide,
  onAmountChange,
  onPumpSideChange,
  onSave,
  isSaving,
}: {
  darkMode: boolean;
  amount: string;
  pumpSide: PumpSide;
  onAmountChange: (value: string) => void;
  onPumpSideChange: (side: PumpSide) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <View className={`p-6 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
      {/* Amount Input */}
      <View className="mb-6">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Amount Pumped (ml)
        </Text>
        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          placeholder="0"
          placeholderTextColor={darkMode ? "#6b7280" : "#D6D3D1"}
          keyboardType="numeric"
          className={`p-5 rounded-2xl text-3xl font-bold text-center ${
            darkMode ? "bg-gray-700 text-white" : "bg-background text-foreground border-2 border-muted focus:border-primary"
          }`}
        />
      </View>

      {/* Pump Side Selection */}
      <View className="mb-8">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Side
        </Text>
        <View className="flex-row gap-3">
          {PUMP_SIDES.map((side) => (
            <Pressable
              key={side.key}
              onPress={() => onPumpSideChange(side.key)}
              className={`flex-1 p-4 rounded-xl items-center border-2 ${
                pumpSide === side.key
                  ? "bg-primary border-primary"
                  : darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-background border-muted"
              }`}
            >
              <Text
                className={`font-bold text-sm ${
                  pumpSide === side.key
                    ? "text-white"
                    : darkMode
                    ? "text-gray-300"
                    : "text-foreground"
                }`}
              >
                {side.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <Pressable
        onPress={onSave}
        disabled={isSaving}
        className={`p-4 rounded-2xl items-center shadow-lg shadow-primary/30 ${
          isSaving ? "bg-gray-400" : "bg-primary active:bg-primary/80"
        }`}
        style={styles.minHeight64}
      >
        <Text className="font-bold text-lg text-white">
          {isSaving ? "Saving..." : "Save Pumping Session"}
        </Text>
      </Pressable>
    </View>
  );
}


/**
 * Solid Food Form Component
 * Validates: Requirements 3.6, 14.1
 */
function SolidFoodForm({
  darkMode,
  foodType,
  reaction,
  onFoodTypeChange,
  onReactionChange,
  onSave,
  isSaving,
}: {
  darkMode: boolean;
  foodType: string;
  reaction: string;
  onFoodTypeChange: (value: string) => void;
  onReactionChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <View className={`p-6 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
      {/* Food Type Input */}
      <View className="mb-6">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Food Type
        </Text>
        <TextInput
          value={foodType}
          onChangeText={onFoodTypeChange}
          placeholder="e.g., Banana, Rice cereal..."
          placeholderTextColor={darkMode ? "#6b7280" : "#D6D3D1"}
          className={`p-5 rounded-2xl text-lg font-medium ${
            darkMode ? "bg-gray-700 text-white" : "bg-background text-foreground border-2 border-muted focus:border-primary"
          }`}
        />
      </View>

      {/* Reaction Input */}
      <View className="mb-8">
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted-foreground"}`}>
          Reaction (Optional)
        </Text>
        <TextInput
          value={reaction}
          onChangeText={onReactionChange}
          placeholder="Did they enjoy it?"
          placeholderTextColor={darkMode ? "#6b7280" : "#D6D3D1"}
          multiline
          numberOfLines={2}
          className={`p-5 rounded-2xl text-lg font-medium ${
            darkMode ? "bg-gray-700 text-white" : "bg-background text-foreground border-2 border-muted focus:border-primary"
          }`}
          style={styles.reactionInput}
        />
      </View>

      {/* Save Button */}
      <Pressable
        onPress={onSave}
        disabled={isSaving}
        className={`p-4 rounded-2xl items-center shadow-lg shadow-primary/30 ${
          isSaving ? "bg-gray-400" : "bg-primary active:bg-primary/80"
        }`}
        style={styles.minHeight64}
      >
        <Text className="font-bold text-lg text-white">
          {isSaving ? "Saving..." : "Save Solid Food"}
        </Text>
      </Pressable>
    </View>
  );
}


const styles = StyleSheet.create({
  minHeight48: {
    minHeight: 48,
  },
  minHeight56: {
    minHeight: 56,
  },
  minHeight64: {
    minHeight: 64,
  },
  minHeight120: {
    minHeight: 120,
  },
  closeButton: {
    padding: 8,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  reactionInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
});
