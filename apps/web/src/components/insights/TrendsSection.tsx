import React from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
          <BarChart3 className="w-5 h-5" />
        </div>
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
            ? "bg-green-50 dark:bg-green-950/30"
            : trend.direction === "stable"
            ? "bg-gray-50 dark:bg-gray-950/30"
            : "bg-red-50 dark:bg-red-950/30";

          return (
            <Card key={idx} className="p-4 border-0 bg-muted/30">
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
                <div className={cn("flex flex-col items-center p-3 rounded-xl", bgColor)}>
                  <TrendIcon className={cn("w-5 h-5 mb-1", trendColor)} />
                  <span className={cn("text-sm font-bold", trendColor)}>
                    {trend.change > 0 ? "+" : ""}{trend.change}%
                  </span>
                  <span className="text-xs text-muted-foreground">{trend.changeLabel}</span>
                </div>
              </div>
              {trend.insight && (
                <p className="mt-3 pt-3 border-t border-muted text-xs text-muted-foreground leading-relaxed">
                  💡 {trend.insight}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
