"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, Save, Clock, Baby, Bath, TreePine, Gamepad2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, ActivityType } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useLogs } from "@/context/log-context";
import { LogFormWrapper } from "@/components/log/log-form-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassTextarea } from "@/components/ui/glass-textarea";

/**
 * Activity Log Page
 *
 * Redesigned with glassmorphism components.
 *
 * @requirements 14.1 - Uses PageHeader with title and back navigation via LogFormWrapper
 * @requirements 14.2 - Uses GlassCard as form container
 * @requirements 14.3 - Uses GlassTextarea for notes field
 * @requirements 14.4 - Uses GlassButton for form submission
 * @requirements 14.5 - All form inputs meet minimum 48px touch target
 */

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
  const { activityTimer, startActivityTimer, clearActivityTimer } = useLogs();

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
  const canSave = showManualEntry || isTimerRunning || manualDuration > 0;

  return (
    <MobileContainer>
      <div className="p-4 pb-32">
        <LogFormWrapper
          title="Log Activity"
          backHref="/log"
          showCard={false}
        >
          <div className="space-y-6">
            {/* Activity Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITY_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = activityType === type.key;
                return (
                  <GlassCard
                    key={type.key}
                    interactive
                    variant={isActive ? "featured" : "default"}
                    size="default"
                    className={cn(
                      "flex flex-col items-center justify-center min-h-[120px] cursor-pointer",
                      isActive && `${type.bgColor} border-transparent text-white shadow-lg -translate-y-1`
                    )}
                    onClick={() => setActivityType(type.key)}
                  >
                    <Icon className={cn("w-8 h-8 mb-2", isActive ? "text-white" : type.color)} />
                    <span className="font-bold text-sm">{type.label}</span>
                    <span className={cn("text-xs mt-1", isActive ? "text-white/80" : "text-muted-foreground")}>
                      {type.description}
                    </span>
                  </GlassCard>
                );
              })}
            </div>

            {/* Mobile Toggle */}
            <GlassCard size="sm" className="flex p-1.5 md:hidden">
              <GlassButton
                variant={!showManualEntry ? "primary" : "ghost"}
                size="default"
                onClick={() => setShowManualEntry(false)}
                className={cn("flex-1 gap-2", !showManualEntry && activeConfig.bgColor)}
              >
                <Play className="w-4 h-4" />
                Timer
              </GlassButton>
              <GlassButton
                variant={showManualEntry ? "primary" : "ghost"}
                size="default"
                onClick={() => setShowManualEntry(true)}
                className={cn("flex-1 gap-2", showManualEntry && activeConfig.bgColor)}
              >
                <Clock className="w-4 h-4" />
                Manual
              </GlassButton>
            </GlassCard>

            {/* Desktop: Side by Side */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-6">
              <GlassCard size="lg" className="space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
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
                      <GlassButton variant="danger" size="default" onClick={handleStopTimer} disabled={isLoading} className="gap-1">
                        <Square className="w-4 h-4 fill-white" /> Stop
                      </GlassButton>
                    ) : (
                      <GlassButton variant="primary" size="default" onClick={handleStartTimer} className={cn("gap-1", activeConfig.bgColor)}>
                        <Play className="w-4 h-4" /> Start
                      </GlassButton>
                    )}
                    <GlassButton variant="default" size="default" onClick={handleResetTimer} disabled={timer === 0}>
                      Reset
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>

              <GlassCard size="lg" className="space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Clock className={cn("w-4 h-4", activeConfig.color)} />
                  Manual Entry
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</label>
                    <NumberStepper value={manualDuration} onChange={setManualDuration} min={1} max={180} step={5} unit="min" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">When</label>
                    <TimeAgoPicker value={manualTimestamp} onChange={setManualTimestamp} />
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Mobile: Timer View */}
            {!showManualEntry && (
              <div className="space-y-6 md:hidden">
                <div className="flex flex-col items-center">
                  <GlassCard
                    size="lg"
                    className={cn(
                      "rounded-full border-4 transition-colors duration-300 p-8",
                      isTimerRunning ? "border-primary/30" : "border-muted"
                    )}
                  >
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-muted/20" strokeWidth="6" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
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
                  </GlassCard>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {isTimerRunning ? (
                    <GlassButton variant="danger" size="lg" onClick={handleStopTimer} disabled={isLoading} className="h-16 text-lg gap-2">
                      <Square className="w-5 h-5 fill-white" /> Stop
                    </GlassButton>
                  ) : (
                    <GlassButton variant="primary" size="lg" onClick={handleStartTimer} className={cn("h-16 text-lg gap-2", activeConfig.bgColor)}>
                      <Play className="w-5 h-5" /> Start
                    </GlassButton>
                  )}
                  <GlassButton variant="default" size="lg" onClick={handleResetTimer} disabled={timer === 0} className="h-16 text-lg">
                    Reset
                  </GlassButton>
                </div>
              </div>
            )}

            {/* Mobile: Manual Entry View */}
            {showManualEntry && (
              <GlassCard size="lg" className="space-y-6 md:hidden">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration (minutes)</label>
                    <NumberStepper value={manualDuration} onChange={setManualDuration} min={1} max={180} step={5} unit="min" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">When</label>
                    <TimeAgoPicker value={manualTimestamp} onChange={setManualTimestamp} />
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="activity-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
              <GlassTextarea
                id="activity-notes"
                name="activity-notes"
                placeholder="Any details about this activity..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="min-h-[80px]"
              />
            </div>

            <div className="h-5" />
          </div>
        </LogFormWrapper>

        {/* Save Button */}
        <div className="fixed bottom-32 left-4 right-4 z-50">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isLoading || !canSave}
            className={cn("w-full h-16 rounded-full text-lg shadow-xl", activeConfig.bgColor)}
          >
            {isLoading ? "Saving..." : <><Save className="w-5 h-5 mr-2" /> Save {activeConfig.label}</>}
          </GlassButton>
        </div>
      </div>
    </MobileContainer>
  );
}
