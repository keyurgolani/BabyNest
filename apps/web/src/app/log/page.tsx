"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, DiaperType, BottleType, ActivityType } from "@/lib/api-client";
import { useLogs } from "@/context/log-context";
import { 
  Baby, Moon, Droplets, Utensils, Bath, Gamepad2,
  Check, ChevronRight, Milk, Pill, Thermometer, Play, TreePine,
  Scale, Ruler, Circle
} from "lucide-react";

/**
 * Quick Log Page
 * 
 * Displays 11 quick log widgets in a responsive grid layout.
 * - 2 columns on mobile (< 768px)
 * - 3 columns on tablet (768px - 1023px)
 * - 4 columns on desktop (>= 1024px)
 * 
 * @requirements 13.1, 13.2, 13.3, 13.4
 */
export default function QuickLogPage() {
  return (
    <MobileContainer>
      <div className="p-4 space-y-4 pb-32 overflow-y-auto">
        {/* PageHeader Component - Requirement 13.4 */}
        <PageHeader 
          title="Quick Log" 
          subtitle="Tap to log instantly"
        />

        {/* Responsive grid - Requirement 13.4: 2-column mobile, 3-column tablet, 4-column desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <QuickBottleWidget />
          <QuickDiaperWidget />
          <QuickSleepWidget />
          <QuickNursingWidget />
          <QuickActivityWidget />
          <QuickGrowthWidget />
          <QuickTemperatureWidget />
          <QuickMedicineWidget />
          <QuickPumpWidget />
          <QuickSolidsWidget />
          <QuickSymptomWidget />
        </div>
      </div>
    </MobileContainer>
  );
}

/**
 * Bottle Widget - Quick log common amounts
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickBottleWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const amounts = [60, 90, 120, 150];

  const handleQuickLog = async (amount: number) => {
    setSelectedAmount(amount);
    setIsLoading(true);
    try {
      await api.feedings.create({
        type: "bottle",
        amount,
        bottleType: "formula" as BottleType,
        timestamp: new Date().toISOString(),
      });
      toast.success(`${amount}ml bottle logged!`);
    } catch {
      toast.error("Failed to log");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSelectedAmount(null), 1000);
    }
  };

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-feed)]/10 to-[var(--color-feed)]/5">
      <Link href="/log/feed?type=bottle" className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-feed)] flex items-center justify-center shadow-lg shadow-[var(--color-feed)]/20">
          <Milk className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-foreground">Bottle</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <div className="grid grid-cols-2 gap-2">
        {amounts.map((amount) => (
          <button
            key={amount}
            onClick={() => handleQuickLog(amount)}
            disabled={isLoading}
            className={cn(
              "py-3 rounded-xl text-sm font-bold transition-all min-h-[44px]",
              selectedAmount === amount
                ? "bg-[var(--color-feed)] text-white"
                : "bg-[var(--color-feed)]/15 hover:bg-[var(--color-feed)]/25 active:scale-95"
            )}
            style={{ color: selectedAmount === amount ? undefined : 'var(--color-feed)' }}
          >
            {selectedAmount === amount ? <Check className="w-4 h-4 mx-auto" /> : `${amount}ml`}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * Diaper Widget - Quick log types
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickDiaperWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<DiaperType | null>(null);
  const types: { type: DiaperType; label: string; emoji: string }[] = [
    { type: "wet", label: "Wet", emoji: "💧" },
    { type: "dirty", label: "Dirty", emoji: "💩" },
    { type: "mixed", label: "Both", emoji: "✨" },
  ];

  const handleQuickLog = async (type: DiaperType) => {
    setSelectedType(type);
    setIsLoading(true);
    try {
      await api.diapers.create({ type, timestamp: new Date().toISOString() });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} diaper logged!`);
    } catch {
      toast.error("Failed to log");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSelectedType(null), 1000);
    }
  };

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-diaper)]/10 to-[var(--color-diaper)]/5">
      <Link href="/log/diaper" className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-diaper)] flex items-center justify-center shadow-lg shadow-[var(--color-diaper)]/20">
          <Baby className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-foreground">Diaper</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <div className="flex flex-col gap-2">
        {types.map(({ type, label, emoji }) => (
          <button
            key={type}
            onClick={() => handleQuickLog(type)}
            disabled={isLoading}
            className={cn(
              "py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 min-h-[44px]",
              selectedType === type
                ? "bg-[var(--color-diaper)] text-white"
                : "bg-[var(--color-diaper)]/15 hover:bg-[var(--color-diaper)]/25 active:scale-95"
            )}
            style={{ color: selectedType === type ? undefined : 'var(--color-diaper)' }}
          >
            {selectedType === type ? <Check className="w-4 h-4" /> : <span>{emoji}</span>}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * Sleep Widget - Start timer
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickSleepWidget() {
  const router = useRouter();
  const { babyStatus, setBabyStatus, setLastStatusChange } = useLogs();
  const isSleeping = babyStatus === "Sleeping";

  const handleStartSleep = () => {
    setBabyStatus("Sleeping");
    setLastStatusChange(new Date());
    toast.success("Sleep timer started!");
    router.push("/log/sleep");
  };

  const handleViewSleep = () => {
    router.push("/log/sleep");
  };

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-sleep)]/10 to-[var(--color-sleep)]/5">
      <Link href="/log/sleep" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-sleep)] flex items-center justify-center shadow-lg shadow-[var(--color-sleep)]/20">
          <Moon className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Sleep</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <button 
        onClick={isSleeping ? handleViewSleep : handleStartSleep}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 rounded-xl transition-all active:scale-95 min-h-[48px]",
          isSleeping 
            ? "bg-[var(--color-sleep)] text-white animate-pulse" 
            : "bg-[var(--color-sleep)]/15 hover:bg-[var(--color-sleep)]/25"
        )}
        style={{ color: isSleeping ? undefined : 'var(--color-sleep)' }}
      >
        {isSleeping ? (
          <>
            <Moon className="w-5 h-5" />
            <span className="text-sm font-bold">Sleeping...</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            <span className="text-sm font-bold">Start Sleep</span>
          </>
        )}
      </button>
    </GlassCard>
  );
}

/**
 * Nursing Widget - Start timer with side selection
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickNursingWidget() {
  const router = useRouter();
  const { nursingTimer, startNursingTimer } = useLogs();
  const isNursing = nursingTimer?.isActive ?? false;

  const handleStartNursing = (side: "left" | "right") => {
    startNursingTimer(side);
    toast.success(`Nursing started (${side} side)!`);
    router.push("/log/feed");
  };

  const handleViewNursing = () => {
    router.push("/log/feed");
  };

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-nursing)]/10 to-[var(--color-nursing)]/5">
      <Link href="/log/feed" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-nursing)] flex items-center justify-center shadow-lg shadow-[var(--color-nursing)]/20">
          <Baby className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Nursing</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      {isNursing ? (
        <button 
          onClick={handleViewNursing}
          className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--color-nursing)] text-white rounded-xl transition-all active:scale-95 animate-pulse min-h-[48px]"
        >
          <Baby className="w-5 h-5" />
          <span className="text-sm font-bold">Nursing...</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleStartNursing("left")}
            className="flex items-center justify-center gap-1 py-3 bg-[var(--color-nursing)]/15 hover:bg-[var(--color-nursing)]/25 active:scale-95 rounded-xl transition-all min-h-[44px]"
            style={{ color: 'var(--color-nursing)' }}
          >
            <span className="text-sm font-bold">◀ Left</span>
          </button>
          <button 
            onClick={() => handleStartNursing("right")}
            className="flex items-center justify-center gap-1 py-3 bg-[var(--color-nursing)]/15 hover:bg-[var(--color-nursing)]/25 active:scale-95 rounded-xl transition-all min-h-[44px]"
            style={{ color: 'var(--color-nursing)' }}
          >
            <span className="text-sm font-bold">Right ▶</span>
          </button>
        </div>
      )}
    </GlassCard>
  );
}

/**
 * Activity Widget - Quick log activities with timer
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickActivityWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  
  const activities = [
    { type: "tummy_time" as ActivityType, label: "Tummy", icon: Baby, duration: 5 },
    { type: "bath" as ActivityType, label: "Bath", icon: Bath, duration: 15 },
    { type: "play" as ActivityType, label: "Play", icon: Gamepad2, duration: 15 },
    { type: "outdoor" as ActivityType, label: "Outdoor", icon: TreePine, duration: 30 },
  ];

  const handleQuickLog = async (activityType: ActivityType, duration: number) => {
    setSelectedActivity(activityType);
    setIsLoading(true);
    try {
      await api.activities.create({
        activityType,
        duration,
        startTime: new Date().toISOString(),
      });
      toast.success(`${duration}min activity logged!`);
    } catch {
      toast.error("Failed to log");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSelectedActivity(null), 1000);
    }
  };

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-activity)]/10 to-[var(--color-activity)]/5">
      <Link href="/log/activity" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-activity)] flex items-center justify-center shadow-lg shadow-[var(--color-activity)]/20">
          <Gamepad2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Activity</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <div className="grid grid-cols-2 gap-2">
        {activities.map(({ type, label, icon: Icon, duration }) => (
          <button
            key={type}
            onClick={() => handleQuickLog(type, duration)}
            disabled={isLoading}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all active:scale-95 min-h-[44px]",
              selectedActivity === type
                ? "bg-[var(--color-activity)] text-white"
                : "bg-[var(--color-activity)]/15 hover:bg-[var(--color-activity)]/25"
            )}
            style={{ color: selectedActivity === type ? undefined : 'var(--color-activity)' }}
          >
            {selectedActivity === type ? (
              <Check className="w-4 h-4" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
            <span className="text-[10px] font-bold">{label}</span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * Growth Widget - Quick log measurements
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickGrowthWidget() {
  const measurements = [
    { type: "weight", label: "Weight", icon: Scale },
    { type: "height", label: "Height", icon: Ruler },
    { type: "head", label: "Head", icon: Circle },
  ];

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-growth)]/10 to-[var(--color-growth)]/5">
      <Link href="/log/growth" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-growth)] flex items-center justify-center shadow-lg shadow-[var(--color-growth)]/20">
          <Scale className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Growth</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <div className="flex flex-col gap-2">
        {measurements.map(({ type, label, icon: Icon }) => (
          <Link
            key={type}
            href={`/log/growth?type=${type}`}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-95 min-h-[44px] bg-[var(--color-growth)]/15 hover:bg-[var(--color-growth)]/25"
            style={{ color: 'var(--color-growth)' }}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-bold">{label}</span>
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * Temperature Widget - Quick log common temps
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickTemperatureWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemp, setSelectedTemp] = useState<number | null>(null);
  const temps = [98.6, 99.5, 100.4, 101];

  const handleQuickLog = async (tempF: number) => {
    setSelectedTemp(tempF);
    setIsLoading(true);
    try {
      const tempC = Math.round(((tempF - 32) * 5 / 9) * 10) / 10;
      const severity = tempC >= 38.3 ? "moderate" : tempC >= 37.8 ? "mild" : "mild";
      await api.health.symptoms.create({
        symptomType: "fever",
        severity,
        temperature: tempC,
        timestamp: new Date().toISOString(),
      });
      toast.success(`${tempF}°F logged!`);
    } catch {
      toast.error("Failed to log");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSelectedTemp(null), 1000);
    }
  };

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-health)]/10 to-[var(--color-health)]/5">
      <Link href="/log/temperature" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-health)] flex items-center justify-center shadow-lg shadow-[var(--color-health)]/20">
          <Thermometer className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Temp</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <div className="grid grid-cols-2 gap-2">
        {temps.map((temp) => {
          const isNormal = temp < 100;
          return (
            <button
              key={temp}
              onClick={() => handleQuickLog(temp)}
              disabled={isLoading}
              className={cn(
                "py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[44px]",
                selectedTemp === temp
                  ? "bg-[var(--color-health)] text-white"
                  : isNormal
                    ? "bg-[var(--color-growth)]/15 hover:bg-[var(--color-growth)]/25"
                    : "bg-[var(--color-health)]/15 hover:bg-[var(--color-health)]/25"
              )}
              style={{ color: selectedTemp === temp ? undefined : (isNormal ? 'var(--color-growth)' : 'var(--color-health)') }}
            >
              {selectedTemp === temp ? <Check className="w-3 h-3 mx-auto" /> : `${temp}°F`}
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

/**
 * Medicine Widget - Quick log common meds
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickMedicineWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMed, setSelectedMed] = useState<string | null>(null);
  const meds = [
    { name: "Tylenol", dosage: "2.5", unit: "ml" },
    { name: "Vit D", dosage: "1", unit: "ml" },
  ];

  const handleQuickLog = async (med: typeof meds[0]) => {
    setSelectedMed(med.name);
    setIsLoading(true);
    try {
      await api.health.medications.create({
        name: med.name,
        dosage: med.dosage,
        unit: med.unit,
        frequency: "as_needed",
        timestamp: new Date().toISOString(),
      });
      toast.success(`${med.name} logged!`);
    } catch {
      toast.error("Failed to log");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSelectedMed(null), 1000);
    }
  };

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-medicine)]/10 to-[var(--color-medicine)]/5">
      <Link href="/log/medication" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-medicine)] flex items-center justify-center shadow-lg shadow-[var(--color-medicine)]/20">
          <Pill className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Medicine</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <div className="flex flex-col gap-2">
        {meds.map((med) => (
          <button
            key={med.name}
            onClick={() => handleQuickLog(med)}
            disabled={isLoading}
            className={cn(
              "py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 min-h-[44px]",
              selectedMed === med.name
                ? "bg-[var(--color-medicine)] text-white"
                : "bg-[var(--color-medicine)]/15 hover:bg-[var(--color-medicine)]/25"
            )}
            style={{ color: selectedMed === med.name ? undefined : 'var(--color-medicine)' }}
          >
            {selectedMed === med.name ? <Check className="w-3 h-3" /> : <span>💊</span>}
            <span>{med.name} {med.dosage}{med.unit}</span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * Pump Widget - Quick log amounts
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickPumpWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const amounts = [60, 90, 120];

  const handleQuickLog = async (amount: number) => {
    setSelectedAmount(amount);
    setIsLoading(true);
    try {
      await api.feedings.create({
        type: "pumping",
        pumpedAmount: amount,
        pumpSide: "both",
        timestamp: new Date().toISOString(),
      });
      toast.success(`${amount}ml pumped!`);
    } catch {
      toast.error("Failed to log");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSelectedAmount(null), 1000);
    }
  };

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-tummy)]/10 to-[var(--color-tummy)]/5">
      <Link href="/log/feed?type=pumping" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-tummy)] flex items-center justify-center shadow-lg shadow-[var(--color-tummy)]/20">
          <Droplets className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Pump</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <div className="grid grid-cols-3 gap-2">
        {amounts.map((amount) => (
          <button
            key={amount}
            onClick={() => handleQuickLog(amount)}
            disabled={isLoading}
            className={cn(
              "py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[44px]",
              selectedAmount === amount
                ? "bg-[var(--color-tummy)] text-white"
                : "bg-[var(--color-tummy)]/15 hover:bg-[var(--color-tummy)]/25"
            )}
            style={{ color: selectedAmount === amount ? undefined : 'var(--color-tummy)' }}
          >
            {selectedAmount === amount ? <Check className="w-3 h-3 mx-auto" /> : `${amount}ml`}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * Solids Widget - Quick log food types
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickSolidsWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const foods = [
    { type: "puree", label: "Puree", emoji: "🥣" },
    { type: "finger", label: "Finger", emoji: "🥕" },
    { type: "cereal", label: "Cereal", emoji: "🥣" },
  ];

  const handleQuickLog = async (foodType: string) => {
    setSelectedFood(foodType);
    setIsLoading(true);
    try {
      await api.feedings.create({
        type: "solid",
        foodType,
        timestamp: new Date().toISOString(),
      });
      toast.success(`${foodType} logged!`);
    } catch {
      toast.error("Failed to log");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSelectedFood(null), 1000);
    }
  };

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-feed)]/10 to-[var(--color-feed)]/5">
      <Link href="/log/feed?type=solid" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-feed)] flex items-center justify-center shadow-lg shadow-[var(--color-feed)]/20">
          <Utensils className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Solids</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <div className="grid grid-cols-3 gap-2">
        {foods.map(({ type, label, emoji }) => (
          <button
            key={type}
            onClick={() => handleQuickLog(type)}
            disabled={isLoading}
            className={cn(
              "py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 active:scale-95 min-h-[44px]",
              selectedFood === type
                ? "bg-[var(--color-feed)] text-white"
                : "bg-[var(--color-feed)]/15 hover:bg-[var(--color-feed)]/25"
            )}
            style={{ color: selectedFood === type ? undefined : 'var(--color-feed)' }}
          >
            {selectedFood === type ? <Check className="w-3 h-3" /> : <span>{emoji}</span>}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * Symptom Widget - Quick log symptoms
 * @requirements 13.2, 13.3 - Uses GlassCard styling and GlassButton-style action buttons
 */
function QuickSymptomWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const symptoms = [
    { type: "cough", label: "Cough", emoji: "😷" },
    { type: "runny_nose", label: "Runny", emoji: "🤧" },
    { type: "rash", label: "Rash", emoji: "🔴" },
    { type: "fussiness", label: "Fussy", emoji: "😢" },
  ];

  const handleQuickLog = async (symptomType: string) => {
    setSelectedSymptom(symptomType);
    setIsLoading(true);
    try {
      await api.health.symptoms.create({
        symptomType,
        severity: "mild",
        timestamp: new Date().toISOString(),
      });
      toast.success("Symptom logged!");
    } catch {
      toast.error("Failed to log");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSelectedSymptom(null), 1000);
    }
  };

  return (
    <GlassCard size="sm" className="bg-gradient-to-br from-[var(--color-health)]/10 to-[var(--color-health)]/5">
      <Link href="/log/symptom" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-health)] flex items-center justify-center shadow-lg shadow-[var(--color-health)]/20">
          <Thermometer className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Symptom</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <div className="grid grid-cols-2 gap-2">
        {symptoms.map(({ type, label, emoji }) => (
          <button
            key={type}
            onClick={() => handleQuickLog(type)}
            disabled={isLoading}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all active:scale-95 min-h-[44px]",
              selectedSymptom === type
                ? "bg-[var(--color-health)] text-white"
                : "bg-[var(--color-health)]/15 hover:bg-[var(--color-health)]/25"
            )}
            style={{ color: selectedSymptom === type ? undefined : 'var(--color-health)' }}
          >
            {selectedSymptom === type ? <Check className="w-3 h-3" /> : <span className="text-sm">{emoji}</span>}
            <span className="text-[10px] font-bold">{label}</span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
