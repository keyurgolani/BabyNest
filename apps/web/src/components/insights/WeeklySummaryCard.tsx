import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { WeeklySummaryResponseDto } from "@/types/insights";
import { InsightCard } from "./InsightCard";
import { api } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

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
        variant="featured"
        iconColor="nursing"
      >
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-white/20 dark:bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/20 dark:bg-white/10 rounded w-full"></div>
          <div className="h-4 bg-white/20 dark:bg-white/10 rounded w-5/6"></div>
        </div>
      </InsightCard>
    );
  }

  if (!summary) {
    return (
      <InsightCard 
        title="Weekly AI Summary" 
        icon={Sparkles}
        variant="featured"
        iconColor="nursing"
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
      variant="featured"
      iconColor="nursing"
    >
      <div className="bg-gradient-to-br from-[var(--color-nursing)]/10 to-white/50 dark:from-[var(--color-nursing)]/20 dark:to-white/5 p-4 rounded-xl border border-[var(--color-nursing)]/20 backdrop-blur-sm transition-colors">
        <MarkdownRenderer content={summary.aiSummary} className="prose-pink" />
        <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10 flex justify-between items-center text-xs text-muted-foreground">
          <span>Generated using {summary.aiSummaryGenerated ? 'Ollama AI' : 'Rule-based Fallback'}</span>
          {summary.aiDurationMs && <span>{Math.round(summary.aiDurationMs / 1000)}s generation time</span>}
        </div>
      </div>
    </InsightCard>
  );
}
