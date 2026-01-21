"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, DiaperType, BottleType, ActivityType } from "@/lib/api-client";
import { useLogs } from "@/context/log-context";
import { 
  Baby, Moon, Droplets, Utensils, Bath, Gamepad2,
  Check, ChevronRight, Milk, Pill, Thermometer, Play, TreePine,
  Scale, Ruler, Circle
} from "lucide-react";

export default function QuickLogPage() {
  return (
    <MobileContainer>
      <div className="p-4 space-y-3 pb-32 overflow-y-auto">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-heading font-bold text-foreground">Quick Log</h1>
          <p className="text-sm text-muted-foreground">Tap to log instantly</p>
        </div>

        {/* Responsive grid - 2 cols on mobile, 3 on md, 4 on lg */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <QuickBottleWidget />
          <QuickDiaperWidget />
          <QuickSleepWidget />
          <QuickNursingWidget />
          <QuickTemperatureWidget />
          <QuickMedicineWidget />
          <QuickPumpWidget />
          <QuickSolidsWidget />
          <QuickActivityWidget />
          <QuickGrowthWidget />
          <QuickSymptomWidget />
        </div>
      </div>
    </MobileContainer>
  );
}

// Bottle Widget - Quick log common amounts
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
    <Card className="p-4 border-0 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
      <Link href="/log/feed?type=bottle" className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
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
              "py-3 rounded-xl text-sm font-bold transition-all",
              selectedAmount === amount
                ? "bg-orange-500 text-white"
                : "bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/25 active:scale-95"
            )}
          >
            {selectedAmount === amount ? <Check className="w-4 h-4 mx-auto" /> : `${amount}ml`}
          </button>
        ))}
      </div>
    </Card>
  );
}

// Diaper Widget - Quick log types
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
    <Card className="p-4 border-0 bg-gradient-to-br from-green-500/10 to-green-500/5">
      <Link href="/log/diaper" className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
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
              "py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              selectedType === type
                ? "bg-green-500 text-white"
                : "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 active:scale-95"
            )}
          >
            {selectedType === type ? <Check className="w-4 h-4" /> : <span>{emoji}</span>}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

// Sleep Widget - Start timer
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
    <Card className="p-4 border-0 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5">
      <Link href="/log/sleep" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Moon className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Sleep</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <button 
        onClick={isSleeping ? handleViewSleep : handleStartSleep}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 rounded-xl transition-all active:scale-95",
          isSleeping 
            ? "bg-indigo-500 text-white animate-pulse" 
            : "bg-indigo-500/15 hover:bg-indigo-500/25"
        )}
      >
        {isSleeping ? (
          <>
            <Moon className="w-5 h-5" />
            <span className="text-sm font-bold">Sleeping...</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Start Sleep</span>
          </>
        )}
      </button>
    </Card>
  );
}

// Nursing Widget - Start timer with side selection
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
    <Card className="p-4 border-0 bg-gradient-to-br from-pink-500/10 to-pink-500/5">
      <Link href="/log/feed" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
          <Baby className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Nursing</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      {isNursing ? (
        <button 
          onClick={handleViewNursing}
          className="w-full flex items-center justify-center gap-2 py-4 bg-pink-500 text-white rounded-xl transition-all active:scale-95 animate-pulse"
        >
          <Baby className="w-5 h-5" />
          <span className="text-sm font-bold">Nursing...</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleStartNursing("left")}
            className="flex items-center justify-center gap-1 py-3 bg-pink-500/15 hover:bg-pink-500/25 active:scale-95 rounded-xl transition-all"
          >
            <span className="text-sm font-bold text-pink-600 dark:text-pink-400">◀ Left</span>
          </button>
          <button 
            onClick={() => handleStartNursing("right")}
            className="flex items-center justify-center gap-1 py-3 bg-pink-500/15 hover:bg-pink-500/25 active:scale-95 rounded-xl transition-all"
          >
            <span className="text-sm font-bold text-pink-600 dark:text-pink-400">Right ▶</span>
          </button>
        </div>
      )}
    </Card>
  );
}

