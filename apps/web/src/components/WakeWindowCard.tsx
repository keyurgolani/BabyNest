"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { api, WakeWindowTimerResponse } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Moon, Sun, AlertTriangle, Clock, Baby } from "lucide-react";
import { cn } from "@/lib/utils";

export function WakeWindowCard() {
  const { babyId } = useBaby();
  const [data, setData] = useState<WakeWindowTimerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWakeWindowTimer = useCallback(async () => {
    if (!babyId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await api.wakeWindowTimer.get();
      setData(response);
    } catch (err) {
      console.error("Failed to fetch wake window timer:", err);
      setError("Failed to load wake window data");
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  useEffect(() => {
    fetchWakeWindowTimer();
    // Refresh every minute
    const interval = setInterval(fetchWakeWindowTimer, 60000);
    return () => clearInterval(interval);
  }, [fetchWakeWindowTimer]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-purple-950/40 border-indigo-300/50 dark:border-indigo-700/30 shadow-[0_8px_24px_rgba(99,102,241,0.2),0_0_40px_rgba(99,102,241,0.15)] p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 bg-indigo-300/50 dark:bg-indigo-700/30" />
          <Skeleton className="h-16 w-full bg-indigo-300/50 dark:bg-indigo-700/30" />
          <Skeleton className="h-4 w-full bg-indigo-300/50 dark:bg-indigo-700/30" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-purple-950/40 border-indigo-300/50 dark:border-indigo-700/30 shadow-[0_8px_24px_rgba(99,102,241,0.2),0_0_40px_rgba(99,102,241,0.15)] p-6">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">{error || "No wake window data available"}</span>
        </div>
      </Card>
    );
  }

  // Determine status color and styling
  const getStatusColor = () => {
    switch (data.status) {
      case "well-rested":
        return "bg-emerald-400";
      case "approaching-tired":
        return "bg-amber-400";
      case "overtired":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBgColor = () => {
    switch (data.status) {
      case "well-rested":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
      case "approaching-tired":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
      case "overtired":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusText = () => {
    switch (data.status) {
      case "well-rested":
        return "Well Rested";
      case "approaching-tired":
        return "Getting Tired";
      case "overtired":
        return "Overtired";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case "well-rested":
        return <Sun className="w-4 h-4" />;
      case "approaching-tired":
        return <Clock className="w-4 h-4" />;
      case "overtired":
        return <Moon className="w-4 h-4" />;
      default:
        return <Baby className="w-4 h-4" />;
    }
  };

  // Calculate progress percentage (capped at 100 for visual)
  const progressPercent = Math.min(100, data.percentageOfWakeWindow);

  // Format suggested nap time
  const getSuggestedNapTimeText = () => {
    if (data.minutesUntilNextSleep <= 0) {
      return "Nap time now!";
    }
    return `Nap in ${data.minutesUntilNextSleepFormatted}`;
  };

  const formatSuggestedTime = () => {
    if (!data.suggestedNextSleepTime) return "";
    const time = new Date(data.suggestedNextSleepTime);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-purple-950/40 border-indigo-300/50 dark:border-indigo-700/30 shadow-[0_8px_24px_rgba(99,102,241,0.2),0_0_40px_rgba(99,102,241,0.15)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.3),0_0_60px_rgba(99,102,241,0.2)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-200 to-blue-200 dark:from-indigo-800/60 dark:to-blue-800/60 flex items-center justify-center shadow-[0_4px_16px_rgba(99,102,241,0.3)]">
            <Icons.Clock className="w-6 h-6 text-indigo-700 dark:text-indigo-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Wake Window</h3>
            <p className="text-sm text-muted-foreground">
              {data.babyAgeMonths} month{data.babyAgeMonths !== 1 ? "s" : ""} old
            </p>
          </div>
        </div>
        <div className={cn("px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md", getStatusBgColor())}>
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </div>

      {/* Awake time display */}
      <div className="text-center mb-6">
        <span className="text-4xl font-bold text-foreground">{data.currentAwakeFormatted}</span>
        <p className="text-sm text-muted-foreground mt-1">awake</p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-500 rounded-full", getStatusColor())}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>0m</span>
          <span>{data.minWakeWindowMinutes}m</span>
          <span>{data.maxWakeWindowMinutes}m</span>
        </div>
      </div>

      {/* Age-appropriate recommendation */}
      <div className="mb-4 p-3 bg-white/60 dark:bg-black/20 rounded-xl">
        <p className="text-xs text-muted-foreground mb-1">Recommended wake window for age</p>
        <p className="text-sm font-semibold text-foreground">{data.recommendedWakeWindowFormatted}</p>
      </div>

      {/* Suggested nap time */}
      <div className={cn(
        "flex items-center justify-between p-3 rounded-xl",
        data.minutesUntilNextSleep <= 0 
          ? "bg-red-100 dark:bg-red-900/30" 
          : data.minutesUntilNextSleep <= 15 
            ? "bg-amber-100 dark:bg-amber-900/30"
            : "bg-white/60 dark:bg-black/20"
      )}>
        <div className="flex items-center gap-2">
          <Moon className={cn(
            "w-4 h-4",
            data.minutesUntilNextSleep <= 0 
              ? "text-red-500" 
              : data.minutesUntilNextSleep <= 15 
                ? "text-amber-500"
                : "text-indigo-500"
          )} />
          <span className={cn(
            "text-sm font-medium",
            data.minutesUntilNextSleep <= 0 
              ? "text-red-700 dark:text-red-300" 
              : data.minutesUntilNextSleep <= 15 
                ? "text-amber-700 dark:text-amber-300"
                : "text-foreground"
          )}>
            {getSuggestedNapTimeText()}
          </span>
        </div>
        {data.suggestedNextSleepTime && (
          <span className="text-xs text-muted-foreground">
            ~{formatSuggestedTime()}
          </span>
        )}
      </div>
    </Card>
  );
}
