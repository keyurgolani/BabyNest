import React, { useEffect, useState } from "react";
import { Moon, Brain } from "lucide-react";
import { SleepPredictionResponseDto } from "@/types/insights";
import { InsightCard } from "./InsightCard";
import { api } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

export function SleepPredictionCard() {
  const { babyId } = useBaby();
  const [prediction, setPrediction] = useState<SleepPredictionResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!babyId) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await api.insights.getSleepPrediction();
        setPrediction(data as unknown as SleepPredictionResponseDto);
      } catch (e) {
        console.error("Failed to fetch sleep prediction", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, [babyId]);

  if (loading) {
    return (
      <InsightCard 
        title="Next Sleep Pulse" 
        icon={Moon} 
        variant="featured"
        iconColor="sleep"
      >
        <div className="h-24 bg-white/20 dark:bg-white/10 rounded-xl animate-pulse"></div>
      </InsightCard>
    );
  }

  if (!prediction) {
    return (
      <InsightCard 
        title="Next Sleep Pulse" 
        icon={Moon}
        variant="featured"
        iconColor="sleep"
      >
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Moon className="w-8 h-8 text-[var(--color-sleep)]/60 mb-2" />
          <p className="text-sm text-muted-foreground">Log sleep sessions to unlock predictions</p>
        </div>
      </InsightCard>
    );
  }

  const isNapDue = prediction.minutesUntilNap <= 0;
  const timeString = new Date(prediction.predictedNapTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <InsightCard 
      title="Next Sleep Pulse" 
      icon={Moon}
      variant="featured"
      iconColor="sleep"
      interactive
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Recommended Nap Time</div>
            <div className="text-3xl font-bold text-foreground">{timeString}</div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium transition-colors backdrop-blur-sm ${
            isNapDue 
              ? 'bg-red-100/80 text-red-700 dark:bg-red-950/50 dark:text-red-300' 
              : 'bg-green-100/80 text-green-700 dark:bg-green-950/50 dark:text-green-300'
          }`}>
            {isNapDue ? 'Due Now' : `in ${prediction.minutesUntilNap} mins`}
          </div>
        </div>

        <div className="bg-[var(--color-sleep)]/10 p-4 rounded-xl border border-[var(--color-sleep)]/20 backdrop-blur-sm transition-colors">
          <div className="flex items-start gap-2">
            <Brain size={16} className="text-[var(--color-sleep)] mt-1 shrink-0" />
            <div className="text-sm text-foreground">
              <MarkdownRenderer content={prediction.reasoning} className="prose-indigo" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="bg-white/20 dark:bg-white/5 p-3 rounded-xl backdrop-blur-sm text-center transition-colors">
            <div className="text-xs text-muted-foreground">Current Wake Window</div>
            <div className="font-semibold text-foreground">{prediction.currentWakeWindowFormatted}</div>
          </div>
          <div className="bg-white/20 dark:bg-white/5 p-3 rounded-xl backdrop-blur-sm text-center transition-colors">
            <div className="text-xs text-muted-foreground">Target</div>
            <div className="font-semibold text-foreground">{prediction.recommendedWakeWindowFormatted}</div>
          </div>
        </div>
      </div>
    </InsightCard>
  );
}
