"use client";

/**
 * Lazy-Loaded Insight Components
 *
 * Heavy insight components that are lazy-loaded to improve initial page load.
 * These components are typically data-heavy and include charts/visualizations.
 *
 * @requirements 21.2 - Lazy load heavy components to improve initial load time
 */

import dynamic from "next/dynamic";
import {
  InsightCardSkeleton,
  FeaturedInsightSkeleton,
  PatternCardSkeleton,
  ChartSkeleton,
  CorrelationsSkeleton,
  InsightsGridSkeleton,
} from "@/components/ui/lazy-loading";

// ============================================================================
// Lazy-Loaded Insight Components
// ============================================================================

/**
 * Lazy-loaded SleepPredictionCard
 * Heavy component with prediction algorithms and chart visualization
 */
export const LazySleepPredictionCard = dynamic(
  () => import("@/components/insights/SleepPredictionCard").then((mod) => mod.SleepPredictionCard),
  {
    loading: () => <InsightCardSkeleton />,
    ssr: false, // Predictions don't need SSR
  }
);

/**
 * Lazy-loaded WeeklySummaryCard
 * Heavy component with aggregated data visualization
 */
export const LazyWeeklySummaryCard = dynamic(
  () => import("@/components/insights/WeeklySummaryCard").then((mod) => mod.WeeklySummaryCard),
  {
    loading: () => <FeaturedInsightSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded AnomaliesCard
 * Heavy component with anomaly detection visualization
 */
export const LazyAnomaliesCard = dynamic(
  () => import("@/components/insights/AnomaliesCard").then((mod) => mod.AnomaliesCard),
  {
    loading: () => <InsightCardSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded AlertsSection
 * Heavy component with multiple alert cards
 */
export const LazyAlertsSection = dynamic(
  () => import("@/components/insights/AlertsSection").then((mod) => mod.AlertsSection),
  {
    loading: () => <InsightsGridSkeleton count={2} />,
    ssr: false,
  }
);

/**
 * Lazy-loaded PatternCard
 * Heavy component with pattern analysis
 */
export const LazyPatternCard = dynamic(
  () => import("@/components/insights/PatternCard").then((mod) => mod.PatternCard),
  {
    loading: () => <PatternCardSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded RecommendationsSection
 * Heavy component with AI-generated recommendations
 */
export const LazyRecommendationsSection = dynamic(
  () => import("@/components/insights/RecommendationsSection").then((mod) => mod.RecommendationsSection),
  {
    loading: () => <InsightsGridSkeleton count={4} />,
    ssr: false,
  }
);

/**
 * Lazy-loaded MilestoneInsights
 * Heavy component with milestone tracking and progress
 */
export const LazyMilestoneInsights = dynamic(
  () => import("@/components/insights/MilestoneInsights").then((mod) => mod.MilestoneInsights),
  {
    loading: () => <InsightsGridSkeleton count={4} />,
    ssr: false,
  }
);

/**
 * Lazy-loaded SummaryCard
 * Heavy component with summary statistics
 */
export const LazySummaryCard = dynamic(
  () => import("@/components/insights/SummaryCard").then((mod) => mod.SummaryCard),
  {
    loading: () => <FeaturedInsightSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded CorrelationInsights
 * Heavy component with correlation analysis and visualization
 */
export const LazyCorrelationInsights = dynamic(
  () => import("@/components/insights/CorrelationInsights").then((mod) => mod.CorrelationInsights),
  {
    loading: () => <CorrelationsSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded PatternChart
 * Heavy component with chart visualization
 */
export const LazyPatternChart = dynamic(
  () => import("@/components/insights/PatternChart").then((mod) => mod.PatternChart),
  {
    loading: () => <ChartSkeleton height="h-32" />,
    ssr: false, // Charts don't need SSR
  }
);

/**
 * Lazy-loaded GrowthTracker
 * Heavy component with growth tracking visualization
 */
export const LazyGrowthTracker = dynamic(
  () => import("@/components/insights/GrowthTracker").then((mod) => mod.GrowthTracker),
  {
    loading: () => <ChartSkeleton height="h-48" />,
    ssr: false,
  }
);

/**
 * Lazy-loaded FeedingPrediction
 * Heavy component with feeding prediction algorithms
 */
export const LazyFeedingPrediction = dynamic(
  () => import("@/components/insights/FeedingPrediction").then((mod) => mod.FeedingPrediction),
  {
    loading: () => <InsightCardSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded GrowthPercentilesChart
 * Heavy component with percentile chart visualization
 */
export const LazyGrowthPercentilesChart = dynamic(
  () => import("@/components/insights/GrowthPercentilesChart").then((mod) => mod.GrowthPercentilesChart),
  {
    loading: () => <ChartSkeleton height="h-64" />,
    ssr: false,
  }
);

/**
 * Lazy-loaded GrowthVelocityCard
 * Heavy component with velocity calculations
 */
export const LazyGrowthVelocityCard = dynamic(
  () => import("@/components/insights/GrowthVelocityCard").then((mod) => mod.GrowthVelocityCard),
  {
    loading: () => <InsightCardSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded TrendAnalysisCard
 * Heavy component with trend analysis algorithms
 */
export const LazyTrendAnalysisCard = dynamic(
  () => import("@/components/insights/TrendAnalysisCard").then((mod) => mod.TrendAnalysisCard),
  {
    loading: () => <InsightCardSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded InsightConfigCard
 * Heavy component with configuration options
 */
export const LazyInsightConfigCard = dynamic(
  () => import("@/components/insights/InsightConfigCard").then((mod) => mod.InsightConfigCard),
  {
    loading: () => <InsightCardSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded InsightHistoryCard
 * Heavy component with historical data
 */
export const LazyInsightHistoryCard = dynamic(
  () => import("@/components/insights/InsightHistoryCard").then((mod) => mod.InsightHistoryCard),
  {
    loading: () => <InsightCardSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded TrendsSection
 * Heavy component with trend visualization
 */
export const LazyTrendsSection = dynamic(
  () => import("@/components/insights/TrendsSection").then((mod) => mod.TrendsSection),
  {
    loading: () => <InsightsGridSkeleton count={4} />,
    ssr: false,
  }
);
