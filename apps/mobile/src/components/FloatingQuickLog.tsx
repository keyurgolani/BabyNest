/**
 * Floating Quick Log (FAB) Component
 * Provides one-tap access to common logging actions from anywhere in the app
 * Validates: Requirements for quick logging for tired parents
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { getDatabaseService } from "../database/DatabaseService";
import type { DiaperType } from "../database/types";
import { useHaptics } from "../hooks";
import { useBabyStore, useActiveBaby, useActiveTimer } from "../store";
import {
  useQuickLogStore,
  useLastFeeding,
  useQuickLogExpanded,
} from "../store/quickLogStore";

// Animation spring config
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.8,
};

// FAB size constants
const FAB_SIZE = 56; // Minimum 56dp touch target

/**
 * Animated Pressable component for action buttons
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * FloatingQuickLog Component
 * Main FAB that expands to show quick action options
 */
export function FloatingQuickLog() {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const sleepTimer = useActiveTimer("sleep");
  const breastfeedingTimer = useActiveTimer("breastfeeding");
  const startTimer = useBabyStore((state) => state.startTimer);
  const stopTimer = useBabyStore((state) => state.stopTimer);
  
  const isExpanded = useQuickLogExpanded();
  const setExpanded = useQuickLogStore((state) => state.setExpanded);
  const showToast = useQuickLogStore((state) => state.showToast);
  const lastFeeding = useLastFeeding();
  const setLastFeeding = useQuickLogStore((state) => state.setLastFeeding);
  const setLastDiaper = useQuickLogStore((state) => state.setLastDiaper);
  const setUndoableEntry = useQuickLogStore((state) => state.setUndoableEntry);
  
  const { lightHaptic, mediumHaptic, successHaptic } = useHaptics();

  // Animation values
  const expandProgress = useSharedValue(0);
  const fabRotation = useSharedValue(0);
  const fabScale = useSharedValue(1);

  // Check if there's an active timer
  const hasActiveTimer = !!sleepTimer || !!breastfeedingTimer;

  // Update animation when expanded state changes
  useEffect(() => {
    expandProgress.value = withSpring(isExpanded ? 1 : 0, SPRING_CONFIG);
    fabRotation.value = withSpring(isExpanded ? 45 : 0, SPRING_CONFIG);
  }, [isExpanded, expandProgress, fabRotation]);

  /**
   * Handle FAB press
   */
  const handleFabPress = useCallback(() => {
    lightHaptic();
    setExpanded(!isExpanded);
  }, [isExpanded, lightHaptic, setExpanded]);

  /**
   * Handle FAB press in animation
   */
  const handleFabPressIn = useCallback(() => {
    fabScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  }, [fabScale]);

  /**
   * Handle FAB press out animation
   */
  const handleFabPressOut = useCallback(() => {
    fabScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [fabScale]);

  /**
   * Close the expanded menu
   */
  const closeMenu = useCallback(() => {
    setExpanded(false);
  }, [setExpanded]);

  /**
   * Handle quick feed action
   */
  const handleQuickFeed = useCallback(async () => {
    if (!activeBaby) {
      showToast("Please select a baby first", "error");
      closeMenu();
      return;
    }

    mediumHaptic();
    closeMenu();

    // If there's a last bottle feeding, repeat it
    if (lastFeeding?.type === "bottle" && lastFeeding.amount) {
      try {
        const db = getDatabaseService();
        await db.initialize();
        const entry = await db.createFeedingEntry({
          babyId: activeBaby.id,
          caregiverId: "current-user", // TODO: Get from auth
          timestamp: new Date().toISOString(),
          type: "bottle",
          amount: lastFeeding.amount,
          bottleType: lastFeeding.bottleType || "formula",
          leftDuration: null,
          rightDuration: null,
          lastSide: null,
          pumpedAmount: null,
          pumpSide: null,
          foodType: null,
          reaction: null,
          notes: "Quick logged",
        });
        
        setLastFeeding({
          type: "bottle",
          amount: lastFeeding.amount,
          bottleType: lastFeeding.bottleType,
          timestamp: new Date().toISOString(),
        });
        
        // Set undoable entry
        setUndoableEntry({
          id: entry.id,
          entityType: "feeding",
          description: `${lastFeeding.amount}ml bottle`,
          timestamp: entry.timestamp,
        });
        
        successHaptic();
        showToast(`🍼 Logged ${lastFeeding.amount}ml bottle`, "success", undefined, true);
      } catch (error) {
        console.error("[FloatingQuickLog] Error logging feeding:", error);
        showToast("Failed to log feeding", "error");
      }
    } else {
      // Start breastfeeding timer or navigate to feed screen
      if (breastfeedingTimer) {
        // Stop existing timer
        const result = stopTimer("breastfeeding");
        if (result) {
          try {
            const db = getDatabaseService();
            await db.initialize();
            const entry = await db.createFeedingEntry({
              babyId: activeBaby.id,
              caregiverId: "current-user",
              timestamp: result.startTime.toISOString(),
              type: "breastfeeding",
              leftDuration: result.metadata.breastSide === "left" ? result.totalDuration : null,
              rightDuration: result.metadata.breastSide === "right" ? result.totalDuration : null,
              lastSide: result.metadata.breastSide || null,
              amount: null,
              bottleType: null,
              pumpedAmount: null,
              pumpSide: null,
              foodType: null,
              reaction: null,
              notes: "Quick logged",
            });
            
            const minutes = Math.floor(result.totalDuration / 60);
            
            // Set undoable entry
            setUndoableEntry({
              id: entry.id,
              entityType: "feeding",
              description: `${minutes}min breastfeeding`,
              timestamp: entry.timestamp,
            });
            
            successHaptic();
            showToast(`🤱 Logged ${minutes}min breastfeeding`, "success", undefined, true);
          } catch (error) {
            console.error("[FloatingQuickLog] Error saving feeding:", error);
            showToast("Failed to save feeding", "error");
          }
        }
      } else {
        // Start new breastfeeding timer
        startTimer("breastfeeding", { breastSide: "left" });
        successHaptic();
        showToast("🤱 Started breastfeeding timer", "info");
      }
    }
  }, [activeBaby, lastFeeding, breastfeedingTimer, closeMenu, mediumHaptic, successHaptic, showToast, startTimer, stopTimer, setLastFeeding, setUndoableEntry]);

  /**
   * Handle quick sleep action
   */
  const handleQuickSleep = useCallback(async () => {
    if (!activeBaby) {
      showToast("Please select a baby first", "error");
      closeMenu();
      return;
    }

    mediumHaptic();
    closeMenu();

    if (sleepTimer) {
      // Stop sleep timer and save entry
      const result = stopTimer("sleep");
      if (result) {
        try {
          const db = getDatabaseService();
          await db.initialize();
          const entry = await db.createSleepEntry({
            babyId: activeBaby.id,
            caregiverId: "current-user",
            timestamp: result.startTime.toISOString(),
            startTime: result.startTime.toISOString(),
            endTime: result.endTime.toISOString(),
            duration: Math.floor(result.totalDuration / 60), // Convert to minutes
            sleepType: result.metadata.sleepType || "nap",
            quality: null,
            notes: "Quick logged",
          });
          
          const minutes = Math.floor(result.totalDuration / 60);
          
          // Set undoable entry
          setUndoableEntry({
            id: entry.id,
            entityType: "sleep",
            description: `${minutes}min sleep`,
            timestamp: entry.timestamp,
          });
          
          successHaptic();
          showToast(`😴 Logged ${minutes}min sleep`, "success", undefined, true);
        } catch (error) {
          console.error("[FloatingQuickLog] Error saving sleep:", error);
          showToast("Failed to save sleep", "error");
        }
      }
    } else {
      // Start sleep timer
      startTimer("sleep", { sleepType: "nap" });
      successHaptic();
      showToast("😴 Started sleep timer", "info");
    }
  }, [activeBaby, sleepTimer, closeMenu, mediumHaptic, successHaptic, showToast, startTimer, stopTimer, setUndoableEntry]);

  /**
   * Handle quick diaper action - shows diaper type options
   */
  const handleQuickDiaper = useCallback((type: DiaperType) => {
    return async () => {
      if (!activeBaby) {
        showToast("Please select a baby first", "error");
        closeMenu();
        return;
      }

      mediumHaptic();
      closeMenu();

      try {
        const db = getDatabaseService();
        await db.initialize();
        const entry = await db.createDiaperEntry({
          babyId: activeBaby.id,
          caregiverId: "current-user",
          timestamp: new Date().toISOString(),
          type,
          color: null,
          consistency: null,
          hasRash: 0,
          notes: "Quick logged",
        });
        
        setLastDiaper({
          type,
          timestamp: new Date().toISOString(),
        });
        
        // Set undoable entry
        setUndoableEntry({
          id: entry.id,
          entityType: "diaper",
          description: `${type} diaper`,
          timestamp: entry.timestamp,
        });
        
        const emoji = type === "wet" ? "💧" : type === "dirty" ? "💩" : "💧💩";
        successHaptic();
        showToast(`${emoji} Logged ${type} diaper`, "success", undefined, true);
      } catch (error) {
        console.error("[FloatingQuickLog] Error logging diaper:", error);
        showToast("Failed to log diaper", "error");
      }
    };
  }, [activeBaby, closeMenu, mediumHaptic, successHaptic, showToast, setLastDiaper, setUndoableEntry]);

  // FAB animated styles
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotation.value}deg` },
    ],
  }));

  // Backdrop animated style
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value * 0.5,
    pointerEvents: isExpanded ? "auto" : "none",
  }));

  // Menu container animated style
  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    transform: [
      {
        translateY: interpolate(
          expandProgress.value,
          [0, 1],
          [20, 0],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          expandProgress.value,
          [0, 1],
          [0.8, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  // Don't render if no baby is selected
  if (!activeBaby) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatedPressable
        onPress={closeMenu}
        style={[styles.backdrop, backdropAnimatedStyle]}
        accessibilityLabel="Close quick log menu"
        accessibilityRole="button"
      />

      {/* Quick Action Menu */}
      {isExpanded && (
        <Animated.View
          style={[styles.menuContainer, menuAnimatedStyle]}
        >
          <View
            className={`rounded-2xl p-4 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
            style={styles.menuContent}
          >
            {/* Feed Section */}
            <Text
              className={`text-xs font-semibold mb-2 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              FEEDING
            </Text>
            <QuickActionButton
              emoji="🍼"
              label={
                lastFeeding?.type === "bottle" && lastFeeding.amount
                  ? `Last Bottle (${lastFeeding.amount}ml)`
                  : breastfeedingTimer
                  ? "Stop Breastfeeding"
                  : "Start Breastfeeding"
              }
              onPress={handleQuickFeed}
              darkMode={darkMode}
              isActive={!!breastfeedingTimer}
            />
            <Pressable
              onPress={() => {
                closeMenu();
                router.push("/feed");
              }}
              className={`flex-row items-center py-2 px-3 rounded-lg mt-1 ${
                darkMode ? "active:bg-gray-700" : "active:bg-gray-100"
              }`}
              accessibilityRole="button"
              accessibilityLabel="Go to full feed screen"
            >
              <Text className="text-lg mr-3">📝</Text>
              <Text
                className={`flex-1 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Full Feed Screen
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={darkMode ? "#9ca3af" : "#6b7280"}
              />
            </Pressable>

            {/* Divider */}
            <View
              className={`h-px my-3 ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            />

            {/* Sleep Section */}
            <Text
              className={`text-xs font-semibold mb-2 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              SLEEP
            </Text>
            <QuickActionButton
              emoji="😴"
              label={sleepTimer ? "Stop Sleep Timer" : "Start Sleep Timer"}
              onPress={handleQuickSleep}
              darkMode={darkMode}
              isActive={!!sleepTimer}
            />

            {/* Divider */}
            <View
              className={`h-px my-3 ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            />

            {/* Diaper Section */}
            <Text
              className={`text-xs font-semibold mb-2 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              DIAPER
            </Text>
            <View className="flex-row gap-2">
              <DiaperButton
                emoji="💧"
                label="Wet"
                onPress={handleQuickDiaper("wet")}
                darkMode={darkMode}
              />
              <DiaperButton
                emoji="💩"
                label="Dirty"
                onPress={handleQuickDiaper("dirty")}
                darkMode={darkMode}
              />
              <DiaperButton
                emoji="💧💩"
                label="Mixed"
                onPress={handleQuickDiaper("mixed")}
                darkMode={darkMode}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Main FAB */}
      <AnimatedPressable
        onPress={handleFabPress}
        onPressIn={handleFabPressIn}
        onPressOut={handleFabPressOut}
        style={[styles.fab, fabAnimatedStyle]}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? "Close quick log menu" : "Open quick log menu"}
        accessibilityHint="Quick access to log feeding, sleep, and diaper changes"
      >
        <Ionicons name="add" size={28} color="#ffffff" />
        
        {/* Active timer indicator badge */}
        {hasActiveTimer && !isExpanded && (
          <View
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"
            accessibilityLabel="Timer active"
          />
        )}
      </AnimatedPressable>
    </>
  );
}

