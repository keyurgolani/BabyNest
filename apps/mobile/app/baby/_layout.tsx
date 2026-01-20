import { Stack } from "expo-router";

import { useBabyStore } from "../../src/store";

/**
 * Baby profiles stack layout
 * Validates: Requirements 1.1, 1.3, 1.5 (baby profile management)
 */
export default function BabyLayout() {
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
          title: "Baby Profiles",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Baby Details",
          headerBackTitle: "Profiles",
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: "Edit Baby",
          headerBackTitle: "Back",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "Add Baby",
          headerBackTitle: "Back",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
