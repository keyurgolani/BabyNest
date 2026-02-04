"use client";

import { useState } from "react";
import { Syringe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { LogFormWrapper } from "@/components/log/log-form-wrapper";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassTextarea } from "@/components/ui/glass-textarea";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";

const COMMON_VACCINES = [
  "DTaP",
  "MMR",
  "Polio (IPV)",
  "Hepatitis B",
  "Hib",
  "PCV13",
  "Rotavirus",
  "Varicella",
  "Flu",
];

export default function VaccinationLogPage() {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter the vaccine name.");
      return;
    }
    
    setIsLoading(true);
    try {
      await api.health.vaccinations.create({
        vaccineName: name.trim(),
        provider: provider.trim() || undefined,
        location: location.trim() || undefined,
        timestamp: timestamp.toISOString(),
        notes: note.trim() || undefined,
      });
      
      toast.success("Vaccination logged!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save vaccination:", err);
      toast.error("Failed to save vaccination. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileContainer>
      <div className="p-4 pb-32">
        <LogFormWrapper
          title="Log Vaccination"
          backHref="/log"
          showCard={false}
        >
          <div className="space-y-6">
            {/* Vaccine Name Card */}
            <GlassCard size="lg" className="space-y-4">
              <div className="space-y-2">
                <label 
                  htmlFor="vaccine-name" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Vaccine Name
                </label>
                <GlassInput
                  id="vaccine-name"
                  name="vaccine-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. DTaP, MMR, Polio"
                  className="h-12"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_VACCINES.map((v) => (
                  <GlassButton
                    key={v}
                    type="button"
                    variant={name === v ? "primary" : "default"}
                    size="sm"
                    onClick={() => setName(v)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold",
                      name === v
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
                    )}
                  >
                    {v}
                  </GlassButton>
                ))}
              </div>
            </GlassCard>

            {/* Desktop: Provider & Location Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Provider Card */}
              <GlassCard size="lg" className="space-y-2">
                <label 
                  htmlFor="healthcare-provider" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Healthcare Provider
                </label>
                <GlassInput
                  id="healthcare-provider"
                  name="healthcare-provider"
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. Dr. Smith"
                  className="h-12"
                />
              </GlassCard>

              {/* Location Card */}
              <GlassCard size="lg" className="space-y-2">
                <label 
                  htmlFor="vaccination-location" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Location
                </label>
                <GlassInput
                  id="vaccination-location"
                  name="vaccination-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. City Pediatric Clinic"
                  className="h-12"
                />
              </GlassCard>
            </div>

            {/* Desktop: Date and Notes Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Card */}
              <GlassCard size="lg" className="space-y-2">
                <span 
                  id="date-administered-label" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Date Administered
                </span>
                <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
              </GlassCard>

              {/* Notes Card */}
              <GlassCard size="lg" className="space-y-2">
                <label 
                  htmlFor="vaccination-notes" 
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Notes
                </label>
                <GlassTextarea
                  id="vaccination-notes"
                  name="vaccination-notes"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any reactions or side effects..."
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
            disabled={!name.trim() || isLoading}
            variant="primary"
            size="lg"
            className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-blue-500/20 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? "Saving..." : <><Syringe className="w-5 h-5 mr-2" /> Save Vaccination</>}
          </GlassButton>
        </div>
      </div>
    </MobileContainer>
  );
}
