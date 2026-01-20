import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";

import { HourlyActivityChart, ChartLegend } from "./MiniChart";
import { getDatabaseService } from "../database/DatabaseService";
import type {
  LocalFeedingEntry,
  LocalSleepEntry,
  LocalDiaperEntry,
  LocalActivityEntry,
} from "../database/types";
import { useActiveBaby, useBabyStore } from "../store";

/**
 * Daily summary data structure
 */
interface DailySummaryData {
  date: Date;
  feeding: {
    count: number;
    totalMinutes: number;
    totalMl: number;
    byType: {
      breastfeeding: number;
      bottle: number;
      pumping: number;
      solid: number;
    };
  };
  sleep: {
    totalMinutes: number;
    napCount: number;
    napMinutes: number;
    nightSleepMinutes: number;
  };
  diaper: {
    total: number;
    wet: number;
    dirty: number;
    mixed: number;
  };
  activities: {
    tummyTimeMinutes: number;
    bathCount: number;
    outdoorMinutes: number;
  };
  hourlyBreakdown: {
    hour: number;
    feeding: number;
    sleep: number;
    diaper: number;
    activity: number;
    total: number;
  }[];
}

/**
 * Format minutes as hours and minutes
 */
function formatDuration(minutes: number): string {
  if (minutes === 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

/**
 * Format date for display
 */
function formatDateLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() === today.getTime()) {
    return "Today";
  }
  if (targetDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface DailySummaryCardProps {
  /**
   * Callback when the card is pressed
   */
  onPress?: () => void;
  /**
   * Initial date to show (defaults to today)
   */
  initialDate?: Date;
}

/**
 * DailySummaryCard Component
 * Displays daily statistics with visual charts for feeding, sleep, and diaper activities
 */
export function DailySummaryCard({ onPress, initialDate }: DailySummaryCardProps) {
  const darkMode = useBabyStore((state) => state.darkMode);
  const activeBaby = useActiveBaby();

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate ?? new Date());
  const [summaryData, setSummaryData] = useState<DailySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Navigate to previous day
   */
  const goToPreviousDay = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  /**
   * Navigate to next day
   */
  const goToNextDay = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      newDate.setHours(0, 0, 0, 0);
      
      // Don't go beyond today
      if (newDate.getTime() > today.getTime()) {
        return prev;
      }
      return newDate;
    });
  }, []);

  /**
   * Check if we can go to next day
   */
  const canGoNext = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected.getTime() < today.getTime();
  }, [selectedDate]);

  /**
   * Load summary data from local database
   */
  const loadSummaryData = useCallback(async () => {
    if (!activeBaby) {
      setSummaryData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const db = getDatabaseService();
      await db.initialize();

      // Get start and end of selected day
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all entries for the day
      const [feedingEntries, sleepEntries, diaperEntries, activityEntries] = await Promise.all([
        db.getFeedingEntries(activeBaby.id, 100),
        db.getSleepEntries(activeBaby.id, 100),
        db.getDiaperEntries(activeBaby.id, 100),
        db.getActivityEntries(activeBaby.id, 100),
      ]);

      // Filter entries for the selected day
      const dayFeedings = feedingEntries.filter((e: LocalFeedingEntry) => {
        const ts = new Date(e.timestamp);
        return ts >= startOfDay && ts <= endOfDay;
      });

      const daySleeps = sleepEntries.filter((e: LocalSleepEntry) => {
        const ts = new Date(e.startTime);
        return ts >= startOfDay && ts <= endOfDay;
      });

      const dayDiapers = diaperEntries.filter((e: LocalDiaperEntry) => {
        const ts = new Date(e.timestamp);
        return ts >= startOfDay && ts <= endOfDay;
      });

      const dayActivities = activityEntries.filter((e: LocalActivityEntry) => {
        const ts = new Date(e.timestamp);
        return ts >= startOfDay && ts <= endOfDay;
      });

      // Aggregate feeding data
      let breastfeedingCount = 0;
      let bottleCount = 0;
      let pumpingCount = 0;
      let solidCount = 0;
      let totalFeedingMinutes = 0;
      let totalBottleMl = 0;

      for (const entry of dayFeedings) {
        switch (entry.type) {
          case "breastfeeding": {
            breastfeedingCount++;
            const leftMin = entry.leftDuration ? entry.leftDuration / 60 : 0;
            const rightMin = entry.rightDuration ? entry.rightDuration / 60 : 0;
            totalFeedingMinutes += leftMin + rightMin;
            break;
          }
          case "bottle":
            bottleCount++;
            if (entry.amount) totalBottleMl += entry.amount;
            break;
          case "pumping":
            pumpingCount++;
            break;
          case "solid":
            solidCount++;
            break;
        }
      }

      // Aggregate sleep data
      let totalSleepMinutes = 0;
      let napCount = 0;
      let napMinutes = 0;
      let nightSleepMinutes = 0;

      for (const entry of daySleeps) {
        const duration = entry.duration ?? 0;
        totalSleepMinutes += duration;
        if (entry.sleepType === "nap") {
          napCount++;
          napMinutes += duration;
        } else {
          nightSleepMinutes += duration;
        }
      }

      // Aggregate diaper data
      let wetCount = 0;
      let dirtyCount = 0;
      let mixedCount = 0;

      for (const entry of dayDiapers) {
        switch (entry.type) {
          case "wet":
            wetCount++;
            break;
          case "dirty":
            dirtyCount++;
            break;
          case "mixed":
            mixedCount++;
            break;
        }
      }

      // Aggregate activity data
      let tummyTimeMinutes = 0;
      let bathCount = 0;
      let outdoorMinutes = 0;

      for (const entry of dayActivities) {
        const duration = entry.duration ?? 0;
        const activityType = entry.activityType.toLowerCase().replace("_", "");
        switch (activityType) {
          case "tummytime":
            tummyTimeMinutes += duration;
            break;
          case "bath":
            bathCount++;
            break;
          case "outdoor":
            outdoorMinutes += duration;
            break;
        }
      }

      // Build hourly breakdown
      const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        feeding: 0,
        sleep: 0,
        diaper: 0,
        activity: 0,
        total: 0,
      }));

      for (const entry of dayFeedings) {
        const hour = new Date(entry.timestamp).getHours();
        const hourData = hourlyBreakdown[hour];
        if (hourData) {
          hourData.feeding++;
          hourData.total++;
        }
      }

      for (const entry of daySleeps) {
        const hour = new Date(entry.startTime).getHours();
        const hourData = hourlyBreakdown[hour];
        if (hourData) {
          hourData.sleep++;
          hourData.total++;
        }
      }

      for (const entry of dayDiapers) {
        const hour = new Date(entry.timestamp).getHours();
        const hourData = hourlyBreakdown[hour];
        if (hourData) {
          hourData.diaper++;
          hourData.total++;
        }
      }

      for (const entry of dayActivities) {
        const hour = new Date(entry.timestamp).getHours();
        const hourData = hourlyBreakdown[hour];
        if (hourData) {
          hourData.activity++;
          hourData.total++;
        }
      }

      setSummaryData({
        date: selectedDate,
        feeding: {
          count: dayFeedings.length,
          totalMinutes: Math.round(totalFeedingMinutes),
          totalMl: totalBottleMl,
          byType: {
            breastfeeding: breastfeedingCount,
            bottle: bottleCount,
            pumping: pumpingCount,
            solid: solidCount,
          },
        },
        sleep: {
          totalMinutes: totalSleepMinutes,
          napCount,
          napMinutes,
          nightSleepMinutes,
        },
        diaper: {
          total: dayDiapers.length,
          wet: wetCount,
          dirty: dirtyCount,
          mixed: mixedCount,
        },
        activities: {
          tummyTimeMinutes,
          bathCount,
          outdoorMinutes,
        },
        hourlyBreakdown,
      });
    } catch (error) {
      console.error("[DailySummaryCard] Error loading data:", error);
      setSummaryData(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeBaby, selectedDate]);

  // Load data when baby or date changes
  useEffect(() => {
    loadSummaryData();
  }, [loadSummaryData]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(loadSummaryData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadSummaryData]);

  // Don't render if no active baby
  if (!activeBaby) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View
        className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <Text
          className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Loading...
        </Text>
      </View>
    );
  }

  // Chart legend colors
  const legendItems = [
    { label: "Feed", color: darkMode ? "#f472b6" : "#ec4899" },
    { label: "Sleep", color: darkMode ? "#818cf8" : "#6366f1" },
    { label: "Diaper", color: darkMode ? "#34d399" : "#10b981" },
    { label: "Activity", color: darkMode ? "#fbbf24" : "#f59e0b" },
  ];

  return (
    <Pressable
      onPress={onPress}
      className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
      accessibilityRole="button"
      accessibilityLabel={`Daily summary for ${formatDateLabel(selectedDate)}`}
      accessibilityHint="Tap for more details"
    >
      {/* Header with date navigation */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Text className="text-xl mr-2">📊</Text>
          <Text
            className={`text-base font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Daily Summary
          </Text>
        </View>
        
        {/* Date selector */}
        <View className="flex-row items-center">
          <Pressable
            onPress={goToPreviousDay}
            className="p-1"
            accessibilityLabel="Previous day"
            accessibilityRole="button"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={darkMode ? "#9ca3af" : "#6b7280"}
            />
          </Pressable>
          <Text
            className={`mx-2 text-sm font-medium ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {formatDateLabel(selectedDate)}
          </Text>
          <Pressable
            onPress={goToNextDay}
            className="p-1"
            accessibilityLabel="Next day"
            accessibilityRole="button"
            disabled={!canGoNext()}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                canGoNext()
                  ? darkMode
                    ? "#9ca3af"
                    : "#6b7280"
                  : darkMode
                  ? "#4b5563"
                  : "#d1d5db"
              }
            />
          </Pressable>
        </View>
      </View>

      {summaryData ? (
        <>
          {/* Stats Grid */}
          <View className="flex-row justify-between mb-4">
            {/* Feeding */}
            <View className="items-center flex-1">
              <Text className="text-2xl mb-1">🍼</Text>
              <Text
                className={`text-lg font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {summaryData.feeding.count}
              </Text>
              <Text
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Feedings
              </Text>
              {summaryData.feeding.totalMl > 0 && (
                <Text
                  className={`text-[10px] ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {summaryData.feeding.totalMl}ml
                </Text>
              )}
            </View>

            {/* Sleep */}
            <View className="items-center flex-1">
              <Text className="text-2xl mb-1">😴</Text>
              <Text
                className={`text-lg font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {formatDuration(summaryData.sleep.totalMinutes)}
              </Text>
              <Text
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Sleep
              </Text>
              {summaryData.sleep.napCount > 0 && (
                <Text
                  className={`text-[10px] ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {summaryData.sleep.napCount} nap{summaryData.sleep.napCount !== 1 ? "s" : ""}
                </Text>
              )}
            </View>

            {/* Diapers */}
            <View className="items-center flex-1">
              <Text className="text-2xl mb-1">👶</Text>
              <Text
                className={`text-lg font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {summaryData.diaper.total}
              </Text>
              <Text
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Diapers
              </Text>
              <Text
                className={`text-[10px] ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                💧{summaryData.diaper.wet + summaryData.diaper.mixed} 💩{summaryData.diaper.dirty + summaryData.diaper.mixed}
              </Text>
            </View>
          </View>

          {/* Hourly Activity Chart */}
          <View
            className={`p-3 rounded-lg ${
              darkMode ? "bg-gray-700/50" : "bg-gray-50"
            }`}
          >
            <Text
              className={`text-xs mb-2 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Activity Timeline
            </Text>
            <HourlyActivityChart
              data={summaryData.hourlyBreakdown}
              height={40}
              darkMode={darkMode}
            />
            {/* Hour labels */}
            <View className="flex-row justify-between mt-1">
              <Text
                className={`text-[8px] ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                12am
              </Text>
              <Text
                className={`text-[8px] ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                6am
              </Text>
              <Text
                className={`text-[8px] ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                12pm
              </Text>
              <Text
                className={`text-[8px] ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                6pm
              </Text>
              <Text
                className={`text-[8px] ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                12am
              </Text>
            </View>
            {/* Legend */}
            <View className="mt-2">
              <ChartLegend items={legendItems} darkMode={darkMode} />
            </View>
          </View>

          {/* Additional Activities */}
          {(summaryData.activities.tummyTimeMinutes > 0 ||
            summaryData.activities.bathCount > 0 ||
            summaryData.activities.outdoorMinutes > 0) && (
            <View className="flex-row justify-center mt-3 gap-4">
              {summaryData.activities.tummyTimeMinutes > 0 && (
                <View className="flex-row items-center">
                  <Text className="text-sm mr-1">⏱️</Text>
                  <Text
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {formatDuration(summaryData.activities.tummyTimeMinutes)} tummy
                  </Text>
                </View>
              )}
              {summaryData.activities.bathCount > 0 && (
                <View className="flex-row items-center">
                  <Text className="text-sm mr-1">🛁</Text>
                  <Text
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {summaryData.activities.bathCount} bath{summaryData.activities.bathCount !== 1 ? "s" : ""}
                  </Text>
                </View>
              )}
              {summaryData.activities.outdoorMinutes > 0 && (
                <View className="flex-row items-center">
                  <Text className="text-sm mr-1">🌳</Text>
                  <Text
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {formatDuration(summaryData.activities.outdoorMinutes)} outdoor
                  </Text>
                </View>
              )}
            </View>
          )}
        </>
      ) : (
        /* No data state */
        <View className="items-center py-4">
          <Ionicons
            name="analytics-outline"
            size={32}
            color={darkMode ? "#6b7280" : "#9ca3af"}
          />
          <Text
            className={`mt-2 text-center ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No data for this day
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Start logging activities to see your daily summary
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default DailySummaryCard;
