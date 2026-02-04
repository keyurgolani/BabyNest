"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { IconBadge } from "@/components/ui/icon-badge";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { api, GrowthResponse } from "@/lib/api-client";
import { Scale, Ruler, TrendingUp, Plus } from "lucide-react";

interface GrowthMeasurement {
  id: string;
  date: Date;
  weight: number;
  height: number;
  headCircumference: number;
  notes?: string;
}

const apiToMeasurement = (response: GrowthResponse): GrowthMeasurement => ({
  id: response.id,
  date: new Date(response.timestamp),
  weight: response.weight ?? 0,
  height: response.height ?? 0,
  headCircumference: response.headCircumference ?? 0,
  notes: response.notes ?? undefined,
});

const gramsToKg = (grams: number): string => (grams / 1000).toFixed(2);
const mmToCm = (mm: number): string => (mm / 10).toFixed(1);

export default function GrowthTrackingPage() {
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"weight" | "height" | "head">("weight");

  const fetchMeasurements = useCallback(async () => {
    try {
      const response = await api.growth.list();
      const sorted = response.data
        .map(apiToMeasurement)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      setMeasurements(sorted);
    } catch (err) {
      console.error("Failed to fetch measurements:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const previous = measurements.length > 1 ? measurements[measurements.length - 2] : null;

  const getChange = (current: number, prev: number | undefined) => {
    if (!prev) return null;
    return current - prev;
  };

  return (
    <MobileContainer>
      <div className="p-4 space-y-6 pb-32">
        {/* Header with PageHeader component */}
        <PageHeader
          title="Growth Tracking"
          subtitle="Monitor development over time"
          backHref="/tracking"
          action={
            <Link href="/log/growth">
              <GlassButton size="sm" variant="primary" className="gap-1">
                <Plus className="w-4 h-4" />
                Add
              </GlassButton>
            </Link>
          }
        />

        {/* Latest Stats with GlassCard */}
        {latest && (
          <div className="grid grid-cols-3 gap-3">
            <GlassCard
              interactive
              className={cn(
                "border-2 transition-all cursor-pointer",
                activeTab === "weight" ? "border-emerald-500 bg-emerald-500/10" : "border-transparent"
              )}
              onClick={() => setActiveTab("weight")}
            >
              <div className="flex flex-col items-center">
                <IconBadge icon={Scale} color="growth" size="sm" className="mb-2" />
                <span className="text-2xl font-bold text-foreground">{gramsToKg(latest.weight)}</span>
                <span className="text-xs text-muted-foreground">kg</span>
                {previous && (
                  <span className={cn(
                    "text-xs mt-1 font-medium",
                    getChange(latest.weight, previous.weight)! >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {getChange(latest.weight, previous.weight)! >= 0 ? "+" : ""}{gramsToKg(getChange(latest.weight, previous.weight)!)}
                  </span>
                )}
              </div>
            </GlassCard>
            <GlassCard
              interactive
              className={cn(
                "border-2 transition-all cursor-pointer",
                activeTab === "height" ? "border-blue-500 bg-blue-500/10" : "border-transparent"
              )}
              onClick={() => setActiveTab("height")}
            >
              <div className="flex flex-col items-center">
                <IconBadge icon={Ruler} color="activity" size="sm" className="mb-2" />
                <span className="text-2xl font-bold text-foreground">{mmToCm(latest.height)}</span>
                <span className="text-xs text-muted-foreground">cm</span>
                {previous && (
                  <span className={cn(
                    "text-xs mt-1 font-medium",
                    getChange(latest.height, previous.height)! >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {getChange(latest.height, previous.height)! >= 0 ? "+" : ""}{mmToCm(getChange(latest.height, previous.height)!)}
                  </span>
                )}
              </div>
            </GlassCard>
            <GlassCard
              interactive
              className={cn(
                "border-2 transition-all cursor-pointer",
                activeTab === "head" ? "border-purple-500 bg-purple-500/10" : "border-transparent"
              )}
              onClick={() => setActiveTab("head")}
            >
              <div className="flex flex-col items-center">
                <IconBadge icon={Icons.Diaper} color="nursing" size="sm" className="mb-2" />
                <span className="text-2xl font-bold text-foreground">{mmToCm(latest.headCircumference)}</span>
                <span className="text-xs text-muted-foreground">cm</span>
                {previous && (
                  <span className={cn(
                    "text-xs mt-1 font-medium",
                    getChange(latest.headCircumference, previous.headCircumference)! >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {getChange(latest.headCircumference, previous.headCircumference)! >= 0 ? "+" : ""}{mmToCm(getChange(latest.headCircumference, previous.headCircumference)!)}
                  </span>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Chart with glassmorphism styling */}
        <GrowthChart measurements={measurements} activeTab={activeTab} isLoading={isLoading} />

        {/* History */}
        <div className="space-y-3">
          <h3 className="font-bold text-foreground">History</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : measurements.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No measurements yet</p>
              <Link href="/log/growth">
                <GlassButton variant="primary" className="mt-4" size="sm">Add First Measurement</GlassButton>
              </Link>
            </GlassCard>
          ) : (
            [...measurements].reverse().map((m) => (
              <GlassCard key={m.id} interactive>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {m.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{gramsToKg(m.weight)} kg</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{mmToCm(m.height)} cm</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">{mmToCm(m.headCircumference)} cm</span>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </MobileContainer>
  );
}


function GrowthChart({ 
  measurements, 
  activeTab, 
  isLoading 
}: { 
  measurements: GrowthMeasurement[]; 
  activeTab: "weight" | "height" | "head";
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <GlassCard size="lg">
        <div className="h-48 bg-muted/50 rounded-xl animate-pulse" />
      </GlassCard>
    );
  }

  if (measurements.length < 2) {
    return (
      <GlassCard size="lg" className="text-center">
        <p className="text-muted-foreground text-sm">Add at least 2 measurements to see the chart</p>
      </GlassCard>
    );
  }

  const chartHeight = 200;
  const padding = 40;

  const getData = () => {
    switch (activeTab) {
      case "weight": return measurements.map(m => m.weight);
      case "height": return measurements.map(m => m.height);
      case "head": return measurements.map(m => m.headCircumference);
    }
  };

  const getColor = () => {
    switch (activeTab) {
      case "weight": return "var(--color-growth)";
      case "height": return "var(--color-activity)";
      case "head": return "var(--color-nursing)";
    }
  };

  const getLabel = () => {
    switch (activeTab) {
      case "weight": return "Weight (kg)";
      case "height": return "Height (cm)";
      case "head": return "Head (cm)";
    }
  };

  const formatValue = (val: number) => {
    if (activeTab === "weight") return gramsToKg(val);
    return mmToCm(val);
  };

  const data = getData();
  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;

  const generatePath = (): string => {
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (100 - padding * 2);
      const y = chartHeight - padding - ((value - min) / (max - min)) * (chartHeight - padding * 2);
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };

  return (
    <GlassCard size="lg">
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        {getLabel()} Trend
      </h3>
      <div className="relative w-full" style={{ height: chartHeight }}>
        <svg
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={padding}
              y1={padding + (i * (chartHeight - padding * 2)) / 4}
              x2={100 - padding}
              y2={padding + (i * (chartHeight - padding * 2)) / 4}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={0.5}
              className="text-muted-foreground"
            />
          ))}
          {/* Data line */}
          <path
            d={generatePath()}
            fill="none"
            stroke={getColor()}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Data points */}
          {data.map((value, index) => {
            const x = padding + (index / (data.length - 1)) * (100 - padding * 2);
            const y = chartHeight - padding - ((value - min) / (max - min)) * (chartHeight - padding * 2);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={4}
                fill="var(--background)"
                stroke={getColor()}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-medium text-muted-foreground py-4">
          <span>{formatValue(max)}</span>
          <span>{formatValue(min)}</span>
        </div>
      </div>
    </GlassCard>
  );
}
