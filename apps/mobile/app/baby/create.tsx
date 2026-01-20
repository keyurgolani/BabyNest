import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedDatePicker } from "../../src/components/ThemedDatePicker";
import { getDatabaseService } from "../../src/database/DatabaseService";
import { useBabyStore } from "../../src/store";
import type { Gender } from "../../src/store/types";

/**
 * Create Baby Screen
 * Form for creating a new baby profile
 * Validates: Requirements 1.1 (create baby profile with name, DOB, gender, photo)
 */
export default function CreateBabyScreen() {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const addBaby = useBabyStore((state) => state.addBaby);

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState<Gender>("other");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle form submission
   * Validates: Requirements 1.1 (store baby's name, DOB, gender, optional photo)
   */
  const handleSubmit = async () => {
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
      await db.initialize();

      // Create baby in database
      const newBaby = await db.createBaby({
        name: trimmedName,
        dateOfBirth: dateOfBirth.toISOString(),
        gender,
        photoUrl: null,
      });

      // Add to Zustand store
      addBaby({
        id: newBaby.id,
        name: newBaby.name,
        dateOfBirth: new Date(newBaby.dateOfBirth),
        gender: newBaby.gender as Gender,
        photoUrl: newBaby.photoUrl,
        createdAt: new Date(newBaby.createdAt),
        updatedAt: new Date(newBaby.updatedAt),
      });

      // Navigate back
      router.back();
    } catch (error) {
      console.error("[CreateBabyScreen] Error creating baby:", error);
      Alert.alert("Error", "Failed to create baby profile. Please try again.");
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
              Enter your baby's information to create a new profile.
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

          {/* Photo Placeholder (future feature) */}
          <View className="mb-6">
            <Text
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Photo (Optional)
            </Text>
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
            accessibilityRole="button"
            accessibilityLabel={isSubmitting ? "Creating baby profile" : "Create baby profile"}
            accessibilityHint="Tap to save the new baby profile"
            accessibilityState={{ disabled: isSubmitting }}
          >
            <Text className="text-white font-semibold text-base">
              {isSubmitting ? "Creating..." : "Create Baby Profile"}
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
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      accessibilityHint={`Tap to select ${label.toLowerCase()}`}
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
