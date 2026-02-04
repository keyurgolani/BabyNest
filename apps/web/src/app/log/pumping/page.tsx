"use client";

import { useState } from "react";
import { Droplets, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, PumpSide } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { NumberStepper } from "@/components/ui/number-stepper";
import { LogFormWrapper } from "@/components/log/log-form-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassTextarea } from "@/components/ui/glass-textarea";

/**
 * Pumping Log Page
 *
 * Redesigned with glassmorphism components.
 *
 * @requirements 14.1 - Uses PageHeader with title and back navigation via LogFormWrapper
 * @requirements 14.2 - Uses GlassCard as form container
 * @requirements 14.3 - Uses GlassInput for text inputs
 * @requirements 14.4 - Uses GlassButton for submit/cancel actions
 * @requirements 14.5 - Ensures 48px minimum touch targets
 * @requirements 14.6 - Maintains existing form functionality
 */

type Unit = "ml" | "oz";

// Pump side options
const PUMP_SIDES: { value: PumpSide; label: string; emoji: string }[] = [
  { value: "left", label: "Left", emoji: "👈" },
  { value: "right", label: "Right", emoji: "👉" },
  { value: "both", label: "Both", emoji: "🤲" },
];

export default function PumpingLogPage() {
  const router = useRouter();
  
  // Form state
  const [pumpAmount, setPumpAmount] = useState(100);
  const [pumpUnit, setPumpUnit] = useState<Unit>("ml");
  const [pumpSide, setPumpSide] = useState<PumpSide>("both");
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const convertToMl = (value: number, fromUnit: Unit): number => {
    if (fromUnit === "oz") {
      return Math.round(value * 29.5735);
    }
    return value;
  };

  const handleSave = async () => {
    if (pumpAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setIsLoading(true);

    try {
      await api.feedings.create({
        type: "pumping",
        pumpedAmount: convertToMl(pumpAmount, pumpUnit),
        pumpSide,
        timestamp: timestamp.toISOString(),
        notes: notes.trim() || undefined,
      });

      toast.success("Pumping session saved!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save pumping session:", err);
      toast.error("Failed to save pumping session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileContainer>
      <div className="p-4 pb-32">
        <LogFormWrapper
          title="Log Pumping"
          backHref="/log"
          showCard={false}
        >
          <div className="space-y-6 animate-fade-in">
            {/* Side Selection Card */}
            <GlassCard size="lg" className="space-y-4">
              <span 
                id="pump-side-label" 
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Side
              </span>
              <div className="grid grid-cols-3 gap-3">
                {PUMP_SIDES.map((s) => (
                  <GlassButton
                    key={s.value}
                    variant={pumpSide === s.value ? "primary" : "default"}
                    onClick={() => setPumpSide(s.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-4 h-auto",
                      pumpSide === s.value && "bg-purple-500 shadow-lg shadow-purple-500/25"
                    )}
                    aria-pressed={pumpSide === s.value}
                    aria-labelledby="pump-side-label"
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="font-bold text-sm">{s.label}</span>
                  </GlassButton>
                ))}
              </div>
            </GlassCard>

            {/* Amount Card */}
            <GlassCard size="lg" className="space-y-4">
              <div className="flex justify-between items-center">
                <label 
                  htmlFor="pump-amount" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Amount
                </label>
                <div className="flex bg-[var(--glass-bg)] rounded-lg p-1 border border-[var(--glass-border)]">
                  {(["ml", "oz"] as Unit[]).map((u) => (
                    <GlassButton
                      key={u}
                      variant={pumpUnit === u ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setPumpUnit(u)}
                      className={cn(
                        "px-4 py-1.5 text-xs font-bold min-h-[36px]",
                        pumpUnit === u && "bg-purple-500"
                      )}
                    >
                      {u}
                    </GlassButton>
                  ))}
                </div>
              </div>
              <NumberStepper 
                value={pumpAmount}
                onChange={setPumpAmount}
                min={0}
                step={pumpUnit === "oz" ? 0.5 : 10}
                unit={pumpUnit}
              />
            </GlassCard>

            {/* Desktop: Time and Notes Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Card */}
              <GlassCard size="lg" className="space-y-2">
                <span 
                  id="pump-time-label" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Time
                </span>
                <TimeAgoPicker 
                  value={timestamp} 
                  onChange={setTimestamp} 
                  id="pump-time-picker"
                />
              </GlassCard>

              {/* Notes Card */}
              <GlassCard size="lg" className="space-y-2">
                <label 
                  htmlFor="pump-notes" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Notes
                </label>
                <GlassTextarea
                  id="pump-notes"
                  name="pump-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any details about this session..."
                  className="min-h-[80px]"
                  rows={2}
                />
              </GlassCard>
            </div>

            {/* Spacer for fixed button */}
            <div className="h-5" />
          </div>
        </LogFormWrapper>

        {/* Save Button - Fixed at bottom - Requirement 14.4, 14.5 */}
        <div className="fixed bottom-32 left-4 right-4 z-50">
          <GlassButton
            onClick={handleSave}
            disabled={pumpAmount <= 0 || isLoading}
            variant="primary"
            size="lg"
            className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-purple-500/20 bg-purple-500 hover:bg-purple-600 text-white transition-all hover:scale-[1.02] active:scale-95"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Droplets className="w-5 h-5 mr-2" />
                Save Pumping
              </>
            )}
          </GlassButton>
        </div>
      </div>
    </MobileContainer>
  );
}
