"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api, VelocityResponse } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Weight, 
  Ruler, 
  Circle,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GrowthVelocityCardProps {
  className?: string;
}

export function GrowthVelocityCard({ className }: GrowthVelocityCardProps) {
  const { babyId } = useBaby();
  const [data, setData] = useState<VelocityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!babyId) {
      setLoading(false);
      return;
    }

    const fetchVelocity = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.growth.getVelocity();
        setData(response);
      } catch (err) {
        console.error("Failed to fetch growth velocity:", err);
        setError("Failed to load growth velocity");
      } finally {
        setLoading(false);
      }
    };

    fetchVelocity();
  }, [babyId]);

  if (loading) {
    return (
      <Card className={cn("p-4 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30", className)}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-4 border-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30", className)}>
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </Card>
    );
  }

  if (!data || data.measurementCount < 2) {
    return (
      <Card className={cn("p-4 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Growth Velocity</h3>
            <p className="text-xs text-muted-foreground">Track growth rate over time</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Add at least 2 growth measurements to see velocity data
        </p>
      </Card>
    );
  }

  const { summary, timeUnit } = data;
  const timeUnitLabel = timeUnit === 'week' ? 'week' : 'day';

  const getStatusColor = (value: number | null, type: 'weight' | 'height' | 'head') => {
    if (value === null) return "text-gray-500 bg-gray-100 dark:bg-gray-900/30";
    // Simple heuristic - positive growth is good
    if (value > 0) return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
    if (value < 0) return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30";
    return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
  };

  const getTrendIcon = (value: number | null) => {
    if (value === null) return <Minus className="w-4 h-4" />;
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <Card className={cn("p-4 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Growth Velocity</h3>
          <p className="text-xs text-muted-foreground">
            Based on {data.measurementCount} measurements • per {timeUnitLabel}
          </p>
        </div>
      </div>

      {/* Velocity Metrics */}
      <div className="space-y-3">
        {/* Weight Velocity */}
        <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-foreground">Weight Gain</span>
            </div>
            <Badge className={cn("text-xs border-0", getStatusColor(summary.averageWeightVelocity, 'weight'))}>
              {getTrendIcon(summary.averageWeightVelocity)}
              <span className="ml-1">{summary.averageWeightVelocity !== null && summary.averageWeightVelocity > 0 ? 'Growing' : 'Stable'}</span>
            </Badge>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {summary.averageWeightVelocity !== null ? Math.round(summary.averageWeightVelocity) : "N/A"}
                <span className="text-sm font-normal ml-1">g/{timeUnitLabel}</span>
              </p>
              {summary.totalWeightChange !== null && (
                <p className="text-xs text-muted-foreground">
                  Total: {summary.totalWeightChange > 0 ? '+' : ''}{Math.round(summary.totalWeightChange)}g
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Height Velocity */}
        <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-foreground">Height Growth</span>
            </div>
            <Badge className={cn("text-xs border-0", getStatusColor(summary.averageHeightVelocity, 'height'))}>
              {getTrendIcon(summary.averageHeightVelocity)}
              <span className="ml-1">{summary.averageHeightVelocity !== null && summary.averageHeightVelocity > 0 ? 'Growing' : 'Stable'}</span>
            </Badge>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {summary.averageHeightVelocity !== null ? (summary.averageHeightVelocity / 10).toFixed(1) : "N/A"}
                <span className="text-sm font-normal ml-1">cm/{timeUnitLabel}</span>
              </p>
              {summary.totalHeightChange !== null && (
                <p className="text-xs text-muted-foreground">
                  Total: {summary.totalHeightChange > 0 ? '+' : ''}{(summary.totalHeightChange / 10).toFixed(1)}cm
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Head Circumference Velocity */}
        <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-foreground">Head Growth</span>
            </div>
            <Badge className={cn("text-xs border-0", getStatusColor(summary.averageHeadCircumferenceVelocity, 'head'))}>
              {getTrendIcon(summary.averageHeadCircumferenceVelocity)}
              <span className="ml-1">{summary.averageHeadCircumferenceVelocity !== null && summary.averageHeadCircumferenceVelocity > 0 ? 'Growing' : 'Stable'}</span>
            </Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {summary.averageHeadCircumferenceVelocity !== null ? (summary.averageHeadCircumferenceVelocity / 10).toFixed(1) : "N/A"}
              <span className="text-sm font-normal ml-1">cm/{timeUnitLabel}</span>
            </p>
            {summary.totalHeadCircumferenceChange !== null && (
              <p className="text-xs text-muted-foreground">
                Total: {summary.totalHeadCircumferenceChange > 0 ? '+' : ''}{(summary.totalHeadCircumferenceChange / 10).toFixed(1)}cm
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Overall Assessment */}
      <div className="mt-4 p-3 rounded-xl bg-green-100/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          <p className="text-sm text-foreground font-medium">Growth Summary</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.measurementCount} measurements tracked. {data.unitDescription}
        </p>
      </div>
    </Card>
  );
}
