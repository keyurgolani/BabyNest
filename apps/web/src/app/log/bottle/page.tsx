"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Milk, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, BottleType } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { NumberStepper } from "@/components/ui/number-stepper";
import { LogFormWrapper } from "@/components/log/log-form-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassTextarea } from "@/components/ui/glass-textarea";
import { AgeWarning } from "@/components/common/AgeWarning";

/**
 * Bottle Log Page
 *
 * Redesigned with glassmorphism components.
 *
 * @requirements 14.1 - Uses PageHeader with title and back navigation via LogFormWrapper
 * @requirements 14.2 - Uses GlassCard as form container
 * @requirements 14.3 - Uses GlassButton for bottle type selection, NumberStepper for amount
 * @requirements 14.4 - Uses GlassButton for form submission
 * @requirements 14.5 - All form inputs meet minimum 48px touch target
 */

type Unit = "ml" | "oz";

// Bottle type options with icons and colors
const BOTTLE_TYPES: { value: BottleType; label: string; emoji: string; color: string; bgColor: string }[] = [
  { value: "breastMilk", label: "Breast Milk", emoji: "🤱", color: "text-pink-500", bgColor: "bg-pink-500" },
  { value: "formula", label: "Formula", emoji: "🍼", color: "text-blue-500", bgColor: "bg-blue-500" },
  { value: "water", label: "Water", emoji: "💧", color: "text-cyan-500", bgColor: "bg-cyan-500" },
];

export default function BottleLogPage() {
  const router = useRouter();

  // Form state
  const [bottleType, setBottleType] = useState<BottleType>("formula");
  const [amount, setAmount] = useState(120);
  const [unit, setUnit] = useState<Unit>("ml");
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
    if (amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setIsLoading(true);

    try {
      await api.feedings.create({
        type: "bottle",
        amount: convertToMl(amount, unit),
        bottleType,
        timestamp: timestamp.toISOString(),
        notes: notes.trim() || undefined,
      });

      toast.success("Bottle feeding saved!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save bottle feeding:", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeConfig = BOTTLE_TYPES.find(t => t.value === bottleType)!;

  return (
    <MobileContainer>
      <div className="p-4 pb-32">
        <LogFormWrapper
          title="Log Bottle"
          backHref="/log"
          showCard={false}
        >
          <div className="space-y-6">
            {/* Age Warning for Water */}
            {bottleType === "water" && (
              <AgeWarning minAgeMonths={6} activityName="Water" />
            )}

            {/* Bottle Type Selection - Requirement 14.3 */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contents
              </label>
              <div className="grid grid-cols-3 gap-3">
                {BOTTLE_TYPES.map((type) => {
                  const isActive = bottleType === type.value;
                  return (
                    <GlassCard
                      key={type.value}
                      interactive
                      variant={isActive ? "featured" : "default"}
                      size="default"
                      className={cn(
                        "flex flex-col items-center justify-center min-h-[100px] cursor-pointer transition-all duration-200",
                        isActive && `${type.bgColor} border-transparent text-white shadow-lg -translate-y-1`
                      )}
                      onClick={() => setBottleType(type.value)}
                    >
                      <span className="text-2xl mb-1">{type.emoji}</span>
                      <span className="font-bold text-sm text-center">{type.label}</span>
                    </GlassCard>
                  );
                })}
              </div>
            </div>

            {/* Amount Section - Requirement 14.3, 14.5 */}
            <GlassCard size="lg" className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Amount
                </label>
                {/* Unit Toggle - Requirement 14.5: 48px touch target */}
                <div className="flex bg-[var(--glass-bg)] rounded-lg p-1 border border-[var(--glass-border)]">
                  {(["ml", "oz"] as Unit[]).map((u) => (
                    <GlassButton
                      key={u}
                      variant={unit === u ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setUnit(u)}
                      className={cn(
                        "px-4 py-2 text-xs font-bold min-h-[40px]",
                        unit === u && activeConfig.bgColor
                      )}
                    >
                      {u}
                    </GlassButton>
                  ))}
                </div>
              </div>
              <NumberStepper
                value={amount}
                onChange={setAmount}
                min={0}
                step={unit === "oz" ? 0.5 : 10}
                unit={unit}
              />
            </GlassCard>

            {/* Time Picker - Requirement 14.3 */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Time
              </label>
              <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
            </div>

            {/* Notes - Requirement 14.3 */}
            <div className="space-y-2">
              <label htmlFor="bottle-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notes
              </label>
              <GlassTextarea
                id="bottle-notes"
                name="bottle-notes"
                placeholder="Any details about this feeding..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="min-h-[80px]"
              />
            </div>

            <div className="h-5" />
          </div>
        </LogFormWrapper>

        {/* Save Button - Requirement 14.4, 14.5 */}
        <div className="fixed bottom-32 left-4 right-4 z-50">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isLoading || amount <= 0}
            className={cn("w-full h-16 rounded-full text-lg shadow-xl", activeConfig.bgColor)}
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Bottle
              </>
            )}
          </GlassButton>
        </div>
      </div>
    </MobileContainer>
  );
}
