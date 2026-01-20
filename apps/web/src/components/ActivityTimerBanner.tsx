"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLogs } from "@/context/log-context";
import Link from "next/link";
import { toast } from "sonner";
import { api, ActivityType } from "@/lib/api-client";
import { Square, Baby, Bath, TreePine, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Activity type configuration
const ACTIVITY_CONFIG: Record<ActivityType, { 
  label: string; 
  icon: typeof Baby; 
  gradient: string;
}> = {
  tummy_time: { label: "Tummy Time", icon: Baby, gradient: "from-pink-500 to-rose-500" },
  bath: { label: "Bath", icon: Bath, gradient: "from-cyan-500 to-teal-500" },
  outdoor: { label: "Outdoor", icon: TreePine, gradient: "from-green-500 to-emerald-500" },
  play: { label: "Play", icon: Gamepad2, gradient: "from-amber-500 to-orange-500" },
};

/**
 * Persistent banner showing active activity timer
 * Shows activity type, duration, and stop button
 */
export function ActivityTimerBanner() {
  const { activityTimer, clearActivityTimer } = useLogs();
  const [isSaving, setIsSaving] = useState(false);

  if (!activityTimer?.isActive) return null;

  const config = ACTIVITY_CONFIG[activityTimer.activityType];
  const Icon = config.icon;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const timer = activityTimer;
      if (!timer) return;

      const now = new Date();
      await api.activities.create({
        activityType: timer.activityType,
        startTime: timer.startTime.toISOString(),
        endTime: now.toISOString(),
        duration: Math.ceil(timer.duration / 60),
        notes: timer.notes || undefined,
      });
      
      clearActivityTimer();
      toast.success(`${config.label} saved!`);
    } catch (err) {
      console.error("Failed to save activity:", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn(
      "w-full flex-shrink-0",
      `bg-gradient-to-r ${config.gradient}`,
      "px-4 py-3 md:py-2",
      "flex items-center justify-between gap-2",
      "shadow-lg"
    )}>
      <Link href="/log/activity" className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white/80 text-xs font-medium">{config.label}</span>
          <span className="text-white font-bold text-lg tabular-nums">{formatTime(activityTimer.duration)}</span>
        </div>
      </Link>
      


      <Button 
        variant="ghost"
        onClick={handleStop}
        disabled={isSaving}
        className="flex items-center gap-1.5 bg-white/30 hover:bg-white/40 active:scale-95 rounded-full px-3 py-2 transition-all h-auto border-0 text-white hover:text-white"
      >
        <Square className="w-4 h-4 text-white fill-white mr-1.5" />
        <span className="text-white text-xs font-medium">
          {isSaving ? "..." : "Stop"}
        </span>
      </Button>
    </div>
  );
}
