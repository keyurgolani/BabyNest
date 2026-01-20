/**
 * Login Screen
 * Allows users to sign in to their BabyNest account
 * Validates: Requirements 2.1, 2.2, 14.1 (48x48dp touch targets), 14.3 (dark mode)
 */

import { useRouter, Link } from "expo-router";
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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { saveAuthToken } from "../../src/services/ApiClient";
import { useBabyStore } from "../../src/store";
import { useAuthStore } from "../../src/store/authStore";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const { serverUrl, setAuthenticated, clearServerUrl } = useAuthStore();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: LoginFormErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  // Handle login
  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;
    if (!serverUrl) {
      setErrors({ general: "Server URL not configured" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Make login request
      const response = await fetch(`${serverUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          setErrors({ general: "Invalid email or password" });
        } else if (response.status === 423) {
          setErrors({
            general: "Account temporarily locked. Please try again later.",
          });
        } else if (data.message) {
          setErrors({ general: data.message });
        } else {
          setErrors({ general: "Login failed. Please try again." });
        }
        return;
      }

      // Save auth token
      await saveAuthToken(data.accessToken);

      // Update auth store
      setAuthenticated(
        {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        },
        data.accessToken,
        data.refreshToken
      );

      // Navigation will be handled by the auth protection hook
    } catch (err) {
      console.error("Login error:", err);
      setErrors({
        general: "Could not connect to server. Please check your connection.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, serverUrl, validateForm, setAuthenticated]);

  // Handle change server
  const handleChangeServer = useCallback(() => {
    clearServerUrl();
    router.replace("/(auth)/server-config");
  }, [clearServerUrl, router]);

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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-5xl mb-4">🔐</Text>
              <Text
                className={`text-2xl font-bold text-center ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Welcome Back
              </Text>
              <Text
                className={`text-center mt-2 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Sign in to your BabyNest account
              </Text>
            </View>

            {/* Server Info */}
            <Pressable
              onPress={handleChangeServer}
              className={`flex-row items-center justify-between p-3 rounded-xl mb-6 min-h-[48px] ${
                darkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <View className="flex-1 mr-2">
                <Text
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Connected to
                </Text>
                <Text
                  className={`text-sm font-medium ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                  numberOfLines={1}
                >
                  {serverUrl}
                </Text>
              </View>
              <Text
                className={`text-sm ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              >
                Change
              </Text>
            </Pressable>

            {/* General Error */}
            {errors.general && (
              <View className="bg-red-100 border border-red-400 rounded-xl p-3 mb-4">
                <Text className="text-red-700 text-sm text-center">
                  {errors.general}
                </Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-4">
              {/* Email Input */}
              <View>
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Email
                </Text>
                <TextInput
                  className={`min-h-[48px] px-4 rounded-xl text-base ${
                    darkMode
                      ? "bg-gray-800 text-white border-gray-700"
                      : "bg-gray-50 text-gray-900 border-gray-200"
                  } ${errors.email ? "border-2 border-red-500" : "border"}`}
                  placeholder="you@example.com"
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  editable={!isLoading}
                />
                {errors.email && (
                  <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View className="mt-4">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    className={`min-h-[48px] px-4 pr-16 rounded-xl text-base ${
                      darkMode
                        ? "bg-gray-800 text-white border-gray-700"
                        : "bg-gray-50 text-gray-900 border-gray-200"
                    } ${errors.password ? "border-2 border-red-500" : "border"}`}
                    placeholder="Enter your password"
                    placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password)
                        setErrors((e) => ({ ...e, password: undefined }));
                    }}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="password"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    editable={!isLoading}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 bottom-0 px-4 justify-center min-w-[48px] min-h-[48px]"
                  >
                    <Text className="text-lg">{showPassword ? "🙈" : "👁️"}</Text>
                  </Pressable>
                </View>
                {errors.password && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Login Button */}
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                className={`min-h-[48px] px-4 py-3 rounded-xl items-center justify-center mt-6 ${
                  isLoading
                    ? "bg-purple-400"
                    : darkMode
                    ? "bg-purple-600 active:bg-purple-700"
                    : "bg-purple-600 active:bg-purple-700"
                }`}
                accessibilityRole="button"
                accessibilityLabel={isLoading ? "Signing in" : "Sign in"}
                accessibilityHint="Tap to sign in to your account"
                accessibilityState={{ disabled: isLoading }}
              >
                {isLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-semibold ml-2">
                      Signing in...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Sign In
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Register Link */}
            <View className="mt-8 items-center">
              <Text
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Don't have an account?
              </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable
                  className="min-h-[48px] px-4 py-3 items-center justify-center"
                  disabled={isLoading}
                >
                  <Text
                    className={`text-base font-semibold ${
                      darkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  >
                    Create Account
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});
