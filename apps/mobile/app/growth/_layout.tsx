import { Stack } from "expo-router";

import { useBabyStore } from "../../src/store";

/**
 * Growth tracking stack layout
 * Validates: Requirements 6.1, 6.2, 6.4 (growth tracking)
 */
export default function GrowthLayout() {
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
          title: "Growth Tracking",
          headerBackTitle: "More",
        }}
      />
    </Stack>
  );
}
