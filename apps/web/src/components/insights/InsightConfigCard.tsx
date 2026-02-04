"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassSelect, GlassSelectContent, GlassSelectItem, GlassSelectTrigger, GlassSelectValue } from "@/components/ui/glass-select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  api,
  InsightConfigResponse,
  InsightCadence,
} from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { Settings, Clock, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightConfigCardProps {
  onConfigChange?: (config: InsightConfigResponse) => void;
}

export function InsightConfigCard({ onConfigChange }: InsightConfigCardProps) {
  const { babyId } = useBaby();
  const [config, setConfig] = useState<InsightConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!babyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.insights.getConfig();
      setConfig(data);
    } catch (err) {
      // Don't show error for new users - use default config
      console.error("Failed to fetch insight config:", err);
      // Set a default config for new users
      setConfig({
        id: '',
        babyId: '',
        cadence: 'weekly' as InsightCadence,
        isEnabled: true,
        lastGenerated: null,
        nextGeneration: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleCadenceChange = async (cadence: InsightCadence) => {
    if (!config) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const updated = await api.insights.configureInsightCadence({
        cadence,
        isEnabled: config.isEnabled,
      });
      setConfig(updated);
      setSuccess(true);
      onConfigChange?.(updated);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to update cadence:", err);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleEnabledChange = async (isEnabled: boolean) => {
    if (!config) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const updated = await api.insights.configureInsightCadence({
        cadence: config.cadence,
        isEnabled,
      });
      setConfig(updated);
      setSuccess(true);
      onConfigChange?.(updated);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to update enabled state:", err);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const formatNextGeneration = (dateStr: string | null) => {
    if (!dateStr) return "On demand only";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays === 1) return "Tomorrow";
    if (diffHours > 1) return `In ${diffHours} hours`;
    if (diffHours === 1) return "In 1 hour";
    return "Soon";
  };

  const cadenceOptions: { value: InsightCadence; label: string; description: string }[] = [
    { value: "everytime", label: "On Demand", description: "Generate insights manually" },
    { value: "daily", label: "Daily", description: "Every day at 9 AM" },
    { value: "weekly", label: "Weekly", description: "Every Monday at 9 AM" },
    { value: "monthly", label: "Monthly", description: "First of each month" },
  ];

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-32" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h3 className="font-semibold text-foreground">AI Insight Settings</h3>
        </div>
        {success && (
          <div className="flex items-center gap-1 text-green-500 text-sm animate-fade-in">
            <Check className="w-4 h-4" />
            <span>Saved</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="insights-enabled" className="text-sm font-medium">
              Auto-generate Insights
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically generate AI insights on schedule
            </p>
          </div>
          <button
            id="insights-enabled"
            onClick={() => handleEnabledChange(!config?.isEnabled)}
            disabled={saving}
            className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              config?.isEnabled ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]' : 'bg-white/10'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={config?.isEnabled ?? true}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                config?.isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Generation Frequency</Label>
          <GlassSelect
            value={config?.cadence ?? "weekly"}
            onValueChange={(value) => handleCadenceChange(value as InsightCadence)}
            disabled={saving || !config?.isEnabled}
          >
            <GlassSelectTrigger className={cn(
              "w-full",
              !config?.isEnabled && "opacity-50"
            )}>
              <GlassSelectValue placeholder="Select frequency" />
            </GlassSelectTrigger>
            <GlassSelectContent>
              {cadenceOptions.map((option) => (
                <GlassSelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </GlassSelectItem>
              ))}
            </GlassSelectContent>
          </GlassSelect>
        </div>

        {config?.isEnabled && config?.nextGeneration && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 backdrop-blur-sm border border-violet-500/20">
            <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <div className="text-sm">
              <span className="text-muted-foreground">Next insight: </span>
              <span className="font-medium text-foreground">
                {formatNextGeneration(config.nextGeneration)}
              </span>
            </div>
          </div>
        )}

        {config?.lastGenerated && (
          <p className="text-xs text-muted-foreground">
            Last generated: {new Date(config.lastGenerated).toLocaleDateString()}
          </p>
        )}
      </div>
    </GlassCard>
  );
}
