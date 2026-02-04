import React, { useEffect, useState } from "react";
import { CheckCircle, Activity, ChevronRight } from "lucide-react";
import { AnomalyDetectionResponseDto } from "@/types/insights";
import { InsightCard } from "./InsightCard";
import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";

export function AnomaliesCard() {
  const { babyId } = useBaby();
  const [data, setData] = useState<AnomalyDetectionResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAnomalies = async () => {
      if (!babyId) {
        setLoading(false);
        return;
      }
      
      try {
        const json = await api.insights.getAnomalies();
        setData(json as unknown as AnomalyDetectionResponseDto);
      } catch (e) {
        console.error("Failed to fetch anomalies", e);
      } finally {
        setLoading(false);
      }
    };
    checkAnomalies();
  }, [babyId]);

  if (loading) {
    return (
      <InsightCard 
        title="Pattern Monitor" 
        icon={Activity} 
        variant="default"
        iconClassName="bg-orange-100 text-orange-500 dark:bg-orange-950/50 dark:text-orange-400"
      >
        <div className="h-32 bg-muted rounded-lg animate-pulse"></div>
      </InsightCard>
    );
  }

  if (!data || data.anomalies.length === 0) {
    return (
      <InsightCard 
        title="Pattern Monitor" 
        icon={Activity}
        variant="default"
        iconClassName="bg-orange-100 text-orange-500 dark:bg-orange-950/50 dark:text-orange-400"
      >
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center mb-3 text-green-600 dark:text-green-400">
            <CheckCircle size={24} />
          </div>
          <h4 className="font-semibold text-foreground">All Systems Normal</h4>
          <p className="text-sm text-muted-foreground mt-1">No unusual patterns detected in the last 48 hours.</p>
        </div>
      </InsightCard>
    );
  }

  return (
    <InsightCard 
      title="Pattern Monitor" 
      icon={Activity}
      variant="default"
      iconClassName="bg-orange-100 text-orange-500 dark:bg-orange-950/50 dark:text-orange-400"
    >
      <div className="mb-4 text-sm text-muted-foreground">
        Detected {data.anomalyCount} unusual patterns in the last 48h.
      </div>
      <div className="space-y-3">
        {data.anomalies.map((anomaly, idx) => (
          <div key={idx} className={`p-4 rounded-xl border-l-4 transition-colors ${
            anomaly.severity === 'high' 
              ? 'bg-red-50 dark:bg-red-950/30 border-red-500' 
              : anomaly.severity === 'medium' 
                ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-500' 
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-500'
          }`}>
            <div className="flex justify-between items-start">
              <h4 className={`font-semibold text-sm ${
                anomaly.severity === 'high' 
                  ? 'text-red-900 dark:text-red-200' 
                  : anomaly.severity === 'medium' 
                    ? 'text-orange-900 dark:text-orange-200' 
                    : 'text-blue-900 dark:text-blue-200'
              }`}>{anomaly.title}</h4>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/50 dark:bg-black/20 text-foreground">
                {anomaly.category}
              </span>
            </div>
            <p className="text-xs mt-1 text-muted-foreground leading-relaxed">{anomaly.description}</p>
            {anomaly.recommendation && (
              <div className="mt-2 text-xs font-medium opacity-80 flex items-center gap-1 text-muted-foreground">
                <ChevronRight size={12} />
                {anomaly.recommendation}
              </div>
            )}
          </div>
        ))}
      </div>
      {data.aiAnalysis && (
        <div className="mt-4 pt-4 border-t border-muted">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">AI Analysis</h4>
          <p className="text-sm text-muted-foreground italic">&quot;{data.aiAnalysis}&quot;</p>
        </div>
      )}
    </InsightCard>
  );
}
