"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Save, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, SymptomSeverity } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";

const QUICK_TEMPS_F = [98.6, 99.5, 100.4, 101, 102, 103];
const QUICK_TEMPS_C = [37.0, 37.5, 38.0, 38.3, 38.9, 39.4];

export default function TemperatureLogPage() {
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
    <MobileContainer>
      <div className="p-4 space-y-6 animate-slide-up pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/log" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Log Temperature</h1>
        </div>

        {/* Temperature Display */}
        <Card className="p-6 border-0 bg-gradient-to-br from-card to-muted/20">
          <div className="flex flex-col items-center">
            {/* Large Temperature Input */}
            <div className="relative mb-4">
              <label htmlFor="temperature-input" className="sr-only">Temperature</label>
              <input
                id="temperature-input"
                name="temperature-input"
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder={tempUnit === "F" ? "98.6" : "37.0"}
                className="w-40 h-24 text-center text-5xl font-heading font-bold bg-transparent border-b-4 border-muted focus:border-primary outline-none transition-colors tabular-nums"
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
            <div className="flex bg-muted/50 rounded-xl p-1">
              <button
                onClick={() => setTempUnit("F")}
                className={cn(
                  "px-6 py-2 rounded-lg font-bold transition-all",
                  tempUnit === "F"
                    ? "bg-white dark:bg-black shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                °F
              </button>
              <button
                onClick={() => setTempUnit("C")}
                className={cn(
                  "px-6 py-2 rounded-lg font-bold transition-all",
                  tempUnit === "C"
                    ? "bg-white dark:bg-black shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                °C
              </button>
            </div>
          </div>
        </Card>

        {/* Quick Temperature Buttons */}
        <div className="space-y-2">
          <span id="quick-select-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Select</span>
          <div className="grid grid-cols-3 gap-2">
            {quickTemps.map((temp) => {
              const status = getTempStatus(temp.toString(), tempUnit);
              return (
                <button
                  key={temp}
                  onClick={() => handleQuickTemp(temp)}
                  className={cn(
                    "py-3 rounded-xl font-bold text-sm transition-all border-2",
                    temperature === temp.toString()
                      ? `${status?.bg || "bg-primary"} border-transparent text-white`
                      : "bg-card border-transparent text-muted-foreground hover:bg-muted"
                  )}
                >
                  {temp}°
                </button>
              );
            })}
          </div>
        </div>

        {/* Time */}
        <div className="space-y-2">
          <span id="temperature-when-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">When</span>
          <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="temperature-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
          <textarea
            id="temperature-notes"
            name="temperature-notes"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any observations (e.g., after bath, fussy, etc.)"
            className="w-full rounded-2xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 p-4 text-sm resize-none outline-none transition-all placeholder:text-muted-foreground/50"
            rows={2}
          />
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <Button
            onClick={handleSave}
            disabled={!temperature || isLoading}
            className={cn(
              "w-full h-16 rounded-full text-lg font-bold shadow-xl text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50",
              tempStatus?.bg || "bg-primary"
            )}
          >
            {isLoading ? "Saving..." : <><Thermometer className="w-5 h-5 mr-2" /> Save Temperature</>}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
