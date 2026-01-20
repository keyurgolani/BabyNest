/**
 * Growth Screen
 * Track weight, height, and head circumference with WHO percentile display
 * Validates: Requirements 6.1, 6.2, 6.4, 14.1
 */

import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback, useMemo } from "react";
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

import { GrowthChart, ChartTypeTabs } from "../../src/components";
import type { ChartType, GrowthDataPoint } from "../../src/components";
import {
  getLMSParams,
  measurementToZScore,
  zScoreToPercentile,
  type Gender,
} from "../../src/data/whoGrowthStandards";
import { getDatabaseService } from "../../src/database/DatabaseService";
import type { LocalGrowthEntry } from "../../src/database/types";
import { useHaptics } from "../../src/hooks";
import { useBabyStore, useActiveBaby } from "../../src/store";

// Unit system type
type UnitSystem = "metric" | "imperial";

// Conversion constants
const GRAMS_PER_POUND = 453.592;
const GRAMS_PER_OUNCE = 28.3495;
const MM_PER_INCH = 25.4;

/**
 * Convert weight from grams to display units
 */
function convertWeightFromGrams(grams: number, unit: UnitSystem): { value: number; display: string } {
  if (unit === "imperial") {
    const totalOunces = grams / GRAMS_PER_OUNCE;
    const pounds = Math.floor(totalOunces / 16);
    const ounces = Math.round(totalOunces % 16);
    return { value: totalOunces, display: `${pounds} lb ${ounces} oz` };
  }
  const kg = grams / 1000;
  return { value: kg, display: `${kg.toFixed(2)} kg` };
}

/**
 * Convert length from mm to display units
 */
function convertLengthFromMm(mm: number, unit: UnitSystem): { value: number; display: string } {
  if (unit === "imperial") {
    const inches = mm / MM_PER_INCH;
    return { value: inches, display: `${inches.toFixed(1)} in` };
  }
  const cm = mm / 10;
  return { value: cm, display: `${cm.toFixed(1)} cm` };
}

/**
 * Convert weight input to grams
 */
function convertWeightToGrams(value: string, unit: UnitSystem): number | null {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return null;
  if (unit === "imperial") {
    return Math.round(num * GRAMS_PER_POUND);
  }
  return Math.round(num * 1000);
}

/**
 * Convert length input to mm
 */
function convertLengthToMm(value: string, unit: UnitSystem): number | null {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return null;
  if (unit === "imperial") {
    return Math.round(num * MM_PER_INCH);
  }
  return Math.round(num * 10);
}

/**
 * Get percentile color based on value
 */
function getPercentileColor(percentile: number | null): string {
  if (percentile === null) return "text-gray-400";
  if (percentile < 3 || percentile > 97) return "text-red-500";
  if (percentile < 15 || percentile > 85) return "text-amber-500";
  return "text-green-500";
}

/**
 * Get percentile description
 */
function getPercentileDescription(percentile: number | null): string {
  if (percentile === null) return "N/A";
  if (percentile < 3) return "Below 3rd";
  if (percentile < 15) return "3rd-15th";
  if (percentile < 50) return "15th-50th";
  if (percentile < 85) return "50th-85th";
  if (percentile < 97) return "85th-97th";
  return "Above 97th";
}

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
 * Calculate percentiles for growth measurements using WHO standards
 */
