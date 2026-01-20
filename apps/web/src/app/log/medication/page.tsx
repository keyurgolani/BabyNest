"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, MedicationFrequency } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";

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
      <div className="p-4 space-y-6 animate-slide-up pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/log" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Log Medication</h1>
        </div>

        {/* Medicine Name */}
        <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
          <div className="space-y-2">
            <label htmlFor="medicine-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Medicine Name</label>
            <input
              id="medicine-name"
              name="medicine-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tylenol, Vitamin D"
              className="w-full h-12 rounded-xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 px-4 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMON_MEDS.map((med) => (
              <button
                key={med}
                onClick={() => setName(med)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  name === med
                    ? "bg-purple-500 text-white"
                    : "bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25"
                )}
              >
                {med}
              </button>
            ))}
          </div>
        </Card>

        {/* Desktop: Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dosage */}
          <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
            <div className="space-y-2">
              <label htmlFor="dosage" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dosage</label>
              <div className="flex gap-3">
                <input
                  id="dosage"
                  name="dosage"
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="Amount (e.g. 2.5)"
                  className="flex-1 h-12 rounded-xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 px-4 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {UNITS.map((u) => (
                <button
                  key={u.value}
                  onClick={() => setUnit(u.value as typeof unit)}
                  className={cn(
                    "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                    unit === u.value
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Frequency */}
          <Card className="p-6 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
            <span id="frequency-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequency</span>
            <div className="flex flex-wrap gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  className={cn(
                    "px-3 py-2 rounded-xl font-bold text-sm transition-all",
                    frequency === f.value
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Desktop: Time and Notes Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Time */}
          <div className="space-y-2">
            <span id="time-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</span>
            <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="medication-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
            <textarea
              id="medication-notes"
              name="medication-notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any reactions or additional info..."
              className="w-full rounded-2xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 p-4 text-sm resize-none outline-none transition-all placeholder:text-muted-foreground/50"
              rows={2}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !dosage.trim() || isLoading}
            className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-purple-500/20 bg-purple-500 hover:bg-purple-600 text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : <><Pill className="w-5 h-5 mr-2" /> Save Medication</>}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
