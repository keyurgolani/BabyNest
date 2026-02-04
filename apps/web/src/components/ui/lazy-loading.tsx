"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

/**
 * Lazy Loading Utilities
 *
 * This module provides lazy loading utilities for heavy components to improve
 * initial load time. Uses Next.js dynamic() for code splitting with SSR control.
 *
 * @requirements 21.2 - Lazy load heavy components to improve initial load time
 */

// ============================================================================
// Skeleton Components for Loading States
// ============================================================================

/**
 * Base skeleton with glassmorphism shimmer effect
 */
export function GlassSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-white/10 animate-pulse",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </div>
  );
}

/**
 * Chart skeleton with glassmorphism styling
 */
export function ChartSkeleton({
  className,
  height = "h-48",
}: {
  className?: string;
  height?: string;
}) {
  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="space-y-4">
        {/* Chart title skeleton */}
        <div className="flex items-center gap-3">
          <GlassSkeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <GlassSkeleton className="h-4 w-32" />
            <GlassSkeleton className="h-3 w-24" />
          </div>
        </div>
        {/* Chart area skeleton */}
        <GlassSkeleton className={cn("w-full rounded-xl", height)} />
        {/* Legend skeleton */}
        <div className="flex gap-4">
          <GlassSkeleton className="h-3 w-16" />
          <GlassSkeleton className="h-3 w-16" />
          <GlassSkeleton className="h-3 w-16" />
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Insight card skeleton with glassmorphism styling
 */
export function InsightCardSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <GlassSkeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <GlassSkeleton className="h-5 w-32" />
            <GlassSkeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="space-y-2">
          <GlassSkeleton className="h-3 w-full" />
          <GlassSkeleton className="h-3 w-3/4" />
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Featured insight card skeleton (larger)
 */
export function FeaturedInsightSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard variant="featured" size="lg" className={cn("relative overflow-hidden", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <GlassSkeleton className="w-14 h-14 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <GlassSkeleton className="h-6 w-40" />
            <GlassSkeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="space-y-2">
          <GlassSkeleton className="h-4 w-full" />
          <GlassSkeleton className="h-4 w-5/6" />
          <GlassSkeleton className="h-4 w-2/3" />
        </div>
        <div className="flex gap-3 pt-2">
          <GlassSkeleton className="h-10 w-24 rounded-xl" />
          <GlassSkeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Pattern card skeleton (compact)
 */
export function PatternCardSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard size="sm" className={cn("relative overflow-hidden", className)}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GlassSkeleton className="w-8 h-8 rounded-lg" />
          <GlassSkeleton className="h-4 w-16" />
        </div>
        <GlassSkeleton className="h-8 w-20" />
        <GlassSkeleton className="h-3 w-24" />
      </div>
    </GlassCard>
  );
}

/**
 * Calendar day skeleton
 */
export function CalendarDaySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-2 space-y-1", className)}>
      <GlassSkeleton className="h-6 w-6 rounded-full mx-auto" />
      <div className="space-y-0.5">
        <GlassSkeleton className="h-1.5 w-full rounded-full" />
        <GlassSkeleton className="h-1.5 w-3/4 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Calendar grid skeleton
 */
export function CalendarGridSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <GlassSkeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <GlassSkeleton className="h-8 w-8 rounded-lg" />
            <GlassSkeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-4 w-8 mx-auto" />
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <CalendarDaySkeleton key={i} />
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Modal content skeleton
 */
export function ModalContentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3">
        <GlassSkeleton className="h-5 w-24" />
        <GlassSkeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <GlassSkeleton className="h-5 w-32" />
        <GlassSkeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <GlassSkeleton className="h-5 w-28" />
        <GlassSkeleton className="h-24 w-full rounded-xl" />
      </div>
      <div className="flex gap-3 pt-4">
        <GlassSkeleton className="h-12 flex-1 rounded-xl" />
        <GlassSkeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Growth chart skeleton
 */
export function GrowthChartSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard size="lg" className={cn("relative overflow-hidden", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GlassSkeleton className="w-5 h-5 rounded" />
          <GlassSkeleton className="h-5 w-32" />
        </div>
        <div className="relative h-48">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
            <GlassSkeleton className="h-3 w-8" />
            <GlassSkeleton className="h-3 w-8" />
            <GlassSkeleton className="h-3 w-8" />
          </div>
          {/* Chart area */}
          <GlassSkeleton className="ml-10 h-full w-[calc(100%-2.5rem)] rounded-xl" />
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Insights grid skeleton (multiple cards)
 */
export function InsightsGridSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <PatternCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Correlation insights skeleton
 */
export function CorrelationsSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="space-y-4">
        <GlassSkeleton className="h-5 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <GlassSkeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <GlassSkeleton className="h-3 w-32" />
              <GlassSkeleton className="h-2 w-24" />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ============================================================================
// Dashboard Widget Skeletons
// ============================================================================

/**
 * Quick stats bar skeleton with horizontal scroll items
 * @requirements 12.2 - Dashboard quick stats bar loading state
 */
export function QuickStatsBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide", className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <GlassCard
          key={i}
          size="sm"
          className="flex items-center gap-2.5 flex-shrink-0 !py-2 !px-3 !rounded-xl relative overflow-hidden"
        >
          <GlassSkeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex flex-col gap-1 min-w-0">
            <GlassSkeleton className="h-3 w-16" />
            <GlassSkeleton className="h-4 w-12" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
        </GlassCard>
      ))}
    </div>
  );
}