// Activity Widget - Quick log activities with timer
function QuickActivityWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  
  const activities = [
    { type: "tummy_time" as ActivityType, label: "Tummy", icon: Baby, color: "bg-cyan-500", duration: 5 },
    { type: "bath" as ActivityType, label: "Bath", icon: Bath, color: "bg-teal-500", duration: 15 },
    { type: "play" as ActivityType, label: "Play", icon: Gamepad2, color: "bg-violet-500", duration: 15 },
    { type: "outdoor" as ActivityType, label: "Outdoor", icon: TreePine, color: "bg-green-500", duration: 30 },
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
    <Card className="p-4 border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5">
      <Link href="/log/activity" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Gamepad2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground">Activity</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </Link>
      <div className="grid grid-cols-2 gap-2">
        {activities.map(({ type, label, icon: Icon, color, duration }) => (
          <button
            key={type}
            onClick={() => handleQuickLog(type, duration)}
            disabled={isLoading}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all active:scale-95",
              selectedActivity === type
                ? `${color} text-white`
                : "bg-cyan-500/15 hover:bg-cyan-500/25"
            )}
          >
            {selectedActivity === type ? (
              <Check className="w-4 h-4" />
            ) : (
              <Icon className={cn("w-4 h-4", selectedActivity === type ? "text-white" : "text-cyan-600 dark:text-cyan-400")} />
            )}
            <span className={cn("text-[10px] font-bold", selectedActivity === type ? "text-white" : "text-cyan-600 dark:text-cyan-400")}>{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

// Growth Widget - Quick log measurements
function QuickGrowthWidget() {
  const measurements = [
    { type: "weight", label: "Weight", icon: Scale, color: "bg-emerald-500" },
    { type: "height", label: "Height", icon: Ruler, color: "bg-blue-500" },
    { type: "head", label: "Head", icon: Circle, color: "bg-purple-500" },
  ];

  return (
    <Card className="p-4 border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
      <Link href="/log/growth" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
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
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-95",
              "bg-emerald-500/15 hover:bg-emerald-500/25"
            )}
          >
            <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

// Temperature Widget - Quick log common temps
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
    <Card className="p-4 border-0 bg-gradient-to-br from-rose-500/10 to-rose-500/5">
      <Link href="/log/temperature" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
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
                "py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95",
                selectedTemp === temp
                  ? "bg-rose-500 text-white"
                  : isNormal
                    ? "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25"
              )}
            >
              {selectedTemp === temp ? <Check className="w-3 h-3 mx-auto" /> : `${temp}°F`}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// Medicine Widget - Quick log common meds
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
    <Card className="p-4 border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
      <Link href="/log/medication" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
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
              "py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95",
              selectedMed === med.name
                ? "bg-blue-500 text-white"
                : "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
            )}
          >
            {selectedMed === med.name ? <Check className="w-3 h-3" /> : <span>💊</span>}
            <span>{med.name} {med.dosage}{med.unit}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

// Pump Widget - Quick log amounts
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
    <Card className="p-4 border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
      <Link href="/log/feed?type=pumping" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
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
              "py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95",
              selectedAmount === amount
                ? "bg-purple-500 text-white"
                : "bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25"
            )}
          >
            {selectedAmount === amount ? <Check className="w-3 h-3 mx-auto" /> : `${amount}ml`}
          </button>
        ))}
      </div>
    </Card>
  );
}

// Solids Widget - Quick log food types
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
    <Card className="p-4 border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
      <Link href="/log/feed?type=solid" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
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
              "py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 active:scale-95",
              selectedFood === type
                ? "bg-amber-500 text-white"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
            )}
          >
            {selectedFood === type ? <Check className="w-3 h-3" /> : <span>{emoji}</span>}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

// Symptom Widget - Quick log symptoms
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
    <Card className="p-4 border-0 bg-gradient-to-br from-red-500/10 to-red-500/5">
      <Link href="/log/symptom" className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
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
              "flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all active:scale-95",
              selectedSymptom === type
                ? "bg-red-500 text-white"
                : "bg-red-500/15 hover:bg-red-500/25"
            )}
          >
            {selectedSymptom === type ? <Check className="w-3 h-3" /> : <span className="text-sm">{emoji}</span>}
            <span className={cn("text-[10px] font-bold", selectedSymptom === type ? "text-white" : "text-red-600 dark:text-red-400")}>{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
