import { Stack } from "expo-router";

import { useBabyStore } from "../../src/store";

/**
 * Activity tracking stack layout
 * Validates: Requirements 9.1, 9.2, 9.3 (activity tracking)
 */
export default function ActivityLayout() {
  const darkMode = useBabyStore((state) => state.darkMode);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
        },
        headerTintColor: darkMode ? "#ffffff" : "#1f2937",
        headerTitleStyle: {
          fontWeight: "600",
        },
        contentStyle: {
          backgroundColor: darkMode ? "#111827" : "#f9fafb",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Activities",
          headerBackTitle: "More",
        }}
      />
    </Stack>
  );
}
