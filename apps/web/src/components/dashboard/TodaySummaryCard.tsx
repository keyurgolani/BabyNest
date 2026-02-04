"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Moon, Utensils, Baby, Activity } from "lucide-react";
import { api, DashboardSummaryResponse } from "@/lib/api-client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBaby } from "@/context/baby-context";

export function TodaySummaryCard() {
  const { babyId } = useBaby();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      if (!babyId) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await api.dashboard.getDailySummary();
        setSummary(res);
      } catch (error) {
        console.error("Failed to fetch daily summary:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [babyId]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            Today&apos;s Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Sleep",
      value: summary ? formatDuration(summary.sleep.totalMinutes) : "0m",
      subValue: summary ? `${summary.sleep.napCount} naps` : "",
      icon: Moon,
      color: "text-[var(--color-sleep)]",
      bg: "bg-[var(--color-sleep)]/10",
      glow: "shadow-[0_0_20px_rgba(126,184,218,0.15)]",
    },
    {
      label: "Feedings",
      value: summary ? `${summary.feeding.count}x` : "0x",
      subValue: summary?.feeding.totalMl ? `${summary.feeding.totalMl}ml` : "",
      icon: Utensils,
      color: "text-[var(--color-feed)]",
      bg: "bg-[var(--color-feed)]/10",
      glow: "shadow-[0_0_20px_rgba(244,162,97,0.15)]",
    },
    {
      label: "Diapers",
      value: summary ? `${summary.diaper.total}x` : "0x",
      subValue: summary ? `${summary.diaper.wet}W ${summary.diaper.dirty}D` : "",
      icon: Baby,
      color: "text-[var(--color-diaper)]",
      bg: "bg-[var(--color-diaper)]/10",
      glow: "shadow-[0_0_20px_rgba(168,213,186,0.15)]",
    },
    {
      label: "Tummy time",
      value: summary ? formatDuration(summary.activities.tummyTimeMinutes) : "0m",
      subValue: "Tummy time",
      icon: Activity,
      color: "text-[var(--color-tummy)]",
      bg: "bg-[var(--color-tummy)]/10",
      glow: "shadow-[0_0_20px_rgba(242,132,130,0.15)]",
    },
  ];

  return (
    <Card variant="aurora" className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Today&apos;s Summary
          </CardTitle>
          <Link href="/tracking/timeline" className="text-xs text-primary font-medium hover:underline">
            View Stats
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "p-3 rounded-2xl flex flex-col items-center text-center transition-all duration-300",
                stat.bg,
                stat.glow,
                "hover:scale-[1.02] hover:shadow-lg"
              )}
            >
              <stat.icon className={cn("w-5 h-5 mb-1", stat.color)} />
              <span className={cn("font-bold text-lg", stat.color)}>
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground truncate w-full">
                {stat.subValue || stat.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