/**
 * Reminders card skeleton
 * @requirements 12.6 - Dashboard reminders card loading state
 */
export function RemindersCardSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="pb-3">
        <div className="flex items-center gap-2">
          <GlassSkeleton className="w-5 h-5 rounded" />
          <GlassSkeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        {/* Featured reminder skeleton */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-start gap-3">
            <GlassSkeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <GlassSkeleton className="h-4 w-32" />
              <GlassSkeleton className="h-3 w-20" />
              <div className="flex gap-2 pt-2">
                <GlassSkeleton className="h-8 w-16 rounded-lg" />
                <GlassSkeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
        {/* Secondary reminders */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <GlassSkeleton className="w-8 h-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <GlassSkeleton className="h-3 w-28" />
              <GlassSkeleton className="h-2 w-20" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </GlassCard>
  );
}

/**
 * Milestones card skeleton
 * @requirements 12.6 - Dashboard milestones card loading state
 */
export function MilestonesCardSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlassSkeleton className="w-5 h-5 rounded" />
            <GlassSkeleton className="h-5 w-32" />
          </div>
          <GlassSkeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <GlassSkeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-1">
              <GlassSkeleton className="h-4 w-36" />
              <GlassSkeleton className="h-3 w-28" />
            </div>
            <GlassSkeleton className="h-6 w-14 rounded-lg" />
          </div>
        ))}
        {/* Progress bar skeleton */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <GlassSkeleton className="h-3 w-24" />
            <GlassSkeleton className="h-4 w-8" />
          </div>
          <GlassSkeleton className="h-3 w-full rounded-full" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </GlassCard>
  );
}

/**
 * Upcoming medications skeleton
 * @requirements 12.6 - Dashboard medications card loading state
 */
export function MedicationsCardSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="flex items-center gap-3 mb-4">
        <GlassSkeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-1">
          <GlassSkeleton className="h-5 w-24" />
          <GlassSkeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <GlassSkeleton className="h-4 w-28" />
                  <GlassSkeleton className="h-5 w-14 rounded-full" />
                </div>
                <GlassSkeleton className="h-3 w-36" />
                <GlassSkeleton className="h-3 w-24" />
              </div>
              <GlassSkeleton className="h-8 w-16 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </GlassCard>
  );
}

/**
 * AI Summary card skeleton
 * @requirements 12.3 - Dashboard AI summary card loading state
 */
