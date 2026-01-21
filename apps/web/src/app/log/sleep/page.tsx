"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Moon, Save, Sun, Clock, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogs } from "@/context/log-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, SleepType, SleepQuality } from "@/lib/api-client";
import { MobileContainer } from "@/components/layout/mobile-container";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";

const SLEEP_TYPES: { key: SleepType; label: string; icon: typeof Sun }[] = [
  { key: "nap", label: "Nap", icon: Sun },
  { key: "night", label: "Night Sleep", icon: Moon },
];

const SLEEP_QUALITIES: { key: SleepQuality; label: string; emoji: string }[] = [
  { key: "good", label: "Good", emoji: "😊" },
  { key: "fair", label: "Fair", emoji: "😐" },
  { key: "poor", label: "Poor", emoji: "😔" },
];

export default function SleepLogPage() {
  const { babyStatus, setBabyStatus, setLastStatusChange } = useLogs();
  const [timer, setTimer] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [stoppedTimer, setStoppedTimer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [sleepType, setSleepType] = useState<SleepType>("nap");
  const [quality, setQuality] = useState<SleepQuality | null>(null);
  const [notes, setNotes] = useState("");

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualStartTime, setManualStartTime] = useState<Date>(new Date(Date.now() - 60 * 60 * 1000));
  const [manualEndTime, setManualEndTime] = useState<Date>(new Date());
  
  const router = useRouter();
  const isSleeping = babyStatus === 'Sleeping';
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSleeping) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSleeping]);

  const startSleep = () => {
    setTimer(0);
    setStoppedTimer(null);
    setStartTime(new Date());
    setBabyStatus('Sleeping');
    setLastStatusChange(new Date());
    toast.success("Sleep started!");
  };

  const stopSleep = () => {
    setStoppedTimer(timer);
    setBabyStatus('Awake');
    toast.info("Sleep stopped. You can save the log now.");
  };

  const displayTimer = stoppedTimer !== null ? stoppedTimer : timer;
  const hasStoppedData = stoppedTimer !== null && stoppedTimer > 0;

  const saveSleepFromTimer = async () => {
    const timerToSave = stoppedTimer !== null ? stoppedTimer : timer;
    
    // On desktop, if timer hasn't been used, fall back to manual entry
    if (timerToSave === 0 && !isSleeping) {
      // Check if manual entry has valid data
      if (manualEndTime > manualStartTime) {
        await saveManualEntry();
        return;
      }
      toast.error("No sleep data to save.");
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const sleepStart = startTime || new Date(now.getTime() - timerToSave * 1000);
      const sleepEnd = stoppedTimer !== null ? new Date(sleepStart.getTime() + stoppedTimer * 1000) : now;
      
      await api.sleep.create({
        startTime: sleepStart.toISOString(),
        endTime: sleepEnd.toISOString(),
        sleepType,
        quality: quality || undefined,
        notes: notes.trim() || undefined,
      });
      
      setBabyStatus('Awake');
      setLastStatusChange(now);
      setStoppedTimer(null);
      setTimer(0);
      toast.success("Sleep saved!");
      router.push('/');
    } catch (err) {
      console.error("Failed to save sleep:", err);
      toast.error("Failed to save sleep. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveManualEntry = async () => {
    if (manualEndTime <= manualStartTime) {
      toast.error("End time must be after start time.");
      return;
    }

    setIsLoading(true);
    try {
      await api.sleep.create({
        startTime: manualStartTime.toISOString(),
        endTime: manualEndTime.toISOString(),
        sleepType,
        quality: quality || undefined,
        notes: notes.trim() || undefined,
      });
      
      toast.success("Sleep log saved.");
      router.push('/');
    } catch (err) {
      console.error("Failed to save sleep:", err);
      toast.error("Failed to save sleep. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatTimeShort = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const manualDuration = () => {
    const diffMs = manualEndTime.getTime() - manualStartTime.getTime();
    if (diffMs <= 0) return "0m";
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;
  };

  return (
    <MobileContainer>
      <div className="p-4 space-y-6 animate-slide-up pb-32">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Log Sleep</h1>
        </div>

        <div className="flex bg-muted/50 rounded-2xl p-1.5 md:hidden">
          <button
            onClick={() => setShowManualEntry(false)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
              !showManualEntry ? "bg-indigo-500 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Play className="w-4 h-4" />
            Timer
          </button>
          <button
            onClick={() => setShowManualEntry(true)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
              showManualEntry ? "bg-indigo-500 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="w-4 h-4" />
            Manual
          </button>
        </div>

        <div className="hidden md:grid md:grid-cols-2 md:gap-6">
          <Card className="p-6 border-0 bg-gradient-to-br from-card to-muted/20">
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-500" />
              Live Timer
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-muted/20" strokeWidth="6" stroke="currentColor" fill="transparent" r="44" cx="50" cy="50" />
                    <circle 
                      className="text-indigo-500 transition-all duration-1000 ease-linear" 
                      strokeWidth="6" 
                      strokeDasharray={276}
                      strokeDashoffset={276 - (276 * (displayTimer % 60) / 60)}
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="44" cx="50" cy="50" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-heading font-black text-foreground tabular-nums">
                      {formatTimeShort(displayTimer)}
                    </span>
                    <span className={cn("text-xs font-bold uppercase tracking-widest", isSleeping ? "text-indigo-500 animate-pulse" : hasStoppedData ? "text-green-500" : "text-muted-foreground")}>
                      {isSleeping ? "Sleeping" : hasStoppedData ? "Stopped" : "Ready"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={startSleep} size="sm" disabled={isSleeping} className="h-10 font-bold rounded-xl bg-indigo-500 text-white hover:bg-indigo-600">
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
                <Button variant="outline" size="sm" onClick={stopSleep} disabled={!isSleeping} className="h-10 font-bold rounded-xl text-red-500 border-red-500/50 hover:bg-red-50 dark:hover:bg-red-950">
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 bg-gradient-to-br from-card to-muted/20">
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Manual Entry
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Started</label>
                <TimeAgoPicker value={manualStartTime} onChange={setManualStartTime} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ended</label>
                <TimeAgoPicker value={manualEndTime} onChange={setManualEndTime} />
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl flex justify-between items-center">
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Duration</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{manualDuration()}</span>
              </div>
            </div>
          </Card>
        </div>

        {!showManualEntry && (
          <div className="space-y-6 md:hidden">
            <div className="flex flex-col items-center justify-center py-4">
              <div className={cn(
                "relative w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl",
                isSleeping ? "bg-indigo-600 shadow-indigo-500/40 scale-105" : hasStoppedData ? "bg-green-600 shadow-green-500/40" : "bg-card border-4 border-dashed border-muted-foreground/20"
              )}>
                {isSleeping ? (
                  <>
                    <Moon className="w-16 h-16 text-white mb-2 animate-pulse duration-[3s]" strokeWidth={1.5} />
                    <span className="text-2xl font-heading font-bold text-white tabular-nums tracking-tight">{formatTime(displayTimer)}</span>
                    <span className="text-xs text-indigo-200 mt-2 font-medium uppercase tracking-widest">Sleeping</span>
                  </>
                ) : hasStoppedData ? (
                  <>
                    <Moon className="w-16 h-16 text-white mb-2" strokeWidth={1.5} />
                    <span className="text-2xl font-heading font-bold text-white tabular-nums tracking-tight">{formatTime(displayTimer)}</span>
                    <span className="text-xs text-green-200 mt-2 font-medium uppercase tracking-widest">Ready to save</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-16 h-16 text-amber-400 mb-2" strokeWidth={1.5} />
                    <span className="text-lg font-heading font-bold text-foreground">Baby&apos;s Awake</span>
                    <span className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">Tap Start below</span>
                  </>
                )}
                {isSleeping && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 animate-ping duration-[2s]" />
                    <div className="absolute inset-0 rounded-full border border-indigo-300/20 animate-ping duration-[3s] delay-75" />
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={startSleep} disabled={isSleeping} className="h-14 font-bold rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg">
                <Play className="w-5 h-5 mr-2" />
                Start
              </Button>
              <Button variant="outline" onClick={stopSleep} disabled={!isSleeping} className="h-14 font-bold rounded-2xl text-red-500 border-2 border-red-500/50 hover:bg-red-50 dark:hover:bg-red-950">
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </div>
          </div>
        )}

        {showManualEntry && (
          <Card className="p-6 space-y-5 border-0 bg-gradient-to-br from-card to-muted/20 animate-fade-in md:hidden">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Started</label>
              <TimeAgoPicker value={manualStartTime} onChange={setManualStartTime} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ended</label>
              <TimeAgoPicker value={manualEndTime} onChange={setManualEndTime} />
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl flex justify-between items-center">
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Total Duration</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{manualDuration()}</span>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          <label htmlFor="sleep-type-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
          <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="sleep-type-select">
            {SLEEP_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button key={type.key} onClick={() => setSleepType(type.key)} className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-200 border-2",
                  sleepType === type.key ? "bg-indigo-500 border-transparent text-white shadow-lg shadow-indigo-500/25" : "bg-card border-transparent text-muted-foreground hover:bg-muted"
                )}>
                  <Icon className="w-5 h-5" />
                  <span className="font-bold">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="sleep-quality-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quality</label>
          <div className="flex justify-between gap-2" role="group" aria-labelledby="sleep-quality-select">
            {SLEEP_QUALITIES.map((q) => (
              <button key={q.key} onClick={() => setQuality(q.key)} className={cn(
                "flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                quality === q.key ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500" : "bg-muted/50 hover:bg-muted text-muted-foreground"
              )}>
                <span className="text-2xl">{q.emoji}</span>
                <span className="text-xs font-bold uppercase">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="sleep-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
          <textarea
            id="sleep-notes"
            name="sleep-notes"
            placeholder="How was the sleep?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-2xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 p-4 text-sm resize-none outline-none transition-all placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Spacer for fixed button */}
        <div className="h-5" />

        <div className="fixed bottom-32 left-4 right-4 z-50">
          <Button
            onClick={showManualEntry ? saveManualEntry : saveSleepFromTimer}
            disabled={isLoading}
            className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-indigo-500/25 bg-indigo-500 hover:bg-indigo-600 text-white transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading ? "Saving..." : isSleeping ? (
              <><Sun className="w-6 h-6 mr-2" strokeWidth={2.5} /> Wake Up & Save</>
            ) : (
              <><Save className="w-5 h-5 mr-2" /> Save Sleep</>
            )}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
