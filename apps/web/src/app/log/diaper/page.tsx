"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Check, Droplets, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, DiaperType } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";

const COLOR_OPTIONS = [
  { value: "yellow", label: "Yellow", bgClass: "bg-yellow-400" },
  { value: "brown", label: "Brown", bgClass: "bg-amber-700" },
  { value: "green", label: "Green", bgClass: "bg-green-600" },
  { value: "black", label: "Black", bgClass: "bg-gray-900" },
  { value: "orange", label: "Orange", bgClass: "bg-orange-500" },
  { value: "red", label: "Red (blood)", bgClass: "bg-red-600" },
];

const AMOUNT_OPTIONS = [
  { value: "light", label: "Light", emoji: "💧" },
  { value: "medium", label: "Medium", emoji: "💧💧" },
  { value: "heavy", label: "Heavy", emoji: "💧💧💧" },
];

export default function DiaperLogPage() {
  const [type, setType] = useState<DiaperType>("wet");
  const [wetAmount, setWetAmount] = useState<string | null>(null);
  const [dirtyAmount, setDirtyAmount] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [consistency, setConsistency] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [hasRash, setHasRash] = useState(false);
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Build notes with amount info
      const noteParts: string[] = [];
      if ((type === "wet" || type === "mixed") && wetAmount) {
        noteParts.push(`Wet: ${wetAmount}`);
      }
      if ((type === "dirty" || type === "mixed") && dirtyAmount) {
        noteParts.push(`Dirty: ${dirtyAmount}`);
      }
      if (note.trim()) {
        noteParts.push(note.trim());
      }

      await api.diapers.create({
        type,
        color: color || undefined,
        consistency: consistency || undefined,
        hasRash,
        timestamp: timestamp.toISOString(),
        notes: noteParts.length > 0 ? noteParts.join(". ") : undefined,
      });
      toast.success("Diaper logged!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save diaper:", err);
      toast.error("Failed to save diaper. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const showWetDetails = type === "wet" || type === "mixed";
  const showDirtyDetails = type === "dirty" || type === "mixed";

  return (
    <MobileContainer>
      <div className="p-4 space-y-6 animate-slide-up pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Log Diaper</h1>
        </div>

        {/* Type Selection */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setType("wet")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 border-2",
              type === "wet"
                ? "bg-blue-500 border-transparent text-white shadow-lg shadow-blue-500/25 -translate-y-1"
                : "bg-card border-transparent text-muted-foreground hover:bg-muted"
            )}
          >
            <Droplets className={cn("w-8 h-8 mb-2", type === "wet" ? "text-white" : "text-blue-500")} />
            <span className="font-bold text-sm">Wet</span>
          </button>

          <button
            onClick={() => setType("dirty")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 border-2",
              type === "dirty"
                ? "bg-amber-500 border-transparent text-white shadow-lg shadow-amber-500/25 -translate-y-1"
                : "bg-card border-transparent text-muted-foreground hover:bg-muted"
            )}
          >
            <Trash2 className={cn("w-8 h-8 mb-2", type === "dirty" ? "text-white" : "text-amber-500")} />
            <span className="font-bold text-sm">Dirty</span>
          </button>

          <button
            onClick={() => setType("mixed")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 border-2",
              type === "mixed"
                ? "bg-green-500 border-transparent text-white shadow-lg shadow-green-500/25 -translate-y-1"
                : "bg-card border-transparent text-muted-foreground hover:bg-muted"
            )}
          >
            <Check className={cn("w-8 h-8 mb-2", type === "mixed" ? "text-white" : "text-green-500")} />
            <span className="font-bold text-sm">Both</span>
          </button>
        </div>

        {/* Desktop: Side by side for mixed */}
        <div className={cn("grid gap-4", type === "mixed" ? "md:grid-cols-2" : "grid-cols-1")}>
          {/* Wet Details */}
          {showWetDetails && (
            <Card className="p-5 space-y-4 border-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Wet Amount
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {AMOUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setWetAmount(wetAmount === opt.value ? null : opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-3 rounded-xl font-bold text-sm transition-all border-2",
                      wetAmount === opt.value
                        ? "bg-blue-500 border-transparent text-white shadow-lg"
                        : "bg-card border-transparent text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Dirty Details */}
          {showDirtyDetails && (
            <Card className="p-5 space-y-4 border-0 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
              <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Dirty Amount
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {AMOUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDirtyAmount(dirtyAmount === opt.value ? null : opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-3 rounded-xl font-bold text-sm transition-all border-2",
                      dirtyAmount === opt.value
                        ? "bg-amber-500 border-transparent text-white shadow-lg"
                        : "bg-card border-transparent text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className="text-lg">💩</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Stool Details - Color & Consistency */}
        {showDirtyDetails && (
          <Card className="p-5 space-y-5 border-0 bg-gradient-to-br from-card to-muted/20">
            {/* Color Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(color === c.value ? null : c.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border-2",
                      color === c.value
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/50 border-transparent hover:bg-muted"
                    )}
                  >
                    <span className={cn("w-4 h-4 rounded-full", c.bgClass)} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consistency Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Consistency</label>
              <div className="flex flex-wrap gap-2">
                {["Normal", "Soft", "Runny", "Hard", "Seedy", "Mucousy"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setConsistency(consistency === t ? null : t)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm font-medium transition-all border-2",
                      consistency === t
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/50 border-transparent hover:bg-muted"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Diaper Rash */}
        <div className="flex items-center gap-3 px-1">
          <button
            onClick={() => setHasRash(!hasRash)}
            className={cn(
              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
              hasRash
                ? "bg-red-500 border-red-500 text-white"
                : "border-muted-foreground/30"
            )}
          >
            {hasRash && <Check className="w-4 h-4" />}
          </button>
          <span className="text-sm font-medium text-foreground">Has diaper rash</span>
        </div>

        {/* Time */}
        <div className="space-y-2">
          <span id="diaper-time-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</span>
          <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="diaper-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
          <textarea
            id="diaper-notes"
            name="diaper-notes"
            className="w-full rounded-2xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 p-4 text-sm resize-none outline-none transition-all placeholder:text-muted-foreground/50"
            placeholder="Any additional observations..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className={cn(
              "w-full h-16 rounded-full text-lg font-bold shadow-xl text-white transition-all hover:scale-[1.02] active:scale-95",
              type === "wet" ? "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20" :
              type === "dirty" ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" :
              "bg-green-500 hover:bg-green-600 shadow-green-500/20"
            )}
          >
            {isLoading ? "Saving..." : <><Save className="w-5 h-5 mr-2" /> Save Diaper</>}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
