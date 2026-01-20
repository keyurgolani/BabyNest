import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";

import { FloatingQuickLog, QuickLogToast } from "../../src/components";
import { useBabyStore } from "../../src/store";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  name: IoniconsName;
  focused: boolean;
  color: string;
  size: number;
}

/**
 * Tab icon component using Ionicons
 * Validates: Requirements 14.1 (minimum 48x48dp touch targets)
 */
function TabIcon({ name, focused, color, size }: TabIconProps) {
  return (
    <View className="items-center justify-center" style={styles.tabIcon}>
      <Ionicons
        name={name}
        size={size}
        color={color}
        style={focused ? styles.iconFocused : styles.iconUnfocused}
      />
    </View>
  );
}

/**
 * Main tab navigation layout
 * Configures the bottom tab navigator with icons and styling
 * Validates: Requirements 14.1, 14.2, 14.3
 */
export default function TabLayout() {
  const darkMode = useBabyStore((state) => state.darkMode);

  const activeColor = "#c026d3"; // Primary fuchsia color
  const inactiveColor = darkMode ? "#9ca3af" : "#6b7280";

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor: darkMode ? "#1f2937" : "#ffffff",
            borderTopColor: darkMode ? "#374151" : "#e5e7eb",
            height: 88,
            paddingBottom: 24,
            paddingTop: 12,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
          headerStyle: {
            backgroundColor: darkMode ? "#1f2937" : "#ffffff",
          },
          headerTintColor: darkMode ? "#ffffff" : "#1f2937",
          headerTitleStyle: {
            fontWeight: "600",
          },
          // Ensure minimum touch target size (48dp) - Requirement 14.1
          tabBarItemStyle: {
            minHeight: 48,
            paddingVertical: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerTitle: "BabyNest",
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={focused ? "home" : "home-outline"}
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: "Feed",
            headerTitle: "Feeding",
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={focused ? "nutrition" : "nutrition-outline"}
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="sleep"
          options={{
            title: "Sleep",
            headerTitle: "Sleep Tracking",
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={focused ? "moon" : "moon-outline"}
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="diaper"
          options={{
            title: "Diaper",
            headerTitle: "Diaper Changes",
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={focused ? "water" : "water-outline"}
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            headerTitle: "More Options",
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={focused ? "ellipsis-horizontal" : "ellipsis-horizontal-outline"}
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tabs>
      
      {/* Floating Quick Log Button - appears on all tab screens */}
      <FloatingQuickLog />
      
      {/* Toast notifications for quick log confirmations */}
      <QuickLogToast />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabIcon: {
    minWidth: 48,
    minHeight: 48,
  },
  iconFocused: {
    opacity: 1,
  },
  iconUnfocused: {
    opacity: 0.7,
  },
});