/**
 * Quick Action Button Component
 */
function QuickActionButton({
  emoji,
  label,
  onPress,
  darkMode,
  isActive = false,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  darkMode: boolean;
  isActive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center py-3 px-3 rounded-lg ${
        isActive
          ? darkMode
            ? "bg-green-900/50"
            : "bg-green-100"
          : darkMode
          ? "active:bg-gray-700"
          : "active:bg-gray-100"
      }`}
      style={styles.quickActionButton}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      <Text className="text-xl mr-3">{emoji}</Text>
      <Text
        className={`flex-1 font-medium ${
          isActive
            ? "text-green-600"
            : darkMode
            ? "text-white"
            : "text-gray-900"
        }`}
      >
        {label}
      </Text>
      {isActive && (
        <View className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      )}
    </Pressable>
  );
}

/**
 * Diaper Button Component
 */
function DiaperButton({
  emoji,
  label,
  onPress,
  darkMode,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  darkMode: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center py-3 px-2 rounded-lg ${
        darkMode
          ? "bg-gray-700 active:bg-gray-600"
          : "bg-gray-100 active:bg-gray-200"
      }`}
      style={styles.diaperButton}
      accessibilityRole="button"
      accessibilityLabel={`Log ${label} diaper`}
    >
      <Text className="text-lg mb-1">{emoji}</Text>
      <Text
        className={`text-xs font-medium ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 998,
  },
  menuContainer: {
    position: "absolute",
    bottom: 120,
    right: 16,
    zIndex: 999,
  },
  menuContent: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    minWidth: 200,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 16,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: "#c026d3",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActionButton: {
    minHeight: 48,
  },
  diaperButton: {
    minHeight: 48,
  },
});

export default FloatingQuickLog;
