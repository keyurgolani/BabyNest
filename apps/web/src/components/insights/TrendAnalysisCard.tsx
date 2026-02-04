"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { IconBadge } from "@/components/ui/icon-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api, TrendInsightsResponse } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  Moon,
  Utensils,
  Baby,
  Activity,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TrendPeriod = "daily" | "weekly" | "monthly" | "yearly";

interface TrendAnalysisCardProps {
  initialPeriod?: TrendPeriod;
  showPeriodSelector?: boolean;
  compact?: boolean;
}

export function TrendAnalysisCard({
  initialPeriod = "weekly",
  showPeriodSelector = true,
  compact = false,
}: TrendAnalysisCardProps) {
  const { babyId } = useBaby();
  const [period, setPeriod] = useState<TrendPeriod>(initialPeriod);
  const [data, setData] = useState<TrendInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    if (!babyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.insights.getTrends(period);
      setData(response);
    } catch (err) {
      console.error("Failed to fetch trend insights:", err);
      setError("Failed to load trends");
    } finally {
      setLoading(false);
    }
  }, [babyId, period]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const periodOptions: { value: TrendPeriod; label: string; icon: React.ReactNode }[] = [
    { value: "daily", label: "Daily", icon: <Clock className="w-3 h-3" /> },
    { value: "weekly", label: "Weekly", icon: <Calendar className="w-3 h-3" /> },
    { value: "monthly", label: "Monthly", icon: <CalendarDays className="w-3 h-3" /> },
    { value: "yearly", label: "Yearly", icon: <CalendarRange className="w-3 h-3" /> },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "sleep":
        return <Moon className="w-4 h-4" />;
      case "feeding":
        return <Utensils className="w-4 h-4" />;
      case "diaper":
        return <Baby className="w-4 h-4" />;
      case "activity":
        return <Activity className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
      case "declining":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
      case "new":
        return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
      default:
        return "bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800";
    }
  };

  const formatPeriodRange = () => {
    if (!data) return "";
    const start = new Date(data.periodStart).toLocaleDateString();
    const end = new Date(data.periodEnd).toLocaleDateString();
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <GlassCard className="border-0 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-cyan-950/30 dark:to-blue-950/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="border-0 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-cyan-950/30 dark:to-blue-950/30">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">{error}</p>
          <GlassButton variant="default" size="sm" onClick={fetchTrends} className="mt-3 gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="border-0 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-cyan-950/30 dark:to-blue-950/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconBadge color="activity" icon={BarChart3} size="sm" gradient />
          <div>
            <h3 className="font-semibold text-foreground">Trend Analysis</h3>
            {data && (
              <p className="text-xs text-muted-foreground">{formatPeriodRange()}</p>
            )}
          </div>
        </div>
        <GlassButton
          variant="ghost"
          size="icon"
          onClick={fetchTrends}
          className="h-8 w-8"
        >
          <RefreshCw className="w-4 h-4" />
        </GlassButton>
      </div>

      {/* Period Selector */}
      {showPeriodSelector && (
        <div className="flex gap-1 mb-4 p-1 bg-white/30 dark:bg-black/20 rounded-xl backdrop-blur-sm">
          {periodOptions.map((option) => (
            <GlassButton
              key={option.value}
              variant={period === option.value ? "primary" : "ghost"}
              size="sm"
              onClick={() => setPeriod(option.value)}
              className={cn(
                "flex-1 gap-1 text-xs",
                period === option.value && "shadow-sm"
              )}
            >
              {option.icon}
              {option.label}
            </GlassButton>
          ))}
        </div>
      )}

      {/* Insights List */}
      {data && data.insights.length > 0 ? (
        <div className="space-y-3">
          {data.insights.slice(0, compact ? 3 : undefined).map((insight, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-xl border transition-colors backdrop-blur-sm",
                getTrendColor(insight.trend)
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-white/50 dark:bg-black/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                    {getCategoryIcon(insight.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {insight.title}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs capitalize",
                          insight.trend === "improving" && "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          insight.trend === "declining" && "bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          insight.trend === "new" && "bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}
                      >
                        {insight.trend}
                        {insight.changePercent !== undefined && insight.changePercent !== 0 && (
                          <span className="ml-1">
                            {insight.changePercent > 0 ? "+" : ""}
                            {insight.changePercent}%
                          </span>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                    {insight.recommendation && (
                      <div className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                        <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{insight.recommendation}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0">{getTrendIcon(insight.trend)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No trend data available</p>
          <p className="text-muted-foreground text-xs mt-1">
            Track more activities to see trends
          </p>
        </div>
      )}

      {/* AI Summary */}
      {data?.aiSummary && data.aiSummaryGenerated && (
        <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              AI Summary
            </span>
          </div>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            &quot;{data.aiSummary}&quot;
          </p>
        </div>
      )}

      {/* Highlights & Concerns */}
      {data && (data.highlights.length > 0 || data.areasOfConcern.length > 0) && (
        <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10 grid grid-cols-2 gap-4">
          {data.highlights.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
                ✓ Highlights
              </h4>
              <ul className="space-y-1">
                {data.highlights.slice(0, 3).map((highlight, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.areasOfConcern.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
                ⚠ Areas to Watch
              </h4>
              <ul className="space-y-1">
                {data.areasOfConcern.slice(0, 3).map((concern, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground">
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
