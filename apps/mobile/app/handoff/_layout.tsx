import { Stack } from "expo-router";

import { useBabyStore } from "../../src/store";

/**
 * Handoff screen stack layout
 * Provides navigation structure for caregiver handoff feature
 */
export default function HandoffLayout() {
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
          title: "Caregiver Handoff",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
