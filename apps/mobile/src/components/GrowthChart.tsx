/**
 * Interactive Growth Chart Component
 * Displays baby growth data against WHO percentile curves
 * Validates: Requirements 6.1, 6.2, 6.4, 14.1
 */

import React, { useMemo } from "react";
import { View, Text, Pressable, Dimensions, StyleSheet } from "react-native";
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from "react-native-svg";

import {
  getAllPercentileCurves,
  type Gender,
  type MeasurementType,
  STANDARD_PERCENTILES,
} from "../data/whoGrowthStandards";
import { useHaptics } from "../hooks";

// Chart types
export type ChartType = "weight" | "height" | "head";

// Unit system
export type UnitSystem = "metric" | "imperial";

// Data point for the chart
export interface GrowthDataPoint {
  ageMonths: number;
  value: number; // In standard units (kg for weight, cm for height/head)
  timestamp: string;
  percentile?: number;
}

// Props for the GrowthChart component
export interface GrowthChartProps {
  /** Baby's gender for WHO standards */
  gender: Gender;
  /** Baby's date of birth */
  dateOfBirth: Date;
  /** Growth measurements data */
  data: GrowthDataPoint[];
  /** Currently selected chart type */
  chartType: ChartType;
  /** Unit system for display */
  unitSystem: UnitSystem;
  /** Whether dark mode is enabled */
  darkMode: boolean;
  /** Callback when a data point is selected */
  onDataPointSelect?: (point: GrowthDataPoint | null) => void;
  /** Currently selected data point */
  selectedPoint?: GrowthDataPoint | null;
}

// Chart dimensions
const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const CHART_HEIGHT = 280;

// Percentile curve colors
const PERCENTILE_COLORS: Record<number, string> = {
  3: "#ef4444",   // red-500
  15: "#f59e0b",  // amber-500
  50: "#22c55e",  // green-500
  85: "#f59e0b",  // amber-500
  97: "#ef4444",  // red-500
};

// Percentile curve opacity
const PERCENTILE_OPACITY: Record<number, number> = {
  3: 0.6,
  15: 0.7,
  50: 1,
  85: 0.7,
  97: 0.6,
};

/**
 * Convert measurement to display value based on unit system
 */
function convertToDisplayValue(
  value: number,
  chartType: ChartType,
  unitSystem: UnitSystem
): number {
  if (unitSystem === "imperial") {
    switch (chartType) {
      case "weight":
        return value * 2.20462; // kg to lb
      case "height":
      case "head":
        return value / 2.54; // cm to inches
    }
  }
  return value;
}

/**
 * Get unit label for chart type and unit system
 */
function getUnitLabel(chartType: ChartType, unitSystem: UnitSystem): string {
  if (unitSystem === "imperial") {
    switch (chartType) {
      case "weight":
        return "lb";
      case "height":
      case "head":
        return "in";
    }
  }
  switch (chartType) {
    case "weight":
      return "kg";
    case "height":
    case "head":
      return "cm";
  }
}

/**
 * Get measurement type from chart type
 */
function getMeasurementType(chartType: ChartType): MeasurementType {
  switch (chartType) {
    case "weight":
      return "weight";
    case "height":
      return "height";
    case "head":
      return "headCircumference";
  }
}

/**
 * Get chart title
 */
function getChartTitle(chartType: ChartType): string {
  switch (chartType) {
    case "weight":
      return "Weight for Age";
    case "height":
      return "Length/Height for Age";
    case "head":
      return "Head Circumference for Age";
  }
}

/**
 * Interactive Growth Chart Component
 */
