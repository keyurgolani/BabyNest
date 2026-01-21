"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type Unit = "ml" | "oz";

// Feeding type tabs
const FEEDING_TYPES: { key: FeedingType; label: string; icon: typeof Baby }[] = [
  { key: "breastfeeding", label: "Nursing", icon: Baby },
  { key: "bottle", label: "Bottle", icon: Milk },
  { key: "pumping", label: "Pump", icon: Droplets },
  { key: "solid", label: "Solid", icon: Utensils },
];

// Bottle type options
const BOTTLE_TYPES: { value: BottleType; label: string }[] = [
  { value: "breastMilk", label: "Breast Milk" },
  { value: "formula", label: "Formula" },
  { value: "water", label: "Water" },
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
        <div className="h-10 bg-muted rounded-lg w-1/3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-2xl flex-1" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-full mx-auto w-64" />
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
      // Pause is not supported in global timer - user should use banner to stop
      // For now, just show a message
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
          // On desktop, check if manual entry has values first
          const hasManualEntry = manualLeftMinutes > 0 || manualRightMinutes > 0;
          
          // On mobile, respect the toggle; on desktop, prefer manual if it has values
          const useManual = showManualBreastfeeding || (typeof window !== 'undefined' && window.innerWidth >= 768 && hasManualEntry && !isNursingActive && !hasStoppedTimerData);
          
          if (useManual && hasManualEntry) {
            // Manual entry
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
            // Stop the active timer and save
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
            // Timer was stopped, save the recorded data
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

  // Tab rendering helper
  const renderTabs = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {FEEDING_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
            key={type.key}
            onClick={() => setSelectedType(type.key)}
            className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-300 border-2",
                selectedType === type.key
                ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25"
                : "bg-card border-transparent text-muted-foreground hover:bg-muted"
            )}
            >
            <Icon className="w-5 h-5" />
            {type.label}
            </button>
          );
      })}
    </div>
  );

  return (
    <MobileContainer>
      <div className="p-4 space-y-6 animate-slide-up pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Log Feed</h1>
        </div>

        {/* Feeding Type Tabs */}
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
              <Card className="p-4 border-0 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 rounded-xl border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50"
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
                  </Button>
                </div>
              </Card>
            )}

            {/* Loading state for suggestion */}
            {suggestionLoading && (
              <Card className="p-4 border-0 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </Card>
            )}

            {/* Mobile: Mode Toggle - Timer vs Manual */}
            <div className="flex bg-muted/50 rounded-2xl p-1.5 md:hidden">
              <button
                onClick={() => setShowManualBreastfeeding(false)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                  !showManualBreastfeeding
                    ? "bg-orange-500 text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Play className="w-4 h-4" />
                Timer
              </button>
              <button
                onClick={() => setShowManualBreastfeeding(true)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                  showManualBreastfeeding
                    ? "bg-orange-500 text-white shadow-lg"
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
              <Card className="p-6 border-0 bg-gradient-to-br from-card to-muted/20">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4 text-orange-500" />
                  Live Timer
                </h3>
                <div className="space-y-4">
                  {/* Compact Timer Display */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-muted/20" strokeWidth="6" stroke="currentColor" fill="transparent" r="44" cx="50" cy="50" />
                        <circle 
                          className="text-orange-500 transition-all duration-1000 ease-linear" 
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
                        <span className={cn("text-xs font-bold uppercase tracking-widest", isNursingActive ? "text-orange-500 animate-pulse" : "text-muted-foreground")}>
                          {isNursingActive ? currentSide : "Ready"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duration Summary */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className={cn(
                      "bg-muted/30 p-2 rounded-xl text-center transition-all",
                      currentSide === "left" && isNursingActive && "ring-2 ring-orange-500"
                    )}>
                      <div className="text-[10px] text-muted-foreground uppercase">Left</div>
                      <div className="text-sm font-bold text-foreground tabular-nums">{formatTime(leftDuration)}</div>
                    </div>
                    <div className={cn(
                      "bg-muted/30 p-2 rounded-xl text-center transition-all",
                      currentSide === "right" && isNursingActive && "ring-2 ring-orange-500"
                    )}>
                      <div className="text-[10px] text-muted-foreground uppercase">Right</div>
                      <div className="text-sm font-bold text-foreground tabular-nums">{formatTime(rightDuration)}</div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      onClick={toggleTimer}
                      size="sm"
                      className={cn(
                        "h-10 font-bold rounded-xl transition-all",
                        isNursingActive 
                          ? "bg-card text-orange-500 border-2 border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950" 
                          : "bg-orange-500 text-white"
                      )}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleSwitchSide}
                      disabled={!isNursingActive}
                      className="h-10 font-bold rounded-xl"
                    >
                      Switch
                    </Button>

                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleStopTimer}
                      disabled={!isNursingActive}
                      className="h-10 font-bold rounded-xl text-red-500 border-red-500/50 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Stop
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Manual Entry Section */}
              <Card className="p-6 border-0 bg-gradient-to-br from-card to-muted/20">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
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
              </Card>
            </div>

            {/* Mobile: Timer Mode */}
            {!showManualBreastfeeding && (
              <div className="space-y-6 md:hidden">
                {/* Visual Timer */}
                <div className="flex flex-col items-center">
                  <Card variant="glass" className="p-8 rounded-full border-4 border-orange-100 dark:border-orange-950/30">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-muted/20" strokeWidth="6" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                        <circle 
                          className="text-orange-500 transition-all duration-1000 ease-linear" 
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
                        <span className={cn("text-xs font-bold uppercase tracking-widest mt-1", isNursingActive ? "text-orange-500 animate-pulse" : "text-muted-foreground")}>
                          {isNursingActive ? `${currentSide === "left" ? "Left" : "Right"}` : "Ready"}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Duration Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={cn(
                    "bg-card p-4 rounded-2xl border text-center transition-all",
                    currentSide === "left" && isNursingActive && "ring-2 ring-orange-500"
                  )}>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Left</div>
                    <div className="text-xl font-bold text-foreground tabular-nums">{formatTime(leftDuration)}</div>
                  </div>
                  <div className={cn(
                    "bg-card p-4 rounded-2xl border text-center transition-all",
                    currentSide === "right" && isNursingActive && "ring-2 ring-orange-500"
                  )}>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Right</div>
                    <div className="text-xl font-bold text-foreground tabular-nums">{formatTime(rightDuration)}</div>
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-3 gap-3">
                    <Button 
                      onClick={toggleTimer}
                      size="lg"
                      className={cn(
                        "h-14 text-base font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95",
                        isNursingActive 
                          ? "bg-card text-orange-500 border-2 border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950" 
                          : "bg-orange-500 text-white shadow-orange-500/25"
                      )}
                    >
                      {isNursingActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleSwitchSide}
                      disabled={!isNursingActive}
                      className="h-14 text-base font-bold rounded-2xl border-2"
                    >
                      Switch
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={handleStopTimer}
                      disabled={!isNursingActive}
                      className="h-14 text-base font-bold rounded-2xl border-2 text-red-500 border-red-500/50 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Stop
                    </Button>
                </div>
              </div>
            )}

            {/* Mobile: Manual Mode */}
            {showManualBreastfeeding && (
              <Card className="p-6 space-y-6 border-0 bg-gradient-to-br from-card to-muted/20 md:hidden">
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
              </Card>
            )}
          </div>
        )}

        {/* Bottle Form */}
        {selectedType === "bottle" && (
            <div className="space-y-6 animate-fade-in">
                {/* Desktop: Side by side layout */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Contents</label>
                            <div className="flex flex-col gap-2">
                                {BOTTLE_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setBottleType(type.value)}
                                    className={cn(
                                    "py-3 px-4 rounded-xl font-bold text-sm transition-all border-2",
                                    bottleType === type.value
                                        ? "bg-orange-500 border-orange-500 text-white"
                                        : "bg-card border-transparent text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {type.label}
                                </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                 <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Amount</label>
                                 <div className="flex bg-muted/50 rounded-lg p-1">
                                     {(["ml", "oz"] as Unit[]).map((u) => (
                                         <button
                                            key={u}
                                            onClick={() => setBottleUnit(u)}
                                            className={cn(
                                                "px-3 py-1 rounded-md text-xs font-bold transition-all",
                                                bottleUnit === u
                                                ? "bg-white dark:bg-black shadow-sm text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                            )}
                                         >
                                             {u}
                                         </button>
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
                    </Card>
                </div>
            </div>
        )}

        {/* Pumping Form */}
        {selectedType === "pumping" && (
            <div className="space-y-6 animate-fade-in">
                {/* Desktop: Side by side layout */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Side</label>
                            <div className="flex flex-col gap-2">
                                {PUMP_SIDES.map((s) => (
                                <button
                                    key={s.value}
                                    onClick={() => setPumpSide(s.value)}
                                    className={cn(
                                    "py-3 px-4 rounded-xl font-bold text-sm transition-all border-2",
                                    pumpSide === s.value
                                        ? "bg-orange-500 border-orange-500 text-white"
                                        : "bg-card border-transparent text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {s.label}
                                </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                 <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Amount</label>
                                 <div className="flex bg-muted/50 rounded-lg p-1">
                                     {(["ml", "oz"] as Unit[]).map((u) => (
                                         <button
                                            key={u}
                                            onClick={() => setPumpUnit(u)}
                                            className={cn(
                                                "px-3 py-1 rounded-md text-xs font-bold transition-all",
                                                pumpUnit === u
                                                ? "bg-white dark:bg-black shadow-sm text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                            )}
                                         >
                                             {u}
                                         </button>
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
                    </Card>
                </div>
            </div>
        )}

        {/* Solid Food Form */}
        {selectedType === "solid" && (
            <div className="space-y-6 animate-fade-in">
                {/* Desktop: Side by side layout */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
                        <div className="space-y-2">
                          <label htmlFor="food-type" className="text-xs font-semibold text-foreground uppercase tracking-wider">Food</label>
                          <Input
                            id="food-type"
                            name="food-type"
                            placeholder="What did they eat?"
                            value={foodType}
                            onChange={(e) => setFoodType(e.target.value)}
                            className="h-12 bg-muted/30 border-transparent focus:bg-background focus:border-primary/20"
                          />
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
                        <div className="space-y-2">
                          <label htmlFor="food-reaction" className="text-xs font-semibold text-foreground uppercase tracking-wider">Reaction (optional)</label>
                          <Input
                            id="food-reaction"
                            name="food-reaction"
                            placeholder="Did they like it?"
                            value={foodReaction}
                            onChange={(e) => setFoodReaction(e.target.value)}
                            className="h-12 bg-muted/30 border-transparent focus:bg-background focus:border-primary/20"
                          />
                        </div>
                    </Card>
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

        {/* Notes */}
        <div className="space-y-2">
            <label htmlFor="feed-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
            <textarea
                id="feed-notes"
                name="feed-notes"
                className="w-full rounded-2xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 p-4 text-sm resize-none outline-none transition-all placeholder:text-muted-foreground/50"
                placeholder="Details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
            />
        </div>

        {/* Spacer for fixed button */}
        <div className="h-5" />

        {/* Save Button */}
        <div className="fixed bottom-32 left-4 right-4 z-50">
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 text-white transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading ? (
                "Saving..."
            ) : (
                <>
                <Save className="w-5 h-5 mr-2" />
                Save Log
                </>
            )}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
