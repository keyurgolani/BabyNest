/**
 * Vaccinations Screen
 * Track vaccination records with date and type
 * Validates: Requirements 8.3, 14.1
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
import type { LocalVaccinationEntry } from "../../src/database/types";
import { useBabyStore, useActiveBaby } from "../../src/store";

// Common vaccines for infants
const COMMON_VACCINES = [
  "Hepatitis B (HepB)",
  "Rotavirus (RV)",
  "Diphtheria, Tetanus, Pertussis (DTaP)",
  "Haemophilus influenzae type b (Hib)",
  "Pneumococcal (PCV13)",
  "Inactivated Poliovirus (IPV)",
  "Influenza (Flu)",
  "Measles, Mumps, Rubella (MMR)",
  "Varicella (Chickenpox)",
  "Hepatitis A (HepA)",
  "COVID-19",
  "Other",
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

export default function VaccinationsScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();

  // State
  const [vaccinations, setVaccinations] = useState<LocalVaccinationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showVaccinePicker, setShowVaccinePicker] = useState(false);

  // Form state
  const [vaccineName, setVaccineName] = useState("");
  const [customVaccineName, setCustomVaccineName] = useState("");
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Load vaccinations
  const loadVaccinations = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const entries = await dbInstance.getAllAsync<LocalVaccinationEntry>(
        `SELECT * FROM vaccination_entries WHERE babyId = ? AND isDeleted = 0 ORDER BY timestamp DESC`,
        [activeBaby.id]
      );
      setVaccinations(entries);
    } catch (error) {
      console.error("[VaccinationsScreen] Error loading vaccinations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadVaccinations();
  }, [loadVaccinations]);

  // Reset form
  const resetForm = () => {
    setVaccineName("");
    setCustomVaccineName("");
    setProvider("");
    setLocation("");
    setNotes("");
  };

  // Get final vaccine name
  const getFinalVaccineName = (): string => {
    if (vaccineName === "Other") {
      return customVaccineName.trim();
    }
    return vaccineName;
  };

  // Handle save vaccination - Validates: Requirements 8.3
  const handleSaveVaccination = async () => {
    if (!activeBaby) return;
    const finalName = getFinalVaccineName();
    if (!finalName) {
      Alert.alert("Error", "Please select or enter a vaccine name.");
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
        `INSERT INTO vaccination_entries (id, babyId, caregiverId, timestamp, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, vaccineName, provider, location, nextDueAt, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          finalName,
          provider.trim() || null,
          location.trim() || null,
          null,
          notes.trim() || null,
        ]
      );

      setShowAddModal(false);
      resetForm();
      await loadVaccinations();
      Alert.alert("Success", "Vaccination recorded successfully!");
    } catch (error) {
      console.error("[VaccinationsScreen] Error saving vaccination:", error);
      Alert.alert("Error", "Failed to save vaccination.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete vaccination
  const handleDeleteVaccination = async (id: string) => {
    Alert.alert(
      "Delete Vaccination",
      "Are you sure you want to delete this vaccination record?",
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
                `UPDATE vaccination_entries SET isDeleted = 1, updatedAt = ?, localSyncStatus = 'pending' WHERE id = ?`,
                [now, id]
              );
              await loadVaccinations();
            } catch (error) {
              console.error("[VaccinationsScreen] Error deleting vaccination:", error);
              Alert.alert("Error", "Failed to delete vaccination.");
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
          <Text className="text-4xl mb-4">💉</Text>
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
            Vaccinations
          </Text>
          <Text
            className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Track {activeBaby.name}'s vaccination records
          </Text>
        </View>

        {/* Add Button - Validates: Requirements 14.1 */}
        <View className="px-4 py-3">
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="bg-green-600 active:bg-green-700 p-4 rounded-xl flex-row items-center justify-center"
            style={styles.minHeight56}
          >
            <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">
              Record Vaccination
            </Text>
          </Pressable>
        </View>

        {/* Vaccinations List */}
        <View className="px-4 py-3">
          <Text
            className={`text-lg font-semibold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Vaccination History
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
          ) : vaccinations.length === 0 ? (
            <View
              className={`p-6 rounded-xl items-center ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <Text className="text-4xl mb-2">💉</Text>
              <Text
                className={`text-center ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No vaccinations recorded yet.{"\n"}Tap the button above to add one.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {vaccinations.map((vax) => (
                <Pressable
                  key={vax.id}
                  onLongPress={() => handleDeleteVaccination(vax.id)}
                  className={`p-4 rounded-xl ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                  style={styles.minHeight80}
                >
                  <View className="flex-row items-start">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        darkMode ? "bg-green-900/50" : "bg-green-100"
                      }`}
                    >
                      <Text className="text-lg">💉</Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-semibold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {vax.vaccineName}
                      </Text>
                      <Text
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatDate(vax.timestamp)}
                      </Text>
                      {vax.provider && (
                        <Text
                          className={`text-xs mt-1 ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          Provider: {vax.provider}
                        </Text>
                      )}
                      {vax.location && (
                        <Text
                          className={`text-xs ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          Location: {vax.location}
                        </Text>
                      )}
                      {vax.notes && (
                        <Text
                          className={`text-xs mt-1 italic ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          "{vax.notes}"
                        </Text>
                      )}
                    </View>
                    <View className="bg-green-500 px-2 py-1 rounded-full">
                      <Text className="text-white text-xs font-medium">✓</Text>
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

      {/* Add Vaccination Modal - Validates: Requirements 8.3, 14.1 */}
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
                Record Vaccination
              </Text>

              {/* Vaccine Name */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Vaccine *
                </Text>
                <Pressable
                  onPress={() => setShowVaccinePicker(true)}
                  className={`p-4 rounded-xl flex-row items-center justify-between ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                  style={styles.minHeight48}
                >
                  <Text
                    className={
                      vaccineName
                        ? darkMode
                          ? "text-white"
                          : "text-gray-900"
                        : darkMode
                        ? "text-gray-500"
                        : "text-gray-400"
                    }
                  >
                    {vaccineName || "Select a vaccine"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={darkMode ? "#9ca3af" : "#6b7280"}
                  />
                </Pressable>
              </View>

              {/* Custom Vaccine Name (if Other selected) */}
              {vaccineName === "Other" && (
                <View className="mb-4">
                  <Text
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Vaccine Name *
                  </Text>
                  <TextInput
                    value={customVaccineName}
                    onChangeText={setCustomVaccineName}
                    placeholder="Enter vaccine name"
                    placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                    className={`p-4 rounded-xl ${
                      darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                    style={styles.minHeight48}
                  />
                </View>
              )}

              {/* Provider */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Healthcare Provider (optional)
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
                  placeholder="e.g., City Pediatrics"
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
                  placeholder="Any reactions or notes..."
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  multiline
                  numberOfLines={3}
                  className={`p-4 rounded-xl ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  style={styles.textAreaInput80}
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
                  onPress={handleSaveVaccination}
                  disabled={isSaving}
                  className={`flex-1 p-4 rounded-xl items-center ${
                    isSaving
                      ? "bg-gray-500"
                      : "bg-green-600 active:bg-green-700"
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

      {/* Vaccine Picker Modal */}
      <Modal
        visible={showVaccinePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVaccinePicker(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1"
            onPress={() => setShowVaccinePicker(false)}
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
              Select Vaccine
            </Text>
            <ScrollView style={styles.scrollContainer400}>
              {COMMON_VACCINES.map((vaccine) => (
                <Pressable
                  key={vaccine}
                  onPress={() => {
                    setVaccineName(vaccine);
                    setShowVaccinePicker(false);
                  }}
                  className={`p-4 rounded-xl mb-2 ${
                    vaccineName === vaccine
                      ? "bg-green-600"
                      : darkMode
                      ? "bg-gray-700"
                      : "bg-gray-100"
                  }`}
                  style={styles.minHeight48}
                >
                  <Text
                    className={`${
                      vaccineName === vaccine
                        ? "text-white font-semibold"
                        : darkMode
                        ? "text-white"
                        : "text-gray-900"
                    }`}
                  >
                    {vaccine}
                  </Text>
                </Pressable>
              ))}
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
  minHeight80: {
    minHeight: 80,
  },
  maxHeightModal: {
    maxHeight: "85%",
  },
  scrollContainer400: {
    maxHeight: 400,
  },
  textAreaInput80: {
    minHeight: 80,
    textAlignVertical: "top",
  },
});
