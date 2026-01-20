import { Stack } from "expo-router";

import { useBabyStore } from "../../src/store";

/**
 * Health tracking stack layout
 * Validates: Requirements 8.1, 8.3, 8.5, 8.6 (health tracking)
 */
export default function HealthLayout() {
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
          title: "Health",
          headerBackTitle: "More",
        }}
      />
      <Stack.Screen
        name="medications"
        options={{
          title: "Medications",
          headerBackTitle: "Health",
        }}
      />
      <Stack.Screen
        name="vaccinations"
        options={{
          title: "Vaccinations",
          headerBackTitle: "Health",
        }}
      />
      <Stack.Screen
        name="symptoms"
        options={{
          title: "Symptoms",
          headerBackTitle: "Health",
        }}
      />
      <Stack.Screen
        name="visits"
        options={{
          title: "Doctor Visits",
          headerBackTitle: "Health",
        }}
      />
    </Stack>
  );
}
