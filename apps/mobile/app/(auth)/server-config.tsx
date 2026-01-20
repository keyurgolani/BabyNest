/**
 * Server Configuration Screen
 * Allows users to configure their self-hosted BabyNest server URL
 * Validates: Requirements 15.3, 14.1 (48x48dp touch targets), 14.3 (dark mode)
 */

import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiClient, saveServerUrl } from "../../src/services/ApiClient";
import { useBabyStore } from "../../src/store";
import { useAuthStore } from "../../src/store/authStore";

// URL validation regex
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export default function ServerConfigScreen() {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const { setServerUrl, serverUrl: existingServerUrl } = useAuthStore();

  // Form state
  const [serverUrl, setServerUrlInput] = useState(existingServerUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate URL format
  const validateUrl = useCallback((url: string): string | null => {
    if (!url.trim()) {
      return "Server URL is required";
    }
    
    // Normalize URL - add https:// if no protocol specified
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    if (!URL_REGEX.test(normalizedUrl)) {
      return "Please enter a valid URL";
    }
    
    return null;
  }, []);

  // Normalize URL for storage
  const normalizeUrl = useCallback((url: string): string => {
    let normalized = url.trim();
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = `https://${normalized}`;
    }
    // Remove trailing slash
    return normalized.replace(/\/+$/, "");
  }, []);

  // Test server connection
  const testConnection = useCallback(async (url: string): Promise<boolean> => {
    try {
      const client = new ApiClient({
        serverUrl: url,
        deviceId: "test-connection",
      });
      
      await client.healthCheck();
      return true;
    } catch (err) {
      console.error("Server connection test failed:", err);
      return false;
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setError(null);
    
    // Validate URL
    const validationError = validateUrl(serverUrl);
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalizedUrl = normalizeUrl(serverUrl);
    setIsLoading(true);

    try {
      // Test connection to server
      const isConnected = await testConnection(normalizedUrl);
      
      if (!isConnected) {
        setError("Could not connect to server. Please check the URL and try again.");
        setIsLoading(false);
        return;
      }

      // Save server URL
      await saveServerUrl(normalizedUrl);
      setServerUrl(normalizedUrl);

      // Navigate to login
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("Server configuration error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl, validateUrl, normalizeUrl, testConnection, setServerUrl, router]);

  // Skip connection test (for offline setup)
  const handleSkipTest = useCallback(() => {
    Alert.alert(
      "Skip Connection Test?",
      "You can configure the server URL without testing the connection. The app will try to connect when you log in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: async () => {
            const validationError = validateUrl(serverUrl);
            if (validationError) {
              setError(validationError);
              return;
            }

            const normalizedUrl = normalizeUrl(serverUrl);
            await saveServerUrl(normalizedUrl);
            setServerUrl(normalizedUrl);
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  }, [serverUrl, validateUrl, normalizeUrl, setServerUrl, router]);

  // Use demo server
  const handleUseDemo = useCallback(() => {
    setServerUrlInput("https://demo.babynest.app");
  }, []);

  return (
    <SafeAreaView
      className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-white"}`}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-5xl mb-4">🖥️</Text>
              <Text
                className={`text-2xl font-bold text-center ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Connect to Your Server
              </Text>
              <Text
                className={`text-center mt-2 px-4 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                BabyNest is self-hosted. Enter your server URL to get started.
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Server URL Input */}
              <View>
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Server URL
                </Text>
                <TextInput
                  className={`min-h-[48px] px-4 rounded-xl text-base ${
                    darkMode
                      ? "bg-gray-800 text-white border-gray-700"
                      : "bg-gray-50 text-gray-900 border-gray-200"
                  } ${error ? "border-2 border-red-500" : "border"}`}
                  placeholder="https://your-server.com"
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  value={serverUrl}
                  onChangeText={(text) => {
                    setServerUrlInput(text);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  editable={!isLoading}
                />
                {error && (
                  <Text className="text-red-500 text-sm mt-1">{error}</Text>
                )}
              </View>

              {/* Demo Server Button */}
              <Pressable
                onPress={handleUseDemo}
                disabled={isLoading}
                className={`min-h-[48px] px-4 py-3 rounded-xl items-center justify-center ${
                  darkMode
                    ? "bg-gray-800 active:bg-gray-700"
                    : "bg-gray-100 active:bg-gray-200"
                } ${isLoading ? "opacity-50" : ""}`}
              >
                <Text
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Use Demo Server
                </Text>
              </Pressable>

              {/* Connect Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading || !serverUrl.trim()}
                className={`min-h-[48px] px-4 py-3 rounded-xl items-center justify-center mt-4 ${
                  isLoading || !serverUrl.trim()
                    ? "bg-purple-400"
                    : darkMode
                    ? "bg-purple-600 active:bg-purple-700"
                    : "bg-purple-600 active:bg-purple-700"
                }`}
                accessibilityRole="button"
                accessibilityLabel={isLoading ? "Connecting to server" : "Connect to server"}
                accessibilityHint="Tap to connect to your BabyNest server"
                accessibilityState={{ disabled: isLoading || !serverUrl.trim() }}
              >
                {isLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-semibold ml-2">
                      Connecting...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Connect to Server
                  </Text>
                )}
              </Pressable>

              {/* Skip Test Link */}
              <Pressable
                onPress={handleSkipTest}
                disabled={isLoading}
                className="min-h-[48px] items-center justify-center"
              >
                <Text
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Skip connection test
                </Text>
              </Pressable>
            </View>

            {/* Info Section */}
            <View className="mt-auto pt-8">
              <View
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-800" : "bg-blue-50"
                }`}
              >
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-blue-400" : "text-blue-700"
                  }`}
                >
                  💡 Self-Hosting Info
                </Text>
                <Text
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-blue-600"
                  }`}
                >
                  BabyNest keeps your baby's data private on your own server.
                  Deploy using Docker Compose or Kubernetes.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
