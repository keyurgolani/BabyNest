/**
 * Doctor Visits Screen
 * Track doctor visits with date, doctor, and notes
 * Validates: Requirements 8.6, 14.1
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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDatabaseService } from "../../src/database/DatabaseService";
import type { LocalDoctorVisitEntry, VisitType } from "../../src/database/types";
import { useBabyStore, useActiveBaby } from "../../src/store";

// Visit type options
const VISIT_TYPE_OPTIONS: { value: VisitType; label: string; icon: string; color: string }[] = [
  { value: "checkup", label: "Checkup", icon: "📋", color: "bg-blue-500" },
  { value: "sick", label: "Sick Visit", icon: "🤒", color: "bg-amber-500" },
  { value: "emergency", label: "Emergency", icon: "🚨", color: "bg-red-500" },
  { value: "specialist", label: "Specialist", icon: "👨‍⚕️", color: "bg-purple-500" },
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
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get visit type info
 */
function getVisitTypeInfo(visitType: VisitType) {
  return VISIT_TYPE_OPTIONS.find((v) => v.value === visitType) || VISIT_TYPE_OPTIONS[0];
}

export default function VisitsScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();

  // State
  const [visits, setVisits] = useState<LocalDoctorVisitEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [visitType, setVisitType] = useState<VisitType>("checkup");
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  // Load visits
  const loadVisits = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const entries = await dbInstance.getAllAsync<LocalDoctorVisitEntry>(
        `SELECT * FROM doctor_visit_entries WHERE babyId = ? AND isDeleted = 0 ORDER BY timestamp DESC`,
        [activeBaby.id]
      );
      setVisits(entries);
    } catch (error) {
      console.error("[VisitsScreen] Error loading visits:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  // Reset form
  const resetForm = () => {
    setVisitType("checkup");
    setProvider("");
    setLocation("");
    setDiagnosis("");
    setNotes("");
  };

  // Handle save visit - Validates: Requirements 8.6
  const handleSaveVisit = async () => {
    if (!activeBaby) return;
    if (!provider.trim()) {
      Alert.alert("Error", "Please enter the healthcare provider's name.");
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
        `INSERT INTO doctor_visit_entries (id, babyId, caregiverId, timestamp, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, visitType, provider, location, diagnosis, followUpDate, notes)
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
          visitType,
          provider.trim(),
          location.trim() || null,
          diagnosis.trim() || null,
          null,
          notes.trim() || null,
        ]
      );

      setShowAddModal(false);
      resetForm();
      await loadVisits();
      Alert.alert("Success", "Doctor visit recorded successfully!");
    } catch (error) {
      console.error("[VisitsScreen] Error saving visit:", error);
      Alert.alert("Error", "Failed to save visit.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete visit
  const handleDeleteVisit = async (id: string) => {
    Alert.alert(
      "Delete Visit",
      "Are you sure you want to delete this visit record?",
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
                `UPDATE doctor_visit_entries SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
                [now, id]
              );
              await loadVisits();
            } catch (error) {
              console.error("[VisitsScreen] Error deleting visit:", error);
              Alert.alert("Error", "Failed to delete visit.");
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
          <Text className="text-4xl mb-4">👨‍⚕️</Text>
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
            Doctor Visits
          </Text>
          <Text
            className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Track {activeBaby.name}'s medical appointments
          </Text>
        </View>

        {/* Add Button - Validates: Requirements 14.1 */}
        <View className="px-4 py-3">
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="bg-purple-600 active:bg-purple-700 p-4 rounded-xl flex-row items-center justify-center"
            style={styles.minHeight56}
          >
            <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">
              Record Visit
            </Text>
          </Pressable>
        </View>

        {/* Visits List */}
        <View className="px-4 py-3">
          <Text
            className={`text-lg font-semibold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Visit History
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
          ) : visits.length === 0 ? (
            <View
              className={`p-6 rounded-xl items-center ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <Text className="text-4xl mb-2">👨‍⚕️</Text>
              <Text
                className={`text-center ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No visits recorded yet.{"\n"}Tap the button above to add one.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {visits.map((visit) => {
                const typeInfo = getVisitTypeInfo(visit.visitType);
                return (
                  <Pressable
                    key={visit.id}
                    onLongPress={() => handleDeleteVisit(visit.id)}
                    className={`p-4 rounded-xl ${
                      darkMode ? "bg-gray-800" : "bg-white"
                    }`}
                    style={styles.minHeight100}
                  >
                    <View className="flex-row items-start">
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                          darkMode ? "bg-purple-900/50" : "bg-purple-100"
                        }`}
                      >
                        <Text className="text-lg">{typeInfo.icon}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text
                            className={`font-semibold ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {visit.provider}
                          </Text>
                          <View
                            className={`px-2 py-0.5 rounded-full ${typeInfo.color}`}
                          >
                            <Text className="text-white text-xs font-medium">
                              {typeInfo.label}
                            </Text>
                          </View>
                        </View>
                        <Text
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {formatDate(visit.timestamp)}
                        </Text>
                        {visit.location && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons
                              name="location-outline"
                              size={14}
                              color={darkMode ? "#9ca3af" : "#6b7280"}
                            />
                            <Text
                              className={`text-xs ml-1 ${
                                darkMode ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {visit.location}
                            </Text>
                          </View>
                        )}
                        {visit.diagnosis && (
                          <View className="mt-2">
                            <Text
                              className={`text-xs font-medium ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Diagnosis:
                            </Text>
                            <Text
                              className={`text-sm ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {visit.diagnosis}
                            </Text>
                          </View>
                        )}
                        {visit.notes && (
                          <Text
                            className={`text-xs mt-2 italic ${
                              darkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            "{visit.notes}"
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Add Visit Modal - Validates: Requirements 8.6, 14.1 */}
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
            style={styles.maxHeightModal}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="w-12 h-1 rounded-full bg-gray-300 self-center mb-4" />

              <Text
                className={`text-xl font-bold text-center mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Record Doctor Visit
              </Text>

              {/* Visit Type */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Visit Type
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {VISIT_TYPE_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setVisitType(option.value)}
                      className={`px-4 py-3 rounded-xl flex-row items-center ${
                        visitType === option.value
                          ? option.color
                          : darkMode
                          ? "bg-gray-700"
                          : "bg-gray-100"
                      }`}
                      style={styles.minHeight48}
                    >
                      <Text className="mr-2">{option.icon}</Text>
                      <Text
                        className={`font-medium ${
                          visitType === option.value
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

              {/* Provider */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Healthcare Provider *
                </Text>
                <TextInput
                  value={provider}
                  onChangeText={setProvider}
                  placeholder="e.g., Dr. Smith"
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  className={`p-4 rounded-xl ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  style={styles.minHeight48}
                />
              </View>

              {/* Location */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Location (optional)
                </Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g., City Pediatrics Clinic"
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  className={`p-4 rounded-xl ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  style={styles.minHeight48}
                />
              </View>

              {/* Diagnosis */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Diagnosis (optional)
                </Text>
                <TextInput
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                  placeholder="e.g., Ear infection"
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  className={`p-4 rounded-xl ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  style={styles.minHeight48}
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
                  placeholder="Treatment plan, follow-up instructions..."
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  multiline
                  numberOfLines={4}
                  className={`p-4 rounded-xl ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  style={styles.textAreaInput100}
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
                  style={styles.minHeight56}
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
                  onPress={handleSaveVisit}
                  disabled={isSaving}
                  className={`flex-1 p-4 rounded-xl items-center ${
                    isSaving
                      ? "bg-gray-500"
                      : "bg-purple-600 active:bg-purple-700"
                  }`}
                  style={styles.minHeight56}
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
  minHeight100: {
    minHeight: 100,
  },
  maxHeightModal: {
    maxHeight: "85%",
  },
  textAreaInput100: {
    minHeight: 100,
    textAlignVertical: "top",
  },
});
