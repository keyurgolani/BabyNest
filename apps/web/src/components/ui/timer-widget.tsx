"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { NumberStepper } from "@/components/ui/number-stepper";
import { cn } from "@/lib/utils";
import { Play, Pause, Clock, RotateCcw } from "lucide-react";

export type TimerMode = "timer" | "manual" | "duration";

interface TimerWidgetProps {
  /** Current mode of the timer */
  mode: TimerMode;
  /** Callback when mode changes */
  onModeChange: (mode: TimerMode) => void;
  /** Timer state */
  isRunning: boolean;
  /** Timer elapsed seconds */
  elapsedSeconds: number;
  /** Callback when timer starts */
  onStart: () => void;
  /** Callback when timer pauses */
  onPause: () => void;
  /** Callback when timer stops/resets */
  onStop: () => void;
  /** Manual start time */
  startTime: Date;
  /** Callback when start time changes */
  onStartTimeChange: (date: Date) => void;
  /** Manual end time */
  endTime: Date;
  /** Callback when end time changes */
  onEndTimeChange: (date: Date) => void;
  /** Duration in minutes (for duration mode) */
  durationMinutes: number;
  /** Callback when duration changes */
  onDurationChange: (minutes: number) => void;
  /** Primary color for the timer (tailwind class) */
  accentColor?: string;
  /** Show hours in duration input */
  showHours?: boolean;
  /** Label for the widget */
  label?: string;
  /** Additional class name */
  className?: string;
}

export function TimerWidget({
  mode,
  onModeChange,
  isRunning,
  elapsedSeconds,
  onStart,
  onPause,
  onStop,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  durationMinutes,
  onDurationChange,
  accentColor = "bg-primary",
  showHours = true,
  label,
  className,
}: TimerWidgetProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateManualDuration = () => {
    const diffMs = endTime.getTime() - startTime.getTime();
    if (diffMs <= 0) return "0m";
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;
  };

  const modes: { key: TimerMode; label: string; icon: typeof Play }[] = [
    { key: "timer", label: "Timer", icon: Play },
    { key: "manual", label: "Manual", icon: Clock },
    { key: "duration", label: "Duration", icon: Clock },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => onModeChange(m.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
              mode === m.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer Mode */}
      {mode === "timer" && (
        <Card className="p-6 border-0 bg-gradient-to-br from-card to-muted/20">
          <div className="flex flex-col items-center space-y-6">
            {/* Timer Display */}
            <div className="relative">
              <div
                className={cn(
                  "w-40 h-40 rounded-full flex items-center justify-center",
                  "border-4 transition-all duration-300",
                  isRunning
                    ? `border-${accentColor.replace("bg-", "")} shadow-lg`
                    : "border-muted"
                )}
              >
                <div className="text-center">
                  <span className="text-4xl font-bold tabular-nums tracking-tight">
                    {formatTime(elapsedSeconds)}
                  </span>
                  <p
                    className={cn(
                      "text-xs font-medium uppercase tracking-widest mt-1",
                      isRunning ? "text-primary animate-pulse" : "text-muted-foreground"
                    )}
                  >
                    {isRunning ? "Running" : elapsedSeconds > 0 ? "Paused" : "Ready"}
                  </p>
                </div>
              </div>
              {isRunning && (
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
              )}
            </div>

            {/* Timer Controls */}
            <div className="flex gap-3">
              <Button
                onClick={isRunning ? onPause : onStart}
                size="lg"
                className={cn(
                  "h-14 px-8 rounded-2xl font-bold transition-all",
                  isRunning
                    ? "bg-card text-primary border-2 border-primary hover:bg-primary/10"
                    : `${accentColor} text-white shadow-lg`
                )}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" /> Start
                  </>
                )}
              </Button>

              {elapsedSeconds > 0 && (
                <Button
                  onClick={onStop}
                  variant="outline"
                  size="lg"
                  className="h-14 px-6 rounded-2xl"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Start Time
            </label>
            <TimeAgoPicker value={startTime} onChange={onStartTimeChange} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              End Time
            </label>
            <TimeAgoPicker value={endTime} onChange={onEndTimeChange} />
          </div>

          <div className="p-3 bg-primary/10 rounded-xl flex justify-between items-center">
            <span className="text-sm font-medium text-primary">Total Duration</span>
            <span className="text-xl font-bold text-primary">{calculateManualDuration()}</span>
          </div>
        </Card>
      )}

      {/* Duration Mode */}
      {mode === "duration" && (
        <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
          {showHours && (
            <div className="grid grid-cols-2 gap-4">
              <NumberStepper
                label="Hours"
                value={Math.floor(durationMinutes / 60)}
                onChange={(h) => onDurationChange(h * 60 + (durationMinutes % 60))}
                min={0}
                max={24}
                step={1}
              />
              <NumberStepper
                label="Minutes"
                value={durationMinutes % 60}
                onChange={(m) => onDurationChange(Math.floor(durationMinutes / 60) * 60 + m)}
                min={0}
                max={59}
                step={5}
              />
            </div>
          )}
          {!showHours && (
            <NumberStepper
              label="Duration (minutes)"
              value={durationMinutes}
              onChange={onDurationChange}
              min={0}
              max={480}
              step={5}
              unit="min"
            />
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              When did it happen?
            </label>
            <TimeAgoPicker value={startTime} onChange={onStartTimeChange} />
          </div>
        </Card>
      )}
    </div>
  );
}

// Hook for managing timer state
export function useTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTimestamp, setStartTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => {
    if (!startTimestamp) {
      setStartTimestamp(new Date());
    }
    setIsRunning(true);
  }, [startTimestamp]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setStartTimestamp(null);
  }, []);

  const reset = useCallback(() => {
    setElapsedSeconds(0);
    setStartTimestamp(new Date());
  }, []);

  return {
    isRunning,
    elapsedSeconds,
    startTimestamp,
    start,
    pause,
    stop,
    reset,
    setElapsedSeconds,
  };
}
