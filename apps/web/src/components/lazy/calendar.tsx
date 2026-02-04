"use client";

/**
 * Lazy-Loaded Calendar Components
 *
 * Heavy calendar components that are lazy-loaded to improve initial page load.
 * Calendar views with many entries can be CPU-intensive.
 *
 * @requirements 21.2 - Lazy load heavy components to improve initial load time
 */

import dynamic from "next/dynamic";
import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { CalendarGridSkeleton, GlassSkeleton } from "@/components/ui/lazy-loading";

// ============================================================================
// Calendar Loading Components
// ============================================================================

/**
 * Calendar month view skeleton
 */
export function CalendarMonthSkeleton() {
  return <CalendarGridSkeleton />;
}

/**
 * Calendar week view skeleton
 */
export function CalendarWeekSkeleton() {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <GlassSkeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <GlassSkeleton className="h-8 w-8 rounded-lg" />
            <GlassSkeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
        {/* Day columns */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <GlassSkeleton className="h-4 w-8 mx-auto" />
              <GlassSkeleton className="h-6 w-6 rounded-full mx-auto" />
              <div className="space-y-1">
                {Array.from({ length: 3 }).map((_, j) => (
                  <GlassSkeleton key={j} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Calendar day view skeleton
 */
export function CalendarDayViewSkeleton() {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <GlassSkeleton className="h-6 w-24" />
            <GlassSkeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <GlassSkeleton className="h-8 w-8 rounded-lg" />
            <GlassSkeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
        {/* Time slots */}
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <GlassSkeleton className="h-4 w-12 flex-shrink-0" />
              <GlassSkeleton className="h-12 flex-1 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Calendar entry list skeleton
 */
export function CalendarEntryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <GlassCard key={i} className="relative overflow-hidden">
          <div className="flex items-center gap-3">
            <GlassSkeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <GlassSkeleton className="h-4 w-24" />
              <GlassSkeleton className="h-3 w-16" />
            </div>
            <GlassSkeleton className="h-3 w-12" />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ============================================================================
// Calendar Loading Wrapper
// ============================================================================

/**
 * Calendar view loading wrapper
 * Provides consistent loading state for calendar views
 */
export function CalendarLoadingWrapper({
  children,
  isLoading,
  view = "month",
}: {
  children: React.ReactNode;
  isLoading: boolean;
  view?: "month" | "week" | "day";
}) {
  if (isLoading) {
    switch (view) {
      case "week":
        return <CalendarWeekSkeleton />;
      case "day":
        return <CalendarDayViewSkeleton />;
      case "month":
      default:
        return <CalendarMonthSkeleton />;
    }
  }

  return <>{children}</>;
}

// ============================================================================
// Lazy-Loaded Calendar Entry Details Modal
// ============================================================================

/**
 * Calendar entry detail modal skeleton
 */
function CalendarEntryDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <GlassSkeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <GlassSkeleton className="h-5 w-32" />
          <GlassSkeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <GlassSkeleton className="h-4 w-full" />
        <GlassSkeleton className="h-4 w-3/4" />
        <GlassSkeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-3 pt-4">
        <GlassSkeleton className="h-10 flex-1 rounded-xl" />
        <GlassSkeleton className="h-10 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

// Note: If there's a CalendarEntryDetailModal component, it would be lazy-loaded here
// For now, we export the skeleton for use in other components

export { CalendarEntryDetailSkeleton };
