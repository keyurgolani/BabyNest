/**
 * Symptoms Screen
 * Log symptoms with severity and notes
 * Validates: Requirements 8.5, 14.1
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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDatabaseService } from "../../src/database/DatabaseService";
import type { LocalSymptomEntry, SymptomSeverity } from "../../src/database/types";
import { useBabyStore, useActiveBaby } from "../../src/store";

// Common symptoms for infants
const COMMON_SYMPTOMS = [
  { label: "Fever", icon: "🌡️" },
  { label: "Cough", icon: "😷" },
  { label: "Runny Nose", icon: "🤧" },
  { label: "Congestion", icon: "😤" },
  { label: "Vomiting", icon: "🤮" },
  { label: "Diarrhea", icon: "💩" },
  { label: "Rash", icon: "🔴" },
  { label: "Ear Pain", icon: "👂" },
  { label: "Fussiness", icon: "😢" },
  { label: "Poor Appetite", icon: "🍼" },
  { label: "Lethargy", icon: "😴" },
  { label: "Teething", icon: "🦷" },
  { label: "Other", icon: "❓" },
];

// Severity options
const SEVERITY_OPTIONS: { value: SymptomSeverity; label: string; color: string }[] = [
  { value: "mild", label: "Mild", color: "bg-yellow-500" },
  { value: "moderate", label: "Moderate", color: "bg-orange-500" },
  { value: "severe", label: "Severe", color: "bg-red-500" },
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

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get severity color
 */
