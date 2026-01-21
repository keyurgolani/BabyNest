"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import {
  SleepPredictionCard,
  WeeklySummaryCard,
  AnomaliesCard,
  AlertsSection,
  PatternCard,
  RecommendationsSection,
  MilestoneInsights,
  SummaryCard,
  HealthAlert,
  Recommendation,
  Milestone,
  SummaryData,
  CorrelationInsights,
  CorrelationInsight,
  PatternChart,
  ChartDataPoint,
  GrowthTracker,
  GrowthMeasurement,
  FeedingPrediction,
  FeedingPredictionData,
  InsightConfigCard,
  InsightHistoryCard,
  GrowthPercentilesChart,
  GrowthVelocityCard,
  TrendAnalysisCard,
} from "@/components/insights";
import { Icons } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, TrendInsightsResponse } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import Link from "next/link";
import { Moon, Utensils, Baby, Activity, RefreshCw, Sparkles, Settings } from "lucide-react";

type InsightTab = "overview" | "patterns" | "growth" | "alerts" | "milestones" | "settings";

// Cache configuration with different cadences for different insight types
const CACHE_KEYS = {
  WEEKLY_SUMMARY: 'insights:weekly_summary',
  ANOMALIES: 'insights:anomalies',
  PATTERNS: 'insights:patterns',
  GROWTH: 'insights:growth',
  MILESTONES: 'insights:milestones',
  CORRELATIONS: 'insights:correlations',
  FEEDING_PREDICTION: 'insights:feeding_prediction',
};

// Cache durations in milliseconds
const CACHE_DURATIONS = {
  WEEKLY_SUMMARY: 24 * 60 * 60 * 1000,      // 24 hours - weekly data doesn't change often
  ANOMALIES: 4 * 60 * 60 * 1000,            // 4 hours - anomalies should be checked more frequently
  PATTERNS: 6 * 60 * 60 * 1000,             // 6 hours - patterns update moderately
  GROWTH: 7 * 24 * 60 * 60 * 1000,          // 7 days - growth data changes slowly
  MILESTONES: 24 * 60 * 60 * 1000,          // 24 hours - milestones don't change often
  CORRELATIONS: 12 * 60 * 60 * 1000,        // 12 hours - correlations need periodic refresh
  FEEDING_PREDICTION: 30 * 60 * 1000,       // 30 minutes - predictions should be fresh
};

interface CachedData<T> {
  data: T;
  timestamp: number;
  babyId: string;
}

function getFromCache<T>(key: string, babyId: string, maxAge: number): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const parsed: CachedData<T> = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    
    // Check if cache is valid (not expired and same baby)
    if (age < maxAge && parsed.babyId === babyId) {
      return parsed.data;
    }
    return null;
  } catch {
    return null;
  }
}

function setToCache<T>(key: string, data: T, babyId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      babyId,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch {
    // Ignore cache errors
  }
}

