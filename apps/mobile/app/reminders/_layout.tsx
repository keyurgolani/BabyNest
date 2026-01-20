/**
 * Reminders Layout
 * Stack navigator for reminder screens
 */

import { Stack } from "expo-router";

import { useBabyStore } from "../../src/store";

export default function RemindersLayout() {
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
          title: "Reminders",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: "Edit Reminder",
          headerShown: true,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
