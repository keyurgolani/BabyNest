import { Stack } from "expo-router";

import { useBabyStore } from "../../src/store";

/**
 * Auth flow navigation layout
 * Handles navigation between server config, login, and register screens
 * Validates: Requirements 2.1, 2.2, 14.2, 15.3
 */
export default function AuthLayout() {
  const darkMode = useBabyStore((state) => state.darkMode);

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
        },
        headerTintColor: darkMode ? "#ffffff" : "#1f2937",
        headerTitleStyle: {
          fontWeight: "600",
        },
        contentStyle: {
          backgroundColor: darkMode ? "#1a1a1a" : "#ffffff",
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="server-config"
        options={{
          title: "Server Setup",
          headerShown: true,
          // First screen in auth flow, no back button
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: "Sign In",
          headerShown: true,
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Create Account",
          headerShown: true,
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
