import "../src/styles/global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

import { useTheme, useTimerNotifications } from "../src/hooks";
import { requestNotificationPermissions } from "../src/services/NotificationService";
import { useAuthStore, useAuthLoading } from "../src/store";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * Auth protection hook - redirects based on authentication state
 * Validates: Requirements 14.2 (navigation structure with auth flow)
 */
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isServerConfigured = useAuthStore((state) => state.isServerConfigured);
  const isLoading = useAuthLoading();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const currentScreen = segments.length > 1 ? segments[1] : null;

    // If server is not configured, redirect to server config
    if (!isServerConfigured) {
      if (!inAuthGroup || currentScreen !== "server-config") {
        router.replace("/(auth)/server-config");
      }
      return;
    }

    // If not authenticated and not in auth group, redirect to login
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    // If authenticated and in auth group, redirect to main app
    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
      return;
    }
  }, [isAuthenticated, isServerConfigured, segments, isLoading, router]);
}

/**
 * Loading screen component shown during auth state hydration
 */
function LoadingScreen({ darkMode }: { darkMode: boolean }) {
  return (
    <View
      className={`flex-1 items-center justify-center ${
        darkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      <ActivityIndicator
        size="large"
        color={darkMode ? "#c026d3" : "#9333ea"}
      />
    </View>
  );
}

export default function RootLayout() {
  // Use the theme hook for system preference detection
  // Validates: Requirements 14.3 (Support dark mode with system preference detection)
  const { darkMode } = useTheme();
  const isLoading = useAuthLoading();

  // Use the auth protection hook
  useProtectedRoute();

  // Initialize timer notifications
  // Validates: Requirements 14.6 (persistent notification when timer is running)
  useTimerNotifications();

  useEffect(() => {
    // Request notification permissions on app start
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    // Hide splash screen after app is ready
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Show loading screen while auth state is being hydrated
  if (isLoading) {
    return <LoadingScreen darkMode={darkMode} />;
  }

  return (
    <>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: darkMode ? "#1a1a1a" : "#ffffff",
          },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            // Prevent going back to tabs when in auth flow
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}
