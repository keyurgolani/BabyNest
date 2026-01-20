import { Stack } from "expo-router";

import { useBabyStore } from "../../src/store";

/**
 * Milestone tracking stack layout
 * Validates: Requirements 7.1, 7.2, 7.4 (milestone tracking)
 */
export default function MilestoneLayout() {
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
          title: "Milestones",
          headerBackTitle: "More",
        }}
      />
    </Stack>
  );
}
