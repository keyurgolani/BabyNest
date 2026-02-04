/**
 * Lazy-Loaded Components
 *
 * This module exports lazy-loaded versions of heavy components to improve
 * initial page load time. Uses Next.js dynamic() for code splitting.
 *
 * @requirements 21.2 - Lazy load heavy components to improve initial load time
 *
 * Usage:
 * ```tsx
 * import { LazyGrowthChart, LazyInsightCards } from '@/components/lazy';
 *
 * // In your component:
 * <LazyGrowthChart measurements={data} activeTab="weight" />
 * ```
 */

// Re-export all lazy insight components
export * from './insights';

// Re-export calendar components (no duplicates with insights)
export * from './calendar';

// Re-export modal components (no duplicates with insights)
export * from './modals';

// Re-export chart wrapper components only (avoid duplicate lazy components)
export { ChartLoadingWrapper, StatsChartWrapper } from './charts';
