import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";

import { useAuthStore, useAuthLoading } from "../src/store";

/**
 * Root index - handles initial routing based on auth state
 * Validates: Requirements 14.2 (navigation structure)
 */
export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isServerConfigured = useAuthStore((state) => state.isServerConfigured);
  const isLoading = useAuthLoading();

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  // Redirect based on auth state
  if (!isServerConfigured) {
    return <Redirect href="/(auth)/server-config" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
