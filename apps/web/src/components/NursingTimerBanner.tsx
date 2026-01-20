"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useLogs } from "@/context/log-context";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { ArrowLeftRight, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Persistent banner showing active nursing timer
 * Shows current side, duration, and controls to switch sides or stop
 */
export function NursingTimerBanner() {
  const { nursingTimer, switchNursingSide, clearNursingTimer } = useLogs();
  const [isSaving, setIsSaving] = useState(false);

  if (!nursingTimer?.isActive) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = nursingTimer.leftDuration + nursingTimer.rightDuration;
  const currentSideDuration = nursingTimer.currentSide === "left" 
    ? nursingTimer.leftDuration 
    : nursingTimer.rightDuration;

  const handleStop = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const timer = nursingTimer;
      if (!timer) return;

      await api.feedings.create({
        type: "breastfeeding",
        leftDuration: timer.leftDuration > 0 ? timer.leftDuration : undefined,
        rightDuration: timer.rightDuration > 0 ? timer.rightDuration : undefined,
        lastSide: timer.currentSide,
        timestamp: timer.startTime.toISOString(),
      });
      
      clearNursingTimer();
      toast.success("Nursing session saved!");
    } catch (err) {
      console.error("Failed to save nursing:", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    switchNursingSide();
    toast.success(`Switched to ${nursingTimer.currentSide === "left" ? "right" : "left"} side`);
  };

  return (
    <div className={cn(
      "w-full flex-shrink-0",
      "bg-gradient-to-r from-pink-500 to-rose-500",
      "px-4 py-3 md:py-2",
      "flex items-center justify-between gap-2",
      "shadow-lg"
    )}>
      <Link href="/log/feed" className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Icons.Feed className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-xs font-medium">Nursing</span>
            <span className={cn(
              "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
              nursingTimer.currentSide === "left" 
                ? "bg-white/30 text-white" 
                : "bg-white/30 text-white"
            )}>
              {nursingTimer.currentSide}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg tabular-nums">{formatTime(currentSideDuration)}</span>
            <span className="text-white/60 text-xs">({formatTime(totalDuration)} total)</span>
          </div>
        </div>
      </Link>
      


      <div className="flex items-center gap-2">
        <Button 
          variant="ghost"
          onClick={handleSwitch}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:scale-95 rounded-full px-3 py-2 transition-all h-auto border-0 text-white hover:text-white"
        >
          <ArrowLeftRight className="w-4 h-4 text-white mr-1.5" />
          <span className="text-white text-xs font-medium hidden sm:inline">Switch</span>
        </Button>
        
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
    </div>
  );
}
