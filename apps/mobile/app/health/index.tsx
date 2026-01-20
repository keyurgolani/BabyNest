/**
 * Health Hub Screen
 * Central navigation for health tracking features
 * Validates: Requirements 8.1, 8.3, 8.5, 8.6, 14.1
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBabyStore, useActiveBaby } from "../../src/store";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface HealthCardProps {
  icon: string;
  _ionIcon: IoniconsName;
  title: string;
  description: string;
  count?: number;
  darkMode: boolean;
  onPress: () => void;
  color: string;
}

/**
 * Health category card component
 * Validates: Requirements 14.1 (48x48dp touch targets)
 */
function HealthCard({
  icon,
  _ionIcon,
  title,
  description,
  count,
  darkMode,
  onPress,
  color,
}: HealthCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`p-4 rounded-xl ${
        darkMode ? "bg-gray-800 active:bg-gray-700" : "bg-white active:bg-gray-100"
      }`}
      style={{ minHeight: 100 }}
      accessibilityRole="button"
      accessibilityLabel={`${title}${count !== undefined && count > 0 ? `, ${count} entries` : ""}`}
      accessibilityHint={description}
    >
      <View className="flex-row items-start">
        <View
          className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${color}`}
        >
          <Text className="text-2xl">{icon}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-lg font-semibold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </Text>
            {count !== undefined && count > 0 && (
              <View className="bg-fuchsia-600 px-2 py-0.5 rounded-full">
                <Text className="text-white text-xs font-medium">{count}</Text>
              </View>
            )}
          </View>
          <Text
            className={`text-sm mt-1 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {description}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={darkMode ? "#6b7280" : "#9ca3af"}
          style={{ marginLeft: 8 }}
        />
      </View>
    </Pressable>
  );
}

export default function HealthScreen() {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();

  // No baby selected state
  if (!activeBaby) {
    return (
      <SafeAreaView
        className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-4xl mb-4">🏥</Text>
          <Text
            className={`text-xl font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            No Baby Selected
          </Text>
          <Text
            className={`text-center mt-2 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Please select or add a baby profile to track health records.
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
            Health Records
          </Text>
          <Text
            className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Track {activeBaby.name}'s health information
          </Text>
        </View>

        {/* Quick Stats */}
        <View className="px-4 py-3">
          <View
            className={`p-4 rounded-xl ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Text
              className={`font-semibold mb-3 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Health Overview
            </Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-3xl">💊</Text>
                <Text
                  className={`text-xs mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Medications
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl">💉</Text>
                <Text
                  className={`text-xs mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Vaccinations
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl">🤒</Text>
                <Text
                  className={`text-xs mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Symptoms
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl">👨‍⚕️</Text>
                <Text
                  className={`text-xs mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Visits
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Categories */}
        <View className="px-4 py-3">
          <Text
            className={`text-lg font-semibold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Categories
          </Text>
          <View className="gap-3">
            {/* Medications - Validates: Requirements 8.1 */}
            <HealthCard
              icon="💊"
              ionIcon="medical-outline"
              title="Medications"
              description="Track medications, dosages, and schedules"
              darkMode={darkMode}
              onPress={() => router.push("/health/medications")}
              color={darkMode ? "bg-blue-900/50" : "bg-blue-100"}
            />

            {/* Vaccinations - Validates: Requirements 8.3 */}
            <HealthCard
              icon="💉"
              ionIcon="fitness-outline"
              title="Vaccinations"
              description="Record vaccination history and schedules"
              darkMode={darkMode}
              onPress={() => router.push("/health/vaccinations")}
              color={darkMode ? "bg-green-900/50" : "bg-green-100"}
            />

            {/* Symptoms - Validates: Requirements 8.5 */}
            <HealthCard
              icon="🤒"
              ionIcon="thermometer-outline"
              title="Symptoms"
              description="Log symptoms, severity, and temperature"
              darkMode={darkMode}
              onPress={() => router.push("/health/symptoms")}
              color={darkMode ? "bg-amber-900/50" : "bg-amber-100"}
            />

            {/* Doctor Visits - Validates: Requirements 8.6 */}
            <HealthCard
              icon="👨‍⚕️"
              ionIcon="person-outline"
              title="Doctor Visits"
              description="Track appointments and visit notes"
              darkMode={darkMode}
              onPress={() => router.push("/health/visits")}
              color={darkMode ? "bg-purple-900/50" : "bg-purple-100"}
            />
          </View>
        </View>

        {/* Tips Section */}
        <View className="px-4 py-3">
          <View
            className={`p-4 rounded-xl ${
              darkMode ? "bg-fuchsia-900/30" : "bg-fuchsia-50"
            }`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="information-circle"
                size={20}
                color={darkMode ? "#e879f9" : "#c026d3"}
              />
              <Text
                className={`font-semibold ml-2 ${
                  darkMode ? "text-fuchsia-300" : "text-fuchsia-700"
                }`}
              >
                Health Tip
              </Text>
            </View>
            <Text
              className={`text-sm ${
                darkMode ? "text-fuchsia-200" : "text-fuchsia-600"
              }`}
            >
              Keep all health records up to date for pediatric visits. You can
              export this data to share with your healthcare provider.
            </Text>
          </View>
        </View>

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