export function AISummaryCardSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard variant="featured" size="lg" className={cn("relative overflow-hidden", className)}>
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlassSkeleton className="w-5 h-5 rounded" />
            <GlassSkeleton className="h-5 w-36" />
          </div>
          <GlassSkeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-4">
        {/* AI Summary text skeleton */}
        <div className="space-y-2">
          <GlassSkeleton className="h-4 w-full" />
          <GlassSkeleton className="h-4 w-5/6" />
          <GlassSkeleton className="h-4 w-4/5" />
        </div>
        {/* Highlights skeleton */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <GlassSkeleton className="h-3 w-20 mb-2" />
          <div className="space-y-1">
            <GlassSkeleton className="h-3 w-full" />
            <GlassSkeleton className="h-3 w-3/4" />
          </div>
        </div>
        {/* Key trends grid skeleton */}
        <div className="space-y-2">
          <GlassSkeleton className="h-3 w-20" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <GlassSkeleton className="w-3 h-3 rounded" />
                  <GlassSkeleton className="h-3 w-16" />
                </div>
                <GlassSkeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </GlassCard>
  );
}

// ============================================================================
// Timeline & Activity Skeletons
// ============================================================================

/**
 * Timeline item skeleton with connecting line
 * @requirements 15.1 - Timeline page loading state
 */
export function TimelineItemSkeleton({ 
  isFirst = false, 
  isLast = false,
  className 
}: { 
  isFirst?: boolean; 
  isLast?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative flex gap-4 pb-6", className)}>
      {/* Connecting line */}
      {!isLast && (
        <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-white/10" />
      )}
      {/* Dot indicator */}
      <div className="relative z-10 flex-shrink-0">
        <GlassSkeleton className="w-9 h-9 rounded-full" />
      </div>
      {/* Content */}
      <GlassCard size="sm" className="flex-1 relative overflow-hidden">
        <div className="flex items-start gap-3">
          <GlassSkeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <GlassSkeleton className="h-4 w-24" />
              <GlassSkeleton className="h-3 w-16" />
            </div>
            <GlassSkeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
      </GlassCard>
    </div>
  );
}

/**
 * Timeline group skeleton (date header + items)
 * @requirements 15.2 - Timeline date grouping loading state
 */
export function TimelineGroupSkeleton({ 
  itemCount = 3,
  className 
}: { 
  itemCount?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Date header */}
      <div className="flex items-center gap-3">
        <GlassSkeleton className="w-8 h-8 rounded-lg" />
        <GlassSkeleton className="h-4 w-24" />
        <GlassSkeleton className="h-3 w-16" />
      </div>
      {/* Timeline items */}
      <div className="ml-4">
        {Array.from({ length: itemCount }).map((_, i) => (
          <TimelineItemSkeleton 
            key={i} 
            isFirst={i === 0} 
            isLast={i === itemCount - 1} 
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Activity log item skeleton (table row style)
 * @requirements 15.1 - Activity log loading state
 */
export function ActivityLogItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden",
      className
    )}>
      <GlassSkeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <GlassSkeleton className="h-4 w-32" />
        <GlassSkeleton className="h-3 w-24" />
      </div>
      <div className="text-right space-y-1">
        <GlassSkeleton className="h-3 w-16 ml-auto" />
        <GlassSkeleton className="h-3 w-12 ml-auto" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </div>
  );
}

// ============================================================================
// Settings Page Skeletons
// ============================================================================

/**
 * Settings section skeleton
 * @requirements 17.1, 17.2 - Settings page section loading state
 */
export function SettingsSectionSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="flex items-center gap-4 p-4">
        <GlassSkeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <GlassSkeleton className="h-5 w-32" />
          <GlassSkeleton className="h-3 w-48" />
        </div>
        <GlassSkeleton className="w-5 h-5 rounded flex-shrink-0" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </GlassCard>
  );
}

/**
 * Settings page grid skeleton
 * @requirements 17.3 - Settings page responsive layout loading state
 */
