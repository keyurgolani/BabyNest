"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  api,
  GeneratedInsightResponse,
  InsightType,
  GenerateAdhocInsightDto,
} from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import {
  History,
  Sparkles,
  Moon,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightHistoryCardProps {
  onViewInsight?: (insight: GeneratedInsightResponse) => void;
}

export function InsightHistoryCard({ onViewInsight }: InsightHistoryCardProps) {
  const { babyId } = useBaby();
  const [insights, setInsights] = useState<GeneratedInsightResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!babyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.insights.getHistory({ page: 1, pageSize: 5 });
      setInsights(data.data);
    } catch (err) {
      // Don't show error for new users - just show empty state
      console.error("Failed to fetch insight history:", err);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleGenerateInsight = async (type: InsightType) => {
    try {
      setGenerating(true);
      setError(null);
      const dto: GenerateAdhocInsightDto = { type };
      const newInsight = await api.insights.generateAdhocInsight(dto);
      setInsights((prev) => [newInsight, ...prev.slice(0, 4)]);
    } catch (err) {
      // Show a friendly message instead of error
      console.error("Failed to generate insight:", err);
      setError("Need more data to generate insights. Try logging some activities first!");
    } finally {
      setGenerating(false);
    }
  };

  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case "weekly_summary":
        return <Calendar className="w-4 h-4" />;
      case "sleep_prediction":
        return <Moon className="w-4 h-4" />;
      case "anomaly":
        return <AlertTriangle className="w-4 h-4" />;
      case "daily_summary":
        return <Sparkles className="w-4 h-4" />;
      case "trend":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getInsightLabel = (type: InsightType) => {
    switch (type) {
      case "weekly_summary":
        return "Weekly Summary";
      case "sleep_prediction":
        return "Sleep Prediction";
      case "anomaly":
        return "Anomaly Detection";
      case "daily_summary":
        return "Daily Summary";
      case "trend":
        return "Trend Analysis";
      default:
        return type;
    }
  };

  const getInsightColor = (type: InsightType) => {
    switch (type) {
      case "weekly_summary":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "sleep_prediction":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
      case "anomaly":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "daily_summary":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "trend":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) return "Just now";
      if (diffHours === 1) return "1 hour ago";
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-4 border-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="font-semibold text-foreground">Insight History</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleGenerateInsight("weekly_summary")}
          disabled={generating}
          className="gap-1"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Generate
        </Button>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {insights.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No insights generated yet</p>
          <p className="text-muted-foreground text-xs mt-1">
            Click Generate to create your first AI insight
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((insight) => (
            <button
              key={insight.id}
              onClick={() => onViewInsight?.(insight)}
              className="w-full p-3 rounded-lg bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    getInsightColor(insight.type)
                  )}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground truncate">
                        {getInsightLabel(insight.type)}
                      </span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {formatDate(insight.generatedAt)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(insight.periodStart).toLocaleDateString()} - {new Date(insight.periodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