function calculatePercentiles(
  weightGrams: number | null,
  heightMm: number | null,
  headMm: number | null,
  dateOfBirth: Date,
  measurementDate: Date,
  gender: string
): { weight: number | null; height: number | null; head: number | null } {
  const diffMs = measurementDate.getTime() - dateOfBirth.getTime();
  const ageMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4375);
  const genderType: Gender = gender === "male" ? "male" : "female";

  const result = {
    weight: null as number | null,
    height: null as number | null,
    head: null as number | null,
  };

  if (weightGrams !== null && weightGrams > 0) {
    const weightKg = weightGrams / 1000;
    const lms = getLMSParams("weight", genderType, ageMonths);
    if (lms) {
      const zScore = measurementToZScore(weightKg, lms);
      result.weight = Math.round(zScoreToPercentile(zScore) * 10) / 10;
    }
  }

  if (heightMm !== null && heightMm > 0) {
    const heightCm = heightMm / 10;
    const lms = getLMSParams("height", genderType, ageMonths);
    if (lms) {
      const zScore = measurementToZScore(heightCm, lms);
      result.height = Math.round(zScoreToPercentile(zScore) * 10) / 10;
    }
  }

  if (headMm !== null && headMm > 0) {
    const headCm = headMm / 10;
    const lms = getLMSParams("headCircumference", genderType, ageMonths);
    if (lms) {
      const zScore = measurementToZScore(headCm, lms);
      result.head = Math.round(zScoreToPercentile(zScore) * 10) / 10;
    }
  }

  return result;
}

