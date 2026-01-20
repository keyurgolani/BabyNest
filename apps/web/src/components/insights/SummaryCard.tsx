import React from "react";
import { Heart, Sparkles, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type HealthStatus = "excellent" | "good" | "fair" | "needs-attention";

export interface SummaryData {
  status: HealthStatus;
  statusLabel: string;
  highlights: string[];
  concerns: string[];
  lastUpdated: string;
  aiGenerated: boolean;
}

interface SummaryCardProps {
  data: SummaryData;
  babyName: string;
}

const statusConfig = {
  excellent: {
    icon: Sparkles,
    color: "text-green-600 dark:text-green-400",
    bg: "from-green-500 to-emerald-500",
    bgLight: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
    label: "Excellent",
  },
  good: {
    icon: CheckCircle,
    color: "text-blue-600 dark:text-blue-400",
    bg: "from-blue-500 to-cyan-500",
    bgLight: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
    label: "Good",
  },
  fair: {
    icon: TrendingUp,
    color: "text-amber-600 dark:text-amber-400",
    bg: "from-amber-500 to-yellow-500",
    bgLight: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30",
    label: "Fair",
  },
  "needs-attention": {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bg: "from-red-500 to-orange-500",
    bgLight: "from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30",
    label: "Needs Attention",
  },
};

export function SummaryCard({ data, babyName }: SummaryCardProps) {
  const config = statusConfig[data.status];
  const StatusIcon = config.icon;

  return (
    <Card className={cn("overflow-hidden border-0 bg-gradient-to-br", config.bgLight)}>
      {/* Header with Status */}
      <div className={cn("p-4 bg-gradient-to-r text-white", config.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{babyName}&apos;s Health Overview</h2>
              <p className="text-sm text-white/80">AI-powered analysis</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <StatusIcon className="w-4 h-4" />
              <span className="font-semibold text-sm">{config.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Highlights */}
        {data.highlights.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-green-500" />
              Highlights
            </h4>
            <ul className="space-y-1.5">
              {data.highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {data.concerns.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Areas to Watch
            </h4>
            <ul className="space-y-1.5">
              {data.concerns.map((concern, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-muted flex items-center justify-between text-xs text-muted-foreground">
          <span>Last updated: {new Date(data.lastUpdated).toLocaleString()}</span>
          {data.aiGenerated && (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Generated
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
