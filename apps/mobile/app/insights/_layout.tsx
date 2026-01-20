import { Stack } from "expo-router";

import { useTheme } from "../../src/hooks";

/**
 * Insights stack layout
 */
export default function InsightsLayout() {
  const { darkMode } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: darkMode ? "#111827" : "#ffffff",
        },
        headerTintColor: darkMode ? "#ffffff" : "#111827",
        headerTitleStyle: {
          fontWeight: "600",
        },
        contentStyle: {
          backgroundColor: darkMode ? "#111827" : "#f3f4f6",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "AI Insights",
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}
