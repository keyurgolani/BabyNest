"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    <div className="p-4 space-y-6 animate-pulse">
      <div className="h-10 bg-white/10 rounded-lg w-1/3" />
      <div className="h-32 bg-white/10 rounded-3xl" />
    </div>
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
    <div className="p-4 pb-32">
      <LogFormWrapper
        title="Log Symptom"
        backHref="/log"
        showCard={false}
      >
        <div className="space-y-6">
          {/* Symptom Type Selection */}
          <GlassCard size="lg" className="space-y-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Symptom
            </span>
            <div className="grid grid-cols-4 gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSymptom(s.value)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl transition-all border min-h-[48px]",
                    symptom === s.value
                      ? "bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/25"
                      : "bg-[var(--glass-bg)] border-[var(--glass-border)] text-muted-foreground hover:bg-[var(--glass-bg-hover)]"
                  )}
                >
                  <span className="text-2xl mb-1">{s.emoji}</span>
                  <span className="text-[10px] font-bold">{s.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Desktop: Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Severity */}
            <GlassCard size="lg" className="space-y-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Severity
              </span>
              <div className="grid grid-cols-3 gap-3">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSeverity(s.value)}
                    className={cn(
                      "py-4 rounded-2xl font-bold text-sm transition-all flex flex-col items-center gap-2 border min-h-[48px]",
                      severity === s.value
                        ? `${s.bgColor} border-transparent text-white shadow-lg`
                        : "bg-[var(--glass-bg)] border-[var(--glass-border)] text-muted-foreground hover:bg-[var(--glass-bg-hover)]"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-full", severity === s.value ? "bg-white" : s.bgColor)} />
                    {s.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Temperature */}
            <GlassCard size="lg" className="space-y-4">
              <label htmlFor="symptom-temperature" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Temperature (Optional)
              </label>
              <div className="flex gap-3">
                <GlassInput
                  id="symptom-temperature"
                  name="symptom-temperature"
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder={tempUnit === "F" ? "e.g. 101.5" : "e.g. 38.5"}
                  className="flex-1 min-h-[48px]"
                />
                <div className="flex gap-1">
                  <GlassButton
                    onClick={() => setTempUnit("F")}
                    variant={tempUnit === "F" ? "danger" : "default"}
                    className="px-4"
                  >
                    °F
                  </GlassButton>
                  <GlassButton
                    onClick={() => setTempUnit("C")}
                    variant={tempUnit === "C" ? "danger" : "default"}
                    className="px-4"
                  >
                    °C
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </div>

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
              <label htmlFor="symptom-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notes
              </label>
              <GlassTextarea
                id="symptom-notes"
                name="symptom-notes"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="When did it start? Any other observations..."
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
          disabled={!symptom || isLoading}
          variant="danger"
          size="lg"
          className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-red-500/20"
        >
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              <Thermometer className="w-5 h-5 mr-2" />
              Save Symptom
            </>
          )}
        </GlassButton>
      </div>
    </div>
  );
}