export default function GrowthScreen() {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const { successHaptic, lightHaptic } = useHaptics();

  // State
  const [recentMeasurements, setRecentMeasurements] = useState<LocalGrowthEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Chart state
  const [chartType, setChartType] = useState<ChartType>("weight");
  const [selectedDataPoint, setSelectedDataPoint] = useState<GrowthDataPoint | null>(null);

  // Unit system toggle
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

  // Form state
  const [weightInput, setWeightInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [headInput, setHeadInput] = useState("");
  const [notes, setNotes] = useState("");

  // Load recent measurements
  const loadMeasurements = useCallback(async () => {
    if (!activeBaby) return;
    setIsLoading(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();
      const entries = await dbInstance.getAllAsync<LocalGrowthEntry>(
        `SELECT * FROM growth_entries WHERE babyId = ? AND isDeleted = 0 ORDER BY timestamp DESC LIMIT 50`,
        [activeBaby.id]
      );
      setRecentMeasurements(entries);
    } catch (error) {
      console.error("[GrowthScreen] Error loading measurements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  // Transform measurements to chart data points
  const chartData = useMemo((): GrowthDataPoint[] => {
    if (!activeBaby) return [];
    const dob = new Date(activeBaby.dateOfBirth);

    return recentMeasurements
      .filter((entry) => {
        switch (chartType) {
          case "weight":
            return entry.weight !== null;
          case "height":
            return entry.height !== null;
          case "head":
            return entry.headCircumference !== null;
        }
      })
      .map((entry) => {
        const measurementDate = new Date(entry.timestamp);
        const ageMonths = (measurementDate.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);

        let value: number;
        let percentile: number | undefined;

        switch (chartType) {
          case "weight":
            value = (entry.weight || 0) / 1000; // grams to kg
            percentile = entry.weightPercentile ?? undefined;
            break;
          case "height":
            value = (entry.height || 0) / 10; // mm to cm
            percentile = entry.heightPercentile ?? undefined;
            break;
          case "head":
            value = (entry.headCircumference || 0) / 10; // mm to cm
            percentile = entry.headPercentile ?? undefined;
            break;
        }

        return {
          ageMonths,
          value,
          timestamp: entry.timestamp,
          percentile,
        };
      })
      .sort((a, b) => a.ageMonths - b.ageMonths);
  }, [recentMeasurements, chartType, activeBaby]);

  // Check which data types have measurements
  const hasWeightData = recentMeasurements.some((e) => e.weight !== null);
  const hasHeightData = recentMeasurements.some((e) => e.height !== null);
  const hasHeadData = recentMeasurements.some((e) => e.headCircumference !== null);

  // Save new measurement
  const handleSaveMeasurement = async () => {
    if (!activeBaby) return;

    const weight = convertWeightToGrams(weightInput, unitSystem);
    const height = convertLengthToMm(heightInput, unitSystem);
    const head = convertLengthToMm(headInput, unitSystem);

    if (weight === null && height === null && head === null) {
      Alert.alert("Missing Data", "Please enter at least one measurement.");
      return;
    }

    setIsSaving(true);
    try {
      const db = getDatabaseService();
      await db.initialize();
      const dbInstance = await db["getDb"]();

      const now = new Date().toISOString();
      const id = generateUUID();

      const percentiles = calculatePercentiles(
        weight,
        height,
        head,
        new Date(activeBaby.dateOfBirth),
        new Date(),
        activeBaby.gender
      );

      await dbInstance.runAsync(
        `INSERT INTO growth_entries (id, babyId, caregiverId, timestamp, createdAt, updatedAt, syncedAt, isDeleted, localSyncStatus, serverVersion, weight, height, headCircumference, weightPercentile, heightPercentile, headPercentile, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, activeBaby.id, "local-user", now, now, now, null, 0, "pending", null, weight, height, head, percentiles.weight, percentiles.height, percentiles.head, notes.trim() || null]
      );

      setWeightInput("");
      setHeightInput("");
      setHeadInput("");
      setNotes("");
      setShowForm(false);

      await loadMeasurements();
      successHaptic();
      Alert.alert("Saved", "Growth measurement recorded successfully!");
    } catch (error) {
      console.error("[GrowthScreen] Error saving measurement:", error);
      Alert.alert("Error", "Failed to save measurement.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getBabyAgeMonths = (): number => {
    if (!activeBaby) return 0;
    const dob = new Date(activeBaby.dateOfBirth);
    const now = new Date();
    const diffMs = now.getTime() - dob.getTime();
    return diffMs / (1000 * 60 * 60 * 24 * 30.4375);
  };

  const handleUnitToggle = (unit: UnitSystem) => {
    lightHaptic();
    setUnitSystem(unit);
  };

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
    setSelectedDataPoint(null);
  };

  const latestMeasurement = recentMeasurements[0] || null;

  // No baby selected state
  if (!activeBaby) {
    return (
      <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">📏</Text>
          <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            No Baby Selected
          </Text>
          <Text className={`text-center mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Please select or add a baby profile to start tracking growth.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const ageMonths = getBabyAgeMonths();
  const babyGender: Gender = activeBaby.gender === "male" ? "male" : "female";

  return (
    <SafeAreaView className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Growth
          </Text>
          <Text className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Track {activeBaby.name}'s growth • {ageMonths.toFixed(1)} months old
          </Text>
        </View>

        {/* Unit Toggle */}
        <View className="px-4 py-2">
          <View className={`flex-row p-1 rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
            <Pressable
              onPress={() => handleUnitToggle("metric")}
              className={`flex-1 py-3 rounded-lg items-center ${
                unitSystem === "metric" ? "bg-teal-600" : "bg-transparent"
              }`}
              style={styles.minHeight48}
              accessibilityRole="radio"
              accessibilityLabel="Metric units (kilograms and centimeters)"
              accessibilityState={{ selected: unitSystem === "metric" }}
            >
              <Text className={`font-medium ${
                unitSystem === "metric" ? "text-white" : darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Metric (kg/cm)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleUnitToggle("imperial")}
              className={`flex-1 py-3 rounded-lg items-center ${
                unitSystem === "imperial" ? "bg-teal-600" : "bg-transparent"
              }`}
              style={styles.minHeight48}
              accessibilityRole="radio"
              accessibilityLabel="Imperial units (pounds and inches)"
              accessibilityState={{ selected: unitSystem === "imperial" }}
            >
              <Text className={`font-medium ${
                unitSystem === "imperial" ? "text-white" : darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Imperial (lb/in)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Chart Type Tabs */}
        <View className="px-4 py-2">
          <ChartTypeTabs
            selectedType={chartType}
            onTypeChange={handleChartTypeChange}
            darkMode={darkMode}
            hasWeightData={hasWeightData}
            hasHeightData={hasHeightData}
            hasHeadData={hasHeadData}
          />
        </View>

        {/* Interactive Growth Chart */}
        <View className="px-4 py-2">
          <GrowthChart
            gender={babyGender}
            dateOfBirth={new Date(activeBaby.dateOfBirth)}
            data={chartData}
            chartType={chartType}
            unitSystem={unitSystem}
            darkMode={darkMode}
            onDataPointSelect={setSelectedDataPoint}
            selectedPoint={selectedDataPoint}
          />
        </View>

        {/* Latest Measurements Summary */}
        {latestMeasurement && (
          <View className="px-4 py-3">
            <Text className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Latest Measurements
            </Text>
            <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className={`text-xs mb-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                Recorded {formatTimestamp(latestMeasurement.timestamp)}
              </Text>
              
              <View className="gap-4">
                {latestMeasurement.weight && (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">⚖️</Text>
                      <View>
                        <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>Weight</Text>
                        <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {convertWeightFromGrams(latestMeasurement.weight, unitSystem).display}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`text-sm ${getPercentileColor(latestMeasurement.weightPercentile)}`}>
                        {latestMeasurement.weightPercentile !== null 
                          ? `${latestMeasurement.weightPercentile.toFixed(0)}th percentile` : "N/A"}
                      </Text>
                      <Text className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {getPercentileDescription(latestMeasurement.weightPercentile)}
                      </Text>
                    </View>
                  </View>
                )}

                {latestMeasurement.height && (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">📏</Text>
                      <View>
                        <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>Height</Text>
                        <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {convertLengthFromMm(latestMeasurement.height, unitSystem).display}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`text-sm ${getPercentileColor(latestMeasurement.heightPercentile)}`}>
                        {latestMeasurement.heightPercentile !== null 
                          ? `${latestMeasurement.heightPercentile.toFixed(0)}th percentile` : "N/A"}
                      </Text>
                      <Text className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {getPercentileDescription(latestMeasurement.heightPercentile)}
                      </Text>
                    </View>
                  </View>
                )}

                {latestMeasurement.headCircumference && (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">👶</Text>
                      <View>
                        <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>Head</Text>
                        <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {convertLengthFromMm(latestMeasurement.headCircumference, unitSystem).display}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`text-sm ${getPercentileColor(latestMeasurement.headPercentile)}`}>
                        {latestMeasurement.headPercentile !== null 
                          ? `${latestMeasurement.headPercentile.toFixed(0)}th percentile` : "N/A"}
                      </Text>
                      <Text className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {getPercentileDescription(latestMeasurement.headPercentile)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Add Measurement Button */}
        <View className="px-4 py-2">
          <Pressable
            onPress={() => {
              lightHaptic();
              setShowForm(!showForm);
            }}
            className={`flex-row items-center justify-center p-4 rounded-xl ${
              showForm ? darkMode ? "bg-gray-700" : "bg-gray-200" : "bg-teal-600"
            }`}
            style={styles.minHeight56}
            accessibilityRole="button"
            accessibilityLabel={showForm ? "Hide measurement form" : "Add new measurement"}
            accessibilityState={{ expanded: showForm }}
          >
            <Ionicons
              name={showForm ? "chevron-up" : "add-circle-outline"}
              size={24}
              color={showForm ? (darkMode ? "#9ca3af" : "#6b7280") : "#ffffff"}
            />
            <Text className={`ml-2 font-semibold ${
              showForm ? (darkMode ? "text-gray-300" : "text-gray-600") : "text-white"
            }`}>
              {showForm ? "Hide Form" : "Add New Measurement"}
            </Text>
          </Pressable>
        </View>

        {/* Measurement Input Form */}
        {showForm && (
          <View className={`mx-4 p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              New Measurement
            </Text>

            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Weight ({unitSystem === "metric" ? "kg" : "lb"})
              </Text>
              <TextInput
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder={unitSystem === "metric" ? "e.g., 7.5" : "e.g., 16.5"}
                placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                keyboardType="decimal-pad"
                className={`p-4 rounded-xl ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
                style={styles.minHeight48}
              />
            </View>

            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Height/Length ({unitSystem === "metric" ? "cm" : "in"})
              </Text>
              <TextInput
                value={heightInput}
                onChangeText={setHeightInput}
                placeholder={unitSystem === "metric" ? "e.g., 65.5" : "e.g., 25.8"}
                placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                keyboardType="decimal-pad"
                className={`p-4 rounded-xl ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
                style={styles.minHeight48}
              />
            </View>

            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Head Circumference ({unitSystem === "metric" ? "cm" : "in"})
              </Text>
              <TextInput
                value={headInput}
                onChangeText={setHeadInput}
                placeholder={unitSystem === "metric" ? "e.g., 42.0" : "e.g., 16.5"}
                placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                keyboardType="decimal-pad"
                className={`p-4 rounded-xl ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
                style={styles.minHeight48}
              />
            </View>

            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Notes (optional)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes..."
                placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                multiline
                numberOfLines={2}
                className={`p-4 rounded-xl ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}
                style={styles.notesInput}
              />
            </View>

            <Pressable
              onPress={handleSaveMeasurement}
              disabled={isSaving}
              className={`p-4 rounded-xl items-center ${isSaving ? "bg-gray-500" : "bg-teal-600 active:bg-teal-700"}`}
              style={styles.minHeight56}
            >
              <Text className="font-semibold text-white">
                {isSaving ? "Saving..." : "Save Measurement"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Recent Measurements History */}
        <View className="px-4 py-4">
          <Text className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Measurement History
          </Text>

          {isLoading ? (
            <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Loading...
              </Text>
            </View>
          ) : recentMeasurements.length === 0 ? (
            <View className={`p-6 rounded-xl items-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className="text-3xl mb-2">📊</Text>
              <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No measurements recorded yet
              </Text>
              <Text className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                Tap "Add New Measurement" to get started
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {recentMeasurements.slice(0, 10).map((entry) => (
                <View
                  key={entry.id}
                  className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
                >
                  <Text className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {formatTimestamp(entry.timestamp)}
                  </Text>
                  
                  <View className="flex-row flex-wrap gap-4">
                    {entry.weight && (
                      <View className="flex-row items-center">
                        <Text className="mr-1">⚖️</Text>
                        <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {convertWeightFromGrams(entry.weight, unitSystem).display}
                        </Text>
                        {entry.weightPercentile !== null && (
                          <Text className={`ml-1 text-xs ${getPercentileColor(entry.weightPercentile)}`}>
                            ({entry.weightPercentile.toFixed(0)}%)
                          </Text>
                        )}
                      </View>
                    )}

                    {entry.height && (
                      <View className="flex-row items-center">
                        <Text className="mr-1">📏</Text>
                        <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {convertLengthFromMm(entry.height, unitSystem).display}
                        </Text>
                        {entry.heightPercentile !== null && (
                          <Text className={`ml-1 text-xs ${getPercentileColor(entry.heightPercentile)}`}>
                            ({entry.heightPercentile.toFixed(0)}%)
                          </Text>
                        )}
                      </View>
                    )}

                    {entry.headCircumference && (
                      <View className="flex-row items-center">
                        <Text className="mr-1">👶</Text>
                        <Text className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {convertLengthFromMm(entry.headCircumference, unitSystem).display}
                        </Text>
                        {entry.headPercentile !== null && (
                          <Text className={`ml-1 text-xs ${getPercentileColor(entry.headPercentile)}`}>
                            ({entry.headPercentile.toFixed(0)}%)
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  {entry.notes && (
                    <Text className={`text-sm mt-2 italic ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {entry.notes}
                    </Text>
                  )}
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

const styles = StyleSheet.create({
  minHeight48: {
    minHeight: 48,
  },
  minHeight56: {
    minHeight: 56,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
});
