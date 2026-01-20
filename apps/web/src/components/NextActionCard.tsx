"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useLogs } from "@/context/log-context";
import Link from "next/link";

interface WakeWindowConfig {
  minWindow: number; // minutes
  maxWindow: number; // minutes
}

// Default wake window (can be customized based on baby's age)
const DEFAULT_WAKE_WINDOW: WakeWindowConfig = {
  minWindow: 90,  // 1.5 hours
  maxWindow: 150, // 2.5 hours
};

type NextAction = {
  type: 'nap' | 'feed' | 'diaper' | 'none';
  urgency: 'now' | 'soon' | 'later';
  message: string;
  timeUntil?: string;
  href: string;
};

/**
 * Smart "Next Action" card that predicts what the parent should do next
 * Based on wake windows, feeding intervals, and diaper patterns
 * 
 * This is the most important card - it tells tired parents exactly what to do
 */
export function NextActionCard() {
  const { babyStatus, lastStatusChange, logs } = useLogs();
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [awakeMinutes, setAwakeMinutes] = useState(0);

  // Find the last wake time
  const getLastWakeTime = useCallback((): Date => {
    const sleepLogs = logs
      .filter((l) => l.type === "sleep" && l.endTime)
      .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0));

    if (sleepLogs.length > 0 && sleepLogs[0].endTime) {
      return sleepLogs[0].endTime;
    }
    return lastStatusChange;
  }, [logs, lastStatusChange]);

  // Get time since last feed
  const getMinutesSinceLastFeed = useCallback((): number => {
    const feedLogs = logs
      .filter((l) => l.type === "feed")
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    if (feedLogs.length > 0) {
      const now = new Date();
      return Math.floor((now.getTime() - feedLogs[0].startTime.getTime()) / 60000);
    }
    return 999; // No feeds logged
  }, [logs]);

  // Get time since last diaper
  const getMinutesSinceLastDiaper = useCallback((): number => {
    const diaperLogs = logs
      .filter((l) => l.type === "diaper")
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    if (diaperLogs.length > 0) {
      const now = new Date();
      return Math.floor((now.getTime() - diaperLogs[0].startTime.getTime()) / 60000);
    }
    return 999;
  }, [logs]);

  useEffect(() => {
    const calculateNextAction = () => {
      // If baby is sleeping, no action needed
      if (babyStatus === "Sleeping") {
        setNextAction({
          type: 'none',
          urgency: 'later',
          message: 'Baby is sleeping peacefully',
          href: '/log/sleep',
        });
        setAwakeMinutes(0);
        return;
      }

      const wakeTime = getLastWakeTime();
      const now = new Date();
      const awake = Math.floor((now.getTime() - wakeTime.getTime()) / 60000);
      setAwakeMinutes(Math.max(0, awake));

      const minutesSinceLastFeed = getMinutesSinceLastFeed();
      const minutesSinceLastDiaper = getMinutesSinceLastDiaper();

      // Priority 1: Overtired - needs nap NOW
      if (awake >= DEFAULT_WAKE_WINDOW.maxWindow) {
        setNextAction({
          type: 'nap',
          urgency: 'now',
          message: 'Baby may be overtired',
          timeUntil: 'Nap time overdue',
          href: '/log/sleep',
        });
        return;
      }

      // Priority 2: Hungry - needs feed (typical interval 2-3 hours)
      if (minutesSinceLastFeed >= 180) { // 3 hours
        setNextAction({
          type: 'feed',
          urgency: 'now',
          message: 'Time for a feeding',
          timeUntil: `${Math.floor(minutesSinceLastFeed / 60)}h since last feed`,
          href: '/log/feed',
        });
        return;
      }

      // Priority 3: Ready for nap
      if (awake >= DEFAULT_WAKE_WINDOW.minWindow) {
        const timeOverOptimal = awake - DEFAULT_WAKE_WINDOW.minWindow;
        setNextAction({
          type: 'nap',
          urgency: timeOverOptimal > 30 ? 'now' : 'soon',
          message: timeOverOptimal > 30 ? 'Getting tired, nap soon' : 'Approaching nap time',
          timeUntil: `Awake for ${Math.floor(awake / 60)}h ${awake % 60}m`,
          href: '/log/sleep',
        });
        return;
      }

      // Priority 4: Diaper check (every 2-3 hours)
      if (minutesSinceLastDiaper >= 150) { // 2.5 hours
        setNextAction({
          type: 'diaper',
          urgency: 'soon',
          message: 'Time for a diaper check',
          timeUntil: `${Math.floor(minutesSinceLastDiaper / 60)}h since last change`,
          href: '/log/diaper',
        });
        return;
      }

      // Priority 5: Feed coming up
      if (minutesSinceLastFeed >= 120) { // 2 hours
        const timeUntilFeed = 180 - minutesSinceLastFeed;
        setNextAction({
          type: 'feed',
          urgency: 'later',
          message: 'Feeding coming up',
          timeUntil: `In ~${timeUntilFeed}m`,
          href: '/log/feed',
        });
        return;
      }

      // Default: Nap prediction
      const timeUntilNap = DEFAULT_WAKE_WINDOW.minWindow - awake;
      setNextAction({
        type: 'nap',
        urgency: 'later',
        message: 'Enjoying awake time',
        timeUntil: `Nap in ~${timeUntilNap}m`,
        href: '/log/sleep',
      });
    };

    calculateNextAction();
    const interval = setInterval(calculateNextAction, 60000);
    return () => clearInterval(interval);
  }, [babyStatus, getLastWakeTime, getMinutesSinceLastFeed, getMinutesSinceLastDiaper]);

  // Progress for wake window
  const progressPercent = useMemo(() => {
    if (babyStatus === "Sleeping") return 0;
    return Math.min(100, (awakeMinutes / DEFAULT_WAKE_WINDOW.maxWindow) * 100);
  }, [awakeMinutes, babyStatus]);

  const progressColor = useMemo(() => {
    if (babyStatus === "Sleeping") return "bg-blue-400";
    if (awakeMinutes < DEFAULT_WAKE_WINDOW.minWindow) return "bg-emerald-500";
    if (awakeMinutes < DEFAULT_WAKE_WINDOW.maxWindow) return "bg-amber-500";
    return "bg-red-500";
  }, [babyStatus, awakeMinutes]);

  const actionIcon = useMemo(() => {
    if (!nextAction) return 'clock';
    switch (nextAction.type) {
      case 'nap': return 'sleep';
      case 'feed': return 'feed';
      case 'diaper': return 'diaper';
      default: return 'clock';
    }
  }, [nextAction]);

  const actionColor = useMemo(() => {
    if (!nextAction) return 'from-gray-500 to-gray-600';
    switch (nextAction.urgency) {
      case 'now': return 'from-red-500 to-rose-600';
      case 'soon': return 'from-amber-500 to-orange-600';
      default: return 'from-emerald-500 to-teal-600';
    }
  }, [nextAction]);

  if (!nextAction) return null;

  // Render the appropriate icon based on action type
  const renderIcon = () => {
    switch (actionIcon) {
      case 'sleep': return <Icons.Sleep className="w-6 h-6 text-white" />;
      case 'feed': return <Icons.Feed className="w-6 h-6 text-white" />;
      case 'diaper': return <Icons.Diaper className="w-6 h-6 text-white" />;
      default: return <Icons.Clock className="w-6 h-6 text-white" />;
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-xl",
      "bg-gradient-to-br",
      actionColor
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white" />
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              "bg-white/20 backdrop-blur-sm"
            )}>
              {renderIcon()}
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Next Up</p>
              <h3 className="text-white font-bold text-lg">{nextAction.message}</h3>
            </div>
          </div>
          
          {nextAction.urgency === 'now' && (
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold animate-pulse">
              NOW
            </span>
          )}
        </div>

        {/* Wake window progress (only when awake) */}
        {babyStatus !== "Sleeping" && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>Wake window</span>
              <span>{awakeMinutes}m / {DEFAULT_WAKE_WINDOW.maxWindow}m</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", progressColor)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Time info */}
        {nextAction.timeUntil && (
          <p className="text-white/90 text-sm mb-4">
            {nextAction.timeUntil}
          </p>
        )}

        {/* Action button */}
        <Link href={nextAction.href}>
          <Button 
            variant="secondary"
            className={cn(
              "w-full bg-white/20 hover:bg-white/30 text-white border-0",
              "backdrop-blur-sm font-semibold"
            )}
          >
            {nextAction.type === 'nap' && babyStatus !== 'Sleeping' && 'Start Sleep'}
            {nextAction.type === 'nap' && babyStatus === 'Sleeping' && 'View Sleep'}
            {nextAction.type === 'feed' && 'Log Feed'}
            {nextAction.type === 'diaper' && 'Log Diaper'}
            {nextAction.type === 'none' && 'View Details'}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
