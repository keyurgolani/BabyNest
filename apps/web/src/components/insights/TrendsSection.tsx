import React from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { IconBadge } from "@/components/ui/icon-badge";
import { cn } from "@/lib/utils";

export interface TrendData {
  category: string;
  metric: string;
  currentValue: string;
  previousValue: string;
  change: number;
  changeLabel: string;
  direction: "up" | "down" | "stable";
  isPositive: boolean;
  insight?: string;
}

interface TrendsSectionProps {
  trends: TrendData[];
  period: "daily" | "weekly" | "monthly";
}

export function TrendsSection({ trends, period }: TrendsSectionProps) {
  const periodLabels = {
    daily: "vs yesterday",
    weekly: "vs last week",
    monthly: "vs last month",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <IconBadge color="activity" icon={BarChart3} size="default" gradient />
        <div>
          <h3 className="font-semibold text-foreground">Trend Analysis</h3>
          <p className="text-xs text-muted-foreground">
            How patterns are changing {periodLabels[period]}
          </p>
        </div>
      </div>

      {/* Trend Cards */}
      <div className="space-y-3">
        {trends.map((trend, idx) => {
          const TrendIcon = trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;
          const trendColor = trend.isPositive
            ? "text-green-600 dark:text-green-400"
            : trend.direction === "stable"
            ? "text-gray-500 dark:text-gray-400"
            : "text-red-600 dark:text-red-400";
          const bgColor = trend.isPositive
            ? "bg-green-50/80 dark:bg-green-950/30"
            : trend.direction === "stable"
            ? "bg-gray-50/80 dark:bg-gray-950/30"
            : "bg-red-50/80 dark:bg-red-950/30";

          return (
            <GlassCard key={idx} size="sm" className="border-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {trend.category}
                    </span>
                  </div>
                  <h4 className="font-semibold text-foreground">{trend.metric}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">{trend.previousValue}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{trend.currentValue}</span>
                  </div>
                </div>
                <div className={cn("flex flex-col items-center p-3 rounded-xl backdrop-blur-sm", bgColor)}>
                  <TrendIcon className={cn("w-5 h-5 mb-1", trendColor)} />
                  <span className={cn("text-sm font-bold", trendColor)}>
                    {trend.change > 0 ? "+" : ""}{trend.change}%
                  </span>
                  <span className="text-xs text-muted-foreground">{trend.changeLabel}</span>
                </div>
              </div>
              {trend.insight && (
                <p className="mt-3 pt-3 border-t border-white/20 dark:border-white/10 text-xs text-muted-foreground leading-relaxed">
                  💡 {trend.insight}
                </p>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