export function SettingsGridSkeleton({ 
  count = 9,
  className 
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SettingsSectionSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================================
// Generic Dashboard Widget Skeleton
// ============================================================================

/**
 * Generic dashboard widget skeleton with icon and content
 * @requirements 12.1-12.6 - Dashboard widget loading states
 */
export function DashboardWidgetSkeleton({ 
  hasHeader = true,
  contentLines = 3,
  className 
}: { 
  hasHeader?: boolean;
  contentLines?: number;
  className?: string;
}) {
  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      {hasHeader && (
        <div className="flex items-center gap-3 mb-4">
          <GlassSkeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="space-y-1">
            <GlassSkeleton className="h-4 w-24" />
            <GlassSkeleton className="h-3 w-16" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: contentLines }).map((_, i) => (
          <GlassSkeleton 
            key={i} 
            className="h-3" 
            style={{ width: `${100 - (i * 10)}%` }} 
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </GlassCard>
  );
}

/**
 * Navigation card skeleton (small widget with icon)
 * @requirements 12.5 - Dashboard navigation cards loading state
 */
export function NavigationCardSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="flex flex-col gap-2">
        <GlassSkeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-1">
          <GlassSkeleton className="h-4 w-16" />
          <GlassSkeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </GlassCard>
  );
}

/**
 * Memory card skeleton (image placeholder)
 * @requirements 12.6 - Dashboard memory card loading state
 */
export function MemoryCardSkeleton({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("relative overflow-hidden !p-0 min-h-[200px]", className)}>
      <GlassSkeleton className="absolute inset-0 rounded-3xl" />
      <div className="absolute bottom-4 left-4 right-4 space-y-1">
        <GlassSkeleton className="h-4 w-24" />
        <GlassSkeleton className="h-3 w-16" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
    </GlassCard>
  );
}

// ============================================================================
// Full Page Loading Skeletons
// ============================================================================

/**
 * Dashboard page skeleton
 * @requirements 12.1-12.6 - Full dashboard loading state
 */
export function DashboardPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-4", className)}>
      {/* Header with avatar */}
      <div className="flex items-center gap-4">
        <GlassSkeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <GlassSkeleton className="h-8 w-32" />
          <QuickStatsBarSkeleton />
        </div>
      </div>
      {/* Bento grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="sm:col-span-2">
          <AISummaryCardSkeleton />
        </div>
        <DashboardWidgetSkeleton />
        <MedicationsCardSkeleton />
        <RemindersCardSkeleton />
        <MilestonesCardSkeleton />
        <MemoryCardSkeleton className="lg:row-span-2" />
        <div className="sm:col-span-2 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <NavigationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline page skeleton
 * @requirements 15.1-15.5 - Full timeline loading state
 */
export function TimelinePageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-4", className)}>
      {/* Page header */}
      <div className="space-y-2">
        <GlassSkeleton className="h-8 w-32" />
        <GlassSkeleton className="h-4 w-24" />
      </div>
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <GlassSkeleton key={i} className="h-9 w-20 rounded-full flex-shrink-0" />
        ))}
      </div>
      {/* Timeline groups */}
      <div className="space-y-8">
        <TimelineGroupSkeleton itemCount={3} />
        <TimelineGroupSkeleton itemCount={2} />
      </div>
    </div>
  );
}

// ============================================================================
// CSS for shimmer animation (add to globals.css if not present)
// ============================================================================

// Note: The shimmer animation is already defined in globals.css as:
// @keyframes skeleton-shimmer {
//   0% { transform: translate3d(-100%, 0, 0); }
//   100% { transform: translate3d(100%, 0, 0); }
// }
// .skeleton-shimmer {
//   animation: skeleton-shimmer 2s infinite;
// }

// ============================================================================
// Lazy Loading Wrapper Component
// ============================================================================

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper for lazy-loaded components with error boundary
 */
export function LazyWrapper({ children, fallback }: LazyComponentProps) {
  return (
    <React.Suspense fallback={fallback || <InsightCardSkeleton />}>
      {children}
    </React.Suspense>
  );
}

// ============================================================================
// Export default skeleton for general use
// ============================================================================

export { GlassSkeleton as Skeleton };
