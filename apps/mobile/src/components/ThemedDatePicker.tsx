import { Ionicons } from "@expo/vector-icons";
import DateTimePickerNative from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  StyleSheet,
} from "react-native";

interface ThemedDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  darkMode: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
  label?: string;
}

/**
 * Themed Date Picker Component
 * A fully themed date picker that works consistently across iOS and Android
 */
export function ThemedDatePicker({
  value,
  onChange,
  darkMode,
  maximumDate,
  minimumDate,
  label = "Date of Birth",
}: ThemedDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setShowPicker(false);
  };

  return (
    <View>
      <Text
        className={`text-sm font-medium mb-2 ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label} *
      </Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        className={`p-4 rounded-xl flex-row items-center justify-between ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
        style={styles.dateButton}
      >
        <Text
          className={`text-base ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {formatDate(value)}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={darkMode ? "#c026d3" : "#9333ea"}
        />
      </Pressable>

      {/* Modal for both iOS and Android */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={handleCancel}
        >
          <Pressable
            className={`rounded-t-3xl ${
              darkMode ? "bg-gray-900" : "bg-white"
            }`}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View
              className={`flex-row items-center justify-between p-4 border-b ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <Pressable onPress={handleCancel}>
                <Text
                  className={`text-base ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Cancel
                </Text>
              </Pressable>
              <Text
                className={`text-base font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {label}
              </Text>
              <Pressable onPress={handleConfirm}>
                <Text className="text-base font-semibold text-fuchsia-500">
                  Done
                </Text>
              </Pressable>
            </View>

            {/* Date Picker */}
            <View className="p-4">
              <DateTimePickerNative
                value={tempDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "spinner"}
                onChange={handleDateChange}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                themeVariant={darkMode ? "dark" : "light"}
                textColor={darkMode ? "#ffffff" : "#000000"}
                style={darkMode ? styles.pickerDark : styles.pickerLight}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    minHeight: 56,
  },
  pickerDark: {
    backgroundColor: "#1f2937",
  },
  pickerLight: {
    backgroundColor: "#ffffff",
  },
});
