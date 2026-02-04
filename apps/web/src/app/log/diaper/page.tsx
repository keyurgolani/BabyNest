"use client";

import { useState } from "react";
import { Check, Droplets, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, DiaperType } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { LogFormWrapper } from "@/components/log/log-form-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassTextarea } from "@/components/ui/glass-textarea";

/**
 * Diaper Log Page
 *
 * Redesigned with glassmorphism components.
 *
 * @requirements 14.1 - Uses PageHeader with title and back navigation via LogFormWrapper
 * @requirements 14.2 - Uses GlassCard as form container
 * @requirements 14.3 - Uses GlassCard for type selection, GlassTextarea for notes
 * @requirements 14.4 - Uses GlassButton for form submission
 * @requirements 14.5 - All form inputs meet minimum 48px touch target
 * @requirements 14.6 - Maintains existing form functionality
 */

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

// Diaper type options with icons and colors
const DIAPER_TYPES: { value: DiaperType; label: string; icon: typeof Droplets; color: string; bgColor: string }[] = [
  { value: "wet", label: "Wet", icon: Droplets, color: "text-blue-500", bgColor: "bg-blue-500" },
  { value: "dirty", label: "Dirty", icon: Trash2, color: "text-amber-500", bgColor: "bg-amber-500" },
  { value: "mixed", label: "Both", icon: Check, color: "text-green-500", bgColor: "bg-green-500" },
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
  const activeConfig = DIAPER_TYPES.find(t => t.value === type)!;

  return (
    <MobileContainer>
      <div className="p-4 pb-32">
        <LogFormWrapper
          title="Log Diaper"
          backHref="/log"
          showCard={false}
        >
          <div className="space-y-6">
            {/* Type Selection - Requirement 14.3, 14.5 */}
            <div className="grid grid-cols-3 gap-3">
              {DIAPER_TYPES.map((diaperType) => {
                const isActive = type === diaperType.value;
                const Icon = diaperType.icon;
                return (
                  <GlassCard
                    key={diaperType.value}
                    interactive
                    variant={isActive ? "featured" : "default"}
                    size="default"
                    className={cn(
                      "flex flex-col items-center justify-center min-h-[100px] cursor-pointer transition-all duration-200",
                      isActive && `${diaperType.bgColor} border-transparent text-white shadow-lg -translate-y-1`
                    )}
                    onClick={() => setType(diaperType.value)}
                  >
                    <Icon className={cn("w-8 h-8 mb-2", isActive ? "text-white" : diaperType.color)} />
                    <span className="font-bold text-sm">{diaperType.label}</span>
                  </GlassCard>
                );
              })}
            </div>

            {/* Desktop: Side by side for mixed */}
            <div className={cn("grid gap-4", type === "mixed" ? "md:grid-cols-2" : "grid-cols-1")}>
              {/* Wet Details - Requirement 14.2, 14.5 */}
              {showWetDetails && (
                <GlassCard size="lg" className="space-y-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                  <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    Wet Amount
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {AMOUNT_OPTIONS.map((opt) => {
                      const isSelected = wetAmount === opt.value;
                      return (
                        <GlassButton
                          key={opt.value}
                          variant={isSelected ? "primary" : "default"}
                          onClick={() => setWetAmount(wetAmount === opt.value ? null : opt.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 py-3 h-auto min-h-[72px]",
                            isSelected && "bg-blue-500 shadow-lg"
                          )}
                        >
                          <span className="text-lg">{opt.emoji}</span>
                          <span className="text-sm font-bold">{opt.label}</span>
                        </GlassButton>
                      );
                    })}
                  </div>
                </GlassCard>
              )}

              {/* Dirty Details - Requirement 14.2, 14.5 */}
              {showDirtyDetails && (
                <GlassCard size="lg" className="space-y-4 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
                  <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Dirty Amount
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {AMOUNT_OPTIONS.map((opt) => {
                      const isSelected = dirtyAmount === opt.value;
                      return (
                        <GlassButton
                          key={opt.value}
                          variant={isSelected ? "primary" : "default"}
                          onClick={() => setDirtyAmount(dirtyAmount === opt.value ? null : opt.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 py-3 h-auto min-h-[72px]",
                            isSelected && "bg-amber-500 shadow-lg"
                          )}
                        >
                          <span className="text-lg">💩</span>
                          <span className="text-sm font-bold">{opt.label}</span>
                        </GlassButton>
                      );
                    })}
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Stool Details - Color & Consistency - Requirement 14.2, 14.5 */}
            {showDirtyDetails && (
              <GlassCard size="lg" className="space-y-5">
                {/* Color Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => {
                      const isSelected = color === c.value;
                      return (
                        <GlassButton
                          key={c.value}
                          variant={isSelected ? "primary" : "default"}
                          size="sm"
                          onClick={() => setColor(color === c.value ? null : c.value)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2",
                            isSelected && "bg-primary/10 border-primary text-primary"
                          )}
                        >
                          <span className={cn("w-4 h-4 rounded-full", c.bgClass)} />
                          {c.label}
                        </GlassButton>
                      );
                    })}
                  </div>
                </div>

                {/* Consistency Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Consistency</label>
                  <div className="flex flex-wrap gap-2">
                    {["Normal", "Soft", "Runny", "Hard", "Seedy", "Mucousy"].map((t) => {
                      const isSelected = consistency === t;
                      return (
                        <GlassButton
                          key={t}
                          variant={isSelected ? "primary" : "default"}
                          size="sm"
                          onClick={() => setConsistency(consistency === t ? null : t)}
                          className={cn(
                            "px-3 py-2",
                            isSelected && "bg-primary/10 border-primary text-primary"
                          )}
                        >
                          {t}
                        </GlassButton>
                      );
                    })}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Diaper Rash - Requirement 14.5 */}
            <div className="flex items-center gap-3 px-1">
              <GlassButton
                variant={hasRash ? "danger" : "default"}
                size="icon"
                onClick={() => setHasRash(!hasRash)}
                className={cn(
                  "w-8 h-8 min-w-[48px] min-h-[48px] rounded-lg",
                  hasRash && "bg-red-500 border-red-500 text-white"
                )}
              >
                {hasRash && <Check className="w-4 h-4" />}
              </GlassButton>
              <span className="text-sm font-medium text-foreground">Has diaper rash</span>
            </div>

            {/* Time - Requirement 14.3 */}
            <div className="space-y-2">
              <span id="diaper-time-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</span>
              <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
            </div>

            {/* Notes - Requirement 14.3 */}
            <div className="space-y-2">
              <label htmlFor="diaper-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
              <GlassTextarea
                id="diaper-notes"
                name="diaper-notes"
                placeholder="Any additional observations..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="min-h-[80px]"
              />
            </div>

            {/* Spacer for fixed button */}
            <div className="h-5" />
          </div>
        </LogFormWrapper>

        {/* Save Button - Requirement 14.4, 14.5 */}
        <div className="fixed bottom-32 left-4 right-4 z-50">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isLoading}
            className={cn(
              "w-full h-16 rounded-full text-lg shadow-xl",
              activeConfig.bgColor,
              `shadow-${activeConfig.bgColor.replace('bg-', '')}/20`
            )}
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Diaper
              </>
            )}
          </GlassButton>
        </div>
      </div>
    </MobileContainer>
  );
}
