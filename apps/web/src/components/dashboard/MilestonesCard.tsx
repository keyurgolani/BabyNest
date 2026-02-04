"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Award, ChevronRight, Star } from "lucide-react";
import { api, MilestonesByCategoryResponse, MilestoneWithStatus } from "@/lib/api-client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBaby } from "@/context/baby-context";

export function MilestonesCard() {
  const { babyId } = useBaby();
  const [milestones, setMilestones] = useState<MilestonesByCategoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMilestones() {
      if (!babyId) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await api.dashboard.getUpcomingMilestones();
        setMilestones(res);
      } catch (error) {
        console.error("Failed to fetch milestones:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMilestones();
  }, [babyId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "motor":
        return "🏃";
      case "cognitive":
        return "🧠";
      case "social":
        return "👋";
      case "language":
        return "🗣️";
      default:
        return "⭐";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "motor":
        return "bg-blue-500/20 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400";
      case "cognitive":
        return "bg-purple-500/20 text-purple-600 dark:bg-purple-500/30 dark:text-purple-400";
      case "social":
        return "bg-pink-500/20 text-pink-600 dark:bg-pink-500/30 dark:text-pink-400";
      case "language":
        return "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400";
      default:
        return "bg-gray-500/20 text-gray-600 dark:bg-gray-500/30 dark:text-gray-400";
    }
  };

  // Get upcoming milestones from all categories
  const getUpcomingMilestones = (): Array<MilestoneWithStatus & { category: string }> => {
    if (!milestones) return [];

    const upcoming: Array<MilestoneWithStatus & { category: string }> = [];

    const categories = ["motor", "cognitive", "social", "language"] as const;
    categories.forEach((category) => {
      const categoryMilestones = milestones[category] || [];
      categoryMilestones
        .filter((m: MilestoneWithStatus) => m.isUpcoming && !m.isAchieved)
        .forEach((m: MilestoneWithStatus) => {
          upcoming.push({ ...m, category });
        });
    });

    // Sort by expected age and take first 3
    return upcoming
      .sort(
        (a, b) =>
          a.definition.expectedAgeMonthsMin - b.definition.expectedAgeMonthsMin
      )
      .slice(0, 3);
  };

  if (loading) {
    return (
      <GlassCard className="relative overflow-hidden">
        <div className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              Next Milestones
            </h3>
            <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-36 bg-white/10 rounded" />
                <div className="h-3 w-28 bg-white/10 rounded" />
              </div>
              <div className="h-6 w-14 bg-white/10 rounded-lg" />
            </div>
          ))}
          {/* Progress bar skeleton */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-8 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
      </GlassCard>
    );
  }

  const upcomingMilestones = getUpcomingMilestones();

  return (
    <GlassCard className="hover:shadow-2xl transition-shadow duration-200">
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            Next Milestones
          </h3>
          <Link href="/milestones" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
            View All
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      <div>
        {upcomingMilestones.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3 shadow-[0_4px_16px_rgba(251,191,36,0.3)]">
              <Star className="w-7 h-7 text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              All milestones achieved! 🎉
            </p>
            <p className="text-xs text-muted-foreground">
              Your baby is doing great!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingMilestones.map((milestone) => (
              <div
                key={milestone.definition.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)] transition-all duration-200"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg",
                    getCategoryColor(milestone.category)
                  )}
                >
                  {getCategoryIcon(milestone.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {milestone.definition.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expected: {milestone.definition.expectedAgeMonthsMin}-
                    {milestone.definition.expectedAgeMonthsMax} months
                  </p>
                </div>
                <Link
                  href="/milestones"
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-primary/10"
                >
                  Track
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}

            {milestones && (
              <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-medium">
                    {milestones.summary.achievedCount} of{" "}
                    {milestones.summary.totalMilestones} achieved
                  </span>
                  <span className="text-primary font-bold text-sm">
                    {Math.round(
                      (milestones.summary.achievedCount /
                        milestones.summary.totalMilestones) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="h-3 bg-[var(--glass-bg)] rounded-full overflow-hidden border border-[var(--glass-border)]">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(244,162,97,0.5)]"
                    style={{
                      width: `${
                        (milestones.summary.achievedCount /
                          milestones.summary.totalMilestones) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
