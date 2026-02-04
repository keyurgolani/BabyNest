"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { FilterPills, FilterOption } from "@/components/ui/filter-pills";
import { IconBadge } from "@/components/ui/icon-badge";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { api, ActivityResponse } from "@/lib/api-client";
import { Plus, Baby, Bath, TreePine, Gamepad2, Calendar, Activity } from "lucide-react";

type ActivityType = "tummy_time" | "bath" | "outdoor" | "play";

const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: typeof Baby; color: string; bgColor: string; emoji: string }> = {
  tummy_time: { label: "Tummy Time", icon: Baby, color: "text-pink-500", bgColor: "bg-pink-500/10", emoji: "👶" },
  bath: { label: "Bath", icon: Bath, color: "text-cyan-500", bgColor: "bg-cyan-500/10", emoji: "🛁" },
  outdoor: { label: "Outdoor", icon: TreePine, color: "text-green-500", bgColor: "bg-green-500/10", emoji: "🌳" },
  play: { label: "Play", icon: Gamepad2, color: "text-amber-500", bgColor: "bg-amber-500/10", emoji: "🎮" },
};

const DATE_FILTER_OPTIONS: FilterOption[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "7 Days" },
  { value: "month", label: "30 Days" },
];

export default function ActivitiesTrackingPage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>("week");

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
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
        {/* Header with PageHeader component */}
        <PageHeader
          title="Activity Tracking"
          subtitle="Tummy time, play & more"
          backHref="/tracking"
          action={
            <Link href="/log/activity">
              <GlassButton variant="primary" size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Add
              </GlassButton>
            </Link>
          }
        />

        {/* Date Filter with FilterPills */}
        <FilterPills
          options={DATE_FILTER_OPTIONS}
          selected={dateFilter}
          onChange={setDateFilter}
        />

        {/* Stats Grid with GlassCard */}
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(stats) as [ActivityType, { count: number; totalMinutes: number }][]).map(([type, data]) => {
            const config = ACTIVITY_CONFIG[type];
            return (
              <GlassCard key={type} size="sm" interactive>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.emoji}</span>
                  <div>
                    <p className="font-bold text-foreground">{config.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.count} times • {data.totalMinutes}m total
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Activity Chart with GlassCard */}
        <ActivityChart activities={filteredActivities} isLoading={isLoading} />

        {/* Activity List with GlassCard */}
        <div className="space-y-4">
          <h3 className="font-bold text-foreground">Recent Activities</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <GlassCard key={i} size="sm">
                  <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
                </GlassCard>
              ))}
            </div>
          ) : Object.keys(groupedActivities).length === 0 ? (
            <GlassCard className="p-8 text-center">
              <IconBadge 
                icon={Gamepad2} 
                color="activity" 
                size="lg" 
                className="mx-auto mb-3"
              />
              <p className="text-muted-foreground mb-4">No activities recorded</p>
              <Link href="/log/activity">
                <GlassButton variant="primary" size="sm">Log Activity</GlassButton>
              </Link>
            </GlassCard>
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
                    <GlassCard key={activity.id} size="sm" interactive>
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
                    </GlassCard>
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
    return (
      <GlassCard>
        <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
      </GlassCard>
    );
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
    <GlassCard>
      <h3 className="font-bold text-foreground mb-4">Daily Activity (minutes)</h3>
      <div className="flex items-end justify-between gap-2 h-24">
        {last7Days.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-md transition-all"
              style={{ height: `${(dailyTotals[i] / maxMinutes) * 100}%`, minHeight: dailyTotals[i] > 0 ? 4 : 0 }}
            />
            <span className="text-[10px] text-muted-foreground">
              {day.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
