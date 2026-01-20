import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, useHaptics } from "../../src/hooks";
import { createApiClient } from "../../src/services/ApiClient";
import { useBabyStore } from "../../src/store";
import type {
  TrendPeriod,
  TrendInsightsResponse,
  TrendInsightItem,
  TrendCategory,
} from "../../src/types/insights";

type IoniconsName = keyof typeof Ionicons.glyphMap;

const PERIOD_OPTIONS: { value: TrendPeriod; label: string; icon: IoniconsName }[] = [
  { value: "daily", label: "Today", icon: "today-outline" },
  { value: "weekly", label: "Week", icon: "calendar-outline" },
  { value: "monthly", label: "Month", icon: "calendar-number-outline" },
  { value: "yearly", label: "Year", icon: "albums-outline" },
];

const CATEGORY_ICONS: Record<TrendCategory, IoniconsName> = {
  sleep: "moon-outline",
  feeding: "restaurant-outline",
  diaper: "water-outline",
  growth: "trending-up-outline",
  activity: "game-controller-outline",
  overall: "analytics-outline",
};

const TREND_COLORS = {
  improving: { bg: "bg-green-100", text: "text-green-700", darkBg: "bg-green-900/30", darkText: "text-green-400" },
  declining: { bg: "bg-red-100", text: "text-red-700", darkBg: "bg-red-900/30", darkText: "text-red-400" },
  stable: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "bg-blue-900/30", darkText: "text-blue-400" },
  new: { bg: "bg-purple-100", text: "text-purple-700", darkBg: "bg-purple-900/30", darkText: "text-purple-400" },
};

/**
 * Period selector tabs
 */
