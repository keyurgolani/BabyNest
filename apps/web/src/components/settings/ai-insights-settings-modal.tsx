"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { InsightConfigCard, InsightHistoryCard } from "@/components/insights";

interface AiInsightsSettingsModalProps {
  onClose: () => void;
}

export function AiInsightsSettingsModal({ onClose }: AiInsightsSettingsModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-lg animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
                <Icons.Insights className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Insights Settings</CardTitle>
                <CardDescription>Configure insight generation schedule</CardDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          <InsightConfigCard />
          <InsightHistoryCard />
        </CardContent>
      </Card>
    </div>
  );
}
