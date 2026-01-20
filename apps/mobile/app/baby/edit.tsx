import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedDatePicker } from "../../src/components/ThemedDatePicker";
import { getDatabaseService } from "../../src/database/DatabaseService";
import type { LocalBaby } from "../../src/database/types";
import { useBabyStore } from "../../src/store";
import type { Gender } from "../../src/store/types";

/**
 * Edit Baby Screen
 * Form for editing an existing baby profile
 * Validates: Requirements 1.3 (edit baby profile and reflect changes immediately)
 */
export default function EditBabyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const darkMode = useBabyStore((state) => state.darkMode);
  const updateBaby = useBabyStore((state) => state.updateBaby);

  const [baby, setBaby] = useState<LocalBaby | null>(null);
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState<Gender>("other");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Load baby data
   */
  useEffect(() => {
    const loadBaby = async () => {
      if (!id) {
        router.back();
        return;
      }

      try {
        const db = getDatabaseService();
        await db.initialize();
        const loadedBaby = await db.getBaby(id);

        if (!loadedBaby) {
          Alert.alert("Error", "Baby profile not found.");
          router.back();
          return;
        }

        setBaby(loadedBaby);
        setName(loadedBaby.name);
        setDateOfBirth(new Date(loadedBaby.dateOfBirth));
        setGender(loadedBaby.gender as Gender);
      } catch (error) {
        console.error("[EditBabyScreen] Error loading baby:", error);
        Alert.alert("Error", "Failed to load baby profile.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadBaby();
  }, [id, router]);

  /**
   * Handle form submission
   * Validates: Requirements 1.3 (update stored information and reflect changes immediately)
   */
  const handleSubmit = async () => {
    if (!baby) return;

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Please enter a name for your baby.");
      return;
    }

    // Validate date of birth (not in the future)
    if (dateOfBirth > new Date()) {
      Alert.alert("Error", "Date of birth cannot be in the future.");
      return;
    }

    setIsSubmitting(true);

    try {
      const db = getDatabaseService();

      // Update baby in database
      await db.updateBaby(baby.id, {
        name: trimmedName,
        dateOfBirth: dateOfBirth.toISOString(),
        gender,
      });

      // Update Zustand store (reflects changes immediately)
      updateBaby(baby.id, {
        name: trimmedName,
        dateOfBirth,
        gender,
      });

      // Navigate back
      router.back();
    } catch (error) {
      console.error("[EditBabyScreen] Error updating baby:", error);
      Alert.alert("Error", "Failed to update baby profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  return (
    <SafeAreaView
      className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="py-4">
            <Text
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Update your baby's information.
            </Text>
          </View>

          {/* Name Input */}
          <View className="mb-4">
            <Text
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter baby's name"
              placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
              className={`p-4 rounded-xl text-base ${
                darkMode
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-900"
              }`}
              style={{ minHeight: 56 }}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Date of Birth */}
          <View className="mb-4">
            <ThemedDatePicker
              value={dateOfBirth}
              onChange={setDateOfBirth}
              darkMode={darkMode}
              maximumDate={new Date()}
              minimumDate={new Date(2000, 0, 1)}
              label="Date of Birth"
            />
          </View>

          {/* Gender Selection */}
          <View className="mb-6">
            <Text
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Gender *
            </Text>
            <View className="flex-row gap-3">
              <GenderOption
                label="Boy"
                emoji="👦"
                selected={gender === "male"}
                darkMode={darkMode}
                onSelect={() => setGender("male")}
              />
              <GenderOption
                label="Girl"
                emoji="👧"
                selected={gender === "female"}
                darkMode={darkMode}
                onSelect={() => setGender("female")}
              />
              <GenderOption
                label="Other"
                emoji="👶"
                selected={gender === "other"}
                darkMode={darkMode}
                onSelect={() => setGender("other")}
              />
            </View>
          </View>

          {/* Photo */}
          <View className="mb-6">
            <Text
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Photo (Optional)
            </Text>
            {baby?.photoUrl ? (
              <View className="items-center">
                <View className="relative">
                  <View
                    className={`w-32 h-32 rounded-full overflow-hidden border-4 ${
                      darkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <Image
                      source={{ uri: baby.photoUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                  <Pressable
                    className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 rounded-full items-center justify-center"
                    onPress={() => {
                      Alert.alert(
                        "Remove Photo",
                        "Are you sure you want to remove this photo?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                const db = getDatabaseService();
                                await db.updateBaby(baby.id, { photoUrl: null });
                                setBaby({ ...baby, photoUrl: null });
                              } catch (error) {
                                console.error("Error removing photo:", error);
                                Alert.alert("Error", "Failed to remove photo.");
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </Pressable>
                </View>
                <Text
                  className={`mt-2 text-xs ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Tap X to remove photo
                </Text>
              </View>
            ) : (
              <Pressable
                className={`p-6 rounded-xl items-center justify-center border-2 border-dashed ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-300"
                }`}
                style={{ minHeight: 120 }}
              >
                <Ionicons
                  name="camera-outline"
                  size={32}
                  color={darkMode ? "#6b7280" : "#9ca3af"}
                />
                <Text
                  className={`mt-2 text-sm ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Coming soon
                </Text>
              </Pressable>
            )}
          </View>

          {/* Submit Button - Validates: Requirements 14.1 (48x48dp touch targets) */}
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`p-4 rounded-xl items-center mb-8 ${
              isSubmitting
                ? "bg-gray-500"
                : "bg-fuchsia-600 active:bg-fuchsia-700"
            }`}
            style={{ minHeight: 56 }}
          >
            <Text className="text-white font-semibold text-base">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Gender Option Component
 * Selectable gender button with emoji and label
 * Validates: Requirements 14.1 (48x48dp touch targets)
 */
function GenderOption({
  label,
  emoji,
  selected,
  darkMode,
  onSelect,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  darkMode: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-1 p-4 rounded-xl items-center ${
        selected
          ? "bg-fuchsia-600"
          : darkMode
          ? "bg-gray-800 active:bg-gray-700"
          : "bg-white active:bg-gray-50"
      }`}
      style={{ minHeight: 80 }}
    >
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text
        className={`text-sm font-medium ${
          selected ? "text-white" : darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
