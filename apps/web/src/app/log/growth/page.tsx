"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, Ruler, Scale, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { LogFormWrapper } from "@/components/log/log-form-wrapper";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassTextarea } from "@/components/ui/glass-textarea";

/**
 * Growth Log Page
 *
 * Redesigned with glassmorphism components.
 *
 * @requirements 14.1 - Uses PageHeader with title and back navigation via LogFormWrapper
 * @requirements 14.2 - Uses GlassCard as form container
 * @requirements 14.3 - Uses GlassCard for measurement type selection, GlassTextarea for notes
 * @requirements 14.4 - Uses GlassButton for form submission
 * @requirements 14.5 - All form inputs meet minimum 48px touch target
 * @requirements 14.6 - Maintains existing form functionality
 */

// Measurement type configuration
type MeasurementType = "weight" | "height" | "head";

const MEASUREMENT_TYPES: { key: MeasurementType; label: string; icon: typeof Scale; color: string; bgColor: string; description: string; unit: string; step: number; min: number; max: number; defaultValue: number }[] = [
  { key: "weight", label: "Weight", icon: Scale, color: "text-emerald-500", bgColor: "bg-emerald-500", description: "Track weight", unit: "kg", step: 0.1, min: 0.5, max: 30, defaultValue: 5 },
  { key: "height", label: "Height", icon: Ruler, color: "text-blue-500", bgColor: "bg-blue-500", description: "Track length/height", unit: "cm", step: 0.5, min: 30, max: 150, defaultValue: 50 },
  { key: "head", label: "Head", icon: Circle, color: "text-purple-500", bgColor: "bg-purple-500", description: "Head circumference", unit: "cm", step: 0.1, min: 25, max: 60, defaultValue: 35 },
];

export default function GrowthLogPage() {
  return (
    <Suspense fallback={<GrowthPageLoading />}>
      <GrowthLogPageContent />
    </Suspense>
  );
}

function GrowthPageLoading() {
  return (
    <MobileContainer>
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-lg w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    </MobileContainer>
  );
}


function GrowthLogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") as MeasurementType | null;

  // State
  const [measurementType, setMeasurementType] = useState<MeasurementType>(initialType || "weight");
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [timestamp, setTimestamp] = useState<Date>(new Date());

  // Measurement values
  const [weight, setWeight] = useState(5);
  const [height, setHeight] = useState(50);
  const [head, setHead] = useState(35);

  const activeConfig = MEASUREMENT_TYPES.find(t => t.key === measurementType)!;

  const getCurrentValue = () => {
    switch (measurementType) {
      case "weight": return weight;
      case "height": return height;
      case "head": return head;
    }
  };

  const setCurrentValue = (value: number) => {
    switch (measurementType) {
      case "weight": setWeight(value); break;
      case "height": setHeight(value); break;
      case "head": setHead(value); break;
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const data: { timestamp: string; weight?: number; height?: number; headCircumference?: number; notes?: string } = {
        timestamp: timestamp.toISOString(),
        notes: notes.trim() || undefined,
      };

      // Convert to API expected units (weight in grams, height/head in mm)
      switch (measurementType) {
        case "weight":
          data.weight = Math.round(weight * 1000); // kg to grams
          break;
        case "height":
          data.height = Math.round(height * 10); // cm to mm
          break;
        case "head":
          data.headCircumference = Math.round(head * 10); // cm to mm
          break;
      }

      await api.growth.create(data);
      toast.success(`${activeConfig.label} measurement saved!`);
      router.push("/");
    } catch (err) {
      console.error("Failed to save measurement:", err);
      toast.error("Failed to save measurement. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const canSave = getCurrentValue() > 0;

  return (
    <MobileContainer>
      <div className="p-4 pb-32">
        <LogFormWrapper
          title="Log Growth"
          backHref="/log"
          showCard={false}
        >
          <div className="space-y-6">
            {/* Measurement Type Selection - Requirement 14.3 */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Measurement Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {MEASUREMENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isActive = measurementType === type.key;
                  return (
                    <GlassCard
                      key={type.key}
                      interactive
                      variant={isActive ? "featured" : "default"}
                      size="default"
                      className={cn(
                        "flex flex-col items-center justify-center min-h-[100px] cursor-pointer transition-all duration-200",
                        isActive && `${type.bgColor} border-transparent text-white shadow-lg -translate-y-1`
                      )}
                      onClick={() => setMeasurementType(type.key)}
                    >
                      <Icon className={cn("w-7 h-7 mb-2", isActive ? "text-white" : type.color)} />
                      <span className="font-bold text-sm">{type.label}</span>
                      <span className={cn("text-xs mt-1", isActive ? "text-white/80" : "text-muted-foreground")}>
                        {type.description}
                      </span>
                    </GlassCard>
                  );
                })}
              </div>
            </div>

            {/* Measurement Input - Requirement 14.2, 14.3 */}
            <GlassCard size="lg" className="space-y-6">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <activeConfig.icon className={cn("w-4 h-4", activeConfig.color)} />
                {activeConfig.label} Measurement
              </h3>
              
              {/* Value Display */}
              <div className="flex flex-col items-center py-6">
                <div className={cn(
                  "text-6xl font-heading font-black tabular-nums",
                  activeConfig.color
                )}>
                  {getCurrentValue().toFixed(activeConfig.step < 1 ? 1 : 0)}
                </div>
                <div className="text-lg font-medium text-muted-foreground mt-1">
                  {activeConfig.unit}
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={activeConfig.min}
                  max={activeConfig.max}
                  step={activeConfig.step}
                  value={getCurrentValue()}
                  onChange={(e) => setCurrentValue(parseFloat(e.target.value))}
                  className={cn(
                    "w-full h-3 rounded-full appearance-none cursor-pointer",
                    "bg-[var(--glass-bg)] border border-[var(--glass-border)]",
                    "[&::-webkit-slider-thumb]:appearance-none",
                    "[&::-webkit-slider-thumb]:w-6",
                    "[&::-webkit-slider-thumb]:h-6",
                    "[&::-webkit-slider-thumb]:rounded-full",
                    "[&::-webkit-slider-thumb]:shadow-lg",
                    measurementType === "weight" && "[&::-webkit-slider-thumb]:bg-emerald-500",
                    measurementType === "height" && "[&::-webkit-slider-thumb]:bg-blue-500",
                    measurementType === "head" && "[&::-webkit-slider-thumb]:bg-purple-500"
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{activeConfig.min} {activeConfig.unit}</span>
                  <span>{activeConfig.max} {activeConfig.unit}</span>
                </div>
              </div>

              {/* Quick Adjust Buttons - Requirement 14.5: 48px touch target */}
              <div className="flex justify-center gap-2">
                <GlassButton
                  variant="default"
                  size="sm"
                  onClick={() => setCurrentValue(Math.max(activeConfig.min, getCurrentValue() - activeConfig.step * 10))}
                  className="h-10 px-4 font-bold rounded-xl min-h-[48px]"
                >
                  -{activeConfig.step * 10}
                </GlassButton>
                <GlassButton
                  variant="default"
                  size="sm"
                  onClick={() => setCurrentValue(Math.max(activeConfig.min, getCurrentValue() - activeConfig.step))}
                  className="h-10 px-4 font-bold rounded-xl min-h-[48px]"
                >
                  -{activeConfig.step}
                </GlassButton>
                <GlassButton
                  variant="default"
                  size="sm"
                  onClick={() => setCurrentValue(Math.min(activeConfig.max, getCurrentValue() + activeConfig.step))}
                  className="h-10 px-4 font-bold rounded-xl min-h-[48px]"
                >
                  +{activeConfig.step}
                </GlassButton>
                <GlassButton
                  variant="default"
                  size="sm"
                  onClick={() => setCurrentValue(Math.min(activeConfig.max, getCurrentValue() + activeConfig.step * 10))}
                  className="h-10 px-4 font-bold rounded-xl min-h-[48px]"
                >
                  +{activeConfig.step * 10}
                </GlassButton>
              </div>
            </GlassCard>

            {/* When - Requirement 14.3 */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                When
              </label>
              <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
            </div>

            {/* Notes - Requirement 14.3 */}
            <div className="space-y-2">
              <label htmlFor="growth-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notes
              </label>
              <GlassTextarea
                id="growth-notes"
                name="growth-notes"
                placeholder="Any details about this measurement..."
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
            disabled={isLoading || !canSave}
            className={cn("w-full h-16 rounded-full text-lg shadow-xl", activeConfig.bgColor)}
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save {activeConfig.label}
              </>
            )}
          </GlassButton>
        </div>
      </div>
    </MobileContainer>
  );
}
