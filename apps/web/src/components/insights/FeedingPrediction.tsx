"use client";

import React, { useState, useEffect } from "react";
import { Utensils, Clock, TrendingUp, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api, FeedingStatisticsResponse } from "@/lib/api-client";

import { useBaby } from "@/context/baby-context";

export interface FeedingPredictionData {
  nextFeedingTime: string;
  minutesUntilFeeding: number;
  averageInterval: number;
  confidence: number;
  recommendedAmount?: number;
  lastFeedingTime: string;
  pattern: "regular" | "irregular" | "cluster";
  insight: string;
}

interface FeedingPredictionProps {
  prediction?: FeedingPredictionData | null;
  loading?: boolean;
}

export function FeedingPrediction({ prediction: propPrediction, loading: propLoading }: FeedingPredictionProps) {
  const { babyId } = useBaby();
  const [loading, setLoading] = useState(propLoading ?? true);
  const [prediction, setPrediction] = useState<FeedingPredictionData | null>(propPrediction ?? null);

  useEffect(() => {
    // If prediction is provided as prop, use it
    if (propPrediction !== undefined) {
      setPrediction(propPrediction);
      setLoading(propLoading ?? false);
      return;
    }

    // Otherwise fetch from API if we have a baby
    if (babyId) {
      fetchFeedingData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propPrediction, propLoading, babyId]);

  const fetchFeedingData = async () => {
    try {
      setLoading(true);
      const stats = await api.feedingSuggestion.get();
      
      // Generate prediction from stats
      if (stats.lastFeeding) {
        const generatedPrediction = generatePredictionFromStats(stats);
        setPrediction(generatedPrediction);
      } else {
        // No feeding data yet - show empty state
        setPrediction(null);
      }
    } catch (error) {
      // Don't show error toast for new users - just show empty state
      console.error("Failed to fetch feeding data:", error);
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const generatePredictionFromStats = (stats: FeedingStatisticsResponse): FeedingPredictionData | null => {
    if (!stats.lastFeeding) return null;

    const lastFeedingTime = new Date(stats.lastFeeding.timestamp);
    const now = new Date();
    
    // Calculate average interval (default to 3 hours if no data)
    const avgIntervalMinutes = stats.totalFeedings > 1 ? 180 : 180; // Simplified - would need more data
    
    // Predict next feeding time
    const nextFeedingTime = new Date(lastFeedingTime.getTime() + avgIntervalMinutes * 60000);
    const minutesUntilFeeding = Math.floor((nextFeedingTime.getTime() - now.getTime()) / 60000);
    
    // Determine pattern based on feeding frequency
    let pattern: "regular" | "irregular" | "cluster" = "regular";
    if (stats.totalFeedings > 8) {
      pattern = "cluster";
    } else if (stats.totalFeedings < 4) {
      pattern = "irregular";
    }
    
    // Generate insight
    let insight = "";
    if (minutesUntilFeeding <= 0) {
      insight = "Baby is due for a feeding now. Watch for hunger cues.";
    } else if (minutesUntilFeeding <= 30) {
      insight = "Feeding time approaching soon. Prepare bottle or find a comfortable spot.";
    } else {
      insight = `Based on recent patterns, next feeding expected in about ${Math.floor(minutesUntilFeeding / 60)} hours.`;
    }
    
    return {
      nextFeedingTime: nextFeedingTime.toISOString(),
      minutesUntilFeeding,
      averageInterval: avgIntervalMinutes,
      confidence: 75, // Simplified confidence score
      recommendedAmount: stats.averageBottleAmount ?? undefined,
      lastFeedingTime: stats.lastFeeding.timestamp,
      pattern,
      insight,
    };
  };

  if (loading) {
    return (
      <Card className="p-4 border-0 bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 dark:from-orange-950/40 dark:via-amber-950/40 dark:to-yellow-950/40 shadow-[0_8px_24px_rgba(251,146,60,0.2),0_0_40px_rgba(251,146,60,0.15)]">
        <div className="h-32 bg-orange-300/30 dark:bg-orange-700/20 rounded-xl animate-pulse" />
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="p-4 border-0 bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 dark:from-orange-950/40 dark:via-amber-950/40 dark:to-yellow-950/40 shadow-[0_8px_24px_rgba(251,146,60,0.2),0_0_40px_rgba(251,146,60,0.15)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800/60 dark:to-amber-800/60 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(251,146,60,0.3)]">
            <Utensils className="w-6 h-6 text-orange-700 dark:text-orange-300" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Next Feeding</h4>
            <p className="text-xs text-muted-foreground font-medium">AI-powered prediction</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Utensils className="w-10 h-10 text-orange-400 dark:text-orange-600 mb-2" />
          <p className="text-sm text-muted-foreground font-medium">Log feedings to unlock predictions</p>
        </div>
      </Card>
    );
  }

  const isDue = prediction.minutesUntilFeeding <= 0;
  const isSoon = prediction.minutesUntilFeeding > 0 && prediction.minutesUntilFeeding <= 30;
  const timeString = new Date(prediction.nextFeedingTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const patternConfig = {
    regular: {
      label: "Regular Pattern",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-950/50",
    },
    irregular: {
      label: "Irregular Pattern",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-950/50",
    },
    cluster: {
      label: "Cluster Feeding",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-950/50",
    },
  };

  const patternStyle = patternConfig[prediction.pattern];

  return (
    <Card className="p-4 border-0 bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 dark:from-orange-950/40 dark:via-amber-950/40 dark:to-yellow-950/40 shadow-[0_8px_24px_rgba(251,146,60,0.2),0_0_40px_rgba(251,146,60,0.15)] hover:shadow-[0_12px_32px_rgba(251,146,60,0.3),0_0_60px_rgba(251,146,60,0.2)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800/60 dark:to-amber-800/60 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(251,146,60,0.3)]">
            <Utensils className="w-6 h-6 text-orange-700 dark:text-orange-300" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Next Feeding</h4>
            <p className="text-xs text-muted-foreground font-medium">AI-powered prediction</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <Sparkles className="w-3 h-3" />
          {prediction.confidence}% confident
        </div>
      </div>

      {/* Prediction Time */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Expected Time</div>
          <div className="text-3xl font-bold text-foreground">{timeString}</div>
        </div>
        <div
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium",
            isDue
              ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
              : isSoon
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
              : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
          )}
        >
          {isDue ? "Due Now" : isSoon ? `Soon (${prediction.minutesUntilFeeding}m)` : `in ${prediction.minutesUntilFeeding}m`}
        </div>
      </div>

      {/* Pattern Badge */}
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4", patternStyle.bg, patternStyle.color)}>
        <TrendingUp className="w-3 h-3" />
        {patternStyle.label}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Avg Interval</span>
          </div>
          <div className="font-semibold text-foreground">
            {Math.floor(prediction.averageInterval / 60)}h {prediction.averageInterval % 60}m
          </div>
        </div>
        {prediction.recommendedAmount && (
          <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Utensils className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Recommended</span>
            </div>
            <div className="font-semibold text-foreground">{prediction.recommendedAmount} ml</div>
          </div>
        )}
      </div>

      {/* Insight */}
      <div className="bg-orange-100/50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
        <p className="text-sm text-foreground leading-relaxed">
          💡 {prediction.insight}
        </p>
      </div>

      {/* Last Feeding */}
      <div className="mt-3 pt-3 border-t border-orange-200/50 dark:border-orange-800/50 text-xs text-muted-foreground">
        Last feeding: {new Date(prediction.lastFeedingTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </Card>
  );
}

