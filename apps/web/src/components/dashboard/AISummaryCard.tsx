"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw, ChevronRight } from "lucide-react";
import { api, TrendInsightsResponse } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useBaby } from "@/context/baby-context";

export function AISummaryCard() {
  const { babyId } = useBaby();
  const [insights, setInsights] = useState<TrendInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchInsights = async () => {
    if (!babyId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await api.insights.getDailyTrends();
      setInsights(res);
    } catch (err) {
      // Handle insufficient data gracefully - this is expected for new users
      // Don't set error state, just show empty state
      console.debug("Insights not available yet:", err);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyId]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case "declining":
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "text-green-600 dark:text-green-400";
      case "declining":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 dark:from-violet-950/40 dark:via-purple-950/40 dark:to-fuchsia-950/40 border-violet-300/50 dark:border-violet-700/30 shadow-[0_8px_24px_rgba(139,92,246,0.2),0_0_40px_rgba(139,92,246,0.15)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            AI Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-violet-300/50 dark:bg-violet-700/30 rounded-lg w-3/4" />
            <div className="h-4 bg-violet-300/50 dark:bg-violet-700/30 rounded-lg w-full" />
            <div className="h-4 bg-violet-300/50 dark:bg-violet-700/30 rounded-lg w-5/6" />
            <div className="h-4 bg-violet-300/50 dark:bg-violet-700/30 rounded-lg w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show friendly empty state for new users
  if (!insights || (insights.insights?.length === 0 && !insights.aiSummary)) {
    return (
      <Card className="bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 dark:from-violet-950/40 dark:via-purple-950/40 dark:to-fuchsia-950/40 border-violet-300/50 dark:border-violet-700/30 shadow-[0_8px_24px_rgba(139,92,246,0.2),0_0_40px_rgba(139,92,246,0.15)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            AI Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-200 to-purple-200 dark:from-violet-800/50 dark:to-purple-800/50 flex items-center justify-center mx-auto mb-3 shadow-[0_4px_16px_rgba(139,92,246,0.3)]">
              <Sparkles className="w-7 h-7 text-violet-600 dark:text-violet-300" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Ready to analyze</p>
            <p className="text-xs text-muted-foreground mb-3">
              Log some activities to unlock AI-powered insights about your baby&apos;s patterns
            </p>
            <Link href="/quick-log">
              <Button variant="soft" size="sm" className="text-violet-700 bg-violet-200/50 hover:bg-violet-200 dark:bg-violet-800/30 dark:hover:bg-violet-800/50">
                Start Logging
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 dark:from-violet-950/40 dark:via-purple-950/40 dark:to-fuchsia-950/40 border-violet-300/50 dark:border-violet-700/30 shadow-[0_8px_24px_rgba(139,92,246,0.2),0_0_40px_rgba(139,92,246,0.15)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            AI Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchInsights}>
              <RefreshCw className="w-3 h-3 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 dark:from-violet-950/40 dark:via-purple-950/40 dark:to-fuchsia-950/40 border-violet-300/50 dark:border-violet-700/30 shadow-[0_8px_24px_rgba(139,92,246,0.2),0_0_40px_rgba(139,92,246,0.15)] hover:shadow-[0_12px_32px_rgba(139,92,246,0.3),0_0_60px_rgba(139,92,246,0.2)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            AI Health Summary
          </CardTitle>
          <Link href="/insights" className="text-xs text-violet-700 dark:text-violet-300 font-semibold hover:underline flex items-center gap-1">
            More Insights
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Summary Text - Collapsible on Mobile */}
        {insights?.aiSummary && (
          <div className="relative">
            <div className={cn(
              "text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap transition-all duration-300",
              !isExpanded && "line-clamp-1 md:line-clamp-none max-h-[1.5em] md:max-h-32 overflow-hidden"
            )}>
              {insights.aiSummary}
            </div>
            
            {/* Show toggle on mobile only if content is long enough (implied by design for now) */}
             <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden w-full mt-1 h-6 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30"
            >
              {isExpanded ? (
                <span className="flex items-center gap-1">Show Less <ChevronRight className="w-3 h-3 rotate-270" /></span>
              ) : (
                <span className="flex items-center gap-1">Read More <ChevronRight className="w-3 h-3 rotate-90" /></span>
              )}
            </Button>
          </div>
        )}

        {/* Note: Fallback summary is already handled in the first aiSummary block above */}

        {/* No summary available at all */}
        {!insights?.aiSummary && (
          <p className="text-sm text-muted-foreground italic">
            AI summary is being generated. Check back soon for personalized insights.
          </p>
        )}

        {/* Areas of Concern */}
        {insights?.areasOfConcern && insights.areasOfConcern.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-100/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                  Areas to Watch
                </p>
                <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
                  {insights.areasOfConcern.slice(0, 2).map((concern, i) => (
                    <li key={i}>• {concern}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Highlights */}
        {insights?.highlights && insights.highlights.length > 0 && (
          <div className="p-3 rounded-xl bg-green-100/50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30">
            <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
              ✨ Highlights
            </p>
            <ul className="text-xs text-green-600 dark:text-green-400 space-y-0.5">
              {insights.highlights.slice(0, 2).map((highlight, i) => (
                <li key={i}>• {highlight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Insights */}
        {insights?.insights && insights.insights.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Key Trends</p>
            <div className="grid grid-cols-2 gap-2">
              {insights.insights.slice(0, 4).map((insight, i) => (
                <div
                  key={i}
                  className="p-2 md:p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-violet-200/50 dark:border-violet-800/20"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {getTrendIcon(insight.trend)}
                    <span className="text-[10px] md:text-xs font-medium truncate">
                      {insight.category}
                    </span>
                  </div>
                  <p className={cn("text-[10px] md:text-xs", getTrendColor(insight.trend))}>
                    {insight.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
