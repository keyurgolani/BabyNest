"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Save, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";

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
      <div className="p-4 space-y-6 animate-slide-up pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/log" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Log Vaccination</h1>
        </div>

        {/* Desktop: Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vaccine Name */}
          <Card className="p-5 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
            <div className="space-y-2">
              <label htmlFor="vaccine-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vaccine Name</label>
              <input
                id="vaccine-name"
                name="vaccine-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. DTaP, MMR, Polio"
                className="w-full h-12 rounded-xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 px-4 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_VACCINES.map((v) => (
                <button
                  key={v}
                  onClick={() => setName(v)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    name === v
                      ? "bg-blue-500 text-white"
                      : "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </Card>

          {/* Provider & Location */}
          <Card className="p-5 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
            <div className="space-y-2">
              <label htmlFor="healthcare-provider" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Healthcare Provider</label>
              <input
                id="healthcare-provider"
                name="healthcare-provider"
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Dr. Smith"
                className="w-full h-12 rounded-xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 px-4 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="vaccination-location" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</label>
              <input
                id="vaccination-location"
                name="vaccination-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. City Pediatric Clinic"
                className="w-full h-12 rounded-xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 px-4 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
              />
            </div>
          </Card>
        </div>

        {/* Desktop: Date and Notes Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date */}
          <div className="space-y-2">
            <span id="date-administered-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Administered</span>
            <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="vaccination-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
            <textarea
              id="vaccination-notes"
              name="vaccination-notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any reactions or side effects..."
              className="w-full rounded-2xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 p-4 text-sm resize-none outline-none transition-all placeholder:text-muted-foreground/50"
              rows={2}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isLoading}
            className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-blue-500/20 bg-blue-500 hover:bg-blue-600 text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : <><Syringe className="w-5 h-5 mr-2" /> Save Vaccination</>}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
