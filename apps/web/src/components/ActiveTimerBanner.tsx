"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useLogs } from "@/context/log-context";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

/**
 * Persistent banner showing active sleep timer
 * Always visible at top of screen when baby is sleeping
 * One tap to go to sleep page and end timer
 */
export function ActiveTimerBanner() {
  const { babyStatus, lastStatusChange, setBabyStatus, setLastStatusChange } = useLogs();
  const [duration, setDuration] = useState("0m");
  const [isWaking, setIsWaking] = useState(false);


  useEffect(() => {
    if (babyStatus !== "Sleeping") return;

    const updateDuration = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastStatusChange.getTime()) / 1000);
      if (diff < 0) {
        setDuration("0m");
        return;
      }
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      
      if (hours > 0) {
        setDuration(`${hours}h ${mins}m`);
      } else if (mins > 0) {
        setDuration(`${mins}m ${secs}s`);
      } else {
        setDuration(`${secs}s`);
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [babyStatus, lastStatusChange]);

  const handleWake = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWaking) return;
    setIsWaking(true);
    
    try {
      const now = new Date();
      await api.sleep.create({
        startTime: lastStatusChange.toISOString(),
        endTime: now.toISOString(),
        sleepType: "nap",
      });
      
      setBabyStatus("Awake");
      setLastStatusChange(now);
      toast.success("Good morning! Sleep saved.");
    } catch (err) {
      console.error("Failed to save sleep:", err);
      toast.error("Failed to save. Tap again to retry.");
    } finally {
      setIsWaking(false);
    }
  };

  if (babyStatus !== "Sleeping") return null;

  return (
    <div className={cn(
      "w-full flex-shrink-0",
      "bg-gradient-to-r from-indigo-600 to-purple-600",
      "px-4 py-3 md:py-2",
      "flex items-center justify-between",
      "shadow-lg"
    )}>
      <Link href="/log/sleep" className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
          <Icons.Sleep className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-white/80 text-xs font-medium">Baby is sleeping</span>
          <span className="text-white font-bold text-lg tabular-nums">{duration}</span>
        </div>
      </Link>
      


      <Button 
        variant="ghost"
        onClick={handleWake}
        disabled={isWaking}
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 active:scale-95 rounded-full px-4 py-2 transition-all h-auto border-0 text-white hover:text-white"
      >
        <Icons.Sun className="w-4 h-4 text-white mr-2" />
        <span className="text-white text-sm font-medium">
          {isWaking ? "Saving..." : "Tap to wake"}
        </span>
      </Button>
    </div>
  );
}
