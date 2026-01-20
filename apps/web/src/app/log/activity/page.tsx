"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Play, Pause, Save, Clock, Baby, Bath, TreePine, Gamepad2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, ActivityType } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useLogs } from "@/context/log-context";

// Activity type configuration
const ACTIVITY_TYPES: { key: ActivityType; label: string; icon: typeof Baby; color: string; bgColor: string; description: string }[] = [
  { key: "tummy_time", label: "Tummy Time", icon: Baby, color: "text-pink-500", bgColor: "bg-pink-500", description: "Strengthen muscles" },
  { key: "bath", label: "Bath", icon: Bath, color: "text-cyan-500", bgColor: "bg-cyan-500", description: "Bath time" },
  { key: "outdoor", label: "Outdoor", icon: TreePine, color: "text-green-500", bgColor: "bg-green-500", description: "Outside activities" },
  { key: "play", label: "Play", icon: Gamepad2, color: "text-amber-500", bgColor: "bg-amber-500", description: "Play time" },
];

export default function ActivityLogPage() {
  return (
    <Suspense fallback={<ActivityPageLoading />}>
      <ActivityLogPageContent />
    </Suspense>
  );
}

function ActivityPageLoading() {
  return (
    <MobileContainer>
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-lg w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    </MobileContainer>
  );
}

function ActivityLogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") as ActivityType | null;
  
  // Context timer
  const { activityTimer, startActivityTimer, stopActivityTimer, clearActivityTimer } = useLogs();

  // State
  const [activityType, setActivityType] = useState<ActivityType>(initialType || activityTimer?.activityType || "tummy_time");
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState(activityTimer?.notes || "");

  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualDuration, setManualDuration] = useState(15);
  const [manualTimestamp, setManualTimestamp] = useState<Date>(new Date());

  // Sync activity type with active timer
  useEffect(() => {
    if (activityTimer?.isActive) {
      setActivityType(activityTimer.activityType);
    }
  }, [activityTimer?.isActive, activityTimer?.activityType]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = () => {
    startActivityTimer(activityType, notes.trim() || undefined);
  };

  const handleStopTimer = async () => {
    if (!activityTimer) return;
    
    setIsLoading(true);
    try {
      const timer = activityTimer;
      const now = new Date();
      
      await api.activities.create({
        activityType: timer.activityType,
        startTime: timer.startTime.toISOString(),
        endTime: now.toISOString(),
        duration: Math.ceil(timer.duration / 60),
        notes: notes.trim() || timer.notes || undefined,
      });
      
      clearActivityTimer();
      toast.success(`${ACTIVITY_TYPES.find(t => t.key === timer.activityType)?.label} logged!`);
      router.push("/");
    } catch (err) {
      console.error("Failed to save activity:", err);
      toast.error("Failed to save activity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetTimer = () => {
    clearActivityTimer();
  };

  const handleSaveManual = async () => {
    setIsLoading(true);

    try {
      await api.activities.create({
        activityType,
        duration: manualDuration,
        startTime: manualTimestamp.toISOString(),
        notes: notes.trim() || undefined,
      });

      toast.success(`${ACTIVITY_TYPES.find(t => t.key === activityType)?.label} logged!`);
      router.push("/");
    } catch (err) {
      console.error("Failed to save activity:", err);
      toast.error("Failed to save activity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Use manual entry if explicitly selected (mobile) OR if timer hasn't been used (desktop with manual duration)
    const useManualEntry = showManualEntry || !activityTimer?.isActive;
    
    if (useManualEntry) {
      await handleSaveManual();
    } else {
      await handleStopTimer();
    }
  };

  const activeConfig = ACTIVITY_TYPES.find(t => t.key === activityType)!;
  const isTimerRunning = activityTimer?.isActive && activityTimer.activityType === activityType;
  const timer = isTimerRunning ? activityTimer.duration : 0;
  // On desktop, both timer and manual entry are visible, so allow save if either has data
  // On mobile, only allow save based on the active mode
  const canSave = showManualEntry || isTimerRunning || manualDuration > 0;

  return (
    <MobileContainer>
      <div className="p-4 space-y-6 animate-slide-up pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/log" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Log Activity</h1>
        </div>

        {/* Activity Type Selection */}
        <div className="grid grid-cols-2 gap-3">
          {ACTIVITY_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = activityType === type.key;
            return (
              <button
                key={type.key}
                onClick={() => setActivityType(type.key)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 border-2",
                  isActive
                    ? `${type.bgColor} border-transparent text-white shadow-lg -translate-y-1`
                    : "bg-card border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className={cn("w-8 h-8 mb-2", isActive ? "text-white" : type.color)} />
                <span className="font-bold text-sm">{type.label}</span>
                <span className={cn("text-xs mt-1", isActive ? "text-white/80" : "text-muted-foreground")}>
                  {type.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Toggle */}
        <div className="flex bg-muted/50 rounded-2xl p-1.5 md:hidden">
          <button
            onClick={() => setShowManualEntry(false)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
              !showManualEntry ? `${activeConfig.bgColor} text-white shadow-lg` : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Play className="w-4 h-4" />
            Timer
          </button>
          <button
            onClick={() => setShowManualEntry(true)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
              showManualEntry ? `${activeConfig.bgColor} text-white shadow-lg` : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="w-4 h-4" />
            Manual
          </button>
        </div>

        {/* Desktop: Side by Side */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-6">
          {/* Timer Card */}
          <Card className="p-6 border-0 bg-gradient-to-br from-card to-muted/20">
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <Play className={cn("w-4 h-4", activeConfig.color)} />
              Live Timer
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-muted/20" strokeWidth="6" stroke="currentColor" fill="transparent" r="44" cx="50" cy="50" />
                    <circle 
                      className={cn("transition-all duration-1000 ease-linear", activeConfig.color)} 
                      strokeWidth="6" 
                      strokeDasharray={276}
                      strokeDashoffset={276 - (276 * (timer % 60) / 60)}
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="44" cx="50" cy="50" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-heading font-black text-foreground tabular-nums">
                      {formatTime(timer)}
                    </span>
                    <span className={cn("text-xs font-bold uppercase tracking-widest", isTimerRunning ? `${activeConfig.color} animate-pulse` : "text-muted-foreground")}>
                      {isTimerRunning ? "Recording" : "Ready"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {isTimerRunning ? (
                  <Button onClick={handleStopTimer} size="sm" disabled={isLoading} className="h-10 font-bold rounded-xl text-white bg-red-500 hover:bg-red-600">
                    <Square className="w-4 h-4 mr-1 fill-white" /> Stop
                  </Button>
                ) : (
                  <Button onClick={handleStartTimer} size="sm" className={cn("h-10 font-bold rounded-xl text-white", activeConfig.bgColor, `hover:${activeConfig.bgColor}/90`)}>
                    <Play className="w-4 h-4 mr-1" /> Start
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleResetTimer} disabled={timer === 0} className="h-10 font-bold rounded-xl">
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Manual Entry Card */}
          <Card className="p-6 border-0 bg-gradient-to-br from-card to-muted/20">
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <Clock className={cn("w-4 h-4", activeConfig.color)} />
              Manual Entry
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</label>
                <NumberStepper
                  value={manualDuration}
                  onChange={setManualDuration}
                  min={1}
                  max={180}
                  step={5}
                  unit="min"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">When</label>
                <TimeAgoPicker value={manualTimestamp} onChange={setManualTimestamp} />
              </div>
            </div>
          </Card>
        </div>

        {/* Mobile: Timer View */}
        {!showManualEntry && (
          <div className="space-y-6 md:hidden">
            {/* Visual Timer */}
            <div className="flex flex-col items-center">
              <Card className={cn(
                "p-8 rounded-full border-4 transition-colors duration-300",
                isTimerRunning ? `border-${activeConfig.color.replace('text-', '')}/30` : "border-muted"
              )}>
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      className="text-muted/20" 
                      strokeWidth="6" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="46" cx="50" cy="50" 
                    />
                    <circle
                      className={cn("transition-all duration-1000 ease-linear", activeConfig.color)}
                      strokeWidth="6"
                      strokeDasharray={289}
                      strokeDashoffset={289 - (289 * (timer % 60) / 60)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="46" cx="50" cy="50"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-heading font-black text-foreground tabular-nums tracking-tighter">
                      {formatTime(timer)}
                    </span>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-widest mt-1",
                      isTimerRunning ? `${activeConfig.color} animate-pulse` : "text-muted-foreground"
                    )}>
                      {isTimerRunning ? "Recording" : "Ready"}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Timer Controls */}
            <div className="grid grid-cols-2 gap-4">
              {isTimerRunning ? (
                <Button
                  onClick={handleStopTimer}
                  size="lg"
                  disabled={isLoading}
                  className="h-16 text-lg font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Square className="w-5 h-5 mr-2 fill-white" /> Stop
                </Button>
              ) : (
                <Button
                  onClick={handleStartTimer}
                  size="lg"
                  className={cn(
                    "h-16 text-lg font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95",
                    `${activeConfig.bgColor} text-white shadow-${activeConfig.color.replace('text-', '')}/25`
                  )}
                >
                  <Play className="w-5 h-5 mr-2" /> Start
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleResetTimer}
                disabled={timer === 0}
                className="h-16 text-lg font-bold rounded-2xl border-2"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {/* Mobile: Manual Entry View */}
        {showManualEntry && (
          <Card className="p-6 space-y-6 border-0 bg-gradient-to-br from-card to-muted/20 md:hidden">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Duration (minutes)
                </label>
                <NumberStepper
                  value={manualDuration}
                  onChange={setManualDuration}
                  min={1}
                  max={180}
                  step={5}
                  unit="min"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  When
                </label>
                <TimeAgoPicker value={manualTimestamp} onChange={setManualTimestamp} />
              </div>
            </div>
          </Card>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="activity-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
          <textarea
            id="activity-notes"
            name="activity-notes"
            className="w-full rounded-2xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 p-4 text-sm resize-none outline-none transition-all placeholder:text-muted-foreground/50"
            placeholder="Any details about this activity..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <Button
            onClick={handleSave}
            disabled={isLoading || !canSave}
            className={cn(
              "w-full h-16 rounded-full text-lg font-bold shadow-xl text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50",
              activeConfig.bgColor
            )}
          >
            {isLoading ? "Saving..." : <><Save className="w-5 h-5 mr-2" /> Save {activeConfig.label}</>}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
