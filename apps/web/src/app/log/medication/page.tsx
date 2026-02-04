"use client";

import { useState } from "react";
import Link from "next/link";
import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, MedicationFrequency } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { LogFormWrapper } from "@/components/log/log-form-wrapper";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassTextarea } from "@/components/ui/glass-textarea";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";

const UNITS = [
  { value: "ml", label: "ml" },
  { value: "mg", label: "mg" },
  { value: "drops", label: "drops" },
  { value: "tablet", label: "tablet" },
];

const FREQUENCIES: { value: MedicationFrequency; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "as_needed", label: "As Needed" },
  { value: "daily", label: "Daily" },
  { value: "twice_daily", label: "Twice Daily" },
  { value: "every_4_hours", label: "Every 4h" },
  { value: "every_6_hours", label: "Every 6h" },
  { value: "every_8_hours", label: "Every 8h" },
];

const COMMON_MEDS = ["Tylenol", "Ibuprofen", "Vitamin D", "Gripe Water", "Gas Drops"];

export default function MedicationLogPage() {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState<"ml" | "mg" | "drops" | "tablet">("ml");
  const [frequency, setFrequency] = useState<MedicationFrequency>("as_needed");
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim()) {
      toast.error("Please enter medicine name and dosage.");
      return;
    }
    
    setIsLoading(true);
    try {
      await api.health.medications.create({
        name: name.trim(),
        dosage: dosage.trim(),
        unit,
        frequency,
        timestamp: timestamp.toISOString(),
        notes: note.trim() || undefined,
      });
      
      toast.success("Medication logged!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save medication:", err);
      toast.error("Failed to save medication. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileContainer>
      <div className="p-4 pb-32">
        <LogFormWrapper
          title="Log Medication"
          backHref="/log"
          showCard={false}
        >
          <div className="space-y-6">
            {/* Medicine Name Card */}
            <GlassCard size="lg" className="space-y-4">
              <div className="space-y-2">
                <label 
                  htmlFor="medicine-name" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Medicine Name
                </label>
                <GlassInput
                  id="medicine-name"
                  name="medicine-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tylenol, Vitamin D"
                  className="h-12"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_MEDS.map((med) => (
                  <GlassButton
                    key={med}
                    type="button"
                    variant={name === med ? "primary" : "default"}
                    size="sm"
                    onClick={() => setName(med)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold",
                      name === med
                        ? "bg-purple-500 hover:bg-purple-600"
                        : "bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25"
                    )}
                  >
                    {med}
                  </GlassButton>
                ))}
              </div>
            </GlassCard>

            {/* Desktop: Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dosage Card */}
              <GlassCard size="lg" className="space-y-4">
                <div className="space-y-2">
                  <label 
                    htmlFor="dosage" 
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Dosage
                  </label>
                  <GlassInput
                    id="dosage"
                    name="dosage"
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Amount (e.g. 2.5)"
                    className="h-12"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {UNITS.map((u) => (
                    <GlassButton
                      key={u.value}
                      type="button"
                      variant={unit === u.value ? "primary" : "default"}
                      size="sm"
                      onClick={() => setUnit(u.value as typeof unit)}
                      className={cn(
                        "px-4 py-2 font-bold text-sm",
                        unit === u.value
                          ? "bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/25"
                          : ""
                      )}
                    >
                      {u.label}
                    </GlassButton>
                  ))}
                </div>
              </GlassCard>

              {/* Frequency Card */}
              <GlassCard size="lg" className="space-y-4">
                <span 
                  id="frequency-label" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Frequency
                </span>
                <div className="flex flex-wrap gap-2">
                  {FREQUENCIES.map((f) => (
                    <GlassButton
                      key={f.value}
                      type="button"
                      variant={frequency === f.value ? "primary" : "default"}
                      size="sm"
                      onClick={() => setFrequency(f.value)}
                      className={cn(
                        "px-3 py-2 font-bold text-sm",
                        frequency === f.value
                          ? "bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/25"
                          : ""
                      )}
                    >
                      {f.label}
                    </GlassButton>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Desktop: Time and Notes Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time */}
              <GlassCard size="lg" className="space-y-2">
                <span 
                  id="time-label" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Time
                </span>
                <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
              </GlassCard>

              {/* Notes */}
              <GlassCard size="lg" className="space-y-2">
                <label 
                  htmlFor="medication-notes" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Notes
                </label>
                <GlassTextarea
                  id="medication-notes"
                  name="medication-notes"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any reactions or additional info..."
                  className="min-h-[80px]"
                  rows={2}
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
            disabled={!name.trim() || !dosage.trim() || isLoading}
            variant="primary"
            size="lg"
            className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-purple-500/20 bg-purple-500 hover:bg-purple-600 text-white"
          >
            {isLoading ? "Saving..." : <><Pill className="w-5 h-5 mr-2" /> Save Medication</>}
          </GlassButton>
        </div>
      </div>
    </MobileContainer>
  );
}
