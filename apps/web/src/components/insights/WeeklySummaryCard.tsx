import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { WeeklySummaryResponseDto } from "@/types/insights";
import { InsightCard } from "./InsightCard";
import { api } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";

// Since we might not have a markdown renderer installed, we'll just render text with newlines.
// If the user wants specific markdown rendering, we'd add `react-markdown`.
// For now, let's just do a simple whitespace pre-wrap.

export function WeeklySummaryCard() {
  const { babyId } = useBaby();
  const [summary, setSummary] = useState<WeeklySummaryResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!babyId) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await api.insights.getWeeklySummary();
        setSummary(data as unknown as WeeklySummaryResponseDto);
      } catch (e) {
        console.error("Failed to fetch weekly summary", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [babyId]);

  if (loading) {
    return (
      <InsightCard 
        title="Weekly AI Summary" 
        icon={Sparkles} 
        variant="neumorphic"
        iconClassName="bg-purple-100 text-purple-500 dark:bg-purple-950/50 dark:text-purple-400"
      >
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </InsightCard>
    );
  }

  if (!summary) {
    return (
      <InsightCard 
        title="Weekly AI Summary" 
        icon={Sparkles}
        variant="neumorphic"
        iconClassName="bg-purple-100 text-purple-500 dark:bg-purple-950/50 dark:text-purple-400"
      >
        <div className="text-muted-foreground text-sm italic">
          Gathering data for your first weekly summary...
        </div>
      </InsightCard>
    );
  }

  return (
    <InsightCard 
      title="Weekly AI Summary" 
      icon={Sparkles}
      variant="neumorphic"
      iconClassName="bg-purple-100 text-purple-500 dark:bg-purple-950/50 dark:text-purple-400"
    >
      <div className="prose prose-purple prose-sm max-w-none text-muted-foreground bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/30 dark:to-card p-4 rounded-xl border border-purple-100/60 dark:border-purple-900/30 transition-colors">
        <div className="whitespace-pre-wrap leading-relaxed font-medium text-foreground/80">
          {summary.aiSummary}
        </div>
        <div className="mt-4 pt-4 border-t border-muted/50 flex justify-between items-center text-xs text-muted-foreground">
          <span>Generated using {summary.aiSummaryGenerated ? 'Ollama AI' : 'Rule-based Fallback'}</span>
          {summary.aiDurationMs && <span>{Math.round(summary.aiDurationMs / 1000)}s generation time</span>}
        </div>
      </div>
    </InsightCard>
  );
}
