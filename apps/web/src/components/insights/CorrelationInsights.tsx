import React from "react";
import { TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CorrelationInsight {
  id: string;
  pattern: string;
  correlation: string;
  strength: "strong" | "moderate" | "weak";
  confidence: number;
  insight: string;
  actionable?: string;
}

interface CorrelationInsightsProps {
  insights: CorrelationInsight[];
}

const strengthConfig = {
  strong: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  },
  moderate: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  weak: {
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-950/30",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300",
  },
};

export function CorrelationInsights({ insights }: CorrelationInsightsProps) {
  if (insights.length === 0) {
    return (
      <Card className="p-6 border-0 bg-muted/30">
        <div className="text-center text-muted-foreground text-sm">
          Not enough data to detect correlations yet. Keep tracking activities!
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Pattern Correlations</h3>
          <p className="text-xs text-muted-foreground">
            Discovered relationships in your baby&apos;s routines
          </p>
        </div>
      </div>

      {/* Correlation Cards */}
      <div className="space-y-3">
        {insights.map((insight) => {
          const config = strengthConfig[insight.strength];

          return (
            <Card
              key={insight.id}
              className={cn(
                "p-4 border-0 transition-all duration-200",
                config.bg
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {/* Correlation Flow */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 bg-white/50 dark:bg-black/20 px-3 py-2 rounded-lg">
                      <span className="text-sm font-medium text-foreground">
                        {insight.pattern}
                      </span>
                    </div>
                    <ArrowRight className={cn("w-5 h-5 shrink-0", config.color)} />
                    <div className="flex-1 bg-white/50 dark:bg-black/20 px-3 py-2 rounded-lg">
                      <span className="text-sm font-medium text-foreground">
                        {insight.correlation}
                      </span>
                    </div>
                  </div>

                  {/* Insight Text */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    💡 {insight.insight}
                  </p>

                  {/* Actionable Tip */}
                  {insight.actionable && (
                    <div className="bg-white/70 dark:bg-black/30 p-3 rounded-lg border border-white/50 dark:border-white/10">
                      <p className="text-xs text-foreground">
                        <span className="font-semibold">Try this:</span> {insight.actionable}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/30 dark:border-white/10">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", config.badge)}>
                      {insight.strength.charAt(0).toUpperCase() + insight.strength.slice(1)} Correlation
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
