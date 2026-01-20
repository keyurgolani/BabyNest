import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDatabaseService } from "../../src/database/DatabaseService";
import type { LocalBaby } from "../../src/database/types";
import { useBabyStore } from "../../src/store";
import {
  calculateAge,
  formatDateOfBirth,
  getAgeDescription,
} from "../../src/utils/ageCalculation";

/**
 * Baby Detail Screen
 * Displays detailed baby information with edit and delete options
 * Validates: Requirements 1.2 (display age), 1.3 (edit profile), 1.4 (delete profile)
 */
export default function BabyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBabyId = useBabyStore((state) => state.activeBabyId);
  const setActiveBaby = useBabyStore((state) => state.setActiveBaby);
  const removeBaby = useBabyStore((state) => state.removeBaby);

  const [baby, setBaby] = useState<LocalBaby | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load baby details from database
   */
  const loadBaby = useCallback(async () => {
    if (!id) return;

    try {
      const db = getDatabaseService();
      await db.initialize();
      const loadedBaby = await db.getBaby(id);
      setBaby(loadedBaby);
    } catch (error) {
      console.error("[BabyDetailScreen] Error loading baby:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBaby();
  }, [loadBaby]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBaby();
    setRefreshing(false);
  }, [loadBaby]);

  /**
   * Handle setting this baby as active
   * Validates: Requirements 1.5 (switch between profiles)
   */
  const handleSetActive = () => {
    if (baby) {
      setActiveBaby(baby.id);
      Alert.alert("Active Baby", `${baby.name} is now the active baby profile.`);
    }
  };

  /**
   * Handle editing baby profile
   * Validates: Requirements 1.3 (edit profile)
   */
  const handleEdit = () => {
    if (baby) {
      router.push(`/baby/edit?id=${baby.id}`);
    }
  };

  /**
   * Handle deleting baby profile
   * Validates: Requirements 1.4 (delete profile with confirmation)
   */
  const handleDelete = () => {
    if (!baby) return;

    Alert.alert(
      "Delete Baby Profile",
      `Are you sure you want to delete ${baby.name}'s profile? This will remove all associated tracking data and cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const db = getDatabaseService();
              await db.deleteBaby(baby.id);
              removeBaby(baby.id);
              router.back();
            } catch (error) {
              console.error("[BabyDetailScreen] Error deleting baby:", error);
              Alert.alert("Error", "Failed to delete baby profile. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
        edges={["bottom"]}
      >
        <View className="flex-1 items-center justify-center">
          <Text className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!baby) {
    return (
      <SafeAreaView
        className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
        edges={["bottom"]}
      >
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={darkMode ? "#4b5563" : "#9ca3af"}
          />
          <Text
            className={`text-lg font-medium mt-4 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Baby Not Found
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 px-6 py-3 rounded-xl bg-fuchsia-600"
            style={styles.minHeight48}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const age = calculateAge(new Date(baby.dateOfBirth));
  const ageDescription = getAgeDescription(new Date(baby.dateOfBirth));
  const isActive = baby.id === activeBabyId;
  const genderEmoji =
    baby.gender === "male" ? "👦" : baby.gender === "female" ? "👧" : "👶";
  const genderLabel =
    baby.gender === "male"
      ? "Boy"
      : baby.gender === "female"
      ? "Girl"
      : "Other";

  return (
    <SafeAreaView
      className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      edges={["bottom"]}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkMode ? "#c026d3" : "#a21caf"}
          />
        }
      >
        {/* Profile Header */}
        <View
          className={`px-4 py-8 items-center ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {/* Avatar */}
          <View
            className={`w-24 h-24 rounded-full items-center justify-center overflow-hidden ${
              isActive ? "bg-fuchsia-600" : darkMode ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            {baby.photoUrl ? (
              <Image
                source={{ uri: baby.photoUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="text-5xl">{genderEmoji}</Text>
            )}
          </View>

          {/* Name */}
          <Text
            className={`text-2xl font-bold mt-4 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {baby.name}
          </Text>

          {/* Age Description - Validates: Requirements 1.2 */}
          <Text
            className={`text-lg mt-1 ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {ageDescription}
          </Text>

          {/* Active Badge */}
          {isActive && (
            <View className="mt-3 px-4 py-1.5 rounded-full bg-fuchsia-600">
              <Text className="text-white font-medium">Active Profile</Text>
            </View>
          )}
        </View>

        {/* Details Section */}
        <View className="px-4 mt-4">
          <Text
            className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Details
          </Text>

          <View
            className={`rounded-xl overflow-hidden ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Date of Birth */}
            <DetailRow
              icon="calendar-outline"
              label="Date of Birth"
              value={formatDateOfBirth(new Date(baby.dateOfBirth))}
              darkMode={darkMode}
            />

            {/* Exact Age - Validates: Requirements 1.2 */}
            <DetailRow
              icon="time-outline"
              label="Age"
              value={age.displayString}
              darkMode={darkMode}
            />

            {/* Gender */}
            <DetailRow
              icon="person-outline"
              label="Gender"
              value={genderLabel}
              darkMode={darkMode}
              isLast
            />
          </View>
        </View>

        {/* Actions Section */}
        <View className="px-4 mt-6">
          <Text
            className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Actions
          </Text>

          <View className="gap-3">
            {/* Set as Active Button - Validates: Requirements 1.5 */}
            {!isActive && (
              <Pressable
                onPress={handleSetActive}
                className={`flex-row items-center p-4 rounded-xl min-h-[56px] ${
                  darkMode
                    ? "bg-gray-800 active:bg-gray-700"
                    : "bg-white active:bg-gray-50"
                }`}
                style={styles.minHeight56}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    darkMode ? "bg-fuchsia-900/50" : "bg-fuchsia-100"
                  }`}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#c026d3"
                  />
                </View>
                <Text
                  className={`flex-1 ml-3 font-medium ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Set as Active Baby
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={darkMode ? "#6b7280" : "#9ca3af"}
                />
              </Pressable>
            )}

            {/* Edit Button - Validates: Requirements 1.3 */}
            <Pressable
              onPress={handleEdit}
              className={`flex-row items-center p-4 rounded-xl min-h-[56px] ${
                darkMode
                  ? "bg-gray-800 active:bg-gray-700"
                  : "bg-white active:bg-gray-50"
              }`}
              style={styles.minHeight56}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  darkMode ? "bg-blue-900/50" : "bg-blue-100"
                }`}
              >
                <Ionicons name="create-outline" size={20} color="#3b82f6" />
              </View>
              <Text
                className={`flex-1 ml-3 font-medium ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Edit Profile
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={darkMode ? "#6b7280" : "#9ca3af"}
              />
            </Pressable>

            {/* Delete Button - Validates: Requirements 1.4 */}
            <Pressable
              onPress={handleDelete}
              className={`flex-row items-center p-4 rounded-xl min-h-[56px] ${
                darkMode
                  ? "bg-gray-800 active:bg-gray-700"
                  : "bg-white active:bg-gray-50"
              }`}
              style={styles.minHeight56}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  darkMode ? "bg-red-900/30" : "bg-red-100"
                }`}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </View>
              <Text className="flex-1 ml-3 font-medium text-red-500">
                Delete Profile
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={darkMode ? "#6b7280" : "#9ca3af"}
              />
            </Pressable>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Detail Row Component
 * Displays a single detail item with icon, label, and value
 */
function DetailRow({
  icon,
  label,
  value,
  darkMode,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  darkMode: boolean;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center px-4 py-3 ${
        !isLast && (darkMode ? "border-b border-gray-700" : "border-b border-gray-100")
      }`}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center ${
          darkMode ? "bg-gray-700" : "bg-gray-100"
        }`}
      >
        <Ionicons
          name={icon}
          size={18}
          color={darkMode ? "#c026d3" : "#9333ea"}
        />
      </View>
      <View className="flex-1 ml-3">
        <Text
          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          {label}
        </Text>
        <Text
          className={`text-base font-medium ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {value}
        </Text>
      </View>
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
});
