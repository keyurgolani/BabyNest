"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Clock, Utensils, Moon, Baby, Pill, Activity } from "lucide-react";
import { api, FeedingResponse, SleepResponse, DiaperResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useBaby } from "@/context/baby-context";

interface RecentActivity {
  id: string;
  type: "feeding" | "sleep" | "diaper" | "medication";
  timestamp: Date;
  details: string;
  subDetails?: string;
}

export function RecentActivityCard() {
  const { babyId } = useBaby();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentActivities() {
      if (!babyId) {
        setLoading(false);
        return;
      }
      
      try {
        const [feedingsRes, sleepRes, diapersRes] = await Promise.all([
          api.feedings.list(),
          api.sleep.list(),
          api.diapers.list(),
        ]);

        const allActivities: RecentActivity[] = [];

        // Add feedings
        feedingsRes.data.slice(0, 5).forEach((f: FeedingResponse) => {
          const details = f.type.charAt(0).toUpperCase() + f.type.slice(1);
          let subDetails = "";
          if (f.type === "bottle" && f.amount) {
            subDetails = `${f.amount}ml`;
          } else if (f.type === "breastfeeding") {
            const totalMin = (f.leftDuration || 0) + (f.rightDuration || 0);
            subDetails = `${totalMin} min`;
          }
          allActivities.push({
            id: f.id,
            type: "feeding",
            timestamp: new Date(f.timestamp),
            details,
            subDetails,
          });
        });

        // Add sleep
        sleepRes.data.slice(0, 5).forEach((s: SleepResponse) => {
          const details = s.sleepType === "nap" ? "Nap" : "Night Sleep";
          let subDetails = "";
          if (s.duration) {
            const hours = Math.floor(s.duration / 60);
            const mins = s.duration % 60;
            subDetails = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          }
          allActivities.push({
            id: s.id,
            type: "sleep",
            timestamp: new Date(s.startTime),
            details,
            subDetails,
          });
        });

        // Add diapers
        diapersRes.data.slice(0, 5).forEach((d: DiaperResponse) => {
          const details = d.type.charAt(0).toUpperCase() + d.type.slice(1);
          allActivities.push({
            id: d.id,
            type: "diaper",
            timestamp: new Date(d.timestamp),
            details,
          });
        });

        // Sort by timestamp and take most recent 5
        allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(allActivities.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch recent activities:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentActivities();
  }, [babyId]);

  const getIcon = (type: string) => {
    switch (type) {
      case "feeding":
        return <Utensils className="w-4 h-4" />;
      case "sleep":
        return <Moon className="w-4 h-4" />;
      case "diaper":
        return <Baby className="w-4 h-4" />;
      case "medication":
        return <Pill className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "feeding":
        return "bg-[var(--color-feed)]/15 text-[var(--color-feed)]";
      case "sleep":
        return "bg-[var(--color-sleep)]/15 text-[var(--color-sleep)]";
      case "diaper":
        return "bg-[var(--color-diaper)]/15 text-[var(--color-diaper)]";
      case "medication":
        return "bg-[var(--color-health)]/15 text-[var(--color-health)]";
      default:
        return "bg-[var(--color-activity)]/15 text-[var(--color-activity)]";
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          <Link href="/activities" className="text-xs text-primary font-medium hover:underline">
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No activity yet</p>
            <p className="text-xs text-muted-foreground mb-3">Start logging to see your baby&apos;s timeline</p>
            <Link href="/quick-log">
              <span className="text-xs text-primary font-medium hover:underline">Log your first activity →</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", getIconBg(activity.type))}>
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.details}</p>
                  {activity.subDetails && (
                    <p className="text-xs text-muted-foreground">{activity.subDetails}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
