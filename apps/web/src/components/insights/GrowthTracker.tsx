import React from "react";
import { TrendingUp, Ruler, Weight, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface GrowthMeasurement {
  date: string;
  weight?: number;
  height?: number;
  headCircumference?: number;
  weightPercentile?: number;
  heightPercentile?: number;
  headPercentile?: number;
}

interface GrowthTrackerProps {
  measurements: GrowthMeasurement[];
  babyAgeMonths: number;
}

export function GrowthTracker({ measurements, babyAgeMonths }: GrowthTrackerProps) {
  if (measurements.length === 0) {
    return (
      <Card className="p-6 border-0 bg-muted/30">
        <div className="text-center">
          <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
            <Ruler className="w-7 h-7 text-muted-foreground" />
          </div>
          <h4 className="font-semibold text-foreground mb-1">No Growth Data Yet</h4>
          <p className="text-sm text-muted-foreground">
            Start tracking weight, height, and head circumference to see growth trends.
          </p>
        </div>
      </Card>
    );
  }

  const latest = measurements[measurements.length - 1];
  const previous = measurements.length > 1 ? measurements[measurements.length - 2] : null;

  const getPercentileColor = (percentile?: number) => {
    if (!percentile) return "text-gray-500";
    if (percentile < 5 || percentile > 95) return "text-amber-600 dark:text-amber-400";
    return "text-green-600 dark:text-green-400";
  };

  const getPercentileLabel = (percentile?: number) => {
    if (!percentile) return "N/A";
    if (percentile < 5) return "Below 5th";
    if (percentile > 95) return "Above 95th";
    return `${percentile}th`;
  };

  const calculateChange = (current?: number, prev?: number) => {
    if (!current || !prev) return null;
    const change = current - prev;
    const percentage = ((change / prev) * 100).toFixed(1);
    return { change: change.toFixed(1), percentage };
  };

  const weightChange = calculateChange(latest.weight, previous?.weight);
  const heightChange = calculateChange(latest.height, previous?.height);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Growth Tracking</h3>
          <p className="text-xs text-muted-foreground">
            {babyAgeMonths} months old · Latest measurements
          </p>
        </div>
      </div>

      {/* Growth Cards */}
      <div className="grid grid-cols-1 gap-3">
        {/* Weight */}
        {latest.weight && (
          <Card className="p-4 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                  <Weight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Weight</div>
                  <div className="text-2xl font-bold text-foreground">
                    {latest.weight} <span className="text-sm font-normal">kg</span>
                  </div>
                  {weightChange && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      +{weightChange.change} kg ({weightChange.percentage}%)
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Percentile</div>
                <div className={cn("text-lg font-bold", getPercentileColor(latest.weightPercentile))}>
                  {getPercentileLabel(latest.weightPercentile)}
                </div>
              </div>
            </div>
            {/* Percentile Bar */}
            {latest.weightPercentile && (
              <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-800/50">
                <div className="relative h-2 bg-blue-200 dark:bg-blue-900/50 rounded-full">
                  <div
                    className="absolute h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${latest.weightPercentile}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 border-2 border-white dark:border-gray-900 rounded-full shadow-lg"
                    style={{ left: `${latest.weightPercentile}%`, transform: "translate(-50%, -50%)" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5th</span>
                  <span>50th</span>
                  <span>95th</span>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Height */}
        {latest.height && (
          <Card className="p-4 border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Height</div>
                  <div className="text-2xl font-bold text-foreground">
                    {latest.height} <span className="text-sm font-normal">cm</span>
                  </div>
                  {heightChange && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      +{heightChange.change} cm ({heightChange.percentage}%)
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Percentile</div>
                <div className={cn("text-lg font-bold", getPercentileColor(latest.heightPercentile))}>
                  {getPercentileLabel(latest.heightPercentile)}
                </div>
              </div>
            </div>
            {/* Percentile Bar */}
            {latest.heightPercentile && (
              <div className="mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-800/50">
                <div className="relative h-2 bg-purple-200 dark:bg-purple-900/50 rounded-full">
                  <div
                    className="absolute h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${latest.heightPercentile}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 border-2 border-white dark:border-gray-900 rounded-full shadow-lg"
                    style={{ left: `${latest.heightPercentile}%`, transform: "translate(-50%, -50%)" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5th</span>
                  <span>50th</span>
                  <span>95th</span>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Head Circumference */}
        {latest.headCircumference && (
          <Card className="p-4 border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                  <Circle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Head Circumference</div>
                  <div className="text-2xl font-bold text-foreground">
                    {latest.headCircumference} <span className="text-sm font-normal">cm</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Percentile</div>
                <div className={cn("text-lg font-bold", getPercentileColor(latest.headPercentile))}>
                  {getPercentileLabel(latest.headPercentile)}
                </div>
              </div>
            </div>
            {/* Percentile Bar */}
            {latest.headPercentile && (
              <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/50">
                <div className="relative h-2 bg-amber-200 dark:bg-amber-900/50 rounded-full">
                  <div
                    className="absolute h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${latest.headPercentile}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-600 border-2 border-white dark:border-gray-900 rounded-full shadow-lg"
                    style={{ left: `${latest.headPercentile}%`, transform: "translate(-50%, -50%)" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5th</span>
                  <span>50th</span>
                  <span>95th</span>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Growth Velocity Indicator */}
      {weightChange && (
        <Card className="p-4 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-sm font-semibold text-foreground">Healthy Growth Velocity</div>
              <p className="text-xs text-muted-foreground">
                Your baby is growing at a healthy rate. Keep up the great work!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
