import React from "react";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface PatternChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  color?: "indigo" | "orange" | "emerald" | "pink" | "blue" | "purple";
}

const colorClasses = {
  indigo: "bg-indigo-500",
  orange: "bg-orange-500",
  emerald: "bg-emerald-500",
  pink: "bg-pink-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
};

export function PatternChart({
  title,
  subtitle,
  data,
  unit = "",
  trend,
  trendValue,
  color = "indigo",
}: PatternChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <GlassCard className="border-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-semibold text-foreground text-sm">{title}</h4>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {trend && trendValue && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm",
              trend === "up"
                ? "bg-green-100/80 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                : "bg-red-100/80 text-red-700 dark:bg-red-950/50 dark:text-red-300"
            )}
          >
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="space-y-3">
        {data.map((point, idx) => {
          const percentage = (point.value / maxValue) * 100;
          const barColor = point.color || colorClasses[color];

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  {point.label}
                </span>
                <span className="text-foreground font-semibold">
                  {point.value}
                  {unit}
                </span>
              </div>
              <div className="h-2 bg-white/20 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    barColor
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Average Line */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Average</span>
          <span className="font-semibold text-foreground">
            {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(1)}
            {unit}
          </span>
        </div>
      )}
    </GlassCard>
  );
}
