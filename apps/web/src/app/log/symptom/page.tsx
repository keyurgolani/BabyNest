"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Save, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, SymptomSeverity } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";

const SYMPTOMS = [
  { value: "fever", label: "Fever", emoji: "🤒" },
  { value: "cough", label: "Cough", emoji: "😷" },
  { value: "runny_nose", label: "Runny Nose", emoji: "🤧" },
  { value: "rash", label: "Rash", emoji: "🔴" },
  { value: "vomiting", label: "Vomiting", emoji: "🤮" },
  { value: "diarrhea", label: "Diarrhea", emoji: "💩" },
  { value: "fussiness", label: "Fussy", emoji: "😢" },
  { value: "other", label: "Other", emoji: "❓" },
];

const SEVERITIES: { value: SymptomSeverity; label: string; color: string; bgColor: string }[] = [
  { value: "mild", label: "Mild", color: "text-yellow-500", bgColor: "bg-yellow-500" },
  { value: "moderate", label: "Moderate", color: "text-orange-500", bgColor: "bg-orange-500" },
  { value: "severe", label: "Severe", color: "text-red-500", bgColor: "bg-red-500" },
];

export default function SymptomLogPage() {
  return (
    <Suspense fallback={<SymptomPageLoading />}>
      <SymptomLogPageContent />
    </Suspense>
  );
}

function SymptomPageLoading() {
  return (
    <MobileContainer>
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-lg w-1/3" />
        <div className="h-32 bg-muted rounded-2xl" />
      </div>
    </MobileContainer>
  );
}

function SymptomLogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "";

  const [symptom, setSymptom] = useState(initialType);
  const [severity, setSeverity] = useState<SymptomSeverity>("mild");
  const [temperature, setTemperature] = useState("");
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Convert temperature to Celsius for API
  const convertToCelsius = (temp: string, unit: "F" | "C"): number | undefined => {
    if (!temp) return undefined;
    const tempNum = parseFloat(temp);
    if (isNaN(tempNum)) return undefined;
    if (unit === "F") {
      return Math.round(((tempNum - 32) * 5 / 9) * 10) / 10;
    }
    return tempNum;
  };

  const handleSave = async () => {
    if (!symptom) {
      toast.error("Please select a symptom.");
      return;
    }
    
    setIsLoading(true);
    try {
      const tempCelsius = convertToCelsius(temperature, tempUnit);
      
      await api.health.symptoms.create({
        symptomType: symptom.toLowerCase(),
        severity,
        temperature: tempCelsius,
        timestamp: timestamp.toISOString(),
        notes: note.trim() || undefined,
      });
      
      toast.success("Symptom logged!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save symptom:", err);
      toast.error("Failed to save symptom. Please try again.");
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
          <h1 className="text-2xl font-heading font-bold text-foreground">Log Symptom</h1>
        </div>

        {/* Symptom Type */}
        <div className="space-y-2">
          <span id="symptom-type-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Symptom</span>
          <div className="grid grid-cols-4 gap-2">
            {SYMPTOMS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSymptom(s.value)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-2xl transition-all border-2",
                  symptom === s.value
                    ? "bg-red-500 border-transparent text-white shadow-lg shadow-red-500/25"
                    : "bg-card border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="text-2xl mb-1">{s.emoji}</span>
                <span className="text-[10px] font-bold">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Severity */}
          <Card className="p-5 space-y-3 border-0 bg-gradient-to-br from-card to-muted/20">
            <span id="severity-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</span>
            <div className="grid grid-cols-3 gap-3">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSeverity(s.value)}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-sm transition-all flex flex-col items-center gap-2 border-2",
                    severity === s.value
                      ? `${s.bgColor} border-transparent text-white shadow-lg`
                      : "bg-card border-transparent text-muted-foreground hover:bg-muted"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full", severity === s.value ? "bg-white" : s.bgColor)} />
                  {s.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Temperature */}
          <Card className="p-5 space-y-3 border-0 bg-gradient-to-br from-card to-muted/20">
            <label htmlFor="symptom-temperature" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temperature (Optional)</label>
            <div className="flex gap-3">
              <input
                id="symptom-temperature"
                name="symptom-temperature"
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder={tempUnit === "F" ? "e.g. 101.5" : "e.g. 38.5"}
                className="flex-1 h-12 rounded-xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 px-4 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => setTempUnit("F")}
                  className={cn(
                    "px-4 h-12 rounded-xl font-bold transition-all",
                    tempUnit === "F"
                      ? "bg-red-500 text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  °F
                </button>
                <button
                  onClick={() => setTempUnit("C")}
                  className={cn(
                    "px-4 h-12 rounded-xl font-bold transition-all",
                    tempUnit === "C"
                      ? "bg-red-500 text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  °C
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Desktop: Time and Notes Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Time */}
          <div className="space-y-2">
            <span id="symptom-when-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">When</span>
            <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="symptom-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
            <textarea
              id="symptom-notes"
              name="symptom-notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="When did it start? Any other observations..."
              className="w-full rounded-2xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 p-4 text-sm resize-none outline-none transition-all placeholder:text-muted-foreground/50"
              rows={2}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <Button
            onClick={handleSave}
            disabled={!symptom || isLoading}
            className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-red-500/20 bg-red-500 hover:bg-red-600 text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : <><Thermometer className="w-5 h-5 mr-2" /> Save Symptom</>}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
