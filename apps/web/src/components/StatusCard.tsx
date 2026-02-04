"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun } from "lucide-react";
import Image from "next/image";

interface StatusCardProps {
  status: "Sleeping" | "Awake";
  duration: string; // "2h 15m" etc
  lastActivityTime?: string;
  lastActivityLabel?: string;
}

export function StatusCard({ status, duration, lastActivityTime, lastActivityLabel }: StatusCardProps) {
  const isSleeping = status === "Sleeping";
  
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-6 transition-all duration-500",
      isSleeping 
        ? "bg-gradient-to-br from-[var(--color-sleep-dark)] via-[var(--color-sleep-dark-mid)] to-[var(--color-sleep-dark-deep)] text-white shadow-[0_8px_32px_-8px_rgba(90,123,154,0.4),0_0_0_1px_rgba(126,184,218,0.1)]" 
        : "bg-gradient-to-br from-[var(--color-awake-light)] via-[var(--color-awake-mid)] to-[var(--color-awake-warm)] text-[var(--color-awake-text)] shadow-[0_8px_32px_-8px_rgba(244,162,97,0.25),0_0_0_1px_rgba(244,162,97,0.1)]"
    )}>
      {/* Aurora glow orbs */}
      <div className={cn(
        "absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60",
        isSleeping ? "bg-[var(--color-sleep-accent)]/30" : "bg-[var(--color-feed)]/20"
      )} />
      <div className={cn(
        "absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 opacity-50",
        isSleeping ? "bg-[var(--color-sleep)]/20" : "bg-[var(--color-play)]/20"
      )} />
      <div className={cn(
        "absolute top-1/2 left-1/2 w-32 h-32 rounded-full blur-xl -translate-x-1/2 -translate-y-1/2 opacity-40",
        isSleeping ? "bg-white/10" : "bg-white/30"
      )} />
      
      <div className="relative z-10 flex flex-col items-center text-center gap-4">
        {/* Status Badge with glow */}
        <Badge variant="secondary" className={cn(
          "px-4 py-1.5 text-sm font-medium rounded-full backdrop-blur-md border-0",
          isSleeping 
            ? "bg-[var(--color-sleep-accent)]/30 text-white shadow-[0_0_20px_rgba(126,184,218,0.3)]" 
            : "bg-white/60 text-[var(--color-awake-muted)] shadow-[0_0_20px_rgba(244,162,97,0.2)]"
        )}>
          {isSleeping ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
          {isSleeping ? "Sweet Dreams" : "Wide Awake"}
        </Badge>
        
        {/* Timer with text shadow */}
        <div className="flex flex-col items-center">
            <span className={cn(
                "text-6xl font-black tracking-tight tabular-nums",
                isSleeping 
                  ? "text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]" 
                  : "text-[var(--color-awake-text)] drop-shadow-[0_2px_10px_rgba(244,162,97,0.2)]"
            )}>
                {duration}
            </span>
            <span className={cn(
                "text-sm font-medium opacity-80 mt-1",
                 isSleeping ? "text-[var(--color-sleep-light)]" : "text-[var(--color-awake-muted)]"
            )}>
                Current Session
            </span>
        </div>

        {/* Baby Avatar/Icon with glow ring */}
        <div className={cn(
          "w-20 h-20 rounded-full border-4 overflow-hidden mt-2 relative",
          isSleeping 
            ? "border-white/30 shadow-[0_0_30px_rgba(126,184,218,0.4)]" 
            : "border-white/50 shadow-[0_0_30px_rgba(244,162,97,0.3)]"
        )}>
             <Image
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Liam"
              alt="Baby"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              loading="eager"
            />
            {/* Status indicator dot with glow */}
             <div className={cn(
                 "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white",
                 isSleeping 
                   ? "bg-[var(--color-sleep-accent)] shadow-[0_0_12px_rgba(126,184,218,0.6)]" 
                   : "bg-[var(--color-awake-indicator)] shadow-[0_0_12px_rgba(168,213,186,0.6)]"
             )} />
        </div>

        {/* Previous Activity Info with soft background */}
        {lastActivityTime && (
            <div className={cn(
                "mt-2 text-xs font-medium px-4 py-2 rounded-xl backdrop-blur-sm",
                 isSleeping 
                   ? "bg-white/10 text-[var(--color-sleep-light)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" 
                   : "bg-white/40 text-[var(--color-awake-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
            )}>
                Last: {lastActivityLabel} @ {lastActivityTime}
            </div>
        )}
      </div>
    </div>
  );
}