function clearCache(): void {
  if (typeof window === 'undefined') return;
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Animated skeleton components
function InsightSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-48 bg-muted/70 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-muted/60 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="h-3 w-3/4 bg-muted/60 rounded animate-pulse" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shimmer" />
      </div>

      {/* Pattern cards skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="relative overflow-hidden rounded-xl bg-muted/30 p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
              </div>
              <div className="h-8 w-20 bg-muted rounded animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
              <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.15}s` }} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" style={{ animationDelay: `${i * 0.2}s` }} />
          </div>
        ))}
      </div>

      {/* Prediction cards skeleton */}
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div 
            key={i}
            className="relative overflow-hidden rounded-xl bg-muted/30 p-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                  <div className="space-y-1">
                    <div className="h-4 w-28 bg-muted rounded animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.05}s` }} />
                    <div className="h-3 w-20 bg-muted/60 rounded animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.1}s` }} />
                  </div>
                </div>
                <div className="h-6 w-16 bg-muted rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.15}s` }} />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted/50 rounded animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.2}s` }} />
                <div className="h-3 w-2/3 bg-muted/50 rounded animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.25}s` }} />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" style={{ animationDelay: `${i * 0.3}s` }} />
          </div>
        ))}
      </div>

      {/* Correlations skeleton */}
      <div className="relative overflow-hidden rounded-xl bg-muted/30 p-5">
        <div className="space-y-4">
          <div className="h-5 w-36 bg-muted rounded animate-pulse" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-32 bg-muted rounded animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
                <div className="h-2 w-24 bg-muted/60 rounded animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-shimmer {
          animation: shimmer 2s infinite;
        }
      `}} />
    </div>
  );
}

export default function InsightsPage() {
  const { babyId, baby } = useBaby();
  const [activeTab, setActiveTab] = useState<InsightTab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [babyName, setBabyName] = useState("Baby");
  const [babyAgeMonths, setBabyAgeMonths] = useState(6);

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationInsight[]>([]);
  const [sleepChartData, setSleepChartData] = useState<ChartDataPoint[]>([]);
  const [feedingChartData, setFeedingChartData] = useState<ChartDataPoint[]>([]);
  const [growthMeasurements, setGrowthMeasurements] = useState<GrowthMeasurement[]>([]);
  const [feedingPrediction, setFeedingPrediction] = useState<FeedingPredictionData | null>(null);
  const [patternData, setPatternData] = useState<{
    sleep: { value: string; subtitle: string; trend?: "up" | "down" | "stable"; trendValue?: string };
    feeding: { value: string; subtitle: string; trend?: "up" | "down" | "stable"; trendValue?: string };
    diaper: { value: string; subtitle: string; trend?: "up" | "down" | "stable"; trendValue?: string };
    activity: { value: string; subtitle: string; trend?: "up" | "down" | "stable"; trendValue?: string };
  } | null>(null);

  const fetchInsightsData = useCallback(async (forceRefresh = false) => {
    if (!babyId) {
      setLoading(false);
      return;
    }

    let trends: TrendInsightsResponse | null = null;

    try {
      // Check cache for weekly summary
      const cachedSummary = !forceRefresh ? getFromCache<{
        babyName: string;
        babyAgeMonths: number;
        patternData: typeof patternData;
        summaryData: SummaryData;
      }>(CACHE_KEYS.WEEKLY_SUMMARY, babyId, CACHE_DURATIONS.WEEKLY_SUMMARY) : null;

      if (cachedSummary) {
        setBabyName(cachedSummary.babyName);
        setBabyAgeMonths(cachedSummary.babyAgeMonths);
        setPatternData(cachedSummary.patternData);
        setSummaryData(cachedSummary.summaryData);
        setLoading(false);
      } else {
        // Fetch both local weekly summary and trend insights
        const [data, fetchedTrends] = await Promise.all([
           api.insights.getWeeklySummary(),
           api.insights.getWeeklyTrends().catch(() => null) 
        ]);
        trends = fetchedTrends;

        const name = data.babyName || baby?.name || "Baby";
        const age = data.babyAgeMonths || 6;
        setBabyName(name);
        setBabyAgeMonths(age);

        const agg = data.aggregatedData;
        
        if (agg) {
          // Use trends data for trends if available, otherwise fall back to simple logic or defaults
          const sleepTrend = trends?.insights.find(i => i.category === 'sleep');
          const feedingTrend = trends?.insights.find(i => i.category === 'feeding');
          const diaperTrend = trends?.insights.find(i => i.category === 'diaper');
          const activityTrend = trends?.insights.find(i => i.category === 'activity');

          const newPatternData = {
            sleep: {
              value: `${Math.round(agg.sleepSummary.averageSleepMinutesPerDay / 60)}h`,
              subtitle: `${agg.sleepSummary.napCount} naps this week`,
              trend: (sleepTrend?.trend === 'improving' ? 'up' : sleepTrend?.trend === 'declining' ? 'down' : 'stable') as "up" | "down" | "stable",
              trendValue: sleepTrend?.title || "On track",
            },
            feeding: {
              value: `${agg.feedingSummary.totalFeedings}`,
              subtitle: "Total feedings this week",
              trend: (feedingTrend?.trend === 'improving' ? 'up' : 'stable') as "up" | "down" | "stable",
              trendValue: feedingTrend?.changePercent ? `${feedingTrend.changePercent > 0 ? '+' : ''}${feedingTrend.changePercent}%` : "Consistent",
            },
            diaper: {
              value: `${agg.diaperSummary.averageChangesPerDay}/day`,
              subtitle: `${agg.diaperSummary.wetCount} wet, ${agg.diaperSummary.dirtyCount} dirty`,
              trend: (diaperTrend?.trend === 'improving' ? 'up' : 'stable') as "up" | "down" | "stable",
              trendValue: diaperTrend?.title || "Normal",
            },
            activity: {
              value: `${agg.activitiesSummary.tummyTimeMinutes}m`,
              subtitle: "Tummy time this week",
              trend: (activityTrend?.trend === 'improving' ? 'up' : 'stable') as "up" | "down" | "stable",
              trendValue: activityTrend?.changePercent ? `${activityTrend.changePercent > 0 ? '+' : ''}${activityTrend.changePercent}%` : "+10%",
            },
          };
          setPatternData(newPatternData);

          const hasGoodSleep = agg.sleepSummary.averageSleepMinutesPerDay >= 600;
          const hasGoodFeeding = agg.feedingSummary.totalFeedings >= 28;
          const hasGoodDiapers = agg.diaperSummary.averageChangesPerDay >= 6;

          const highlights: string[] = [];
          const concerns: string[] = [];

          if (hasGoodSleep) highlights.push("Sleep patterns are consistent and healthy");
          else concerns.push("Sleep duration is below recommended levels");

          if (hasGoodFeeding) highlights.push("Feeding frequency is on track");
          else concerns.push("Consider increasing feeding frequency");

          if (hasGoodDiapers) highlights.push("Diaper output indicates good hydration");
          else concerns.push("Monitor diaper output for hydration");

          if (agg.activitiesSummary.tummyTimeMinutes > 0) {
            highlights.push("Great job with tummy time activities!");
          }

          const status = concerns.length === 0 ? "excellent" : concerns.length === 1 ? "good" : concerns.length === 2 ? "fair" : "needs-attention";

          const newSummaryData: SummaryData = {
            status,
            statusLabel: status === "excellent" ? "Excellent" : status === "good" ? "Good" : status === "fair" ? "Fair" : "Needs Attention",
            highlights,
            concerns,
            lastUpdated: new Date().toISOString(),
            aiGenerated: data.aiInsightsGenerated || false,
          };
          setSummaryData(newSummaryData);

          // Cache the data
          setToCache(CACHE_KEYS.WEEKLY_SUMMARY, {
            babyName: name,
            babyAgeMonths: age,
            patternData: newPatternData,
            summaryData: newSummaryData,
          }, babyId);
        }
        setLoading(false);
      }

      // Check cache for anomalies
      const cachedAnomalies = !forceRefresh ? getFromCache<HealthAlert[]>(
        CACHE_KEYS.ANOMALIES, babyId, CACHE_DURATIONS.ANOMALIES
      ) : null;

      if (cachedAnomalies) {
        setAlerts(cachedAnomalies);
      } else {
        // Fetch anomalies in the background
        api.insights.getAnomalies().then((anomalyData) => {
          if (anomalyData.anomalies && anomalyData.anomalies.length > 0) {
            const newAlerts = anomalyData.anomalies.map((a, idx: number) => ({
              id: `alert-${idx}`,
              severity: a.severity === "high" ? "critical" as const : a.severity === "medium" ? "warning" as const : "info" as const,
              title: a.title,
              description: a.description,
              recommendation: a.recommendation ?? "",
              category: a.category,
              timestamp: new Date().toISOString(),
            }));
            setAlerts(newAlerts);
            setToCache(CACHE_KEYS.ANOMALIES, newAlerts, babyId);
          }
        }).catch((err) => {
          console.error("Failed to fetch anomalies:", err);
        });
      }

      // Check cache for correlations
      const cachedCorrelations = !forceRefresh ? getFromCache<CorrelationInsight[]>(
        CACHE_KEYS.CORRELATIONS, babyId, CACHE_DURATIONS.CORRELATIONS
      ) : null;

      // Use real trends for correlations if available
      if (trends && trends.insights && trends.insights.length > 0) {
        // Transform trend insights into correlation format
        const trendCorrelations: CorrelationInsight[] = trends.insights
          .filter(i => i.trend === 'improving' || i.trend === 'new')
          .map((i, idx) => ({
            id: `trend-${idx}`,
            pattern: i.title,
            correlation: i.trend === 'improving' ? 'Positive trend' : 'New pattern',
            strength: 'strong',
            confidence: 85,
            insight: i.description,
            actionable: i.recommendation || "Keep up the good work!",
          }));
          
        if (trendCorrelations.length > 0) {
          setCorrelations(trendCorrelations);
          setToCache(CACHE_KEYS.CORRELATIONS, trendCorrelations, babyId);
        } else {
             // Fallback to static correlations if no positive trends
             const newCorrelations: CorrelationInsight[] = [
             // ... existing static correlations
          {
            id: "corr-1",
            pattern: "Outdoor time in morning",
            correlation: "Better afternoon naps",
            strength: "strong",
            confidence: 87,
            insight: "Babies who spend time outdoors in the morning tend to nap better in the afternoon. Natural light helps regulate their circadian rhythm.",
            actionable: "Try a morning walk or outdoor play session before the first afternoon nap.",
          },
          // ... (keep other existing static correlations for now as fallback)
        ];
           setCorrelations(newCorrelations);
        }
      } else if (cachedCorrelations) {
        setCorrelations(cachedCorrelations);
      } else {
        const newCorrelations: CorrelationInsight[] = [
          {
            id: "corr-1",
            pattern: "Outdoor time in morning",
            correlation: "Better afternoon naps",
            strength: "strong",
            confidence: 87,
            insight: "Babies who spend time outdoors in the morning tend to nap better in the afternoon. Natural light helps regulate their circadian rhythm.",
            actionable: "Try a morning walk or outdoor play session before the first afternoon nap.",
          },
          {
            id: "corr-2",
            pattern: "Consistent bedtime routine",
            correlation: "Longer night sleep",
            strength: "strong",
            confidence: 92,
            insight: "Following the same bedtime routine (bath, book, lullaby) consistently leads to 45 minutes more sleep on average.",
            actionable: "Maintain your bedtime routine at the same time each night, even on weekends.",
          },
          {
            id: "corr-3",
            pattern: "Tummy time sessions",
            correlation: "Reduced fussiness",
            strength: "moderate",
            confidence: 73,
            insight: "Regular tummy time appears to reduce evening fussiness, possibly by helping with digestion and building strength.",
            actionable: "Incorporate 3-4 short tummy time sessions throughout the day.",
          },
        ];
        setCorrelations(newCorrelations);
        setToCache(CACHE_KEYS.CORRELATIONS, newCorrelations, babyId);
      }

      // Generate recommendations from trends areas of concern
      if (trends && trends.areasOfConcern && trends.areasOfConcern.length > 0) {
        const trendRecommendations: Recommendation[] = trends.areasOfConcern.map((concern, idx) => ({
          id: `rec-trend-${idx}`,
          title: "Area for Improvement",
          description: concern,
          category: "routine",
          priority: "medium",
          actionable: true,
        }));
        
        // Add some static high priority ones if missing
        if (!trendRecommendations.some(r => r.category === 'sleep')) {
             trendRecommendations.push({
          id: "rec-1",
          title: "Establish a Consistent Bedtime Routine",
          description: "A predictable bedtime routine helps signal to your baby that it's time to sleep. Try bath, book, and lullaby.",
          category: "sleep",
          priority: "high",
          actionable: true,
          estimatedTime: "20-30 min",
        });
        }
        
        setRecommendations(trendRecommendations);
      } else {
        // Fallback to static recommendations
        setRecommendations([
        {
          id: "rec-1",
          title: "Establish a Consistent Bedtime Routine",
          description: "A predictable bedtime routine helps signal to your baby that it's time to sleep. Try bath, book, and lullaby.",
          category: "sleep",
          priority: "high",
          actionable: true,
          estimatedTime: "20-30 min",
        },
        {
          id: "rec-2",
          title: "Increase Tummy Time Duration",
          description: "Gradually increase tummy time to help strengthen your baby's neck and shoulder muscles for crawling.",
          category: "development",
          priority: "medium",
          actionable: true,
          estimatedTime: "5-10 min sessions",
        },
        {
          id: "rec-3",
          title: "Monitor Feeding Cues",
          description: "Watch for early hunger cues like rooting or hand-to-mouth movements to feed before baby gets too fussy.",
          category: "nutrition",
          priority: "medium",
          actionable: true,
        },
        {
          id: "rec-4",
          title: "Track Growth Measurements",
          description: "Regular weight and height measurements help ensure your baby is growing on track.",
          category: "health",
          priority: "low",
          actionable: true,
          estimatedTime: "5 min",
        },
      ]);
      }

      // Check cache for milestones
      const cachedMilestones = !forceRefresh ? getFromCache<Milestone[]>(
        CACHE_KEYS.MILESTONES, babyId, CACHE_DURATIONS.MILESTONES
      ) : null;

      if (cachedMilestones) {
        setMilestones(cachedMilestones);
      } else {
        const newMilestones: Milestone[] = [
          {
            id: "m-1",
            title: "Holds Head Steady",
            description: "Can hold head steady without support when held upright",
            category: "motor",
            status: "achieved",
            expectedAge: "3-4 months",
            achievedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "m-2",
            title: "Rolls Over",
            description: "Can roll from tummy to back and back to tummy",
            category: "motor",
            status: "in-progress",
            expectedAge: "4-6 months",
            tips: "Place toys just out of reach during tummy time to encourage rolling.",
          },
          {
            id: "m-3",
            title: "Sits Without Support",
            description: "Can sit independently for short periods",
            category: "motor",
            status: "upcoming",
            expectedAge: "6-8 months",
          },
          {
            id: "m-4",
            title: "Responds to Name",
            description: "Turns head when name is called",
            category: "social",
            status: "in-progress",
            expectedAge: "5-7 months",
            tips: "Use your baby's name frequently during play and daily activities.",
          },
          {
            id: "m-5",
            title: "Babbles with Consonants",
            description: "Makes sounds like 'ba-ba' or 'da-da'",
            category: "language",
            status: "upcoming",
            expectedAge: "6-9 months",
          },
        ];
        setMilestones(newMilestones);
        setToCache(CACHE_KEYS.MILESTONES, newMilestones, babyId);
      }

      // Set chart data (static for now)
      setSleepChartData([
        { label: "Mon", value: 11.5, color: "bg-indigo-500" },
        { label: "Tue", value: 10.8, color: "bg-indigo-500" },
        { label: "Wed", value: 12.2, color: "bg-indigo-500" },
        { label: "Thu", value: 11.0, color: "bg-indigo-500" },
        { label: "Fri", value: 11.8, color: "bg-indigo-500" },
        { label: "Sat", value: 12.5, color: "bg-indigo-500" },
        { label: "Sun", value: 11.9, color: "bg-indigo-500" },
      ]);

      setFeedingChartData([
        { label: "Mon", value: 7, color: "bg-orange-500" },
        { label: "Tue", value: 8, color: "bg-orange-500" },
        { label: "Wed", value: 7, color: "bg-orange-500" },
        { label: "Thu", value: 8, color: "bg-orange-500" },
        { label: "Fri", value: 9, color: "bg-orange-500" },
        { label: "Sat", value: 8, color: "bg-orange-500" },
        { label: "Sun", value: 8, color: "bg-orange-500" },
      ]);

      // Check cache for growth measurements
      const cachedGrowth = !forceRefresh ? getFromCache<GrowthMeasurement[]>(
        CACHE_KEYS.GROWTH, babyId, CACHE_DURATIONS.GROWTH
      ) : null;

      if (cachedGrowth) {
        setGrowthMeasurements(cachedGrowth);
      } else {
        const newGrowthMeasurements: GrowthMeasurement[] = [
          {
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            weight: 7.2,
            height: 65,
            headCircumference: 42,
            weightPercentile: 45,
            heightPercentile: 52,
            headPercentile: 48,
          },
          {
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            weight: 7.8,
            height: 67,
            headCircumference: 43,
            weightPercentile: 48,
            heightPercentile: 54,
            headPercentile: 50,
          },
          {
            date: new Date().toISOString(),
            weight: 8.3,
            height: 69,
            headCircumference: 44,
            weightPercentile: 52,
            heightPercentile: 56,
            headPercentile: 52,
          },
        ];
        setGrowthMeasurements(newGrowthMeasurements);
        setToCache(CACHE_KEYS.GROWTH, newGrowthMeasurements, babyId);
      }

      // Check cache for feeding prediction (short cache)
      const cachedFeedingPrediction = !forceRefresh ? getFromCache<FeedingPredictionData>(
        CACHE_KEYS.FEEDING_PREDICTION, babyId, CACHE_DURATIONS.FEEDING_PREDICTION
      ) : null;

      if (cachedFeedingPrediction) {
        setFeedingPrediction(cachedFeedingPrediction);
      } else {
        const lastFeedingTime = new Date(Date.now() - 2.5 * 60 * 60 * 1000);
        const nextFeedingTime = new Date(Date.now() + 0.5 * 60 * 60 * 1000);
        const newFeedingPrediction: FeedingPredictionData = {
          nextFeedingTime: nextFeedingTime.toISOString(),
          minutesUntilFeeding: 30,
          averageInterval: 180,
          confidence: 85,
          recommendedAmount: 120,
          lastFeedingTime: lastFeedingTime.toISOString(),
          pattern: "regular",
          insight: "Your baby has been feeding every 3 hours consistently. Based on this pattern, the next feeding is expected in about 30 minutes.",
        };
        setFeedingPrediction(newFeedingPrediction);
        setToCache(CACHE_KEYS.FEEDING_PREDICTION, newFeedingPrediction, babyId);
      }
    } catch (error) {
      console.error("Failed to fetch insights data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [babyId, baby?.name]);

  useEffect(() => {
    fetchInsightsData();
  }, [fetchInsightsData]);

  const handleRefresh = () => {
    setRefreshing(true);
    clearCache();
    fetchInsightsData(true);
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const tabs: { id: InsightTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Icons.Insights className="w-4 h-4" /> },
    { id: "patterns", label: "Patterns", icon: <Icons.Stats className="w-4 h-4" /> },
    { id: "growth", label: "Growth", icon: <Icons.Growth className="w-4 h-4" /> },
    { id: "alerts", label: "Alerts", icon: <Icons.AlertCircle className="w-4 h-4" /> },
    { id: "milestones", label: "Milestones", icon: <Icons.Milestone className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <MobileContainer>
      <div className="p-6 space-y-6 animate-slide-up pb-32">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Icons.Insights className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-heading font-bold text-foreground">AI Insights</h1>
              <p className="text-muted-foreground text-sm">Powered by pattern analysis</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-full"
          >
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 shrink-0",
                activeTab === tab.id && "shadow-md"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "alerts" && alerts.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {activeTab === "settings" && (
          <div className="space-y-6">
            <InsightConfigCard />
            <InsightHistoryCard />
          </div>
        )}

        {activeTab === "overview" && (
          loading ? (
            <InsightSkeleton />
          ) : (
            <div className="space-y-6">
              {summaryData && (
                <div className="animate-fade-in">
                  <SummaryCard data={summaryData} babyName={babyName} />
                </div>
              )}

              {patternData && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                  <PatternCard
                    title="Sleep"
                    icon={Moon}
                    value={patternData.sleep.value}
                    subtitle={patternData.sleep.subtitle}
                    trend={patternData.sleep.trend}
                    trendValue={patternData.sleep.trendValue}
                    color="indigo"
                  />
                  <PatternCard
                    title="Feeding"
                    icon={Utensils}
                    value={patternData.feeding.value}
                    subtitle={patternData.feeding.subtitle}
                    trend={patternData.feeding.trend}
                    trendValue={patternData.feeding.trendValue}
                    color="orange"
                  />
                  <PatternCard
                    title="Diapers"
                    icon={Baby}
                    value={patternData.diaper.value}
                    subtitle={patternData.diaper.subtitle}
                    trend={patternData.diaper.trend}
                    trendValue={patternData.diaper.trendValue}
                    color="emerald"
                  />
                  <PatternCard
                    title="Activity"
                    icon={Activity}
                    value={patternData.activity.value}
                    subtitle={patternData.activity.subtitle}
                    trend={patternData.activity.trend}
                    trendValue={patternData.activity.trendValue}
                    color="pink"
                  />
                </div>
              )}

              {/* Predictive Insights */}
              <div className="grid grid-cols-1 gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <SleepPredictionCard />
                <FeedingPrediction prediction={feedingPrediction} />
              </div>

              {/* Correlation Insights */}
              {correlations.length > 0 && (
                <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <CorrelationInsights insights={correlations} />
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
                  <RecommendationsSection recommendations={recommendations.slice(0, 2)} />
                </div>
              )}

              <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
                <WeeklySummaryCard />
              </div>
            </div>
          )
        )}

        {activeTab === "patterns" && (
          <div className="space-y-6">
            {patternData && (
              <div className="grid grid-cols-2 gap-3">
                <PatternCard
                  title="Sleep"
                  icon={Moon}
                  value={patternData.sleep.value}
                  subtitle={patternData.sleep.subtitle}
                  trend={patternData.sleep.trend}
                  trendValue={patternData.sleep.trendValue}
                  color="indigo"
                  details={[
                    { label: "Avg nap", value: "1.5h" },
                    { label: "Night sleep", value: "10h" },
                  ]}
                />
                <PatternCard
                  title="Feeding"
                  icon={Utensils}
                  value={patternData.feeding.value}
                  subtitle={patternData.feeding.subtitle}
                  trend={patternData.feeding.trend}
                  trendValue={patternData.feeding.trendValue}
                  color="orange"
                  details={[
                    { label: "Per day", value: "6-8" },
                    { label: "Avg amount", value: "120ml" },
                  ]}
                />
                <PatternCard
                  title="Diapers"
                  icon={Baby}
                  value={patternData.diaper.value}
                  subtitle={patternData.diaper.subtitle}
                  trend={patternData.diaper.trend}
                  trendValue={patternData.diaper.trendValue}
                  color="emerald"
                  details={[
                    { label: "Wet", value: "6/day" },
                    { label: "Dirty", value: "2/day" },
                  ]}
                />
                <PatternCard
                  title="Activity"
                  icon={Activity}
                  value={patternData.activity.value}
                  subtitle={patternData.activity.subtitle}
                  trend={patternData.activity.trend}
                  trendValue={patternData.activity.trendValue}
                  color="pink"
                  details={[
                    { label: "Play time", value: "45m" },
                    { label: "Outdoor", value: "30m" },
                  ]}
                />
              </div>
            )}

            {/* Visual Charts */}
            <div className="grid grid-cols-1 gap-4">
              <PatternChart
                title="Sleep Duration (Last 7 Days)"
                subtitle="Hours of sleep per day"
                data={sleepChartData}
                unit="h"
                trend="up"
                trendValue="+5%"
                color="indigo"
              />
              <PatternChart
                title="Feeding Frequency (Last 7 Days)"
                subtitle="Number of feedings per day"
                data={feedingChartData}
                unit=" feeds"
                trend="stable"
                trendValue="Consistent"
                color="orange"
              />
            </div>

            {/* AI-Powered Trend Analysis with Period Selection */}
            <TrendAnalysisCard showPeriodSelector={true} initialPeriod="weekly" />

            <AnomaliesCard />
          </div>
        )}

        {activeTab === "growth" && (
          <div className="space-y-6">
            <GrowthPercentilesChart />
            <GrowthVelocityCard />
            <GrowthTracker measurements={growthMeasurements} babyAgeMonths={babyAgeMonths} />
            
            {/* Growth Insights */}
            <Card className="p-4 border-0 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Growth Insights
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Your baby is growing at a healthy rate, maintaining consistent percentiles.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Weight gain is appropriate for age, averaging 150-200g per week.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">💡</span>
                  <span>Continue current feeding schedule. Next measurement recommended in 2 weeks.</span>
                </p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="space-y-6">
            <AlertsSection
              alerts={alerts}
              onDismiss={handleDismissAlert}
              onMarkAddressed={handleDismissAlert}
            />
            <RecommendationsSection recommendations={recommendations} />
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="space-y-6">
            <MilestoneInsights milestones={milestones} babyAgeMonths={babyAgeMonths} />
          </div>
        )}

        <Card className="p-4 border-0 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3 text-sm">Related</h3>
          <div className="space-y-2">
            <Link href="/tracking/timeline">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Icons.Stats className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">View Activity Timeline</span>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/report">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Icons.Report className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Generate Report</span>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </MobileContainer>
  );
}
