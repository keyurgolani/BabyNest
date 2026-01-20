"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { api } from "@/lib/api-client";
import { ChevronLeft, Calendar } from "lucide-react";

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: Date;
  icon: keyof typeof Icons;
  color: string;
  bgColor: string;
}

const TYPE_CONFIG: Record<string, { icon: keyof typeof Icons; color: string; bgColor: string }> = {
  feeding: { icon: "Feed", color: "text-orange-500", bgColor: "bg-orange-500/10" },
  sleep: { icon: "Sleep", color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
  diaper: { icon: "Diaper", color: "text-green-500", bgColor: "bg-green-500/10" },
  activity: { icon: "Activity", color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  growth: { icon: "Growth", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  medication: { icon: "Medication", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  symptom: { icon: "Symptom", color: "text-red-500", bgColor: "bg-red-500/10" },
  vaccination: { icon: "Vaccination", color: "text-purple-500", bgColor: "bg-purple-500/10" },
};

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month">("week");

  const fetchAllData = useCallback(async () => {
    try {
      const [feedingsRes, sleepRes, diapersRes, activitiesRes, growthRes, medsRes, symptomsRes, vaccinesRes] = await Promise.all([
        api.feedings.list().catch(() => ({ data: [] })),
        api.sleep.list().catch(() => ({ data: [] })),
        api.diapers.list().catch(() => ({ data: [] })),
        api.activities.list().catch(() => ({ data: [] })),
        api.growth.list().catch(() => ({ data: [] })),
        api.health.medications.list().catch(() => ({ data: [] })),
        api.health.symptoms.list().catch(() => ({ data: [] })),
        api.health.vaccinations.list().catch(() => ({ data: [] })),
      ]);

      const allItems: TimelineItem[] = [
        ...feedingsRes.data.map(f => ({
          id: f.id,
          type: "feeding",
          title: f.type === "breastfeeding" ? "Nursing" : f.type === "bottle" ? "Bottle" : "Feeding",
          subtitle: f.amount ? `${f.amount}ml` : f.leftDuration || f.rightDuration ? `${Math.round(((f.leftDuration || 0) + (f.rightDuration || 0)) / 60)}m` : "",
          timestamp: new Date(f.timestamp),
          ...TYPE_CONFIG.feeding,
        })),
        ...sleepRes.data.map(s => ({
          id: s.id,
          type: "sleep",
          title: s.sleepType === "nap" ? "Nap" : "Night Sleep",
          subtitle: s.duration ? `${Math.round(s.duration)}m` : "",
          timestamp: new Date(s.startTime),
          ...TYPE_CONFIG.sleep,
        })),
        ...diapersRes.data.map(d => ({
          id: d.id,
          type: "diaper",
          title: "Diaper",
          subtitle: d.type.charAt(0).toUpperCase() + d.type.slice(1),
          timestamp: new Date(d.timestamp),
          ...TYPE_CONFIG.diaper,
        })),
        ...activitiesRes.data.filter(a => a.startTime).map(a => ({
          id: a.id,
          type: "activity",
          title: a.activityType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
          subtitle: a.duration ? `${a.duration}m` : "",
          timestamp: new Date(a.startTime!),
          ...TYPE_CONFIG.activity,
        })),
        ...growthRes.data.map(g => ({
          id: g.id,
          type: "growth",
          title: "Growth Measurement",
          subtitle: [
            g.weight ? `${(g.weight / 1000).toFixed(1)}kg` : null,
            g.height ? `${(g.height / 10).toFixed(1)}cm` : null,
          ].filter(Boolean).join(" • "),
          timestamp: new Date(g.timestamp),
          ...TYPE_CONFIG.growth,
        })),
        ...medsRes.data.map(m => ({
          id: m.id,
          type: "medication",
          title: m.name,
          subtitle: `${m.dosage} ${m.unit}`,
          timestamp: new Date(m.timestamp),
          ...TYPE_CONFIG.medication,
        })),
        ...symptomsRes.data.map(s => ({
          id: s.id,
          type: "symptom",
          title: s.symptomType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
          subtitle: s.severity,
          timestamp: new Date(s.timestamp),
          ...TYPE_CONFIG.symptom,
        })),
        ...vaccinesRes.data.map(v => ({
          id: v.id,
          type: "vaccination",
          title: v.vaccineName,
          subtitle: "",
          timestamp: new Date(v.timestamp),
          ...TYPE_CONFIG.vaccination,
        })),
      ];

      setItems(allItems);
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredItems = useMemo(() => {
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
    
    return items
      .filter(item => item.timestamp >= startDate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [items, dateFilter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    filteredItems.forEach(item => {
      const dateKey = item.timestamp.toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <MobileContainer>
      <div className="p-4 space-y-6 pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/tracking" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-foreground">Timeline</h1>
            <p className="text-sm text-muted-foreground">{filteredItems.length} activities</p>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {[
            { key: "today" as const, label: "Today" },
            { key: "week" as const, label: "7 Days" },
            { key: "month" as const, label: "30 Days" },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant="ghost"
              onClick={() => setDateFilter(filter.key)}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all h-auto",
                dateFilter === filter.key
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-transparent"
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No activities in this period</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([dateKey, dayItems]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {new Date(dateKey).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="space-y-2 ml-2 border-l-2 border-muted pl-4">
                  {dayItems.map((item) => {
                    const IconComponent = Icons[item.icon];
                    return (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-[21px] top-3 w-2 h-2 rounded-full bg-muted-foreground" />
                        <Card className="p-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", item.bgColor)}>
                              <IconComponent className={cn("w-4 h-4", item.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm">{item.title}</p>
                              {item.subtitle && (
                                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
