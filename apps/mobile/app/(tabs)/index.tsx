import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WakeWindowCard , SleepPredictionCard , DailySummaryCard } from "../../src/components";
import { getDatabaseService } from "../../src/database/DatabaseService";
import type { 
  LocalFeedingEntry, 
  LocalSleepEntry, 
  LocalDiaperEntry 
} from "../../src/database/types";
import { useHaptics } from "../../src/hooks";
import { useActiveBaby, useBabyStore } from "../../src/store";

/**
 * Activity type for recent activities display
 */
type ActivityItem = {
  id: string;
  type: "feeding" | "sleep" | "diaper";
  timestamp: Date;
  details: string;
  icon: string;
};

/**
 * Daily summary statistics
 */
interface DailySummary {
  feedingCount: number;
  sleepMinutes: number;
  diaperCount: number;
  wetDiapers: number;
  dirtyDiapers: number;
}

/**
 * Calculate time since a given date in human-readable format
 */
function getTimeSince(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
  return `${diffDays}d ago`;
}

/**
 * Format feeding entry details
 */
function formatFeedingDetails(entry: LocalFeedingEntry): string {
  switch (entry.type) {
    case "breastfeeding": {
      const leftMin = entry.leftDuration ? Math.round(entry.leftDuration / 60) : 0;
      const rightMin = entry.rightDuration ? Math.round(entry.rightDuration / 60) : 0;
      if (leftMin && rightMin) return `L: ${leftMin}m, R: ${rightMin}m`;
      if (leftMin) return `Left: ${leftMin}m`;
      if (rightMin) return `Right: ${rightMin}m`;
      return "Breastfeeding";
    }
    case "bottle":
      return entry.amount ? `${entry.amount}ml ${entry.bottleType || ""}`.trim() : "Bottle";
    case "pumping":
      return entry.pumpedAmount ? `${entry.pumpedAmount}ml pumped` : "Pumping";
    case "solid":
      return entry.foodType || "Solid food";
    default:
      return "Feeding";
  }
}

/**
 * Format sleep entry details
 */
function formatSleepDetails(entry: LocalSleepEntry): string {
  const type = entry.sleepType === "nap" ? "Nap" : "Night sleep";
  if (entry.duration) {
    const hours = Math.floor(entry.duration / 60);
    const mins = entry.duration % 60;
    if (hours > 0) return `${type}: ${hours}h ${mins}m`;
    return `${type}: ${mins}m`;
  }
  if (!entry.endTime) return `${type} (ongoing)`;
  return type;
}

/**
 * Format diaper entry details
 */
function formatDiaperDetails(entry: LocalDiaperEntry): string {
  const typeMap: Record<string, string> = {
    wet: "💧 Wet",
    dirty: "💩 Dirty",
    mixed: "💧💩 Mixed",
    dry: "Dry",
  };
  return typeMap[entry.type] || entry.type;
}

/**
 * Home Screen Component
 * Displays recent activities, time since last, and quick-log buttons
 * Validates: Requirements 14.2, 14.4, 14.7
 */
