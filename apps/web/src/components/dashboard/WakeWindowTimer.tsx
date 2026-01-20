"use client";

import React, { useState, useEffect } from "react";
import { Moon, Clock, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api, WakeWindowTimerResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { useBaby } from "@/context/baby-context";

interface WakeWindowTimerProps {
  className?: string;
}

export function WakeWindowTimer({ className }: WakeWindowTimerProps) {
  const { babyId } = useBaby();
  const [wakeWindow, setWakeWindow] = useState<WakeWindowTimerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!babyId) {
      setLoading(false);
      return;
    }
    
    fetchWakeWindow();
    // Update current time every minute
    const interval = setInterval(() => {
      if (babyId) fetchWakeWindow();
    }, 60000);
    return () => clearInterval(interval);
  }, [babyId]);

  const fetchWakeWindow = async () => {
    try {
      setLoading(true);
      const data = await api.wakeWindowTimer.get();
      setWakeWindow(data);
    } catch (error) {
      // Don't show error toast for new users - just show empty state
      console.error("Failed to fetch wake window:", error);
      setWakeWindow(null);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedWakeWindow = (ageMonths: number): { min: number; max: number } => {
    // Age-based wake window recommendations (in minutes)
    if (ageMonths < 1) return { min: 45, max: 60 };
    if (ageMonths < 2) return { min: 60, max: 90 };
    if (ageMonths < 4) return { min: 75, max: 120 };
    if (ageMonths < 6) return { min: 90, max: 150 };
    if (ageMonths < 9) return { min: 120, max: 180 };
    if (ageMonths < 12) return { min: 150, max: 240 };
    return { min: 180, max: 300 };
  };

  const getStatus = (currentMinutes: number, recommended: { min: number; max: number }) => {
    if (currentMinutes < recommended.min) {
      return {
        status: "well-rested",
        label: "Well Rested",
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-950/50",
        icon: CheckCircle2,
      };
    }
    if (currentMinutes <= recommended.max) {
      return {
        status: "approaching-tired",
        label: "Getting Tired",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-950/50",
        icon: Clock,
      };
    }
    return {
      status: "overtired",
      label: "Overtired",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-950/50",
      icon: AlertCircle,
    };
  };

  const calculateSuggestedSleepTime = (
    wakeStartTime: string,
    recommendedMax: number
  ): string => {
    const start = new Date(wakeStartTime);
    const suggested = new Date(start.getTime() + recommendedMax * 60000);
    return suggested.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <Card className={cn("p-4 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30", className)}>
        <div className="h-48 bg-muted/50 rounded-xl animate-pulse" />
      </Card>
    );
  }

  if (!wakeWindow || !wakeWindow.hasSleepHistory) {
    return (
      <Card className={cn("p-4 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30", className)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
            <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Wake Window</h4>
            <p className="text-xs text-muted-foreground">No sleep data</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Log a sleep session to start tracking wake windows.
        </p>
      </Card>
    );
  }

  // Calculate baby age from last sleep timestamp (simplified - in real app would come from baby profile)
  const babyAgeMonths = 3; // This should come from baby profile
  const recommended = getRecommendedWakeWindow(babyAgeMonths);
  const statusInfo = getStatus(wakeWindow.currentAwakeMinutes, recommended);
  const StatusIcon = statusInfo.icon;
  const suggestedSleepTime = wakeWindow.lastSleepEndTime ? calculateSuggestedSleepTime(
    wakeWindow.lastSleepEndTime,
    recommended.max
  ) : '--:--';

  // Calculate progress percentage
  const progressPercent = Math.min(
    (wakeWindow.currentAwakeMinutes / recommended.max) * 100,
    100
  );

  return (
    <Card className={cn("p-4 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
            <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Wake Window</h4>
            <p className="text-xs text-muted-foreground">Current awake time</p>
          </div>
        </div>
        <div className={cn("px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1", statusInfo.bg, statusInfo.color)}>
          <StatusIcon className="w-3 h-3" />
          {statusInfo.label}
        </div>
      </div>

      {/* Current Awake Time - Large Display */}
      <div className="text-center mb-4">
        <div className="text-sm text-muted-foreground mb-1">Awake for</div>
        <div className="text-5xl font-bold text-foreground mb-1">
          {wakeWindow.currentAwakeFormatted}
        </div>
        <div className="text-xs text-muted-foreground">
          Since {wakeWindow.lastSleepEndTime ? new Date(wakeWindow.lastSleepEndTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }) : 'Unknown'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Recommended: {recommended.min}-{recommended.max}m</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-3 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              progressPercent < 50
                ? "bg-gradient-to-r from-green-400 to-green-500"
                : progressPercent < 80
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : "bg-gradient-to-r from-red-400 to-red-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Recommended</span>
          </div>
          <div className="font-semibold text-foreground text-sm">
            {recommended.min}-{recommended.max}m
          </div>
        </div>
        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Next Sleep</span>
          </div>
          <div className="font-semibold text-foreground text-sm">
            {suggestedSleepTime}
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="bg-blue-100/50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
        <p className="text-sm text-foreground leading-relaxed">
          {statusInfo.status === "well-rested" && (
            <>💡 Baby is well-rested. Good time for activities and play.</>
          )}
          {statusInfo.status === "approaching-tired" && (
            <>💡 Watch for sleep cues. Consider starting wind-down routine soon.</>
          )}
          {statusInfo.status === "overtired" && (
            <>⚠️ Baby may be overtired. Try to settle for sleep as soon as possible.</>
          )}
        </p>
      </div>
    </Card>
  );
}
