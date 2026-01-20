/**
 * Register Screen
 * Allows users to create a new BabyNest account
 * Validates: Requirements 2.1, 14.1 (48x48dp touch targets), 14.3 (dark mode)
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

interface RegisterFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const { serverUrl, setAuthenticated, clearServerUrl } = useAuthStore();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterFormErrors>({});

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: RegisterFormErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.trim().length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, password, confirmPassword]);

  // Handle registration
  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;
    if (!serverUrl) {
      setErrors({ general: "Server URL not configured" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Make registration request
      const response = await fetch(`${serverUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          setErrors({ email: "An account with this email already exists" });
        } else if (response.status === 400 && data.message) {
          // Parse validation errors
          if (Array.isArray(data.message)) {
            const fieldErrors: RegisterFormErrors = {};
            data.message.forEach((msg: string) => {
              if (msg.toLowerCase().includes("email")) {
                fieldErrors.email = msg;
              } else if (msg.toLowerCase().includes("password")) {
                fieldErrors.password = msg;
              } else if (msg.toLowerCase().includes("name")) {
                fieldErrors.name = msg;
              } else {
                fieldErrors.general = msg;
              }
            });
            setErrors(fieldErrors);
          } else {
            setErrors({ general: data.message });
          }
        } else {
          setErrors({ general: "Registration failed. Please try again." });
        }
        return;
      }

      // Save auth token if returned (auto-login after registration)
      if (data.accessToken) {
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
      } else {
        // If no auto-login, redirect to login page
        router.replace("/(auth)/login");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setErrors({
        general: "Could not connect to server. Please check your connection.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [name, email, password, serverUrl, validateForm, setAuthenticated, router]);

  // Handle change server
  const handleChangeServer = useCallback(() => {
    clearServerUrl();
    router.replace("/(auth)/server-config");
  }, [clearServerUrl, router]);

  // Clear field error on change
  const clearFieldError = useCallback(
    (field: keyof RegisterFormErrors) => {
      if (errors[field]) {
        setErrors((e) => ({ ...e, [field]: undefined }));
      }
    },
    [errors]
  );

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
            <View className="items-center mb-6">
              <Text className="text-5xl mb-4">📝</Text>
              <Text
                className={`text-2xl font-bold text-center ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Create Account
              </Text>
              <Text
                className={`text-center mt-2 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Start tracking your baby's journey
              </Text>
            </View>

            {/* Server Info */}
            <Pressable
              onPress={handleChangeServer}
              className={`flex-row items-center justify-between p-3 rounded-xl mb-4 min-h-[48px] ${
                darkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <View className="flex-1 mr-2">
                <Text
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Registering on
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
            <View className="space-y-3">
              {/* Name Input */}
              <View>
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Full Name
                </Text>
                <TextInput
                  className={`min-h-[48px] px-4 rounded-xl text-base ${
                    darkMode
                      ? "bg-gray-800 text-white border-gray-700"
                      : "bg-gray-50 text-gray-900 border-gray-200"
                  } ${errors.name ? "border-2 border-red-500" : "border"}`}
                  placeholder="Your name"
                  placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    clearFieldError("name");
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  autoComplete="name"
                  returnKeyType="next"
                  editable={!isLoading}
                />
                {errors.name && (
                  <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
                )}
              </View>

              {/* Email Input */}
              <View className="mt-3">
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
                    clearFieldError("email");
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
              <View className="mt-3">
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
                    placeholder="Create a strong password"
                    placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearFieldError("password");
                    }}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    returnKeyType="next"
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
                {/* Password requirements hint */}
                {!errors.password && (
                  <Text
                    className={`text-xs mt-1 ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Min 8 characters with uppercase, lowercase, and number
                  </Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View className="mt-3">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Confirm Password
                </Text>
                <View className="relative">
                  <TextInput
                    className={`min-h-[48px] px-4 pr-16 rounded-xl text-base ${
                      darkMode
                        ? "bg-gray-800 text-white border-gray-700"
                        : "bg-gray-50 text-gray-900 border-gray-200"
                    } ${
                      errors.confirmPassword ? "border-2 border-red-500" : "border"
                    }`}
                    placeholder="Confirm your password"
                    placeholderTextColor={darkMode ? "#6b7280" : "#9ca3af"}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearFieldError("confirmPassword");
                    }}
                    secureTextEntry={!showConfirmPassword}
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    editable={!isLoading}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-0 bottom-0 px-4 justify-center min-w-[48px] min-h-[48px]"
                  >
                    <Text className="text-lg">
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </Text>
                  </Pressable>
                </View>
                {errors.confirmPassword && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Register Button */}
              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                className={`min-h-[48px] px-4 py-3 rounded-xl items-center justify-center mt-6 ${
                  isLoading
                    ? "bg-purple-400"
                    : darkMode
                    ? "bg-purple-600 active:bg-purple-700"
                    : "bg-purple-600 active:bg-purple-700"
                }`}
                accessibilityRole="button"
                accessibilityLabel={isLoading ? "Creating account" : "Create account"}
                accessibilityHint="Tap to create a new account"
                accessibilityState={{ disabled: isLoading }}
              >
                {isLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-semibold ml-2">
                      Creating account...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Create Account
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Login Link */}
            <View className="mt-6 items-center">
              <Text
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Already have an account?
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable
                  className="min-h-[48px] px-4 py-3 items-center justify-center"
                  disabled={isLoading}
                >
                  <Text
                    className={`text-base font-semibold ${
                      darkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  >
                    Sign In
                  </Text>
                </Pressable>
              </Link>
            </View>

            {/* Privacy Note */}
            <View className="mt-auto pt-4">
              <Text
                className={`text-xs text-center ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Your data stays on your self-hosted server.{"\n"}
                BabyNest respects your privacy.
              </Text>
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
