"use client";

import * as React from "react";
import { useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { IconBadge, type ActivityColor } from "@/components/ui/icon-badge";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  SleepStatisticsResponse,
  FeedingStatisticsResponse,
  DiaperStatisticsResponse,
} from "@/lib/api-client";

/**
 * QuickStatsBar Component
 *
 * A horizontal stats bar displaying quick info items (last feeding, last diaper, wake window, etc.)
 * with glassmorphism styling and horizontal scroll on mobile.
 *
 * @requirements 12.2 - Dashboard SHALL display a quick stats bar with horizontal scroll on mobile
 */

export interface QuickStatsBarProps {
  /** Feeding statistics data */
  feedingStats?: FeedingStatisticsResponse | null;
  /** Diaper statistics data */
  diaperStats?: DiaperStatisticsResponse | null;
  /** Sleep statistics data */
  sleepStats?: SleepStatisticsResponse | null;
  /** Additional className for the container */
  className?: string;
}

interface StatItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: ActivityColor;
}

/**
 * Format relative time (e.g., "2h ago", "30m ago")
 */
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return time.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function QuickStatsBar({
  feedingStats,
  diaperStats,
  sleepStats,
  className,
}: QuickStatsBarProps) {
  // Build quick info items from stats data
  const quickInfo = useMemo(() => {
    const items: StatItem[] = [];

    // Last feeding
    if (feedingStats?.lastFeeding) {
      const feedType =
        feedingStats.lastFeeding.type === "breastfeeding"
          ? "Nursed"
          : feedingStats.lastFeeding.type === "bottle"
            ? "Bottle"
            : feedingStats.lastFeeding.type === "pumping"
              ? "Pumped"
              : "Solids";
      items.push({
        icon: Icons.Feed,
        label: `Fed (${feedType})`,
        value: formatTimeAgo(feedingStats.lastFeeding.timestamp),
        color: "feed",
      });
    }

    // Last diaper
    if (diaperStats?.lastDiaper) {
      const diaperType =
        diaperStats.lastDiaper.type === "wet"
          ? "Wet"
          : diaperStats.lastDiaper.type === "dirty"
            ? "Dirty"
            : diaperStats.lastDiaper.type === "mixed"
              ? "Mixed"
              : "Dry";
      items.push({
        icon: Icons.Diaper,
        label: `Diaper (${diaperType})`,
        value: formatTimeAgo(diaperStats.lastDiaper.timestamp),
        color: "diaper",
      });
    }

    // Wake window
    if (sleepStats?.currentWakeWindowFormatted) {
      items.push({
        icon: Icons.Sleep,
        label: "Awake",
        value: sleepStats.currentWakeWindowFormatted,
        color: "sleep",
      });
    }

    return items;
  }, [feedingStats, diaperStats, sleepStats]);

  // Don't render if no stats available
  if (quickInfo.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        // Horizontal scroll container for mobile
        "flex gap-2 overflow-x-auto scrollbar-hide",
        // Snap scrolling for better mobile UX
        "snap-x snap-mandatory",
        // Hide scrollbar but keep functionality
        "-mx-1 px-1",
        // Padding for scroll shadows
        "pb-1",
        className
      )}
      role="region"
      aria-label="Quick stats"
    >
      {quickInfo.map((item, index) => (
        <GlassCard
          key={index}
          size="sm"
          className={cn(
            // Flex layout for stat item
            "flex items-center gap-2.5",
            // Prevent shrinking on mobile scroll
            "flex-shrink-0",
            // Snap alignment
            "snap-start",
            // Custom padding for compact look
            "!py-2 !px-3",
            // Smaller border radius for stat items
            "!rounded-xl"
          )}
        >
          {/* Icon badge with activity color */}
          <IconBadge
            icon={item.icon}
            color={item.color}
            size="sm"
            className="flex-shrink-0"
          />

          {/* Stat content */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-foreground/80 truncate">
              {item.label}
            </span>
            <span className="text-sm font-bold text-foreground">
              {item.value}
            </span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

export default QuickStatsBar;
