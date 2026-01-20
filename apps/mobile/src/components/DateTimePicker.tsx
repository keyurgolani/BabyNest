/**
 * DateTimePicker Component
 * Reusable component for selecting date and time for retrospective logging
 * Supports both date and time selection with a user-friendly interface
 */

import { Ionicons } from "@expo/vector-icons";
import DateTimePickerNative, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState, useCallback } from "react";
import { View, Text, Pressable, Platform, Modal } from "react-native";

interface DateTimePickerProps {
  /** Current selected date/time */
  value: Date;
  /** Callback when date/time changes */
  onChange: (date: Date) => void;
  /** Whether dark mode is enabled */
  darkMode?: boolean;
  /** Label to display above the picker */
  label?: string;
  /** Maximum date allowed (defaults to now) */
  maximumDate?: Date;
  /** Minimum date allowed */
  minimumDate?: Date;
  /** Whether to show time picker (default: true) */
  showTime?: boolean;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return "Today";
  }
  if (isYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Quick time presets for common scenarios
 */
const TIME_PRESETS = [
  { label: "Now", minutes: 0 },
  { label: "5m ago", minutes: 5 },
  { label: "15m ago", minutes: 15 },
  { label: "30m ago", minutes: 30 },
  { label: "1h ago", minutes: 60 },
  { label: "2h ago", minutes: 120 },
];

export function DateTimePicker({
  value,
  onChange,
  darkMode = false,
  label = "When did this happen?",
  maximumDate = new Date(),
  minimumDate,
  showTime = true,
  disabled = false,
}: DateTimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");

  // Handle date change from native picker
  const handleDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowDatePicker(false);
        setShowTimePicker(false);
      }

      if (event.type === "set" && selectedDate) {
        if (pickerMode === "date") {
          // Keep the time from current value, update the date
          const newDate = new Date(selectedDate);
          newDate.setHours(value.getHours(), value.getMinutes(), 0, 0);
          onChange(newDate);

          // On Android, show time picker after date is selected
          if (Platform.OS === "android" && showTime) {
            setTimeout(() => {
              setPickerMode("time");
              setShowTimePicker(true);
            }, 100);
          }
        } else {
          // Keep the date from current value, update the time
          const newDate = new Date(value);
          newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
          onChange(newDate);
        }
      }
    },
    [onChange, pickerMode, showTime, value]
  );

  // Handle quick preset selection
  const handlePresetSelect = useCallback(
    (minutesAgo: number) => {
      const newDate = new Date();
      newDate.setMinutes(newDate.getMinutes() - minutesAgo);
      newDate.setSeconds(0, 0);
      onChange(newDate);
    },
    [onChange]
  );

  // Open date picker
  const openDatePicker = useCallback(() => {
    setPickerMode("date");
    setShowDatePicker(true);
  }, []);

  // Open time picker
  const openTimePicker = useCallback(() => {
    setPickerMode("time");
    setShowTimePicker(true);
  }, []);

  // Close iOS modal
  const closeModal = useCallback(() => {
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, []);

  const isNow = Math.abs(new Date().getTime() - value.getTime()) < 60000; // Within 1 minute

  return (
    <View className="mb-4">
      {/* Label */}
      <Text
        className={`text-sm font-bold mb-3 uppercase tracking-wider ${
          darkMode ? "text-gray-400" : "text-muted-foreground"
        }`}
      >
        {label}
      </Text>

      {/* Quick Presets */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        {TIME_PRESETS.map((preset) => {
          const presetDate = new Date();
          presetDate.setMinutes(presetDate.getMinutes() - preset.minutes);
          const isSelected =
            preset.minutes === 0
              ? isNow
              : Math.abs(value.getTime() - presetDate.getTime()) < 60000;

          return (
            <Pressable
              key={preset.label}
              onPress={() => handlePresetSelect(preset.minutes)}
              disabled={disabled}
              className={`px-4 py-2 rounded-xl border-2 ${
                isSelected
                  ? "bg-primary border-primary"
                  : darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-background border-muted"
              } ${disabled ? "opacity-50" : ""}`}
              style={{ minHeight: 40 }}
            >
              <Text
                className={`font-medium text-sm ${
                  isSelected
                    ? "text-white"
                    : darkMode
                    ? "text-gray-300"
                    : "text-foreground"
                }`}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Date and Time Buttons */}
      <View className="flex-row gap-3">
        {/* Date Button */}
        <Pressable
          onPress={openDatePicker}
          disabled={disabled}
          className={`flex-1 flex-row items-center justify-between p-4 rounded-2xl border-2 ${
            darkMode
              ? "bg-gray-700 border-gray-600"
              : "bg-background border-muted"
          } ${disabled ? "opacity-50" : ""}`}
          style={{ minHeight: 56 }}
        >
          <View className="flex-row items-center">
            <Ionicons
              name="calendar-outline"
              size={20}
              color={darkMode ? "#9ca3af" : "#6b7280"}
            />
            <Text
              className={`ml-3 font-medium ${
                darkMode ? "text-white" : "text-foreground"
              }`}
            >
              {formatDate(value)}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={16}
            color={darkMode ? "#6b7280" : "#9ca3af"}
          />
        </Pressable>

        {/* Time Button */}
        {showTime && (
          <Pressable
            onPress={openTimePicker}
            disabled={disabled}
            className={`flex-1 flex-row items-center justify-between p-4 rounded-2xl border-2 ${
              darkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-background border-muted"
            } ${disabled ? "opacity-50" : ""}`}
            style={{ minHeight: 56 }}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="time-outline"
                size={20}
                color={darkMode ? "#9ca3af" : "#6b7280"}
              />
              <Text
                className={`ml-3 font-medium ${
                  darkMode ? "text-white" : "text-foreground"
                }`}
              >
                {formatTime(value)}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={16}
              color={darkMode ? "#6b7280" : "#9ca3af"}
            />
          </Pressable>
        )}
      </View>

      {/* Native Date/Time Pickers */}
      {Platform.OS === "ios" ? (
        // iOS: Show in modal
        <Modal
          visible={showDatePicker || showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={closeModal}
        >
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={closeModal}
          >
            <Pressable
              className={`rounded-t-3xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Pressable onPress={closeModal} style={{ minWidth: 60 }}>
                  <Text className="text-primary font-medium">Cancel</Text>
                </Pressable>
                <Text
                  className={`font-bold ${
                    darkMode ? "text-white" : "text-foreground"
                  }`}
                >
                  {showDatePicker ? "Select Date" : "Select Time"}
                </Text>
                <Pressable onPress={closeModal} style={{ minWidth: 60 }}>
                  <Text className="text-primary font-bold text-right">Done</Text>
                </Pressable>
              </View>

              {/* Picker */}
              <DateTimePickerNative
                value={value}
                mode={showDatePicker ? "date" : "time"}
                display="spinner"
                onChange={handleDateChange}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                themeVariant={darkMode ? "dark" : "light"}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        // Android: Show inline
        <>
          {showDatePicker && (
            <DateTimePickerNative
              value={value}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
            />
          )}
          {showTimePicker && (
            <DateTimePickerNative
              value={value}
              mode="time"
              display="default"
              onChange={handleDateChange}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
            />
          )}
        </>
      )}
    </View>
  );
}

export default DateTimePicker;
