"use client";

/**
 * Lazy-Loaded Chart Components
 *
 * Chart wrapper components and loading states for lazy-loaded charts.
 * The actual lazy-loaded chart components are exported from ./insights.tsx
 * to avoid duplication.
 *
 * @requirements 21.2 - Lazy load heavy components to improve initial load time
 */

import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassSkeleton, ChartSkeleton, GrowthChartSkeleton } from "@/components/ui/lazy-loading";

// ============================================================================
// Chart Wrapper Components with Loading States
// ============================================================================

/**
 * Generic chart loading wrapper
 * Provides consistent loading state for any chart component
 */
export function ChartLoadingWrapper({
  children,
  isLoading,
  height = "h-48",
  title,
}: {
  children: React.ReactNode;
  isLoading: boolean;
  height?: string;
  title?: string;
}) {
  if (isLoading) {
    return (
      <GlassCard size="lg" className="relative overflow-hidden">
        <div className="space-y-4">
          {title && (
            <div className="flex items-center gap-2">
              <GlassSkeleton className="w-5 h-5 rounded" />
              <GlassSkeleton className="h-5 w-32" />
            </div>
          )}
          <GlassSkeleton className={`w-full rounded-xl ${height}`} />
        </div>
      </GlassCard>
    );
  }

  return <>{children}</>;
}

/**
 * Stats chart loading wrapper
 * For smaller stat-focused charts
 */
export function StatsChartWrapper({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <GlassCard key={i} className="relative overflow-hidden">
            <div className="flex flex-col items-center space-y-2">
              <GlassSkeleton className="w-8 h-8 rounded-lg" />
              <GlassSkeleton className="h-6 w-12" />
              <GlassSkeleton className="h-3 w-8" />
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  return <>{children}</>;
}

// Re-export skeleton components for convenience
export { ChartSkeleton, GrowthChartSkeleton };
