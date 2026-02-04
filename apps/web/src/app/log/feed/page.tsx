"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, Play, Pause, Save, Clock, Utensils, Droplets, Baby, Milk, Lightbulb } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { api, FeedingType, BottleType, PumpSide, FeedingSuggestionResponse } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useLogs } from "@/context/log-context";
import { AgeWarning } from "@/components/common/AgeWarning";
import { LogFormWrapper } from "@/components/log/log-form-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassTextarea } from "@/components/ui/glass-textarea";

/**
 * Feed Log Page
 *
 * Redesigned with glassmorphism components.
 *
 * @requirements 14.1 - Uses PageHeader with title and back navigation via LogFormWrapper
 * @requirements 14.2 - Uses GlassCard as form container
 * @requirements 14.3 - Uses GlassInput for text inputs
 * @requirements 14.4 - Uses GlassButton for submit/cancel actions
 * @requirements 14.5 - Ensures 48px minimum touch targets
 * @requirements 14.6 - Maintains existing form functionality
 */

type Unit = "ml" | "oz";

// Feeding type tabs
const FEEDING_TYPES: { key: FeedingType; label: string; icon: typeof Baby; color: string; bgColor: string }[] = [
  { key: "breastfeeding", label: "Nursing", icon: Baby, color: "text-pink-500", bgColor: "bg-pink-500" },
  { key: "bottle", label: "Bottle", icon: Milk, color: "text-blue-500", bgColor: "bg-blue-500" },
  { key: "pumping", label: "Pump", icon: Droplets, color: "text-purple-500", bgColor: "bg-purple-500" },
  { key: "solid", label: "Solid", icon: Utensils, color: "text-green-500", bgColor: "bg-green-500" },
];

// Bottle type options
const BOTTLE_TYPES: { value: BottleType; label: string; emoji: string }[] = [
  { value: "breastMilk", label: "Breast Milk", emoji: "🤱" },
  { value: "formula", label: "Formula", emoji: "🍼" },
  { value: "water", label: "Water", emoji: "💧" },
];

// Pump side options
const PUMP_SIDES: { value: PumpSide; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "both", label: "Both" },
];

export default function FeedLogPage() {
  return (
    <Suspense fallback={<FeedPageLoading />}>
      <FeedLogPageContent />
    </Suspense>
  );
}

function FeedPageLoading() {
  return (
    <MobileContainer>
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-10 bg-[var(--glass-bg)] rounded-lg w-1/3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-[var(--glass-bg)] rounded-2xl flex-1" />
          ))}
        </div>
        <div className="h-64 bg-[var(--glass-bg)] rounded-full mx-auto w-64" />
      </div>
    </MobileContainer>
  );
}

function FeedLogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { nursingTimer, startNursingTimer, switchNursingSide, stopNursingTimer, clearNursingTimer } = useLogs();
  
  // Get initial type from URL param (supports: breastfeeding, bottle, pumping, solid)
  const typeParam = searchParams.get("type") as FeedingType | null;
  const validTypes: FeedingType[] = ["breastfeeding", "bottle", "pumping", "solid"];
  const initialType = typeParam && validTypes.includes(typeParam) ? typeParam : "breastfeeding";
  
  // Common state
  const [selectedType, setSelectedType] = useState<FeedingType>(initialType);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [timestamp, setTimestamp] = useState<Date>(new Date());

  // Manual breastfeeding entry state
  const [showManualBreastfeeding, setShowManualBreastfeeding] = useState(false);
  const [manualLeftMinutes, setManualLeftMinutes] = useState(0);
  const [manualRightMinutes, setManualRightMinutes] = useState(0);
  const [manualTimestamp, setManualTimestamp] = useState<Date>(new Date());

  // Bottle state
  const [bottleAmount, setBottleAmount] = useState(120);
  const [bottleUnit, setBottleUnit] = useState<Unit>("ml");
  const [bottleType, setBottleType] = useState<BottleType>("formula");

  // Pumping state
  const [pumpAmount, setPumpAmount] = useState(100);
  const [pumpUnit, setPumpUnit] = useState<Unit>("ml");
  const [pumpSide, setPumpSide] = useState<PumpSide>("both");

  // Solid food state
  const [foodType, setFoodType] = useState("");
  const [foodReaction, setFoodReaction] = useState("");

  // Breast side suggestion state
  const [breastSuggestion, setBreastSuggestion] = useState<FeedingSuggestionResponse | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // Fetch breast side suggestion on mount
  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        setSuggestionLoading(true);
        const suggestion = await api.feedings.getSuggestion();
        setBreastSuggestion(suggestion);
      } catch (error) {
        // Silently fail for 403 errors (no previous feeding data)
        // or when baby is not selected
        console.debug("Breast side suggestion not available:", error);
        setBreastSuggestion(null);
      } finally {
        setSuggestionLoading(false);
      }
    };
    
    fetchSuggestion();
  }, []);

  // Derived state from context nursing timer
  const isNursingActive = nursingTimer?.isActive ?? false;
  const currentSide = nursingTimer?.currentSide ?? "left";
  const leftDuration = nursingTimer?.leftDuration ?? 0;
  const rightDuration = nursingTimer?.rightDuration ?? 0;
  const currentSideDuration = currentSide === "left" ? leftDuration : rightDuration;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    if (isNursingActive) {
      toast.info("Use the banner at the top to stop the timer");
    } else {
      startNursingTimer("left");
      toast.success("Nursing timer started!");
    }
  };

  const handleSwitchSide = () => {
    if (isNursingActive) {
      switchNursingSide();
      toast.success(`Switched to ${currentSide === "left" ? "right" : "left"} side`);
    }
  };

  const handleStopTimer = () => {
    if (isNursingActive) {
      stopNursingTimer();
      toast.info("Timer stopped. You can save the log now.");
    }
  };

  // Check if we have stopped timer data to save
  const hasStoppedTimerData = !isNursingActive && (leftDuration > 0 || rightDuration > 0);

  const convertToMl = (value: number, fromUnit: Unit): number => {
    if (fromUnit === "oz") {
      return Math.round(value * 29.5735);
    }
    return value;
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const ts = timestamp.toISOString();

      switch (selectedType) {
        case "breastfeeding": {
          const hasManualEntry = manualLeftMinutes > 0 || manualRightMinutes > 0;
          const useManual = showManualBreastfeeding || (typeof window !== 'undefined' && window.innerWidth >= 768 && hasManualEntry && !isNursingActive && !hasStoppedTimerData);
          
          if (useManual && hasManualEntry) {
            const leftSecs = manualLeftMinutes * 60;
            const rightSecs = manualRightMinutes * 60;
            
            await api.feedings.create({
              type: "breastfeeding",
              leftDuration: leftSecs > 0 ? leftSecs : undefined,
              rightDuration: rightSecs > 0 ? rightSecs : undefined,
              lastSide: rightSecs > 0 ? "right" : "left",
              timestamp: manualTimestamp.toISOString(),
              notes: notes.trim() || undefined,
            });
          } else if (isNursingActive) {
            const timer = stopNursingTimer();
            if (!timer) {
              toast.error("No active timer to save.");
              setIsLoading(false);
              return;
            }
            await api.feedings.create({
              type: "breastfeeding",
              leftDuration: timer.leftDuration > 0 ? timer.leftDuration : undefined,
              rightDuration: timer.rightDuration > 0 ? timer.rightDuration : undefined,
              lastSide: timer.currentSide,
              timestamp: timer.startTime.toISOString(),
              notes: notes.trim() || undefined,
            });
            clearNursingTimer();
          } else if (hasStoppedTimerData) {
            await api.feedings.create({
              type: "breastfeeding",
              leftDuration: leftDuration > 0 ? leftDuration : undefined,
              rightDuration: rightDuration > 0 ? rightDuration : undefined,
              lastSide: currentSide,
              timestamp: nursingTimer?.startTime?.toISOString() || new Date().toISOString(),
              notes: notes.trim() || undefined,
            });
            clearNursingTimer();
          } else {
            toast.error("Please start the timer or enter manual values.");
            setIsLoading(false);
            return;
          }
          break;
        }
        case "bottle": {
          if (bottleAmount <= 0) {
             toast.error("Please enter a valid amount.");
             setIsLoading(false);
             return;
          }
          await api.feedings.create({
            type: "bottle",
            amount: convertToMl(bottleAmount, bottleUnit),
            bottleType,
            timestamp: ts,
            notes: notes.trim() || undefined,
          });
          break;
        }
        case "pumping": {
          if (pumpAmount <= 0) {
            toast.error("Please enter a valid amount.");
            setIsLoading(false);
            return;
          }
          await api.feedings.create({
            type: "pumping",
            pumpedAmount: convertToMl(pumpAmount, pumpUnit),
            pumpSide,
            timestamp: ts,
            notes: notes.trim() || undefined,
          });
          break;
        }
        case "solid": {
          if (!foodType.trim()) {
            toast.error("Please enter the food type.");
            setIsLoading(false);
            return;
          }
          await api.feedings.create({
            type: "solid",
            foodType: foodType.trim(),
            reaction: foodReaction.trim() || undefined,
            timestamp: ts,
            notes: notes.trim() || undefined,
          });
          break;
        }
      }

      toast.success("Feeding saved!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save feeding:", err);
      toast.error("Failed to save feeding. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeConfig = FEEDING_TYPES.find(t => t.key === selectedType)!;

  // Tab rendering helper with glassmorphism styling
  const renderTabs = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {FEEDING_TYPES.map((type) => {
        const Icon = type.icon;
        const isActive = selectedType === type.key;
        return (
          <GlassButton
            key={type.key}
            variant={isActive ? "primary" : "default"}
            onClick={() => setSelectedType(type.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 whitespace-nowrap",
              isActive && type.bgColor
            )}
          >
            <Icon className="w-5 h-5" />
            {type.label}
          </GlassButton>
        );
      })}
    </div>
  );

  return (
    <MobileContainer>
      <div className="p-4 pb-32">
        <LogFormWrapper
          title="Log Feed"
          backHref="/log"
          showCard={false}
        >
          <div className="space-y-6">
            {/* Feeding Type Tabs - Requirement 14.5: 48px touch targets */}
            {renderTabs()}

            {/* Age Warnings */}
            {selectedType === "solid" && (
              <AgeWarning minAgeMonths={6} activityName="Solid Foods" />
            )}
            {selectedType === "bottle" && bottleType === "water" && (
              <AgeWarning minAgeMonths={6} activityName="Water" />
            )}

            {/* Breastfeeding UI */}
            {selectedType === "breastfeeding" && (
              <div className="space-y-6 animate-fade-in">
                {/* Breast Side Suggestion Banner */}
                {breastSuggestion?.hasPreviousBreastfeeding && breastSuggestion.suggestedNextSide && (
                  <GlassCard variant="featured" className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-foreground">Suggested Side</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-bold uppercase",
                            breastSuggestion.suggestedNextSide === "left"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                              : "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300"
                          )}>
                            {breastSuggestion.suggestedNextSide}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last used: <span className="font-medium capitalize">{breastSuggestion.lastUsedSide}</span>
                          {breastSuggestion.lastBreastfeedingTime && (
                            <> • {new Date(breastSuggestion.lastBreastfeedingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                          )}
                        </p>
                      </div>
                      <GlassButton
                        size="sm"
                        variant="default"
                        className="flex-shrink-0"
                        onClick={() => {
                          if (!isNursingActive && breastSuggestion.suggestedNextSide) {
                            startNursingTimer(breastSuggestion.suggestedNextSide as "left" | "right");
                            toast.success(`Started timer on ${breastSuggestion.suggestedNextSide} side`);
                          }
                        }}
                        disabled={isNursingActive}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </GlassButton>
                    </div>
                  </GlassCard>
                )}

                {/* Loading state for suggestion */}
                {suggestionLoading && (
                  <GlassCard variant="featured" className="p-4">
                    <div className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-[var(--glass-bg)] rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[var(--glass-bg)] rounded w-1/3" />
                        <div className="h-3 bg-[var(--glass-bg)] rounded w-1/2" />
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* Mobile: Mode Toggle - Timer vs Manual */}
                <div className="flex bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl p-1.5 border border-[var(--glass-border)] md:hidden">
                  <button
                    onClick={() => setShowManualBreastfeeding(false)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all min-h-[48px]",
                      !showManualBreastfeeding
                        ? "bg-pink-500 text-white shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Play className="w-4 h-4" />
                    Timer
                  </button>
                  <button
                    onClick={() => setShowManualBreastfeeding(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all min-h-[48px]",
                      showManualBreastfeeding
                        ? "bg-pink-500 text-white shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Clock className="w-4 h-4" />
                    Manual
                  </button>
                </div>

                {/* Desktop: Side by side layout */}
                <div className="hidden md:grid md:grid-cols-2 md:gap-6">
                  {/* Timer Section */}
                  <GlassCard size="lg" className="space-y-4">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Play className="w-4 h-4 text-pink-500" />
                      Live Timer
                    </h3>
                    <div className="space-y-4">
                      {/* Compact Timer Display */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle className="text-[var(--glass-border)]" strokeWidth="6" stroke="currentColor" fill="transparent" r="44" cx="50" cy="50" />
                            <circle 
                              className="text-pink-500 transition-all duration-1000 ease-linear" 
                              strokeWidth="6" 
                              strokeDasharray={276}
                              strokeDashoffset={276 - (276 * (currentSideDuration % 60) / 60)}
                              strokeLinecap="round" 
                              stroke="currentColor" 
                              fill="transparent" 
                              r="44" cx="50" cy="50" 
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-heading font-black text-foreground tabular-nums">
                              {formatTime(currentSideDuration)}
                            </span>
                            <span className={cn("text-xs font-bold uppercase tracking-widest", isNursingActive ? "text-pink-500 animate-pulse" : "text-muted-foreground")}>
                              {isNursingActive ? currentSide : "Ready"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Duration Summary */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className={cn(
                          "bg-[var(--glass-bg)] p-2 rounded-xl text-center transition-all border border-[var(--glass-border)]",
                          currentSide === "left" && isNursingActive && "ring-2 ring-pink-500"
                        )}>
                          <div className="text-[10px] text-muted-foreground uppercase">Left</div>
                          <div className="text-sm font-bold text-foreground tabular-nums">{formatTime(leftDuration)}</div>
                        </div>
                        <div className={cn(
                          "bg-[var(--glass-bg)] p-2 rounded-xl text-center transition-all border border-[var(--glass-border)]",
                          currentSide === "right" && isNursingActive && "ring-2 ring-pink-500"
                        )}>
                          <div className="text-[10px] text-muted-foreground uppercase">Right</div>
                          <div className="text-sm font-bold text-foreground tabular-nums">{formatTime(rightDuration)}</div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="grid grid-cols-3 gap-2">
                        <GlassButton 
                          onClick={toggleTimer}
                          size="sm"
                          variant={isNursingActive ? "default" : "primary"}
                          className={cn(
                            "h-10",
                            !isNursingActive && "bg-pink-500"
                          )}
                        >
                          <Play className="w-4 h-4" />
                        </GlassButton>
                        
                        <GlassButton 
                          variant="default"
                          size="sm"
                          onClick={handleSwitchSide}
                          disabled={!isNursingActive}
                          className="h-10"
                        >
                          Switch
                        </GlassButton>

                        <GlassButton 
                          variant="danger"
                          size="sm"
                          onClick={handleStopTimer}
                          disabled={!isNursingActive}
                          className="h-10"
                        >
                          Stop
                        </GlassButton>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Manual Entry Section */}
                  <GlassCard size="lg" className="space-y-4">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-pink-500" />
                      Manual Entry
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Left Side (min)</label>
                        <NumberStepper 
                          value={manualLeftMinutes} 
                          onChange={setManualLeftMinutes} 
                          min={0}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Right Side (min)</label>
                        <NumberStepper 
                          value={manualRightMinutes} 
                          onChange={setManualRightMinutes} 
                          min={0}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">When</label>
                        <TimeAgoPicker value={manualTimestamp} onChange={setManualTimestamp} />
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Mobile: Timer Mode */}
                {!showManualBreastfeeding && (
                  <div className="space-y-6 md:hidden">
                    {/* Visual Timer */}
                    <div className="flex flex-col items-center">
                      <GlassCard variant="default" className="p-8 rounded-full border-4 border-pink-100 dark:border-pink-950/30">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle className="text-[var(--glass-border)]" strokeWidth="6" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                            <circle 
                              className="text-pink-500 transition-all duration-1000 ease-linear" 
                              strokeWidth="6" 
                              strokeDasharray={289}
                              strokeDashoffset={289 - (289 * (currentSideDuration % 60) / 60)}
                              strokeLinecap="round" 
                              stroke="currentColor" 
                              fill="transparent" 
                              r="46" cx="50" cy="50" 
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-heading font-black text-foreground tabular-nums tracking-tighter">
                              {formatTime(currentSideDuration)}
                            </span>
                            <span className={cn("text-xs font-bold uppercase tracking-widest mt-1", isNursingActive ? "text-pink-500 animate-pulse" : "text-muted-foreground")}>
                              {isNursingActive ? `${currentSide === "left" ? "Left" : "Right"}` : "Ready"}
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    </div>

                    {/* Duration Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <GlassCard className={cn(
                        "p-4 text-center transition-all",
                        currentSide === "left" && isNursingActive && "ring-2 ring-pink-500"
                      )}>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Left</div>
                        <div className="text-xl font-bold text-foreground tabular-nums">{formatTime(leftDuration)}</div>
                      </GlassCard>
                      <GlassCard className={cn(
                        "p-4 text-center transition-all",
                        currentSide === "right" && isNursingActive && "ring-2 ring-pink-500"
                      )}>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Right</div>
                        <div className="text-xl font-bold text-foreground tabular-nums">{formatTime(rightDuration)}</div>
                      </GlassCard>
                    </div>

                    {/* Controls - Requirement 14.5: 48px touch targets */}
                    <div className="grid grid-cols-3 gap-3">
                      <GlassButton 
                        onClick={toggleTimer}
                        size="lg"
                        variant={isNursingActive ? "default" : "primary"}
                        className={cn(
                          "h-14 shadow-xl transition-all hover:scale-[1.02] active:scale-95",
                          !isNursingActive && "bg-pink-500 shadow-pink-500/25"
                        )}
                      >
                        {isNursingActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </GlassButton>
                      
                      <GlassButton 
                        variant="default"
                        size="lg"
                        onClick={handleSwitchSide}
                        disabled={!isNursingActive}
                        className="h-14"
                      >
                        Switch
                      </GlassButton>

                      <GlassButton 
                        variant="danger"
                        size="lg"
                        onClick={handleStopTimer}
                        disabled={!isNursingActive}
                        className="h-14"
                      >
                        Stop
                      </GlassButton>
                    </div>
                  </div>
                )}

                {/* Mobile: Manual Mode */}
                {showManualBreastfeeding && (
                  <GlassCard size="lg" className="space-y-6 md:hidden">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Left Side (min)</label>
                        <NumberStepper 
                          value={manualLeftMinutes} 
                          onChange={setManualLeftMinutes} 
                          min={0}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Right Side (min)</label>
                        <NumberStepper 
                          value={manualRightMinutes} 
                          onChange={setManualRightMinutes} 
                          min={0}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">When</label>
                        <TimeAgoPicker value={manualTimestamp} onChange={setManualTimestamp} />
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

            {/* Bottle Form */}
            {selectedType === "bottle" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid md:grid-cols-2 gap-4">
                  <GlassCard size="lg" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contents</label>
                      <div className="flex flex-col gap-2">
                        {BOTTLE_TYPES.map((type) => (
                          <GlassButton
                            key={type.value}
                            variant={bottleType === type.value ? "primary" : "default"}
                            onClick={() => setBottleType(type.value)}
                            className={cn(
                              "justify-start gap-2",
                              bottleType === type.value && "bg-blue-500"
                            )}
                          >
                            <span>{type.emoji}</span>
                            {type.label}
                          </GlassButton>
                        ))}
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard size="lg" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
                        <div className="flex bg-[var(--glass-bg)] rounded-lg p-1 border border-[var(--glass-border)]">
                          {(["ml", "oz"] as Unit[]).map((u) => (
                            <GlassButton
                              key={u}
                              variant={bottleUnit === u ? "primary" : "ghost"}
                              size="sm"
                              onClick={() => setBottleUnit(u)}
                              className={cn(
                                "px-3 py-1 text-xs min-h-[36px]",
                                bottleUnit === u && "bg-blue-500"
                              )}
                            >
                              {u}
                            </GlassButton>
                          ))}
                        </div>
                      </div>
                      <NumberStepper 
                        value={bottleAmount}
                        onChange={setBottleAmount}
                        min={0}
                        step={bottleUnit === "oz" ? 0.5 : 10}
                        unit={bottleUnit}
                      />
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}

            {/* Pumping Form */}
            {selectedType === "pumping" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid md:grid-cols-2 gap-4">
                  <GlassCard size="lg" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Side</label>
                      <div className="flex flex-col gap-2">
                        {PUMP_SIDES.map((s) => (
                          <GlassButton
                            key={s.value}
                            variant={pumpSide === s.value ? "primary" : "default"}
                            onClick={() => setPumpSide(s.value)}
                            className={cn(
                              "justify-center",
                              pumpSide === s.value && "bg-purple-500"
                            )}
                          >
                            {s.label}
                          </GlassButton>
                        ))}
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard size="lg" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
                        <div className="flex bg-[var(--glass-bg)] rounded-lg p-1 border border-[var(--glass-border)]">
                          {(["ml", "oz"] as Unit[]).map((u) => (
                            <GlassButton
                              key={u}
                              variant={pumpUnit === u ? "primary" : "ghost"}
                              size="sm"
                              onClick={() => setPumpUnit(u)}
                              className={cn(
                                "px-3 py-1 text-xs min-h-[36px]",
                                pumpUnit === u && "bg-purple-500"
                              )}
                            >
                              {u}
                            </GlassButton>
                          ))}
                        </div>
                      </div>
                      <NumberStepper 
                        value={pumpAmount}
                        onChange={setPumpAmount}
                        min={0}
                        step={pumpUnit === "oz" ? 0.5 : 10}
                        unit={pumpUnit}
                      />
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}

            {/* Solid Food Form - Requirement 14.3: GlassInput for text inputs */}
            {selectedType === "solid" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid md:grid-cols-2 gap-4">
                  <GlassCard size="lg" className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="food-type" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Food</label>
                      <GlassInput
                        id="food-type"
                        name="food-type"
                        placeholder="What did they eat?"
                        value={foodType}
                        onChange={(e) => setFoodType(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </GlassCard>

                  <GlassCard size="lg" className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="food-reaction" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reaction (optional)</label>
                      <GlassInput
                        id="food-reaction"
                        name="food-reaction"
                        placeholder="Did they like it?"
                        value={foodReaction}
                        onChange={(e) => setFoodReaction(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}

            {/* Time Picker - Only for non-breastfeeding types */}
            {selectedType !== "breastfeeding" && (
              <div className="space-y-2">
                <label htmlFor="feed-time-picker" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</label>
                <TimeAgoPicker value={timestamp} onChange={setTimestamp} id="feed-time-picker" />
              </div>
            )}

            {/* Notes - Requirement 14.3: GlassTextarea */}
            <div className="space-y-2">
              <label htmlFor="feed-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
              <GlassTextarea
                id="feed-notes"
                name="feed-notes"
                placeholder="Details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="min-h-[80px]"
              />
            </div>

            {/* Spacer for fixed button */}
            <div className="h-5" />
          </div>
        </LogFormWrapper>

        {/* Save Button - Requirement 14.4, 14.5: GlassButton with 48px touch target */}
        <div className="fixed bottom-32 left-4 right-4 z-50">
          <GlassButton 
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isLoading}
            className={cn(
              "w-full h-16 rounded-full text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-95",
              activeConfig.bgColor
            )}
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Log
              </>
            )}
          </GlassButton>
        </div>
      </div>
    </MobileContainer>
  );
}
