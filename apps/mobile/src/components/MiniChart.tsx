import { View, Text, StyleSheet } from "react-native";

/**
 * Data point for the mini chart
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * Props for the MiniBarChart component
 */
interface MiniBarChartProps {
  /**
   * Data points to display
   */
  data: ChartDataPoint[];
  /**
   * Maximum value for scaling (auto-calculated if not provided)
   */
  maxValue?: number;
  /**
   * Height of the chart in pixels
   */
  height?: number;
  /**
   * Whether dark mode is enabled
   */
  darkMode?: boolean;
  /**
   * Show labels below bars
   */
  showLabels?: boolean;
  /**
   * Default bar color if not specified per data point
   */
  barColor?: string;
  /**
   * Accessibility label for the chart
   */
  accessibilityLabel?: string;
}

/**
 * MiniBarChart Component
 * A simple bar chart using View components with dynamic heights
 * No external charting library needed
 */
export function MiniBarChart({
  data,
  maxValue,
  height = 60,
  darkMode = false,
  showLabels = false,
  barColor,
  accessibilityLabel,
}: MiniBarChartProps) {
  // Calculate max value if not provided
  const calculatedMax = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  // Default colors
  const defaultBarColor = barColor ?? (darkMode ? "#a855f7" : "#c026d3");
  const labelColor = darkMode ? "text-gray-500" : "text-gray-400";

  return (
    <View
      className="flex-row items-end justify-between"
      style={showLabels ? styles.chartContainerWithLabels : styles.chartContainer}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ??
        `Bar chart with ${data.length} data points`
      }
    >
      {data.map((point, index) => {
        const barHeight = calculatedMax > 0 
          ? (point.value / calculatedMax) * height 
          : 0;
        const color = point.color ?? defaultBarColor;

        return (
          <View
            key={index}
            className="flex-1 items-center mx-0.5"
            accessibilityLabel={`${point.label}: ${point.value}`}
          >
            <View
              className="w-full rounded-t"
              style={[styles.bar, {
                height: Math.max(barHeight, point.value > 0 ? 2 : 0),
                backgroundColor: color,
              }]}
            />
            {showLabels && (
              <Text
                className={`text-[8px] mt-1 ${labelColor}`}
                numberOfLines={1}
              >
                {point.label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Props for the HourlyActivityChart component
 */
interface HourlyActivityChartProps {
  /**
   * Hourly data (24 entries, one per hour)
   */
  data: {
    hour: number;
    feeding: number;
    sleep: number;
    diaper: number;
    activity: number;
    total: number;
  }[];
  /**
   * Height of the chart
   */
  height?: number;
  /**
   * Whether dark mode is enabled
   */
  darkMode?: boolean;
}

/**
 * HourlyActivityChart Component
 * Shows activity distribution across 24 hours with color-coded stacked bars
 */
export function HourlyActivityChart({
  data,
  height = 50,
  darkMode = false,
}: HourlyActivityChartProps) {
  // Calculate max total for scaling
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  // Activity colors
  const colors = {
    feeding: darkMode ? "#f472b6" : "#ec4899", // Pink
    sleep: darkMode ? "#818cf8" : "#6366f1", // Indigo
    diaper: darkMode ? "#34d399" : "#10b981", // Emerald
    activity: darkMode ? "#fbbf24" : "#f59e0b", // Amber
  };

  return (
    <View
      className="flex-row items-end justify-between"
      style={styles.hourlyChartContainer}
      accessibilityRole="image"
      accessibilityLabel="Hourly activity distribution chart"
    >
      {data.map((hourData, index) => {
        const totalHeight = maxTotal > 0 
          ? (hourData.total / maxTotal) * height 
          : 0;

        // Calculate proportional heights for each activity type
        const feedingHeight = hourData.total > 0 
          ? (hourData.feeding / hourData.total) * totalHeight 
          : 0;
        const sleepHeight = hourData.total > 0 
          ? (hourData.sleep / hourData.total) * totalHeight 
          : 0;
        const diaperHeight = hourData.total > 0 
          ? (hourData.diaper / hourData.total) * totalHeight 
          : 0;
        const activityHeight = hourData.total > 0 
          ? (hourData.activity / hourData.total) * totalHeight 
          : 0;

        return (
          <View
            key={index}
            className="flex-1 mx-px"
            style={styles.hourlyBarContainer}
            accessibilityLabel={`Hour ${hourData.hour}: ${hourData.total} activities`}
          >
            <View className="flex-1 justify-end">
              {/* Stacked bar - bottom to top: feeding, sleep, diaper, activity */}
              <View className="rounded-t overflow-hidden">
                {activityHeight > 0 && (
                  <View
                    style={[styles.stackedBarSegment, {
                      height: activityHeight,
                      backgroundColor: colors.activity,
                    }]}
                  />
                )}
                {diaperHeight > 0 && (
                  <View
                    style={[styles.stackedBarSegment, {
                      height: diaperHeight,
                      backgroundColor: colors.diaper,
                    }]}
                  />
                )}
                {sleepHeight > 0 && (
                  <View
                    style={[styles.stackedBarSegment, {
                      height: sleepHeight,
                      backgroundColor: colors.sleep,
                    }]}
                  />
                )}
                {feedingHeight > 0 && (
                  <View
                    style={[styles.stackedBarSegment, {
                      height: feedingHeight,
                      backgroundColor: colors.feeding,
                    }]}
                  />
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Props for the ChartLegend component
 */
interface ChartLegendProps {
  /**
   * Legend items to display
   */
  items: {
    label: string;
    color: string;
  }[];
  /**
   * Whether dark mode is enabled
   */
  darkMode?: boolean;
}

/**
 * ChartLegend Component
 * Displays a horizontal legend for chart colors
 */
export function ChartLegend({ items, darkMode = false }: ChartLegendProps) {
  const textColor = darkMode ? "text-gray-400" : "text-gray-500";

  return (
    <View className="flex-row flex-wrap justify-center gap-x-3 gap-y-1">
      {items.map((item, index) => (
        <View key={index} className="flex-row items-center">
          <View
            className="w-2 h-2 rounded-full mr-1"
            style={[styles.legendDot, { backgroundColor: item.color }]}
          />
          <Text className={`text-[10px] ${textColor}`}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    height: 60,
  },
  chartContainerWithLabels: {
    height: 76,
  },
  bar: {
    minWidth: 4,
  },
  hourlyChartContainer: {
    height: 50,
  },
  hourlyBarContainer: {
    height: 50,
  },
  stackedBarSegment: {},
  legendDot: {},
});

export default MiniBarChart;
