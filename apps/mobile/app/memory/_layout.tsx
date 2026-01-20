import { Stack } from "expo-router";

import { useBabyStore } from "../../src/store";

/**
 * Memory Stack Layout
 * Provides navigation structure for memory/photo journal screens
 */
export default function MemoryLayout() {
  const darkMode = useBabyStore((state) => state.darkMode);

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
          backgroundColor: darkMode ? "#111827" : "#f9fafb",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Memories",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Memory Details",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
