import React, { useEffect, useState } from "react";
import { Moon, Brain } from "lucide-react";
import { SleepPredictionResponseDto } from "@/types/insights";
import { InsightCard } from "./InsightCard";
import { api } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";

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
        variant="aurora"
        iconClassName="bg-indigo-100 text-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-400"
      >
        <div className="h-24 bg-muted rounded-xl animate-pulse"></div>
      </InsightCard>
    );
  }

  if (!prediction) {
    return (
      <InsightCard 
        title="Next Sleep Pulse" 
        icon={Moon}
        variant="aurora"
        iconClassName="bg-indigo-100 text-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-400"
      >
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Moon className="w-8 h-8 text-indigo-300 dark:text-indigo-700 mb-2" />
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
      variant="aurora"
      iconClassName="bg-indigo-100 text-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-400"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Recommended Nap Time</div>
            <div className="text-3xl font-bold text-foreground">{timeString}</div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            isNapDue 
              ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' 
              : 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
          }`}>
            {isNapDue ? 'Due Now' : `in ${prediction.minutesUntilNap} mins`}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 transition-colors">
          <div className="flex items-start gap-2">
            <Brain size={16} className="text-blue-600 dark:text-blue-400 mt-1 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {prediction.reasoning}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="bg-muted/50 dark:bg-muted/30 p-3 rounded-lg text-center transition-colors">
            <div className="text-xs text-muted-foreground">Current Wake Window</div>
            <div className="font-semibold text-foreground">{prediction.currentWakeWindowFormatted}</div>
          </div>
          <div className="bg-muted/50 dark:bg-muted/30 p-3 rounded-lg text-center transition-colors">
            <div className="text-xs text-muted-foreground">Target</div>
            <div className="font-semibold text-foreground">{prediction.recommendedWakeWindowFormatted}</div>
          </div>
        </div>
      </div>
    </InsightCard>
  );
}
