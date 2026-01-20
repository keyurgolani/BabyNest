"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        return "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";
      case "cognitive":
        return "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400";
      case "social":
        return "bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400";
      case "language":
        return "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
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
      <Card className="animate-pulse shadow-[0_8px_24px_rgba(244,162,97,0.15),0_0_40px_rgba(244,162,97,0.1)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            Next Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const upcomingMilestones = getUpcomingMilestones();

  return (
    <Card className="shadow-[0_8px_24px_rgba(244,162,97,0.15),0_0_40px_rgba(244,162,97,0.1)] hover:shadow-[0_12px_32px_rgba(244,162,97,0.25),0_0_60px_rgba(244,162,97,0.15)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            Next Milestones
          </CardTitle>
          <Link href="/milestones" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
            View All
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingMilestones.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-200 to-amber-200 dark:from-yellow-800/50 dark:to-amber-800/50 flex items-center justify-center mx-auto mb-3 shadow-[0_4px_16px_rgba(251,191,36,0.3)]">
              <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-300" />
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
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/40 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md",
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
              <div className="mt-4 pt-4 border-t border-border/50">
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
                <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
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
      </CardContent>
    </Card>
  );
}
