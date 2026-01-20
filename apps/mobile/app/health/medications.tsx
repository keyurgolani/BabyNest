/**
 * Medications Screen
 * Track medications with name, dosage, and frequency
 * Validates: Requirements 8.1, 14.1
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
import type { LocalMedicationEntry } from "../../src/database/types";
import { useBabyStore, useActiveBaby } from "../../src/store";

// Common medication frequencies
const FREQUENCY_OPTIONS = [
  { label: "Once daily", value: "once_daily" },
  { label: "Twice daily", value: "twice_daily" },
  { label: "Three times daily", value: "three_times_daily" },
  { label: "Four times daily", value: "four_times_daily" },
  { label: "Every 4 hours", value: "every_4_hours" },
  { label: "Every 6 hours", value: "every_6_hours" },
  { label: "Every 8 hours", value: "every_8_hours" },
  { label: "As needed", value: "as_needed" },
  { label: "Weekly", value: "weekly" },
];

// Common dosage units
const UNIT_OPTIONS = ["ml", "mg", "drops", "tablets", "tsp", "tbsp"];

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
 * Format frequency for display
 */
function formatFrequency(frequency: string): string {
  const option = FREQUENCY_OPTIONS.find((f) => f.value === frequency);
  return option?.label || frequency;
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

export default function MedicationsScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();

  // State
  const [medications, setMedications] = useState<LocalMedicationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState("ml");
  const [frequency, setFrequency] = useState("as_needed");
  const [notes, setNotes] = useState("");
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  // Load medications
  const loadMedications = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const entries = await dbInstance.getAllAsync<LocalMedicationEntry>(
        `SELECT * FROM medication_entries WHERE babyId = ? AND isDeleted = 0 ORDER BY timestamp DESC`,
        [activeBaby.id]
      );
      setMedications(entries);
    } catch (error) {
      console.error("[MedicationsScreen] Error loading medications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  // Reset form
  const resetForm = () => {
    setName("");
    setDosage("");
    setUnit("ml");
    setFrequency("as_needed");
    setNotes("");
  };

  // Handle save medication - Validates: Requirements 8.1
  const handleSaveMedication = async () => {
    if (!activeBaby) return;
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a medication name.");
      return;
    }
    if (!dosage.trim()) {
      Alert.alert("Error", "Please enter a dosage.");
      return;
    }

    setIsSaving(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const now = new Date().toISOString();
      const id = generateUUID();

      await dbInstance.runAsync(
        `INSERT INTO medication_entries (id, babyId, caregiverId, timestamp, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, name, dosage, unit, frequency, nextDueAt, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          name.trim(),
          dosage.trim(),
          unit,
          frequency,
          null,
          notes.trim() || null,
        ]
      );

      setShowAddModal(false);
      resetForm();
      await loadMedications();
      Alert.alert("Success", "Medication logged successfully!");
    } catch (error) {
      console.error("[MedicationsScreen] Error saving medication:", error);
      Alert.alert("Error", "Failed to save medication.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete medication
  const handleDeleteMedication = async (id: string) => {
    Alert.alert(
      "Delete Medication",
      "Are you sure you want to delete this medication record?",
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
                `UPDATE medication_entries SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
                [now, id]
              );
              await loadMedications();
            } catch (error) {
              console.error("[MedicationsScreen] Error deleting medication:", error);
              Alert.alert("Error", "Failed to delete medication.");
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
          <Text className="text-4xl mb-4">💊</Text>
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
            Medications
          </Text>
          <Text
            className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Track {activeBaby.name}'s medications
          </Text>
        </View>

        {/* Add Button - Validates: Requirements 14.1 */}
        <View className="px-4 py-3">
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="bg-fuchsia-600 active:bg-fuchsia-700 p-4 rounded-xl flex-row items-center justify-center"
            style={{ minHeight: 56 }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">
              Log Medication
            </Text>
          </Pressable>
        </View>

        {/* Medications List */}
        <View className="px-4 py-3">
          <Text
            className={`text-lg font-semibold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Recent Medications
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
          ) : medications.length === 0 ? (
            <View
              className={`p-6 rounded-xl items-center ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <Text className="text-4xl mb-2">💊</Text>
              <Text
                className={`text-center ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No medications logged yet.{"\n"}Tap the button above to add one.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {medications.map((med) => (
                <Pressable
                  key={med.id}
                  onLongPress={() => handleDeleteMedication(med.id)}
                  className={`p-4 rounded-xl ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                  style={{ minHeight: 80 }}
                >
                  <View className="flex-row items-start">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        darkMode ? "bg-blue-900/50" : "bg-blue-100"
                      }`}
                    >
                      <Text className="text-lg">💊</Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-semibold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {med.name}
                      </Text>
                      <Text
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {med.dosage} {med.unit} • {formatFrequency(med.frequency)}
                      </Text>
                      <Text
                        className={`text-xs mt-1 ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {formatDate(med.timestamp)}
                      </Text>
                      {med.notes && (
                        <Text
                          className={`text-xs mt-1 italic ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          "{med.notes}"
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

      {/* Add Medication Modal - Validates: Requirements 8.1, 14.1 */}
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
                Log Medication
              </Text>

              {/* Medication Name */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Medication Name *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Tylenol, Amoxicillin"
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  className={`p-4 rounded-xl ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  style={{ minHeight: 48 }}
                />
              </View>

              {/* Dosage */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Dosage *
                </Text>
                <View className="flex-row gap-2">
                  <TextInput
                    value={dosage}
                    onChangeText={setDosage}
                    placeholder="e.g., 5"
                    placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                    keyboardType="decimal-pad"
                    className={`flex-1 p-4 rounded-xl ${
                      darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                    style={{ minHeight: 48 }}
                  />
                  <Pressable
                    onPress={() => setShowUnitPicker(true)}
                    className={`px-4 rounded-xl justify-center ${
                      darkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                    style={{ minHeight: 48, minWidth: 80 }}
                  >
                    <Text
                      className={`text-center ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Frequency */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Frequency
                </Text>
                <Pressable
                  onPress={() => setShowFrequencyPicker(true)}
                  className={`p-4 rounded-xl flex-row items-center justify-between ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                  style={{ minHeight: 48 }}
                >
                  <Text
                    className={darkMode ? "text-white" : "text-gray-900"}
                  >
                    {formatFrequency(frequency)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={darkMode ? "#9ca3af" : "#6b7280"}
                  />
                </Pressable>
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
                  placeholder="Any additional notes..."
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
                  onPress={handleSaveMedication}
                  disabled={isSaving}
                  className={`flex-1 p-4 rounded-xl items-center ${
                    isSaving
                      ? "bg-gray-500"
                      : "bg-fuchsia-600 active:bg-fuchsia-700"
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

      {/* Frequency Picker Modal */}
      <Modal
        visible={showFrequencyPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1"
            onPress={() => setShowFrequencyPicker(false)}
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
              Select Frequency
            </Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {FREQUENCY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setFrequency(option.value);
                    setShowFrequencyPicker(false);
                  }}
                  className={`p-4 rounded-xl mb-2 ${
                    frequency === option.value
                      ? "bg-fuchsia-600"
                      : darkMode
                      ? "bg-gray-700"
                      : "bg-gray-100"
                  }`}
                  style={{ minHeight: 48 }}
                >
                  <Text
                    className={`${
                      frequency === option.value
                        ? "text-white font-semibold"
                        : darkMode
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Unit Picker Modal */}
      <Modal
        visible={showUnitPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1"
            onPress={() => setShowUnitPicker(false)}
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
              Select Unit
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {UNIT_OPTIONS.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => {
                    setUnit(u);
                    setShowUnitPicker(false);
                  }}
                  className={`px-6 py-3 rounded-xl ${
                    unit === u
                      ? "bg-fuchsia-600"
                      : darkMode
                      ? "bg-gray-700"
                      : "bg-gray-100"
                  }`}
                  style={{ minHeight: 48 }}
                >
                  <Text
                    className={`${
                      unit === u
                        ? "text-white font-semibold"
                        : darkMode
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
