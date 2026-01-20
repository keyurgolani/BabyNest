"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { api, ActivityResponse } from "@/lib/api-client";
import { ChevronLeft, Plus, Baby, Bath, TreePine, Gamepad2, Calendar } from "lucide-react";

type ActivityType = "tummy_time" | "bath" | "outdoor" | "play";

const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: typeof Baby; color: string; bgColor: string; emoji: string }> = {
  tummy_time: { label: "Tummy Time", icon: Baby, color: "text-pink-500", bgColor: "bg-pink-500/10", emoji: "👶" },
  bath: { label: "Bath", icon: Bath, color: "text-cyan-500", bgColor: "bg-cyan-500/10", emoji: "🛁" },
  outdoor: { label: "Outdoor", icon: TreePine, color: "text-green-500", bgColor: "bg-green-500/10", emoji: "🌳" },
  play: { label: "Play", icon: Gamepad2, color: "text-amber-500", bgColor: "bg-amber-500/10", emoji: "🎮" },
};

export default function ActivitiesTrackingPage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month">("week");

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.activities.list();
      setActivities(response.data);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getFilteredActivities = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (dateFilter) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return activities.filter(a => a.startTime && new Date(a.startTime) >= startDate);
  };

  const filteredActivities = getFilteredActivities();

  const getStats = () => {
    const stats: Record<ActivityType, { count: number; totalMinutes: number }> = {
      tummy_time: { count: 0, totalMinutes: 0 },
      bath: { count: 0, totalMinutes: 0 },
      outdoor: { count: 0, totalMinutes: 0 },
      play: { count: 0, totalMinutes: 0 },
    };
    
    filteredActivities.forEach(a => {
      const type = a.activityType as ActivityType;
      if (stats[type]) {
        stats[type].count++;
        stats[type].totalMinutes += a.duration || 0;
      }
    });
    
    return stats;
  };

  const stats = getStats();

  const groupByDate = () => {
    const groups: Record<string, ActivityResponse[]> = {};
    filteredActivities
      .filter(a => a.startTime)
      .sort((a, b) => new Date(b.startTime!).getTime() - new Date(a.startTime!).getTime())
      .forEach(activity => {
        const dateKey = new Date(activity.startTime!).toDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(activity);
      });
    return groups;
  };

  const groupedActivities = groupByDate();

  return (
    <MobileContainer>
      <div className="p-4 space-y-6 pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/tracking" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-foreground">Activity Tracking</h1>
            <p className="text-sm text-muted-foreground">Tummy time, play & more</p>
          </div>
          <Link href="/log/activity">
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </Link>
        </div>

        {/* Date Filter */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {[
            { key: "today" as const, label: "Today" },
            { key: "week" as const, label: "7 Days" },
            { key: "month" as const, label: "30 Days" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setDateFilter(filter.key)}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                dateFilter === filter.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(stats) as [ActivityType, { count: number; totalMinutes: number }][]).map(([type, data]) => {
            const config = ACTIVITY_CONFIG[type];
            return (
              <Card key={type} className={cn("p-4", config.bgColor)}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.emoji}</span>
                  <div>
                    <p className="font-bold text-foreground">{config.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.count} times • {data.totalMinutes}m total
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Activity Chart */}
        <ActivityChart activities={filteredActivities} isLoading={isLoading} />

        {/* Activity List */}
        <div className="space-y-4">
          <h3 className="font-bold text-foreground">Recent Activities</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : Object.keys(groupedActivities).length === 0 ? (
            <Card className="p-8 text-center">
              <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No activities recorded</p>
              <Link href="/log/activity">
                <Button className="mt-4" size="sm">Log Activity</Button>
              </Link>
            </Card>
          ) : (
            Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(dateKey).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
                {dayActivities.map((activity) => {
                  const config = ACTIVITY_CONFIG[activity.activityType as ActivityType];
                  return (
                    <Card key={activity.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{config?.emoji || "🎯"}</span>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{config?.label || activity.activityType}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.startTime && new Date(activity.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {activity.duration && ` • ${activity.duration}m`}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </MobileContainer>
  );
}

function ActivityChart({ activities, isLoading }: { activities: ActivityResponse[]; isLoading: boolean }) {
  if (isLoading) {
    return <Card className="p-6"><div className="h-32 bg-muted/50 rounded-xl animate-pulse" /></Card>;
  }

  // Group by day and calculate totals
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const dailyTotals = last7Days.map(day => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const dayActivities = activities.filter(a => {
      if (!a.startTime) return false;
      const actDate = new Date(a.startTime);
      return actDate >= day && actDate < nextDay;
    });
    
    return dayActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
  });

  const maxMinutes = Math.max(...dailyTotals, 30);

  return (
    <Card className="p-4">
      <h3 className="font-bold text-foreground mb-4">Daily Activity (minutes)</h3>
      <div className="flex items-end justify-between gap-2 h-24">
        {last7Days.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full bg-cyan-500 rounded-t-md transition-all"
              style={{ height: `${(dailyTotals[i] / maxMinutes) * 100}%`, minHeight: dailyTotals[i] > 0 ? 4 : 0 }}
            />
            <span className="text-[10px] text-muted-foreground">
              {day.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
