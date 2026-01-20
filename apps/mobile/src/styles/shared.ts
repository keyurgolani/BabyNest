/**
 * Shared Styles
 * Common StyleSheet patterns used across the app to avoid inline style warnings.
 * These styles are for properties that aren't available in NativeWind/Tailwind.
 */

import { StyleSheet } from "react-native";

export const sharedStyles = StyleSheet.create({
  // Min heights for touch targets
  minH48: { minHeight: 48 },
  minH56: { minHeight: 56 },
  minH64: { minHeight: 64 },
  minH80: { minHeight: 80 },
  minH100: { minHeight: 100 },
  minH120: { minHeight: 120 },
  minH140: { minHeight: 140 },

  // Min widths
  minW48: { minWidth: 48 },
  minW80: { minWidth: 80 },

  // Combined min dimensions
  minWH48: { minWidth: 48, minHeight: 48 },
  minWH80: { minWidth: 80, minHeight: 80 },
  minWH100_48: { minHeight: 100, minWidth: 48 },

  // Text alignment (not available in NativeWind)
  textAlignTop: { textAlignVertical: "top" as const },

  // Combined patterns
  textAreaMH80: { minHeight: 80, textAlignVertical: "top" as const },
  textAreaMH100: { minHeight: 100, textAlignVertical: "top" as const },
  textAreaMH120: { minHeight: 120, textAlignVertical: "top" as const },

  // Flex patterns
  flexGrow1: { flexGrow: 1 },
  flex1: { flex: 1 },
});

export default sharedStyles;
