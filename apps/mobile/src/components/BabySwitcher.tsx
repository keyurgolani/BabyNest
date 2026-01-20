import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  StyleSheet,
} from "react-native";

import { getDatabaseService } from "../database/DatabaseService";
import type { LocalBaby } from "../database/types";
import { useHaptics } from "../hooks";
import { useBabyStore, useActiveBaby } from "../store";
import type { Baby } from "../store/types";
import { calculateAge } from "../utils/ageCalculation";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BabySwitcherProps {
  /**
   * Style variant for the switcher
   * - "compact": Small button showing current baby name
   * - "full": Larger button with avatar and age
   */
  variant?: "compact" | "full";
}

/**
 * Baby Switcher Component
 * Allows switching between baby profiles with a single tap
 * Validates: Requirements 1.5 (switch between profiles with single tap)
 * Validates: Requirements 14.7 (haptic feedback for successful actions)
 */
export function BabySwitcher({ variant = "compact" }: BabySwitcherProps) {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const activeBabyId = useBabyStore((state) => state.activeBabyId);
  const setActiveBaby = useBabyStore((state) => state.setActiveBaby);
  const setBabies = useBabyStore((state) => state.setBabies);
  const { lightHaptic } = useHaptics();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [babies, setBabiesLocal] = useState<LocalBaby[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load babies from database when modal opens
   */
  const loadBabies = useCallback(async () => {
    setIsLoading(true);
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
    } catch (error) {
      console.error("[BabySwitcher] Error loading babies:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setBabies]);

  /**
   * Handle opening the modal
   */
  const handleOpen = () => {
    setIsModalVisible(true);
    loadBabies();
  };

  /**
   * Handle selecting a baby
   * Validates: Requirements 1.5 (switch with single tap)
   * Validates: Requirements 14.7 (haptic feedback)
   */
  const handleSelectBaby = (babyId: string) => {
    setActiveBaby(babyId);
    setIsModalVisible(false);
    lightHaptic(); // Haptic feedback for baby selection
  };

  /**
   * Handle navigating to add baby screen
   */
  const handleAddBaby = () => {
    setIsModalVisible(false);
    router.push("/baby/create");
  };

  /**
   * Handle navigating to manage babies screen
   */
  const handleManageBabies = () => {
    setIsModalVisible(false);
    router.push("/baby");
  };

  // Render compact variant
  if (variant === "compact") {
    return (
      <>
        <Pressable
          onPress={handleOpen}
          className={`flex-row items-center px-3 py-2 rounded-full ${
            darkMode
              ? "bg-gray-800 active:bg-gray-700"
              : "bg-gray-100 active:bg-gray-200"
          }`}
          style={styles.compactButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={activeBaby ? `Current baby: ${activeBaby.name}. Tap to switch` : "Select baby"}
          accessibilityHint="Tap to open baby switcher"
        >
          {activeBaby ? (
            <>
              {activeBaby.photoUrl ? (
                <Image
                  source={{ uri: activeBaby.photoUrl }}
                  className="w-6 h-6 rounded-full mr-1"
                  style={styles.compactAvatar}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-base mr-1">
                  {activeBaby.gender === "male"
                    ? "👦"
                    : activeBaby.gender === "female"
                    ? "👧"
                    : "👶"}
                </Text>
              )}
              <Text
                className={`font-medium ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
                numberOfLines={1}
              >
                {activeBaby.name}
              </Text>
            </>
          ) : (
            <Text
              className={`font-medium ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Select Baby
            </Text>
          )}
          <Ionicons
            name="chevron-down"
            size={16}
            color={darkMode ? "#9ca3af" : "#6b7280"}
            style={styles.chevronIcon}
          />
        </Pressable>

        <BabySwitcherModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          babies={babies}
          activeBabyId={activeBabyId}
          darkMode={darkMode}
          isLoading={isLoading}
          onSelectBaby={handleSelectBaby}
          onAddBaby={handleAddBaby}
          onManageBabies={handleManageBabies}
        />
      </>
    );
  }

  // Render full variant
  return (
    <>
      <Pressable
        onPress={handleOpen}
        className={`flex-row items-center p-3 rounded-xl ${
          darkMode
            ? "bg-gray-800 active:bg-gray-700"
            : "bg-white active:bg-gray-50"
        }`}
        style={styles.fullButton}
      >
        {activeBaby ? (
          <>
            {/* Avatar */}
            <View
              className={`w-12 h-12 rounded-full items-center justify-center overflow-hidden ${
                darkMode ? "bg-fuchsia-900/50" : "bg-fuchsia-100"
              }`}
            >
              {activeBaby.photoUrl ? (
                <Image
                  source={{ uri: activeBaby.photoUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-2xl">
                  {activeBaby.gender === "male"
                    ? "👦"
                    : activeBaby.gender === "female"
                    ? "👧"
                    : "👶"}
                </Text>
              )}
            </View>

            {/* Info */}
            <View className="flex-1 ml-3">
              <Text
                className={`font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {activeBaby.name}
              </Text>
              <Text
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {calculateAge(activeBaby.dateOfBirth).shortDisplayString} old
              </Text>
            </View>
          </>
        ) : (
          <>
            <View
              className={`w-12 h-12 rounded-full items-center justify-center ${
                darkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <Ionicons
                name="person-add-outline"
                size={24}
                color={darkMode ? "#9ca3af" : "#6b7280"}
              />
            </View>
            <View className="flex-1 ml-3">
              <Text
                className={`font-medium ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No baby selected
              </Text>
              <Text
                className={`text-sm ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Tap to add or select
              </Text>
            </View>
          </>
        )}

        <Ionicons
          name="chevron-down"
          size={20}
          color={darkMode ? "#9ca3af" : "#6b7280"}
        />
      </Pressable>

      <BabySwitcherModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        babies={babies}
        activeBabyId={activeBabyId}
        darkMode={darkMode}
        isLoading={isLoading}
        onSelectBaby={handleSelectBaby}
        onAddBaby={handleAddBaby}
        onManageBabies={handleManageBabies}
      />
    </>
  );
}

/**
 * Baby Switcher Modal Component
 * Bottom sheet modal for selecting babies
 */
function BabySwitcherModal({
  visible,
  onClose,
  babies,
  activeBabyId,
  darkMode,
  isLoading,
  onSelectBaby,
  onAddBaby,
  onManageBabies,
}: {
  visible: boolean;
  onClose: () => void;
  babies: LocalBaby[];
  activeBabyId: string | null;
  darkMode: boolean;
  isLoading: boolean;
  onSelectBaby: (id: string) => void;
  onAddBaby: () => void;
  onManageBabies: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50"
        onPress={onClose}
      >
        <View className="flex-1" />
        <Pressable
          className={`rounded-t-3xl ${
            darkMode ? "bg-gray-900" : "bg-white"
          }`}
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-2">
            <View
              className={`w-10 h-1 rounded-full ${
                darkMode ? "bg-gray-700" : "bg-gray-300"
              }`}
            />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text
              className={`text-lg font-semibold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Switch Baby
            </Text>
            <Pressable
              onPress={onClose}
              className={`w-8 h-8 rounded-full items-center justify-center ${
                darkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close"
                size={20}
                color={darkMode ? "#9ca3af" : "#6b7280"}
              />
            </Pressable>
          </View>

          {/* Baby List */}
          <ScrollView
            className="px-4"
            showsVerticalScrollIndicator={false}
            style={styles.babyListContainer}
          >
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
                  size={48}
                  color={darkMode ? "#4b5563" : "#9ca3af"}
                />
                <Text
                  className={`mt-3 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No baby profiles yet
                </Text>
              </View>
            ) : (
              <View className="gap-2 pb-2">
                {babies.map((baby) => (
                  <BabyOption
                    key={baby.id}
                    baby={baby}
                    isActive={baby.id === activeBabyId}
                    darkMode={darkMode}
                    onSelect={() => onSelectBaby(baby.id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View className="px-4 py-4 gap-2">
            {/* Add Baby Button */}
            <Pressable
              onPress={onAddBaby}
              className={`flex-row items-center justify-center p-4 rounded-xl ${
                darkMode
                  ? "bg-fuchsia-600 active:bg-fuchsia-700"
                  : "bg-fuchsia-600 active:bg-fuchsia-700"
              }`}
              style={styles.addBabyButton}
            >
              <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Add Baby</Text>
            </Pressable>

            {/* Manage Babies Button */}
            <Pressable
              onPress={onManageBabies}
              className={`flex-row items-center justify-center p-4 rounded-xl ${
                darkMode
                  ? "bg-gray-800 active:bg-gray-700"
                  : "bg-gray-100 active:bg-gray-200"
              }`}
              style={styles.manageBabiesButton}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={darkMode ? "#c026d3" : "#9333ea"}
              />
              <Text
                className={`font-semibold ml-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Manage Profiles
              </Text>
            </Pressable>
          </View>

          {/* Safe area bottom padding */}
          <View className="h-8" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Baby Option Component
 * Single baby option in the switcher modal
 * Validates: Requirements 1.5 (single tap switch), 14.1 (48x48dp touch targets)
 */
function BabyOption({
  baby,
  isActive,
  darkMode,
  onSelect,
}: {
  baby: LocalBaby;
  isActive: boolean;
  darkMode: boolean;
  onSelect: () => void;
}) {
  const age = calculateAge(new Date(baby.dateOfBirth));
  const genderEmoji =
    baby.gender === "male" ? "👦" : baby.gender === "female" ? "👧" : "👶";

  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center p-3 rounded-xl ${
        isActive
          ? darkMode
            ? "bg-fuchsia-900/50 border border-fuchsia-500"
            : "bg-fuchsia-50 border border-fuchsia-500"
          : darkMode
          ? "bg-gray-800 active:bg-gray-700"
          : "bg-gray-50 active:bg-gray-100"
      }`}
      style={styles.babyOptionButton}
      accessibilityRole="radio"
      accessibilityLabel={`${baby.name}, ${age.shortDisplayString} old${isActive ? ", currently selected" : ""}`}
      accessibilityState={{ selected: isActive }}
      accessibilityHint={isActive ? "Currently selected baby" : `Tap to switch to ${baby.name}`}
    >
      {/* Avatar */}
      <View
        className={`w-12 h-12 rounded-full items-center justify-center overflow-hidden ${
          isActive
            ? "bg-fuchsia-600"
            : darkMode
            ? "bg-gray-700"
            : "bg-gray-200"
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
        <Text
          className={`font-semibold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {baby.name}
        </Text>
        <Text
          className={`text-sm ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {age.shortDisplayString} old
        </Text>
      </View>

      {/* Active Indicator */}
      {isActive && (
        <View className="w-6 h-6 rounded-full bg-fuchsia-600 items-center justify-center">
          <Ionicons name="checkmark" size={16} color="#ffffff" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactButton: {
    minHeight: 40,
  },
  compactAvatar: {
    width: 24,
    height: 24,
  },
  chevronIcon: {
    marginLeft: 4,
  },
  fullButton: {
    minHeight: 64,
  },
  modalContainer: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  babyListContainer: {
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  addBabyButton: {
    minHeight: 56,
  },
  manageBabiesButton: {
    minHeight: 56,
  },
  babyOptionButton: {
    minHeight: 64,
  },
});

export default BabySwitcher;