function getSeverityColor(severity: SymptomSeverity): string {
  switch (severity) {
    case "mild":
      return "bg-yellow-500";
    case "moderate":
      return "bg-orange-500";
    case "severe":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

/**
 * Get symptom icon
 */
function getSymptomIcon(symptomType: string): string {
  const symptom = COMMON_SYMPTOMS.find((s) => s.label === symptomType);
  return symptom?.icon || "❓";
}

export default function SymptomsScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();

  // State
  const [symptoms, setSymptoms] = useState<LocalSymptomEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSymptomPicker, setShowSymptomPicker] = useState(false);

  // Form state
  const [symptomType, setSymptomType] = useState("");
  const [customSymptom, setCustomSymptom] = useState("");
  const [severity, setSeverity] = useState<SymptomSeverity>("mild");
  const [temperature, setTemperature] = useState("");
  const [notes, setNotes] = useState("");

  // Load symptoms
  const loadSymptoms = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const entries = await dbInstance.getAllAsync<LocalSymptomEntry>(
        `SELECT * FROM symptom_entries WHERE babyId = ? AND isDeleted = 0 ORDER BY timestamp DESC`,
        [activeBaby.id]
      );
      setSymptoms(entries);
    } catch (error) {
      console.error("[SymptomsScreen] Error loading symptoms:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadSymptoms();
  }, [loadSymptoms]);

  // Reset form
  const resetForm = () => {
    setSymptomType("");
    setCustomSymptom("");
    setSeverity("mild");
    setTemperature("");
    setNotes("");
  };

  // Get final symptom type
  const getFinalSymptomType = (): string => {
    if (symptomType === "Other") {
      return customSymptom.trim();
    }
    return symptomType;
  };

  // Handle save symptom - Validates: Requirements 8.5
  const handleSaveSymptom = async () => {
    if (!activeBaby) return;
    const finalType = getFinalSymptomType();
    if (!finalType) {
      Alert.alert("Error", "Please select or enter a symptom.");
      return;
    }

    setIsSaving(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const now = new Date().toISOString();
      const id = generateUUID();

      // Parse temperature if provided
      const tempValue = temperature.trim()
        ? parseFloat(temperature.trim())
        : null;

      await dbInstance.runAsync(
        `INSERT INTO symptom_entries (id, babyId, caregiverId, timestamp, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, symptomType, severity, temperature, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          activeBaby.id,
          "local-user",
          now,
          now,
          now,
          null,
          0,
          "pending",
          null,
          finalType,
          severity,
          tempValue,
          notes.trim() || null,
        ]
      );

      setShowAddModal(false);
      resetForm();
      await loadSymptoms();
      Alert.alert("Success", "Symptom logged successfully!");
    } catch (error) {
      console.error("[SymptomsScreen] Error saving symptom:", error);
      Alert.alert("Error", "Failed to save symptom.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete symptom
  const handleDeleteSymptom = async (id: string) => {
    Alert.alert(
      "Delete Symptom",
      "Are you sure you want to delete this symptom record?",
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
                `UPDATE symptom_entries SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
                [now, id]
              );
              await loadSymptoms();
            } catch (error) {
              console.error("[SymptomsScreen] Error deleting symptom:", error);
              Alert.alert("Error", "Failed to delete symptom.");
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
          <Text className="text-4xl mb-4">🤒</Text>
          <Text
            className={`text-xl font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            No Baby Selected
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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Symptoms
          </Text>
          <Text
            className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Track {activeBaby.name}'s symptoms
          </Text>
        </View>

        {/* Add Button - Validates: Requirements 14.1 */}
        <View className="px-4 py-3">
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="bg-amber-600 active:bg-amber-700 p-4 rounded-xl flex-row items-center justify-center"
            style={{ minHeight: 56 }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Log Symptom</Text>
          </Pressable>
        </View>

        {/* Symptoms List */}
        <View className="px-4 py-3">
          <Text
            className={`text-lg font-semibold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Recent Symptoms
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
          ) : symptoms.length === 0 ? (
            <View
              className={`p-6 rounded-xl items-center ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <Text className="text-4xl mb-2">🤒</Text>
              <Text
                className={`text-center ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No symptoms logged yet.{"\n"}Tap the button above to add one.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {symptoms.map((symptom) => (
                <Pressable
                  key={symptom.id}
                  onLongPress={() => handleDeleteSymptom(symptom.id)}
                  className={`p-4 rounded-xl ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                  style={{ minHeight: 80 }}
                >
                  <View className="flex-row items-start">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        darkMode ? "bg-amber-900/50" : "bg-amber-100"
                      }`}
                    >
                      <Text className="text-lg">
                        {getSymptomIcon(symptom.symptomType)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text
                          className={`font-semibold ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {symptom.symptomType}
                        </Text>
                        <View
                          className={`ml-2 px-2 py-0.5 rounded-full ${getSeverityColor(
                            symptom.severity
                          )}`}
                        >
                          <Text className="text-white text-xs font-medium capitalize">
                            {symptom.severity}
                          </Text>
                        </View>
                      </View>
                      <Text
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatDate(symptom.timestamp)}
                      </Text>
                      {symptom.temperature && (
                        <Text
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          🌡️ {symptom.temperature}°C
                        </Text>
                      )}
                      {symptom.notes && (
                        <Text
                          className={`text-xs mt-1 italic ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          "{symptom.notes}"
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Add Symptom Modal - Validates: Requirements 8.5, 14.1 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1"
            onPress={() => setShowAddModal(false)}
          />
          <View
            className={`rounded-t-3xl p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
            style={{ maxHeight: "85%" }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="w-12 h-1 rounded-full bg-gray-300 self-center mb-4" />

              <Text
                className={`text-xl font-bold text-center mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Log Symptom
              </Text>

              {/* Symptom Type */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Symptom *
                </Text>
                <Pressable
                  onPress={() => setShowSymptomPicker(true)}
                  className={`p-4 rounded-xl flex-row items-center justify-between ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                  style={{ minHeight: 48 }}
                >
                  <Text
                    className={
                      symptomType
                        ? darkMode
                          ? "text-white"
                          : "text-gray-900"
                        : darkMode
                        ? "text-gray-500"
                        : "text-gray-400"
                    }
                  >
                    {symptomType
                      ? `${getSymptomIcon(symptomType)} ${symptomType}`
                      : "Select a symptom"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={darkMode ? "#9ca3af" : "#6b7280"}
                  />
                </Pressable>
              </View>

              {/* Custom Symptom (if Other selected) */}
              {symptomType === "Other" && (
                <View className="mb-4">
                  <Text
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Symptom Description *
                  </Text>
                  <TextInput
                    value={customSymptom}
                    onChangeText={setCustomSymptom}
                    placeholder="Describe the symptom"
                    placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                    className={`p-4 rounded-xl ${
                      darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                    style={{ minHeight: 48 }}
                  />
                </View>
              )}

              {/* Severity */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Severity
                </Text>
                <View className="flex-row gap-2">
                  {SEVERITY_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setSeverity(option.value)}
                      className={`flex-1 p-3 rounded-xl items-center ${
                        severity === option.value
                          ? option.color
                          : darkMode
                          ? "bg-gray-700"
                          : "bg-gray-100"
                      }`}
                      style={{ minHeight: 48 }}
                    >
                      <Text
                        className={`font-medium ${
                          severity === option.value
                            ? "text-white"
                            : darkMode
                            ? "text-gray-300"
                            : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Temperature */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Temperature °C (optional)
                </Text>
                <TextInput
                  value={temperature}
                  onChangeText={setTemperature}
                  placeholder="e.g., 38.5"
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  keyboardType="decimal-pad"
                  className={`p-4 rounded-xl ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  style={{ minHeight: 48 }}
                />
              </View>

              {/* Notes */}
              <View className="mb-6">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Notes (optional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional details..."
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  multiline
                  numberOfLines={3}
                  className={`p-4 rounded-xl ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />
              </View>

              {/* Buttons */}
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className={`flex-1 p-4 rounded-xl items-center ${
                    darkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}
                  style={{ minHeight: 56 }}
                >
                  <Text
                    className={`font-semibold ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveSymptom}
                  disabled={isSaving}
                  className={`flex-1 p-4 rounded-xl items-center ${
                    isSaving
                      ? "bg-gray-500"
                      : "bg-amber-600 active:bg-amber-700"
                  }`}
                  style={{ minHeight: 56 }}
                >
                  <Text className="font-semibold text-white">
                    {isSaving ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Symptom Picker Modal */}
      <Modal
        visible={showSymptomPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSymptomPicker(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1"
            onPress={() => setShowSymptomPicker(false)}
          />
          <View
            className={`rounded-t-3xl p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Text
              className={`text-lg font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Select Symptom
            </Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <View className="flex-row flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <Pressable
                    key={symptom.label}
                    onPress={() => {
                      setSymptomType(symptom.label);
                      setShowSymptomPicker(false);
                    }}
                    className={`px-4 py-3 rounded-xl flex-row items-center ${
                      symptomType === symptom.label
                        ? "bg-amber-600"
                        : darkMode
                        ? "bg-gray-700"
                        : "bg-gray-100"
                    }`}
                    style={{ minHeight: 48 }}
                  >
                    <Text className="mr-2">{symptom.icon}</Text>
                    <Text
                      className={`${
                        symptomType === symptom.label
                          ? "text-white font-semibold"
                          : darkMode
                          ? "text-white"
                          : "text-gray-900"
                      }`}
                    >
                      {symptom.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
