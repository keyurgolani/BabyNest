import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDatabaseService } from "../../src/database/DatabaseService";
import type { LocalBaby } from "../../src/database/types";
import { useBabyStore } from "../../src/store";
import type { Baby } from "../../src/store/types";
import { calculateAge, formatDateOfBirth } from "../../src/utils/ageCalculation";

/**
 * Baby List Screen
 * Displays all baby profiles with ability to add, view, and manage
 * Validates: Requirements 1.1, 1.2, 1.5 (baby profile management)
 */
export default function BabyListScreen() {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBabyId = useBabyStore((state) => state.activeBabyId);
  const setActiveBaby = useBabyStore((state) => state.setActiveBaby);
  const setBabies = useBabyStore((state) => state.setBabies);

  const [babies, setBabiesLocal] = useState<LocalBaby[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load babies from database
   */
  const loadBabies = useCallback(async () => {
    try {
      const db = getDatabaseService();
      await db.initialize();
      const loadedBabies = await db.getAllBabies();
      setBabiesLocal(loadedBabies);

      // Sync with Zustand store
      const storeBabiesData: Baby[] = loadedBabies.map((b) => ({
        id: b.id,
        name: b.name,
        dateOfBirth: new Date(b.dateOfBirth),
        gender: b.gender as Baby["gender"],
        photoUrl: b.photoUrl,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      }));
      setBabies(storeBabiesData);

      // If no active baby and we have babies, set the first one as active
      if (!activeBabyId && loadedBabies.length > 0) {
        const firstBaby = loadedBabies[0];
        if (firstBaby) {
          setActiveBaby(firstBaby.id);
        }
      }
    } catch (error) {
      console.error("[BabyListScreen] Error loading babies:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBabyId, setActiveBaby, setBabies]);

  useEffect(() => {
    loadBabies();
  }, [loadBabies]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBabies();
    setRefreshing(false);
  }, [loadBabies]);

  /**
   * Handle selecting a baby as active
   * Validates: Requirements 1.5 (switch between profiles with single tap)
   */
  const handleSelectBaby = (babyId: string) => {
    setActiveBaby(babyId);
  };

  /**
   * Navigate to baby detail screen
   */
  const handleViewBaby = (babyId: string) => {
    router.push(`/baby/${babyId}`);
  };

  /**
   * Navigate to create baby screen
   */
  const handleAddBaby = () => {
    router.push("/baby/create");
  };

  return (
    <SafeAreaView
      className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      edges={["bottom"]}
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkMode ? "#c026d3" : "#a21caf"}
          />
        }
      >
        {/* Header Info */}
        <View className="py-4">
          <Text
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {babies.length === 0
              ? "No babies added yet"
              : `${babies.length} ${babies.length === 1 ? "baby" : "babies"}`}
          </Text>
        </View>

        {/* Baby List */}
        {isLoading ? (
          <View className="py-8">
            <Text
              className={`text-center ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Loading...
            </Text>
          </View>
        ) : babies.length === 0 ? (
          <View className="py-8 items-center">
            <Ionicons
              name="people-outline"
              size={64}
              color={darkMode ? "#4b5563" : "#9ca3af"}
            />
            <Text
              className={`text-lg font-medium mt-4 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              No Baby Profiles
            </Text>
            <Text
              className={`text-sm mt-2 text-center px-8 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Add your first baby profile to start tracking their activities
            </Text>
          </View>
        ) : (
          <View className="gap-3 pb-4">
            {babies.map((baby) => (
              <BabyCard
                key={baby.id}
                baby={baby}
                isActive={baby.id === activeBabyId}
                darkMode={darkMode}
                onSelect={() => handleSelectBaby(baby.id)}
                onView={() => handleViewBaby(baby.id)}
              />
            ))}
          </View>
        )}

        {/* Add Baby Button */}
        <Pressable
          onPress={handleAddBaby}
          className={`flex-row items-center justify-center p-4 rounded-xl mb-8 min-h-[56px] ${
            darkMode
              ? "bg-fuchsia-600 active:bg-fuchsia-700"
              : "bg-fuchsia-600 active:bg-fuchsia-700"
          }`}
          style={{ minHeight: 56 }}
          accessibilityRole="button"
          accessibilityLabel="Add baby"
          accessibilityHint="Tap to create a new baby profile"
        >
          <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
          <Text className="text-white font-semibold ml-2 text-base">
            Add Baby
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Baby Card Component
 * Displays baby info with selection and navigation
 * Validates: Requirements 1.2 (display age), 1.5 (single tap switch), 14.1 (48x48dp touch targets)
 */
function BabyCard({
  baby,
  isActive,
  darkMode,
  onSelect,
  onView,
}: {
  baby: LocalBaby;
  isActive: boolean;
  darkMode: boolean;
  onSelect: () => void;
  onView: () => void;
}) {
  const age = calculateAge(new Date(baby.dateOfBirth));
  const genderEmoji = baby.gender === "male" ? "👦" : baby.gender === "female" ? "👧" : "👶";

  return (
    <Pressable
      onPress={onSelect}
      className={`p-4 rounded-xl ${
        isActive
          ? darkMode
            ? "bg-fuchsia-900/50 border-2 border-fuchsia-500"
            : "bg-fuchsia-50 border-2 border-fuchsia-500"
          : darkMode
          ? "bg-gray-800 active:bg-gray-700"
          : "bg-white active:bg-gray-50"
      }`}
      style={{ minHeight: 80 }}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View
          className={`w-14 h-14 rounded-full items-center justify-center overflow-hidden ${
            isActive
              ? "bg-fuchsia-600"
              : darkMode
              ? "bg-gray-700"
              : "bg-gray-100"
          }`}
        >
          {baby.photoUrl ? (
            <Image
              source={{ uri: baby.photoUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-2xl">{genderEmoji}</Text>
          )}
        </View>

        {/* Info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text
              className={`text-lg font-semibold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {baby.name}
            </Text>
            {isActive && (
              <View className="ml-2 px-2 py-0.5 rounded-full bg-fuchsia-600">
                <Text className="text-xs text-white font-medium">Active</Text>
              </View>
            )}
          </View>
          <Text
            className={`text-sm mt-0.5 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {age.shortDisplayString} old
          </Text>
          <Text
            className={`text-xs mt-0.5 ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Born {formatDateOfBirth(new Date(baby.dateOfBirth))}
          </Text>
        </View>

        {/* View Details Button - 48x48dp touch target */}
        <Pressable
          onPress={onView}
          className={`w-12 h-12 rounded-full items-center justify-center ${
            darkMode
              ? "bg-gray-700 active:bg-gray-600"
              : "bg-gray-100 active:bg-gray-200"
          }`}
          style={{ minWidth: 48, minHeight: 48 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`View ${baby.name}'s profile details`}
          accessibilityHint="Tap to view full profile details"
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={darkMode ? "#9ca3af" : "#6b7280"}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}
