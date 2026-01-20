import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, Pressable, ScrollView, Modal, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, useThemeOptions, useHaptics } from "../../src/hooks";
import { useAuthStore } from "../../src/store";
import type { ThemePreference } from "../../src/store/types";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface MenuItemProps {
  icon: IoniconsName;
  label: string;
  description: string;
  darkMode: boolean;
  onPress?: () => void;
}

/**
 * Menu item component with icon and navigation
 * Validates: Requirements 14.1 (48x48dp touch targets)
 */
function MenuItem({ icon, label, description, darkMode, onPress }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center p-4 rounded-xl min-h-[56px] ${
        darkMode ? "bg-gray-800 active:bg-gray-700" : "bg-white active:bg-gray-100"
      }`}
      style={styles.minHeight56}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={description}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
          darkMode ? "bg-gray-700" : "bg-gray-100"
        }`}
      >
        <Ionicons
          name={icon}
          size={20}
          color={darkMode ? "#c026d3" : "#9333ea"}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
        >
          {label}
        </Text>
        <Text
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          {description}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={darkMode ? "#6b7280" : "#9ca3af"}
      />
    </Pressable>
  );
}

/**
 * More screen - navigation hub for additional features
 * Validates: Requirements 14.2 (navigation structure)
 */
export default function MoreScreen() {
  const router = useRouter();
  const { darkMode, themePreference, setThemePreference, autoNightMode, setAutoNightMode, systemColorScheme, isNightTime } = useTheme();
  const themeOptions = useThemeOptions();
  const logout = useAuthStore((state) => state.logout);
  const { lightHaptic } = useHaptics();
  
  // State for time picker modal
  const [showTimePicker, setShowTimePicker] = useState<"start" | "end" | null>(null);
  const [tempTime, setTempTime] = useState("");

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  /**
   * Get the display label for current theme preference
   */
  const getThemeLabel = () => {
    const option = themeOptions.find((opt) => opt.value === themePreference);
    if (themePreference === "system") {
      return `System (${systemColorScheme === "dark" ? "Dark" : "Light"})`;
    }
    if (themePreference === "auto") {
      return `Auto (${isNightTime ? "Night" : "Day"})`;
    }
    return option?.label ?? "System";
  };

  /**
   * Handle time selection for auto night mode
   */
  const handleTimeSelect = (type: "start" | "end") => {
    setTempTime(type === "start" ? autoNightMode.startTime : autoNightMode.endTime);
    setShowTimePicker(type);
  };

  /**
   * Save the selected time
   */
  const handleTimeSave = () => {
    if (showTimePicker && tempTime.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      lightHaptic();
      if (showTimePicker === "start") {
        setAutoNightMode({ startTime: tempTime });
      } else {
        setAutoNightMode({ endTime: tempTime });
      }
    }
    setShowTimePicker(null);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      edges={["bottom"]}
    >
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Tracking Features Section */}
        <Text
          className={`text-sm font-semibold uppercase tracking-wide mt-4 mb-3 px-1 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Tracking
        </Text>
        <View className="gap-2">
          <MenuItem
            icon="images-outline"
            label="Memories"
            description="Photo journal and timeline"
            darkMode={darkMode}
            onPress={() => router.push("/memory")}
          />
          <MenuItem
            icon="trending-up-outline"
            label="Growth"
            description="Track weight, height, and percentiles"
            darkMode={darkMode}
            onPress={() => router.push("/growth")}
          />
          <MenuItem
            icon="flag-outline"
            label="Milestones"
            description="Track developmental milestones"
            darkMode={darkMode}
            onPress={() => router.push("/milestone")}
          />
          <MenuItem
            icon="medkit-outline"
            label="Health"
            description="Medications, vaccinations, symptoms"
            darkMode={darkMode}
            onPress={() => router.push("/health")}
          />
          <MenuItem
            icon="game-controller-outline"
            label="Activities"
            description="Tummy time, bath, outdoor play"
            darkMode={darkMode}
            onPress={() => router.push("/activity")}
          />
        </View>

        {/* Insights Section */}
        <Text
          className={`text-sm font-semibold uppercase tracking-wide mt-6 mb-3 px-1 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Insights & Reports
        </Text>
        <View className="gap-2">
          <MenuItem
            icon="people-outline"
            label="Caregiver Handoff"
            description="Share baby status with other caregivers"
            darkMode={darkMode}
            onPress={() => router.push("/handoff")}
          />
          <MenuItem
            icon="bulb-outline"
            label="AI Insights"
            description="AI-powered patterns and predictions"
            darkMode={darkMode}
            onPress={() => router.push("/insights")}
          />
          <MenuItem
            icon="document-text-outline"
            label="Reports"
            description="Generate and export reports"
            darkMode={darkMode}
            onPress={() => {
              // TODO: Navigate to reports screen when implemented
            }}
          />
        </View>

        {/* Settings Section */}
        <Text
          className={`text-sm font-semibold uppercase tracking-wide mt-6 mb-3 px-1 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Settings
        </Text>
        <View className="gap-2">
          <MenuItem
            icon="notifications-outline"
            label="Reminders"
            description="Set up feeding and care reminders"
            darkMode={darkMode}
            onPress={() => router.push("/reminders")}
          />
          {/* Theme Selector */}
          {/* Validates: Requirements 14.3 (Support dark mode with system preference detection) */}
          <View
            className={`rounded-xl overflow-hidden ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <View className="p-4 pb-2">
              <View className="flex-row items-center">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <Ionicons
                    name={darkMode ? "moon" : "sunny-outline"}
                    size={20}
                    color={darkMode ? "#c026d3" : "#9333ea"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Appearance
                  </Text>
                  <Text
                    className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {getThemeLabel()}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Theme Options */}
            <View className="flex-row px-4 pb-4 pt-2 gap-2">
              {themeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    lightHaptic();
                    setThemePreference(option.value as ThemePreference);
                  }}
                  className={`flex-1 py-3 px-2 rounded-lg items-center ${
                    themePreference === option.value
                      ? darkMode
                        ? "bg-fuchsia-600"
                        : "bg-purple-600"
                      : darkMode
                      ? "bg-gray-700"
                      : "bg-gray-100"
                  }`}
                  style={styles.minHeight48}
                >
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={
                      themePreference === option.value
                        ? "#ffffff"
                        : darkMode
                        ? "#9ca3af"
                        : "#6b7280"
                    }
                  />
                  <Text
                    className={`text-xs mt-1 font-medium ${
                      themePreference === option.value
                        ? "text-white"
                        : darkMode
                        ? "text-gray-400"
                        : "text-gray-600"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Auto Night Mode Settings - shown when "auto" is selected */}
            {themePreference === "auto" && (
              <View className={`px-4 pb-4 pt-2 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <Text className={`text-xs font-medium mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  NIGHT MODE SCHEDULE
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => handleTimeSelect("start")}
                    className={`flex-1 py-3 px-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
                    style={styles.minHeight48}
                  >
                    <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Dark mode starts
                    </Text>
                    <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {autoNightMode.startTime}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleTimeSelect("end")}
                    className={`flex-1 py-3 px-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
                    style={styles.minHeight48}
                  >
                    <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Light mode starts
                    </Text>
                    <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {autoNightMode.endTime}
                    </Text>
                  </Pressable>
                </View>
                <Text className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {isNightTime ? "🌙 Currently in night mode" : "☀️ Currently in day mode"}
                </Text>
              </View>
            )}
          </View>

          <MenuItem
            icon="people-outline"
            label="Baby Profiles"
            description="Manage baby profiles"
            darkMode={darkMode}
            onPress={() => router.push("/baby")}
          />
          <MenuItem
            icon="server-outline"
            label="Server Settings"
            description="Configure self-hosted server"
            darkMode={darkMode}
            onPress={() => router.push("/(auth)/server-config")}
          />
        </View>

        {/* Account Section */}
        <Text
          className={`text-sm font-semibold uppercase tracking-wide mt-6 mb-3 px-1 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Account
        </Text>
        <View className="gap-2 mb-8">
          <Pressable
            onPress={handleLogout}
            className={`flex-row items-center p-4 rounded-xl min-h-[56px] ${
              darkMode ? "bg-gray-800 active:bg-gray-700" : "bg-white active:bg-gray-100"
            }`}
          >
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                darkMode ? "bg-red-900/30" : "bg-red-100"
              }`}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#ef4444"
              />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-red-500">Sign Out</Text>
              <Text
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Sign out of your account
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
      
      {/* Time Picker Modal for Auto Night Mode */}
      <Modal
        visible={showTimePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(null)}
      >
        <Pressable
          onPress={() => setShowTimePicker(null)}
          className="flex-1 justify-center items-center bg-black/50"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className={`mx-6 p-6 rounded-2xl w-72 ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <Text className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              {showTimePicker === "start" ? "Dark Mode Starts" : "Light Mode Starts"}
            </Text>
            <Text className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Enter time in 24-hour format (HH:MM)
            </Text>
            <TextInput
              value={tempTime}
              onChangeText={setTempTime}
              placeholder="20:00"
              placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              className={`text-2xl font-bold text-center py-4 px-4 rounded-xl mb-4 ${
                darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
              }`}
              autoFocus
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowTimePicker(null)}
                className={`flex-1 py-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                style={styles.minHeight48}
              >
                <Text className={`text-center font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleTimeSave}
                className="flex-1 py-3 rounded-lg bg-fuchsia-600"
                style={styles.minHeight48}
              >
                <Text className="text-center font-medium text-white">
                  Save
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
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
});
