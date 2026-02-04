"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, SymptomSeverity } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { LogFormWrapper } from "@/components/log/log-form-wrapper";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassTextarea } from "@/components/ui/glass-textarea";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";

const QUICK_TEMPS_F = [98.6, 99.5, 100.4, 101, 102, 103];
const QUICK_TEMPS_C = [37.0, 37.5, 38.0, 38.3, 38.9, 39.4];

export default function TemperatureLogPage() {
  return (
    <Suspense fallback={<TemperaturePageLoading />}>
      <TemperatureLogPageContent />
    </Suspense>
  );
}

function TemperaturePageLoading() {
  return (
    <div className="p-4 space-y-6 animate-pulse">
      <div className="h-10 bg-white/10 rounded-lg w-1/3" />
      <div className="h-32 bg-white/10 rounded-3xl" />
    </div>
  );
}

function TemperatureLogPageContent() {
  const [temperature, setTemperature] = useState("");
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const quickTemps = tempUnit === "F" ? QUICK_TEMPS_F : QUICK_TEMPS_C;

  // Convert to Celsius for API
  const convertToCelsius = (temp: number, unit: "F" | "C"): number => {
    if (unit === "F") {
      return Math.round(((temp - 32) * 5 / 9) * 10) / 10;
    }
    return temp;
  };

  // Determine severity based on temperature
  const getSeverity = (tempC: number): SymptomSeverity => {
    // High fever
    if (tempC >= 39.4) return "severe"; // 103°F+
    if (tempC >= 38.3) return "moderate"; // 101°F+
    if (tempC >= 37.8) return "mild"; // 100°F+
    // Low temperature (hypothermia)
    if (tempC < 35.0) return "severe"; // Below 95°F
    if (tempC < 36.0) return "moderate"; // Below 96.8°F
    if (tempC < 36.5) return "mild"; // Below 97.7°F
    return "mild";
  };

  // Get temperature status
  const getTempStatus = (temp: string, unit: "F" | "C") => {
    if (!temp) return null;
    const tempNum = parseFloat(temp);
    if (isNaN(tempNum)) return null;
    
    const tempC = convertToCelsius(tempNum, unit);
    
    // High temperatures
    if (tempC >= 39.4) return { label: "High Fever", color: "text-red-500", bg: "bg-red-500" };
    if (tempC >= 38.3) return { label: "Fever", color: "text-orange-500", bg: "bg-orange-500" };
    if (tempC >= 37.8) return { label: "Low-grade", color: "text-yellow-500", bg: "bg-yellow-500" };
    // Low temperatures (hypothermia)
    if (tempC < 35.0) return { label: "Hypothermia", color: "text-blue-600", bg: "bg-blue-600" };
    if (tempC < 36.0) return { label: "Low", color: "text-blue-500", bg: "bg-blue-500" };
    if (tempC < 36.5) return { label: "Slightly Low", color: "text-sky-500", bg: "bg-sky-500" };
    // Normal range: 36.5°C - 37.8°C (97.7°F - 100°F)
    return { label: "Normal", color: "text-green-500", bg: "bg-green-500" };
  };

  const tempStatus = getTempStatus(temperature, tempUnit);

  const handleQuickTemp = (temp: number) => {
    setTemperature(temp.toString());
  };

  const handleSave = async () => {
    if (!temperature) {
      toast.error("Please enter a temperature.");
      return;
    }

    const tempNum = parseFloat(temperature);
    if (isNaN(tempNum)) {
      toast.error("Please enter a valid temperature.");
      return;
    }

    setIsLoading(true);
    try {
      const tempCelsius = convertToCelsius(tempNum, tempUnit);
      const severity = getSeverity(tempCelsius);
      
      await api.health.symptoms.create({
        symptomType: "fever",
        severity,
        temperature: tempCelsius,
        timestamp: timestamp.toISOString(),
        notes: note.trim() || undefined,
      });
      
      toast.success("Temperature logged!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save temperature:", err);
      toast.error("Failed to save temperature. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 pb-32">
      <LogFormWrapper
        title="Log Temperature"
        backHref="/log"
        showCard={false}
      >
        <div className="space-y-6">
          {/* Temperature Display Card */}
          <GlassCard size="lg" className="space-y-4">
            <div className="flex flex-col items-center">
              {/* Large Temperature Input */}
              <div className="relative mb-4">
                <label htmlFor="temperature-input" className="sr-only">Temperature</label>
                <GlassInput
                  id="temperature-input"
                  name="temperature-input"
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder={tempUnit === "F" ? "98.6" : "37.0"}
                  className="w-40 h-24 text-center text-5xl font-heading font-bold border-b-4 border-[var(--glass-border)] focus:border-primary rounded-none px-0 tabular-nums min-h-[48px]"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                  °{tempUnit}
                </span>
              </div>

              {/* Status Badge */}
              {tempStatus && (
                <div className={cn("px-4 py-2 rounded-full text-sm font-bold text-white mb-4", tempStatus.bg)}>
                  {tempStatus.label}
                </div>
              )}

              {/* Unit Toggle */}
              <div className="flex gap-2">
                <GlassButton
                  onClick={() => setTempUnit("F")}
                  variant={tempUnit === "F" ? "primary" : "default"}
                  className="px-6"
                >
                  °F
                </GlassButton>
                <GlassButton
                  onClick={() => setTempUnit("C")}
                  variant={tempUnit === "C" ? "primary" : "default"}
                  className="px-6"
                >
                  °C
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {/* Quick Temperature Buttons */}
          <GlassCard size="lg" className="space-y-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Select
            </span>
            <div className="grid grid-cols-3 gap-2">
              {quickTemps.map((temp) => {
                const status = getTempStatus(temp.toString(), tempUnit);
                const isSelected = temperature === temp.toString();
                return (
                  <GlassButton
                    key={temp}
                    onClick={() => handleQuickTemp(temp)}
                    variant={isSelected ? "primary" : "default"}
                    className={cn(
                      "py-3 font-bold text-sm min-h-[48px]",
                      isSelected && status?.bg && `${status.bg} border-transparent text-white`
                    )}
                  >
                    {temp}°
                  </GlassButton>
                );
              })}
            </div>
          </GlassCard>

          {/* Desktop: Time and Notes Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time */}
            <GlassCard size="lg" className="space-y-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                When
              </span>
              <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
            </GlassCard>

            {/* Notes */}
            <GlassCard size="lg" className="space-y-4">
              <label htmlFor="temperature-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notes
              </label>
              <GlassTextarea
                id="temperature-notes"
                name="temperature-notes"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any observations (e.g., after bath, fussy, etc.)"
                rows={2}
                className="min-h-[80px]"
              />
            </GlassCard>
          </div>

          {/* Spacer for fixed button */}
          <div className="h-5" />
        </div>
      </LogFormWrapper>

      {/* Save Button - Fixed at bottom */}
      <div className="fixed bottom-32 left-4 right-4 z-50">
        <GlassButton
          onClick={handleSave}
          disabled={!temperature || isLoading}
          variant="primary"
          size="lg"
          className={cn(
            "w-full h-16 rounded-full text-lg font-bold shadow-xl",
            tempStatus?.bg && `${tempStatus.bg} shadow-${tempStatus.bg.replace('bg-', '')}/20`
          )}
        >
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              <Thermometer className="w-5 h-5 mr-2" />
              Save Temperature
            </>
          )}
        </GlassButton>
      </div>
    </div>
  );
}