function PeriodTabs({
  selected,
  onSelect,
  darkMode,
}: {
  selected: TrendPeriod;
  onSelect: (period: TrendPeriod) => void;
  darkMode: boolean;
}) {
  const { lightHaptic } = useHaptics();

  return (
    <View className="flex-row px-4 py-3 gap-2">
      {PERIOD_OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => {
            lightHaptic();
            onSelect(option.value);
          }}
          className={`flex-1 py-3 px-2 rounded-xl items-center ${
            selected === option.value
              ? darkMode
                ? "bg-fuchsia-600"
                : "bg-purple-600"
              : darkMode
              ? "bg-gray-800"
              : "bg-white"
          }`}
          style={styles.minHeight48}
          accessibilityRole="tab"
          accessibilityState={{ selected: selected === option.value }}
          accessibilityLabel={option.label}
        >
          <Ionicons
            name={option.icon}
            size={20}
            color={
              selected === option.value
                ? "#ffffff"
                : darkMode
                ? "#9ca3af"
                : "#6b7280"
            }
          />
          <Text
            className={`text-xs mt-1 font-medium ${
              selected === option.value
                ? "text-white"
                : darkMode
                ? "text-gray-400"
                : "text-gray-600"
            }`}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}


/**
 * AI Summary card component
 */
function AISummaryCard({
  summary,
  isLoading,
  darkMode,
}: {
  summary: string;
  isLoading: boolean;
  darkMode: boolean;
}) {
  if (isLoading) {
    return (
      <View
        className={`mx-4 p-4 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <View className="flex-row items-center mb-3">
          <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${darkMode ? "bg-fuchsia-900/30" : "bg-purple-100"}`}>
            <Ionicons name="sparkles" size={16} color={darkMode ? "#e879f9" : "#9333ea"} />
          </View>
          <Text className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            AI Analysis
          </Text>
        </View>
        <View className="flex-row items-center justify-center py-6">
          <ActivityIndicator size="small" color={darkMode ? "#e879f9" : "#9333ea"} />
          <Text className={`ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Analyzing patterns...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`mx-4 p-4 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <View className="flex-row items-center mb-3">
        <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${darkMode ? "bg-fuchsia-900/30" : "bg-purple-100"}`}>
          <Ionicons name="sparkles" size={16} color={darkMode ? "#e879f9" : "#9333ea"} />
        </View>
        <Text className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
          AI Analysis
        </Text>
      </View>
      <Text className={`leading-6 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {summary}
      </Text>
    </View>
  );
}

/**
 * Insight item card
 */
function InsightCard({
  insight,
  darkMode,
}: {
  insight: TrendInsightItem;
  darkMode: boolean;
}) {
  const trendStyle = TREND_COLORS[insight.trend];
  const _categoryIcon = CATEGORY_ICONS[insight.category];

  return (
    <View className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <View className="flex-row items-start">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            darkMode ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <Text className="text-lg">{insight.icon || "📊"}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className={`font-semibold flex-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
              {insight.title}
            </Text>
            <View
              className={`px-2 py-1 rounded-full ${
                darkMode ? trendStyle.darkBg : trendStyle.bg
              }`}
            >
              <Text
                className={`text-xs font-medium capitalize ${
                  darkMode ? trendStyle.darkText : trendStyle.text
                }`}
              >
                {insight.trend}
                {insight.changePercent !== undefined && insight.changePercent !== 0 && (
                  <Text> {insight.changePercent > 0 ? "+" : ""}{insight.changePercent}%</Text>
                )}
              </Text>
            </View>
          </View>
          <Text className={`text-sm leading-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {insight.description}
          </Text>
          {insight.recommendation && (
            <View className={`mt-2 p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <Text className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                💡 {insight.recommendation}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}


/**
 * Highlights section
 */
function HighlightsSection({
  highlights,
  darkMode,
}: {
  highlights: string[];
  darkMode: boolean;
}) {
  if (highlights.length === 0) return null;

  return (
    <View className={`mx-4 p-4 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <View className="flex-row items-center mb-3">
        <Ionicons name="star" size={18} color={darkMode ? "#fbbf24" : "#f59e0b"} />
        <Text className={`font-semibold ml-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
          Highlights
        </Text>
      </View>
      {highlights.map((highlight, index) => (
        <View key={index} className="flex-row items-start mb-2 last:mb-0">
          <Text className={`mr-2 ${darkMode ? "text-green-400" : "text-green-600"}`}>✓</Text>
          <Text className={`flex-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            {highlight}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Areas of concern section
 */
function ConcernsSection({
  concerns,
  darkMode,
}: {
  concerns: string[];
  darkMode: boolean;
}) {
  if (concerns.length === 0) return null;

  return (
    <View className={`mx-4 p-4 rounded-2xl ${darkMode ? "bg-amber-900/20" : "bg-amber-50"}`}>
      <View className="flex-row items-center mb-3">
        <Ionicons name="alert-circle" size={18} color={darkMode ? "#fbbf24" : "#f59e0b"} />
        <Text className={`font-semibold ml-2 ${darkMode ? "text-amber-400" : "text-amber-700"}`}>
          Areas to Watch
        </Text>
      </View>
      {concerns.map((concern, index) => (
        <View key={index} className="flex-row items-start mb-2 last:mb-0">
          <Text className={`mr-2 ${darkMode ? "text-amber-400" : "text-amber-600"}`}>•</Text>
          <Text className={`flex-1 ${darkMode ? "text-amber-200" : "text-amber-800"}`}>
            {concern}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Quick stats row
 */
function QuickStats({
  data,
  darkMode,
}: {
  data: TrendInsightsResponse;
  darkMode: boolean;
}) {
  const stats = [
    {
      icon: "moon-outline" as IoniconsName,
      label: "Sleep",
      value: `${Math.round(data.aggregatedData.sleep.averageDailySleepMinutes / 60)}h`,
      subValue: "avg/day",
    },
    {
      icon: "restaurant-outline" as IoniconsName,
      label: "Feedings",
      value: `${Math.round(data.aggregatedData.feeding.averageFeedingsPerDay)}`,
      subValue: "avg/day",
    },
    {
      icon: "water-outline" as IoniconsName,
      label: "Diapers",
      value: `${Math.round(data.aggregatedData.diaper.averageChangesPerDay)}`,
      subValue: "avg/day",
    },
    {
      icon: "fitness-outline" as IoniconsName,
      label: "Tummy Time",
      value: `${data.aggregatedData.activity.averageDailyTummyTime}m`,
      subValue: "avg/day",
    },
  ];

  return (
    <View className="flex-row mx-4 gap-2">
      {stats.map((stat, index) => (
        <View
          key={index}
          className={`flex-1 p-3 rounded-xl items-center ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <Ionicons
            name={stat.icon}
            size={20}
            color={darkMode ? "#c026d3" : "#9333ea"}
          />
          <Text className={`text-lg font-bold mt-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
            {stat.value}
          </Text>
          <Text className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            {stat.subValue}
          </Text>
        </View>
      ))}
    </View>
  );
}


/**
 * Empty state when no baby is selected
 */
function EmptyState({ darkMode }: { darkMode: boolean }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View
        className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
          darkMode ? "bg-gray-800" : "bg-gray-100"
        }`}
      >
        <Ionicons
          name="analytics-outline"
          size={40}
          color={darkMode ? "#6b7280" : "#9ca3af"}
        />
      </View>
      <Text
        className={`text-lg font-semibold text-center mb-2 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        No Baby Selected
      </Text>
      <Text
        className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        Select a baby profile to view AI-powered insights and trends.
      </Text>
    </View>
  );
}

/**
 * Error state
 */
function ErrorState({
  message,
  onRetry,
  darkMode,
}: {
  message: string;
  onRetry: () => void;
  darkMode: boolean;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View
        className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
          darkMode ? "bg-red-900/30" : "bg-red-100"
        }`}
      >
        <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
      </View>
      <Text
        className={`text-lg font-semibold text-center mb-2 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        Unable to Load Insights
      </Text>
      <Text
        className={`text-center mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        className={`px-6 py-3 rounded-xl ${darkMode ? "bg-fuchsia-600" : "bg-purple-600"}`}
        style={styles.minHeight48}
      >
        <Text className="text-white font-medium">Try Again</Text>
      </Pressable>
    </View>
  );
}

/**
 * Main Insights Screen
 * Displays AI-powered trend insights with period selection
 */
export default function InsightsScreen() {
  const { darkMode } = useTheme();
  const { lightHaptic } = useHaptics();
  const selectedBaby = useBabyStore((state) => state.selectedBaby);

  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>("daily");
  const [insights, setInsights] = useState<TrendInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!selectedBaby?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const client = await createApiClient();
      if (!client) {
        throw new Error("Not connected to server");
      }

      const response = await client.getTrendInsights(selectedBaby.id, selectedPeriod);
      setInsights(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load insights";
      setError(message);
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBaby?.id, selectedPeriod]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    lightHaptic();
    await fetchInsights();
    setRefreshing(false);
  }, [fetchInsights, lightHaptic]);

  const handlePeriodChange = (period: TrendPeriod) => {
    setSelectedPeriod(period);
  };

  if (!selectedBaby) {
    return (
      <SafeAreaView
        className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
        edges={["bottom"]}
      >
        <PeriodTabs
          selected={selectedPeriod}
          onSelect={handlePeriodChange}
          darkMode={darkMode}
        />
        <EmptyState darkMode={darkMode} />
      </SafeAreaView>
    );
  }

  if (error && !insights) {
    return (
      <SafeAreaView
        className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
        edges={["bottom"]}
      >
        <PeriodTabs
          selected={selectedPeriod}
          onSelect={handlePeriodChange}
          darkMode={darkMode}
        />
        <ErrorState message={error} onRetry={fetchInsights} darkMode={darkMode} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      edges={["bottom"]}
    >
      <PeriodTabs
        selected={selectedPeriod}
        onSelect={handlePeriodChange}
        darkMode={darkMode}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={darkMode ? "#e879f9" : "#9333ea"}
          />
        }
      >
        {isLoading && !insights ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={darkMode ? "#e879f9" : "#9333ea"} />
            <Text className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Loading insights...
            </Text>
          </View>
        ) : insights ? (
          <View className="pb-8 gap-4">
            {/* Period info */}
            <View className="px-4 pt-2">
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {new Date(insights.periodStart).toLocaleDateString()} - {new Date(insights.periodEnd).toLocaleDateString()}
                {" • "}{insights.periodDays} day{insights.periodDays !== 1 ? "s" : ""}
              </Text>
            </View>

            {/* Quick stats */}
            <QuickStats data={insights} darkMode={darkMode} />

            {/* AI Summary */}
            <AISummaryCard
              summary={insights.aiSummary}
              isLoading={isLoading}
              darkMode={darkMode}
            />

            {/* Highlights */}
            <HighlightsSection highlights={insights.highlights} darkMode={darkMode} />

            {/* Areas of concern */}
            <ConcernsSection concerns={insights.areasOfConcern} darkMode={darkMode} />

            {/* Detailed insights */}
            {insights.insights.length > 0 && (
              <View className="px-4">
                <Text
                  className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Detailed Insights
                </Text>
                <View className="gap-3">
                  {insights.insights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} darkMode={darkMode} />
                  ))}
                </View>
              </View>
            )}

            {/* AI generation info */}
            {insights.aiSummaryGenerated && insights.aiDurationMs && (
              <Text className={`text-xs text-center ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                AI analysis completed in {(insights.aiDurationMs / 1000).toFixed(1)}s
              </Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  minHeight48: {
    minHeight: 48,
  },
});