export function GrowthChart({
  gender,
  dateOfBirth,
  data,
  chartType,
  unitSystem,
  darkMode,
  onDataPointSelect,
  selectedPoint,
}: GrowthChartProps) {
  const { lightHaptic } = useHaptics();
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 32; // Account for padding

  const measurementType = getMeasurementType(chartType);
  const unitLabel = getUnitLabel(chartType, unitSystem);

  // Calculate baby's current age in months
  const currentAgeMonths = useMemo(() => {
    const now = new Date();
    const diffMs = now.getTime() - dateOfBirth.getTime();
    return Math.min(24, diffMs / (1000 * 60 * 60 * 24 * 30.4375));
  }, [dateOfBirth]);

  // Get percentile curves
  const percentileCurves = useMemo(() => {
    return getAllPercentileCurves(measurementType, gender);
  }, [measurementType, gender]);

  // Calculate chart bounds
  const { minAge, maxAge, minValue, maxValue } = useMemo(() => {
    // Determine age range based on baby's age and data
    const dataAges = data.map((d) => d.ageMonths);
    const maxDataAge = dataAges.length > 0 ? Math.max(...dataAges) : 0;
    const maxAgeToShow = Math.min(24, Math.max(currentAgeMonths + 3, maxDataAge + 1, 6));
    
    // Get value range from percentile curves
    const curve3 = percentileCurves.get(3) || [];
    const curve97 = percentileCurves.get(97) || [];
    
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    // Consider percentile curves within age range
    for (const point of curve3) {
      if (point.ageMonths <= maxAgeToShow) {
        const displayVal = convertToDisplayValue(point.value, chartType, unitSystem);
        minVal = Math.min(minVal, displayVal);
      }
    }
    for (const point of curve97) {
      if (point.ageMonths <= maxAgeToShow) {
        const displayVal = convertToDisplayValue(point.value, chartType, unitSystem);
        maxVal = Math.max(maxVal, displayVal);
      }
    }
    
    // Consider actual data points
    for (const point of data) {
      const displayVal = convertToDisplayValue(point.value, chartType, unitSystem);
      minVal = Math.min(minVal, displayVal * 0.95);
      maxVal = Math.max(maxVal, displayVal * 1.05);
    }
    
    // Add padding
    const range = maxVal - minVal;
    minVal = Math.max(0, minVal - range * 0.1);
    maxVal = maxVal + range * 0.1;
    
    return {
      minAge: 0,
      maxAge: maxAgeToShow,
      minValue: minVal,
      maxValue: maxVal,
    };
  }, [data, currentAgeMonths, percentileCurves, chartType, unitSystem]);

  // Chart drawing area dimensions
  const drawWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const drawHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // Scale functions
  const scaleX = (age: number): number => {
    return CHART_PADDING.left + ((age - minAge) / (maxAge - minAge)) * drawWidth;
  };

  const scaleY = (value: number): number => {
    const displayValue = typeof value === "number" ? value : 0;
    return CHART_PADDING.top + drawHeight - ((displayValue - minValue) / (maxValue - minValue)) * drawHeight;
  };

  // Generate path for percentile curve
  const generateCurvePath = (curveData: { ageMonths: number; value: number }[]): string => {
    const filteredData = curveData.filter((p) => p.ageMonths <= maxAge);
    if (filteredData.length === 0) return "";

    const points = filteredData.map((p) => ({
      x: scaleX(p.ageMonths),
      y: scaleY(convertToDisplayValue(p.value, chartType, unitSystem)),
    }));

    // Create smooth curve using quadratic bezier
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` Q ${cpX} ${prev.y} ${curr.x} ${curr.y}`;
    }
    return path;
  };

  // Generate Y-axis ticks
  const yTicks = useMemo(() => {
    const range = maxValue - minValue;
    const tickCount = 5;
    const tickStep = range / (tickCount - 1);
    const ticks: number[] = [];
    for (let i = 0; i < tickCount; i++) {
      ticks.push(minValue + i * tickStep);
    }
    return ticks;
  }, [minValue, maxValue]);

  // Generate X-axis ticks
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = maxAge <= 6 ? 1 : maxAge <= 12 ? 2 : 3;
    for (let i = 0; i <= maxAge; i += step) {
      ticks.push(i);
    }
    return ticks;
  }, [maxAge]);

  // Handle data point press
  const handleDataPointPress = (point: GrowthDataPoint) => {
    lightHaptic();
    onDataPointSelect?.(selectedPoint?.timestamp === point.timestamp ? null : point);
  };

  // Colors based on dark mode
  const colors = {
    background: darkMode ? "#1f2937" : "#ffffff",
    gridLine: darkMode ? "#374151" : "#e5e7eb",
    axisText: darkMode ? "#9ca3af" : "#6b7280",
    dataPoint: "#14b8a6", // teal-500
    dataPointSelected: "#0d9488", // teal-600
    dataPointStroke: darkMode ? "#1f2937" : "#ffffff",
  };

  return (
    <View className={`rounded-xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Chart Title */}
      <View className="px-4 pt-4 pb-2">
        <Text className={`text-base font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
          {getChartTitle(chartType)}
        </Text>
        <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          WHO Growth Standards • {gender === "male" ? "Boys" : "Girls"} 0-24 months
        </Text>
      </View>

      {/* SVG Chart */}
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          {/* Gradient for the area under 50th percentile */}
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect
          x={CHART_PADDING.left}
          y={CHART_PADDING.top}
          width={drawWidth}
          height={drawHeight}
          fill={colors.background}
        />

        {/* Grid lines - horizontal */}
        {yTicks.map((tick, i) => (
          <Line
            key={`h-grid-${i}`}
            x1={CHART_PADDING.left}
            y1={scaleY(tick)}
            x2={chartWidth - CHART_PADDING.right}
            y2={scaleY(tick)}
            stroke={colors.gridLine}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Grid lines - vertical */}
        {xTicks.map((tick, i) => (
          <Line
            key={`v-grid-${i}`}
            x1={scaleX(tick)}
            y1={CHART_PADDING.top}
            x2={scaleX(tick)}
            y2={CHART_HEIGHT - CHART_PADDING.bottom}
            stroke={colors.gridLine}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Percentile curves */}
        {STANDARD_PERCENTILES.map((percentile) => {
          const curveData = percentileCurves.get(percentile);
          if (!curveData) return null;
          const path = generateCurvePath(curveData);
          return (
            <G key={`percentile-${percentile}`}>
              <Path
                d={path}
                stroke={PERCENTILE_COLORS[percentile]}
                strokeWidth={percentile === 50 ? 2.5 : 1.5}
                strokeOpacity={PERCENTILE_OPACITY[percentile]}
                fill="none"
              />
              {/* Percentile label at the end of curve */}
              {curveData.length > 0 && (
                <SvgText
                  x={chartWidth - CHART_PADDING.right + 2}
                  y={scaleY(convertToDisplayValue(
                    curveData.find((p) => p.ageMonths === Math.floor(maxAge))?.value || 
                    curveData[curveData.length - 1].value,
                    chartType,
                    unitSystem
                  ))}
                  fontSize={9}
                  fill={PERCENTILE_COLORS[percentile]}
                  opacity={PERCENTILE_OPACITY[percentile]}
                  textAnchor="start"
                  alignmentBaseline="middle"
                >
                  {percentile}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <SvgText
            key={`y-label-${i}`}
            x={CHART_PADDING.left - 8}
            y={scaleY(tick)}
            fontSize={10}
            fill={colors.axisText}
            textAnchor="end"
            alignmentBaseline="middle"
          >
            {tick.toFixed(1)}
          </SvgText>
        ))}

        {/* X-axis labels */}
        {xTicks.map((tick, i) => (
          <SvgText
            key={`x-label-${i}`}
            x={scaleX(tick)}
            y={CHART_HEIGHT - CHART_PADDING.bottom + 16}
            fontSize={10}
            fill={colors.axisText}
            textAnchor="middle"
          >
            {tick}
          </SvgText>
        ))}

        {/* Axis labels */}
        <SvgText
          x={chartWidth / 2}
          y={CHART_HEIGHT - 8}
          fontSize={11}
          fill={colors.axisText}
          textAnchor="middle"
        >
          Age (months)
        </SvgText>
        <SvgText
          x={12}
          y={CHART_HEIGHT / 2}
          fontSize={11}
          fill={colors.axisText}
          textAnchor="middle"
          rotation={-90}
          originX={12}
          originY={CHART_HEIGHT / 2}
        >
          {unitLabel}
        </SvgText>

        {/* Data points */}
        {data.map((point, index) => {
          const displayValue = convertToDisplayValue(point.value, chartType, unitSystem);
          const x = scaleX(point.ageMonths);
          const y = scaleY(displayValue);
          const isSelected = selectedPoint?.timestamp === point.timestamp;

          return (
            <G key={`data-point-${index}`}>
              {/* Outer ring for selected state */}
              {isSelected && (
                <Circle
                  cx={x}
                  cy={y}
                  r={14}
                  fill={colors.dataPoint}
                  opacity={0.2}
                />
              )}
              {/* Data point circle */}
              <Circle
                cx={x}
                cy={y}
                r={isSelected ? 8 : 6}
                fill={isSelected ? colors.dataPointSelected : colors.dataPoint}
                stroke={colors.dataPointStroke}
                strokeWidth={2}
              />
            </G>
          );
        })}

        {/* Current age indicator line */}
        <Line
          x1={scaleX(currentAgeMonths)}
          y1={CHART_PADDING.top}
          x2={scaleX(currentAgeMonths)}
          y2={CHART_HEIGHT - CHART_PADDING.bottom}
          stroke={darkMode ? "#6b7280" : "#9ca3af"}
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      </Svg>

      {/* Touchable overlay for data points */}
      <View
        style={[styles.touchableOverlay, {
          top: CHART_PADDING.top,
          left: CHART_PADDING.left,
          width: drawWidth,
          height: drawHeight,
        }]}
        pointerEvents="box-none"
      >
        {data.map((point, index) => {
          const displayValue = convertToDisplayValue(point.value, chartType, unitSystem);
          const x = scaleX(point.ageMonths) - CHART_PADDING.left;
          const y = scaleY(displayValue) - CHART_PADDING.top;

          return (
            <Pressable
              key={`touch-${index}`}
              onPress={() => handleDataPointPress(point)}
              style={[styles.dataPointTouchable, { left: x - 24, top: y - 24 }]}
              accessibilityRole="button"
              accessibilityLabel={`Data point at ${point.ageMonths.toFixed(1)} months: ${displayValue.toFixed(2)} ${unitLabel}`}
              accessibilityHint="Tap to see details"
            />
          );
        })}
      </View>

      {/* Selected point details */}
      {selectedPoint && (
        <View className={`mx-4 mb-4 p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                {convertToDisplayValue(selectedPoint.value, chartType, unitSystem).toFixed(2)} {unitLabel}
              </Text>
              <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                at {selectedPoint.ageMonths.toFixed(1)} months
              </Text>
            </View>
            {selectedPoint.percentile !== undefined && (
              <View className="items-end">
                <Text className={`text-sm font-medium ${
                  selectedPoint.percentile < 3 || selectedPoint.percentile > 97
                    ? "text-red-500"
                    : selectedPoint.percentile < 15 || selectedPoint.percentile > 85
                    ? "text-amber-500"
                    : "text-green-500"
                }`}>
                  {selectedPoint.percentile.toFixed(0)}th percentile
                </Text>
                <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {new Date(selectedPoint.timestamp).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Legend */}
      <View className="px-4 pb-4">
        <View className="flex-row flex-wrap gap-3">
          {STANDARD_PERCENTILES.map((percentile) => (
            <View key={`legend-${percentile}`} className="flex-row items-center">
              <View
                style={[styles.legendLine, {
                  backgroundColor: PERCENTILE_COLORS[percentile],
                  opacity: PERCENTILE_OPACITY[percentile],
                }]}
              />
              <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {percentile === 50 ? "50th (median)" : `${percentile}th`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Chart Type Tabs Component
 */
export interface ChartTypeTabsProps {
  selectedType: ChartType;
  onTypeChange: (type: ChartType) => void;
  darkMode: boolean;
  hasWeightData: boolean;
  hasHeightData: boolean;
  hasHeadData: boolean;
}

export function ChartTypeTabs({
  selectedType,
  onTypeChange,
  darkMode,
  hasWeightData,
  hasHeightData,
  hasHeadData,
}: ChartTypeTabsProps) {
  const { lightHaptic } = useHaptics();

  const tabs: { type: ChartType; label: string; icon: string; hasData: boolean }[] = [
    { type: "weight", label: "Weight", icon: "⚖️", hasData: hasWeightData },
    { type: "height", label: "Height", icon: "📏", hasData: hasHeightData },
    { type: "head", label: "Head", icon: "👶", hasData: hasHeadData },
  ];

  const handleTabPress = (type: ChartType) => {
    lightHaptic();
    onTypeChange(type);
  };

  return (
    <View className={`flex-row p-1 rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.type}
          onPress={() => handleTabPress(tab.type)}
          className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
            selectedType === tab.type
              ? "bg-teal-600"
              : "bg-transparent"
          }`}
          style={styles.chartTypeTab}
          accessibilityRole="tab"
          accessibilityLabel={`${tab.label} chart`}
          accessibilityState={{ selected: selectedType === tab.type }}
          accessibilityHint={`Tap to view ${tab.label.toLowerCase()} growth chart`}
        >
          <Text className="mr-1">{tab.icon}</Text>
          <Text
            className={`font-medium text-sm ${
              selectedType === tab.type
                ? "text-white"
                : darkMode
                ? "text-gray-400"
                : "text-gray-600"
            }`}
          >
            {tab.label}
          </Text>
          {!tab.hasData && (
            <View className="ml-1 w-2 h-2 rounded-full bg-gray-400" />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  touchableOverlay: {
    position: "absolute",
  },
  dataPointTouchable: {
    position: "absolute",
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    marginRight: 4,
  },
  chartTypeTab: {
    minHeight: 48,
  },
});

export default GrowthChart;
