"use client";

import { useMemo } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useLogs } from "@/context/log-context";

/**
 * Compact horizontal stats bar showing today's key metrics at a glance
 * Designed for quick scanning without scrolling
 */
export function QuickStatsBar() {
  const { logs } = useLogs();

  const todayStats = useMemo(() => {
    const today = new Date();
    const isToday = (date: Date) => {
      return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    };

    const todayLogs = logs.filter(l => isToday(l.startTime));
    
    const feedCount = todayLogs.filter(l => l.type === 'feed').length;
    const diaperCount = todayLogs.filter(l => l.type === 'diaper').length;
    
    // Calculate total sleep
    const sleepLogs = todayLogs.filter(l => l.type === 'sleep');
    let totalSleepMinutes = 0;
    sleepLogs.forEach(s => {
      const duration = s.details.duration as string | undefined;
      if (duration) {
        const parts = duration.split(' ');
        let h = 0;
        let m = 0;
        parts.forEach((p: string) => {
          if (p.includes('h')) h = parseInt(p.replace('h', ''));
          if (p.includes('m')) m = parseInt(p.replace('m', ''));
        });
        totalSleepMinutes += h * 60 + m;
      }
    });
    
    const sleepHours = Math.floor(totalSleepMinutes / 60);
    const sleepMins = totalSleepMinutes % 60;

    // Get last feed time
    const lastFeed = todayLogs.find(l => l.type === 'feed');
    let timeSinceLastFeed = '';
    if (lastFeed) {
      const diff = Math.floor((today.getTime() - lastFeed.startTime.getTime()) / 60000);
      if (diff < 60) {
        timeSinceLastFeed = `${diff}m ago`;
      } else {
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        timeSinceLastFeed = `${hours}h ${mins}m ago`;
      }
    }

    return {
      feedCount,
      diaperCount,
      sleepHours,
      sleepMins,
      timeSinceLastFeed,
    };
  }, [logs]);

  const stats = [
    {
      icon: Icons.Feed,
      value: todayStats.feedCount.toString(),
      label: 'Feeds',
      sublabel: todayStats.timeSinceLastFeed || 'None today',
      bgColor: 'bg-orange-100 dark:bg-orange-950/50',
      iconColor: 'text-orange-500 dark:text-orange-400',
    },
    {
      icon: Icons.Sleep,
      value: `${todayStats.sleepHours}h ${todayStats.sleepMins}m`,
      label: 'Sleep',
      sublabel: 'Total today',
      bgColor: 'bg-blue-100 dark:bg-blue-950/50',
      iconColor: 'text-blue-500 dark:text-blue-400',
    },
    {
      icon: Icons.Diaper,
      value: todayStats.diaperCount.toString(),
      label: 'Diapers',
      sublabel: 'Changes',
      bgColor: 'bg-green-100 dark:bg-green-950/50',
      iconColor: 'text-green-500 dark:text-green-400',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center p-3 rounded-2xl",
              stat.bgColor,
              "transition-transform hover:scale-[1.02]"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center mb-1",
              "bg-white/60 dark:bg-black/20"
            )}>
              <Icon className={cn("w-4 h-4", stat.iconColor)} />
            </div>
            <span className="text-lg font-bold text-foreground tabular-nums">
              {stat.value}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
