"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, PercentileChartResponse } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { TrendingUp, Weight, Ruler, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricType = "weight" | "height" | "headCircumference";

interface GrowthPercentilesChartProps {
  className?: string;
}

export function GrowthPercentilesChart({ className }: GrowthPercentilesChartProps) {
  const { babyId } = useBaby();
  const [data, setData] = useState<PercentileChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricType>("weight");

  useEffect(() => {
    if (!babyId) {
      setLoading(false);
      return;
    }

    const fetchPercentiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.growth.getPercentiles(activeMetric);
        setData(response);
      } catch (err) {
        console.error("Failed to fetch growth percentiles:", err);
        setError("Failed to load growth percentiles");
      } finally {
        setLoading(false);
      }
    };

    fetchPercentiles();
  }, [babyId, activeMetric]);

  const metricConfig = {
    weight: { label: "Weight", icon: Weight, color: "blue" },
    height: { label: "Height", icon: Ruler, color: "purple" },
    headCircumference: { label: "Head", icon: Circle, color: "amber" },
  };

  if (loading) {
    return (
      <Card className={cn("p-4 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30", className)}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-4 border-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30", className)}>
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </Card>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <Card className={cn("p-4 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">WHO Growth Percentiles</h3>
            <p className="text-xs text-muted-foreground">No data available yet</p>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {(Object.keys(metricConfig) as MetricType[]).map((metric) => {
            const config = metricConfig[metric];
            const Icon = config.icon;
            return (
              <Button
                key={metric}
                variant={activeMetric === metric ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveMetric(metric)}
                className="gap-1.5"
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </Button>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Add growth measurements to see percentile charts
        </p>
      </Card>
    );
  }

  const percentileData = data.data;
  const measurements = data.measurements || [];
  const currentMetric = metricConfig[activeMetric];

  // Calculate chart dimensions
  const chartHeight = 200;
  const chartWidth = 100;
  const padding = { top: 20, right: 10, bottom: 30, left: 40 };

  // Get min/max values for scaling
  const allValues = percentileData.flatMap(d => [d.p3, d.p97]);
  const measurementValues = measurements.map(m => m.value);
  const minValue = Math.min(...allValues, ...(measurementValues.length > 0 ? measurementValues : allValues)) * 0.95;
  const maxValue = Math.max(...allValues, ...(measurementValues.length > 0 ? measurementValues : allValues)) * 1.05;
  const minAge = Math.min(...percentileData.map(d => d.ageMonths));
  const maxAge = Math.max(...percentileData.map(d => d.ageMonths));

  const scaleX = (age: number) => {
    if (maxAge === minAge) return padding.left;
    return padding.left + ((age - minAge) / (maxAge - minAge)) * (chartWidth - padding.left - padding.right);
  };

  const scaleY = (value: number) => {
    if (maxValue === minValue) return chartHeight / 2;
    return chartHeight - padding.bottom - ((value - minValue) / (maxValue - minValue)) * (chartHeight - padding.top - padding.bottom);
  };

  const generatePath = (percentile: 'p3' | 'p15' | 'p50' | 'p85' | 'p97') => {
    return percentileData
      .map((d, i) => {
        const x = scaleX(d.ageMonths);
        const y = scaleY(d[percentile]);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const getPercentileColor = (percentile: number | null) => {
    if (!percentile) return "text-gray-500";
    if (percentile < 5 || percentile > 95) return "text-amber-600 dark:text-amber-400";
    if (percentile < 15 || percentile > 85) return "text-blue-600 dark:text-blue-400";
    return "text-green-600 dark:text-green-400";
  };

  // Get latest measurement
  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  return (
    <Card className={cn("p-4 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">WHO Growth Percentiles</h3>
            <p className="text-xs text-muted-foreground">
              {data.gender} • {currentMetric.label}
            </p>
          </div>
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(metricConfig) as MetricType[]).map((metric) => {
          const config = metricConfig[metric];
          const Icon = config.icon;
          return (
            <Button
              key={metric}
              variant={activeMetric === metric ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveMetric(metric)}
              className="gap-1.5"
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* Current Value Display */}
      {latestMeasurement && (
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-white/50 dark:bg-black/20">
          <div>
            <p className="text-xs text-muted-foreground">Latest {currentMetric.label}</p>
            <p className="text-2xl font-bold text-foreground">
              {latestMeasurement.value.toFixed(1)}
              <span className="text-sm font-normal ml-1">{data.unit}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Percentile</p>
            <p className={cn("text-2xl font-bold", getPercentileColor(latestMeasurement.percentile))}>
              {latestMeasurement.percentile ? `${Math.round(latestMeasurement.percentile)}th` : "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="percentileBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.05" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* P3-P97 band */}
          <path
            d={`${generatePath('p97')} ${percentileData.slice().reverse().map((d, i) => {
              const x = scaleX(d.ageMonths);
              const y = scaleY(d.p3);
              return `${i === 0 ? 'L' : 'L'} ${x} ${y}`;
            }).join(' ')} Z`}
            fill="url(#percentileBand)"
            className="text-blue-500"
          />

          {/* Percentile lines */}
          <path d={generatePath('p97')} fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" className="text-blue-300 dark:text-blue-700" />
          <path d={generatePath('p85')} fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" className="text-blue-300 dark:text-blue-700" />
          <path d={generatePath('p50')} fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-500" />
          <path d={generatePath('p15')} fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" className="text-blue-300 dark:text-blue-700" />
          <path d={generatePath('p3')} fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" className="text-blue-300 dark:text-blue-700" />

          {/* Baby's measurements */}
          {measurements.length > 1 && (
            <path
              d={measurements.map((m, i) => {
                const x = scaleX(m.ageMonths);
                const y = scaleY(m.value);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-green-500"
            />
          )}

          {/* Measurement points */}
          {measurements.map((m, i) => (
            <circle
              key={i}
              cx={scaleX(m.ageMonths)}
              cy={scaleY(m.value)}
              r="3"
              fill="currentColor"
              className="text-green-500"
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-muted-foreground py-5">
          <span>{maxValue.toFixed(1)}</span>
          <span>{((maxValue + minValue) / 2).toFixed(1)}</span>
          <span>{minValue.toFixed(1)}</span>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-10 right-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{minAge}m</span>
          <span>{Math.round((minAge + maxAge) / 2)}m</span>
          <span>{maxAge}m</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span>50th percentile</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-300 border-dashed" style={{ borderTopWidth: 1 }} />
          <span>3rd-97th range</span>
        </div>
        {measurements.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500" />
            <span>Your baby</span>
          </div>
        )}
      </div>
    </Card>
  );
}