export default function HomeScreen() {
  const router = useRouter();
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();
  const syncStatus = useBabyStore((state) => state.syncStatus);
  const activeTimers = useBabyStore((state) => state.activeTimers);
  const { lightHaptic } = useHaptics();

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [lastFeeding, setLastFeeding] = useState<Date | null>(null);
  const [lastSleep, setLastSleep] = useState<Date | null>(null);
  const [lastDiaper, setLastDiaper] = useState<Date | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    feedingCount: 0,
    sleepMinutes: 0,
    diaperCount: 0,
    wetDiapers: 0,
    dirtyDiapers: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load recent activities and statistics from the database
   */
  const loadData = useCallback(async () => {
    if (!activeBaby) {
      setRecentActivities([]);
      setLastFeeding(null);
      setLastSleep(null);
      setLastDiaper(null);
      setDailySummary({
        feedingCount: 0,
        sleepMinutes: 0,
        diaperCount: 0,
        wetDiapers: 0,
        dirtyDiapers: 0,
      });
      setIsLoading(false);
      return;
    }

    try {
      const db = getDatabaseService();
      await db.initialize();

      // Get recent entries
      const [feedings, sleeps, diapers] = await Promise.all([
        db.getFeedingEntries(activeBaby.id, 10),
        db.getSleepEntries(activeBaby.id, 10),
        db.getDiaperEntries(activeBaby.id, 10),
      ]);

      // Set last activity times
      const firstFeeding = feedings[0];
      if (firstFeeding) {
        setLastFeeding(new Date(firstFeeding.timestamp));
      } else {
        setLastFeeding(null);
      }

      const firstSleep = sleeps[0];
      if (firstSleep) {
        // For sleep, use endTime if available, otherwise startTime
        setLastSleep(new Date(firstSleep.endTime || firstSleep.startTime));
      } else {
        setLastSleep(null);
      }

      const firstDiaper = diapers[0];
      if (firstDiaper) {
        setLastDiaper(new Date(firstDiaper.timestamp));
      } else {
        setLastDiaper(null);
      }

      // Build recent activities list (combine and sort by timestamp)
      const activities: ActivityItem[] = [];

      feedings.slice(0, 5).forEach((entry) => {
        activities.push({
          id: entry.id,
          type: "feeding",
          timestamp: new Date(entry.timestamp),
          details: formatFeedingDetails(entry),
          icon: "🍼",
        });
      });

      sleeps.slice(0, 5).forEach((entry) => {
        activities.push({
          id: entry.id,
          type: "sleep",
          timestamp: new Date(entry.timestamp),
          details: formatSleepDetails(entry),
          icon: "😴",
        });
      });

      diapers.slice(0, 5).forEach((entry) => {
        activities.push({
          id: entry.id,
          type: "diaper",
          timestamp: new Date(entry.timestamp),
          details: formatDiaperDetails(entry),
          icon: "👶",
        });
      });

      // Sort by timestamp descending and take top 10
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentActivities(activities.slice(0, 10));

      // Calculate daily summary (today's activities)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayFeedings = feedings.filter(
        (e) => new Date(e.timestamp) >= today
      );
      const todaySleeps = sleeps.filter(
        (e) => new Date(e.timestamp) >= today
      );
      const todayDiapers = diapers.filter(
        (e) => new Date(e.timestamp) >= today
      );

      const totalSleepMinutes = todaySleeps.reduce(
        (sum, entry) => sum + (entry.duration || 0),
        0
      );

      const wetCount = todayDiapers.filter(
        (e) => e.type === "wet" || e.type === "mixed"
      ).length;
      const dirtyCount = todayDiapers.filter(
        (e) => e.type === "dirty" || e.type === "mixed"
      ).length;

      setDailySummary({
        feedingCount: todayFeedings.length,
        sleepMinutes: totalSleepMinutes,
        diaperCount: todayDiapers.length,
        wetDiapers: wetCount,
        dirtyDiapers: dirtyCount,
      });
    } catch (error) {
      console.error("[HomeScreen] Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Check for active timers
  const hasActiveBreastfeedingTimer = activeTimers.has("breastfeeding");
  const hasActiveSleepTimer = activeTimers.has("sleep");
  const hasActiveTummyTimeTimer = activeTimers.has("tummyTime");

  return (
    <SafeAreaView
      className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      edges={["left", "right"]}
    >
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkMode ? "#c026d3" : "#a21caf"}
          />
        }
      >
        {/* Header */}
        <View className="py-4">
          <Text
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {activeBaby ? `Hello, ${activeBaby.name}!` : "Welcome to BabyNest"}
          </Text>
          <View className="flex-row items-center mt-1">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                syncStatus === "synced"
                  ? "bg-green-500"
                  : syncStatus === "syncing"
                  ? "bg-yellow-500"
                  : syncStatus === "error"
                  ? "bg-red-500"
                  : "bg-gray-400"
              }`}
            />
            <Text
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {syncStatus === "synced"
                ? "Synced"
                : syncStatus === "syncing"
                ? "Syncing..."
                : syncStatus === "error"
                ? "Sync error"
                : "Offline"}
            </Text>
          </View>
        </View>

        {/* Sleep Prediction Card - SweetSpot Feature */}
        {activeBaby && (
          <View className="mt-4">
            <SleepPredictionCard
              onStartSleep={() => {
                lightHaptic();
                router.push("/(tabs)/sleep");
              }}
            />
          </View>
        )}

        {/* Wake Window Timer - Similar to Huckleberry's SweetSpot */}
        {activeBaby && (
          <View className="mt-4">
            <WakeWindowCard
              onPress={() => {
                lightHaptic();
                router.push("/(tabs)/sleep");
              }}
            />
          </View>
        )}

        {/* Daily Summary Dashboard */}
        {activeBaby && (
          <View className="mt-4">
            <DailySummaryCard
              onPress={() => {
                lightHaptic();
                // Could navigate to a detailed insights screen in the future
              }}
            />
          </View>
        )}

        {/* Quick Actions - Requirement 14.2 */}
        <View className="mt-4">
          <Text
            className={`text-lg font-semibold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <QuickActionButton
              emoji="🍼"
              label="Feed"
              lastTime={lastFeeding}
              isActive={hasActiveBreastfeedingTimer}
              darkMode={darkMode}
              onPress={() => {
                lightHaptic();
                router.push("/(tabs)/feed");
              }}
            />
            <QuickActionButton
              emoji="😴"
              label="Sleep"
              lastTime={lastSleep}
              isActive={hasActiveSleepTimer}
              darkMode={darkMode}
              onPress={() => {
                lightHaptic();
                router.push("/(tabs)/sleep");
              }}
            />
            <QuickActionButton
              emoji="👶"
              label="Diaper"
              lastTime={lastDiaper}
              darkMode={darkMode}
              onPress={() => {
                lightHaptic();
                router.push("/(tabs)/diaper");
              }}
            />
            <QuickActionButton
              emoji="⏱️"
              label="Tummy Time"
              isActive={hasActiveTummyTimeTimer}
              darkMode={darkMode}
              onPress={() => {
                lightHaptic();
                router.push("/(tabs)/more");
              }}
            />
          </View>
        </View>

        {/* Today's Summary */}
        {activeBaby && (
          <View className="mt-6">
            <Text
              className={`text-lg font-semibold mb-3 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Today's Summary
            </Text>
            <View
              className={`p-4 rounded-xl ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <View className="flex-row justify-between">
                <SummaryItem
                  icon="🍼"
                  label="Feedings"
                  value={dailySummary.feedingCount.toString()}
                  darkMode={darkMode}
                />
                <SummaryItem
                  icon="😴"
                  label="Sleep"
                  value={formatSleepDuration(dailySummary.sleepMinutes)}
                  darkMode={darkMode}
                />
                <SummaryItem
                  icon="👶"
                  label="Diapers"
                  value={dailySummary.diaperCount.toString()}
                  subValue={`💧${dailySummary.wetDiapers} 💩${dailySummary.dirtyDiapers}`}
                  darkMode={darkMode}
                />
              </View>
            </View>
          </View>
        )}

        {/* Time Since Last - Requirement 14.4 */}
        {activeBaby && (lastFeeding || lastSleep || lastDiaper) && (
          <View className="mt-6">
            <Text
              className={`text-lg font-semibold mb-3 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Time Since Last
            </Text>
            <View
              className={`p-4 rounded-xl ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <View className="flex-row justify-between">
                {lastFeeding && (
                  <TimeSinceItem
                    icon="🍼"
                    label="Feed"
                    time={getTimeSince(lastFeeding)}
                    darkMode={darkMode}
                  />
                )}
                {lastSleep && (
                  <TimeSinceItem
                    icon="😴"
                    label="Sleep"
                    time={getTimeSince(lastSleep)}
                    darkMode={darkMode}
                  />
                )}
                {lastDiaper && (
                  <TimeSinceItem
                    icon="👶"
                    label="Diaper"
                    time={getTimeSince(lastDiaper)}
                    darkMode={darkMode}
                  />
                )}
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity - Requirement 14.4 */}
        <View className="mt-6 mb-8">
          <Text
            className={`text-lg font-semibold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Recent Activity
          </Text>
          <View
            className={`rounded-xl overflow-hidden ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {isLoading ? (
              <View className="p-4">
                <Text
                  className={`text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Loading...
                </Text>
              </View>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  darkMode={darkMode}
                  isLast={index === recentActivities.length - 1}
                />
              ))
            ) : (
              <View className="p-4">
                <Text
                  className={`text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {activeBaby
                    ? "No recent activities yet. Start tracking!"
                    : "Add a baby profile to start tracking"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Format sleep duration for display
 */
function formatSleepDuration(minutes: number): string {
  if (minutes === 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

/**
 * Quick Action Button Component
 * Validates: Requirements 14.1 (48x48dp minimum touch targets), 14.2
 */
function QuickActionButton({
  emoji,
  label,
  lastTime,
  isActive,
  darkMode,
  onPress,
}: {
  emoji: string;
  label: string;
  lastTime?: Date | null;
  isActive?: boolean;
  darkMode: boolean;
  onPress: () => void;
}) {
  const accessibilityState = isActive ? "Timer active" : lastTime ? `Last: ${getTimeSince(lastTime)}` : "";
  
  return (
    <Pressable
      className={`min-w-[80px] min-h-[80px] p-3 rounded-xl items-center justify-center ${
        isActive
          ? "bg-fuchsia-600"
          : darkMode
          ? "bg-gray-800 active:bg-gray-700"
          : "bg-white active:bg-gray-100"
      }`}
      style={styles.quickActionButton}
      onPress={onPress}
      // Ensure minimum 48x48dp touch target - Requirement 14.1
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={`${label}${accessibilityState ? `. ${accessibilityState}` : ""}`}
      accessibilityHint={`Tap to open ${label.toLowerCase()} tracking`}
    >
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text
        className={`text-xs font-medium ${
          isActive
            ? "text-white"
            : darkMode
            ? "text-gray-300"
            : "text-gray-700"
        }`}
      >
        {label}
      </Text>
      {lastTime && !isActive && (
        <Text
          className={`text-[10px] mt-0.5 ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {getTimeSince(lastTime)}
        </Text>
      )}
      {isActive && (
        <View className="flex-row items-center mt-0.5">
          <View className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
          <Text className="text-[10px] text-white">Active</Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Summary Item Component
 */
function SummaryItem({
  icon,
  label,
  value,
  subValue,
  darkMode,
}: {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  darkMode: boolean;
}) {
  return (
    <View className="items-center flex-1">
      <Text className="text-xl mb-1">{icon}</Text>
      <Text
        className={`text-lg font-bold ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </Text>
      <Text
        className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        {label}
      </Text>
      {subValue && (
        <Text
          className={`text-[10px] mt-0.5 ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {subValue}
        </Text>
      )}
    </View>
  );
}

/**
 * Time Since Item Component
 */
function TimeSinceItem({
  icon,
  label,
  time,
  darkMode,
}: {
  icon: string;
  label: string;
  time: string;
  darkMode: boolean;
}) {
  return (
    <View className="items-center flex-1">
      <Text className="text-lg mb-1">{icon}</Text>
      <Text
        className={`text-sm font-semibold ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        {time}
      </Text>
      <Text
        className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Activity Row Component
 */
function ActivityRow({
  activity,
  darkMode,
  isLast,
}: {
  activity: ActivityItem;
  darkMode: boolean;
  isLast: boolean;
}) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View
      className={`flex-row items-center px-4 py-3 ${
        !isLast && (darkMode ? "border-b border-gray-700" : "border-b border-gray-100")
      }`}
    >
      <Text className="text-xl mr-3">{activity.icon}</Text>
      <View className="flex-1">
        <Text
          className={`text-sm font-medium ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {activity.details}
        </Text>
        <Text
          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          {formatTime(activity.timestamp)} · {getTimeSince(activity.timestamp)}
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  quickActionButton: {
    minWidth: 80,
    minHeight: 80,
  },
});
