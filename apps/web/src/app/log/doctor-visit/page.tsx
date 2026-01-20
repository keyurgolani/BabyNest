"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { toast } from "sonner";
import { api, VisitType } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";

const VISIT_TYPES: { value: VisitType; label: string; emoji: string }[] = [
  { value: "checkup", label: "Checkup", emoji: "✅" },
  { value: "sick", label: "Sick Visit", emoji: "🤒" },
  { value: "specialist", label: "Specialist", emoji: "👨‍⚕️" },
  { value: "emergency", label: "Emergency", emoji: "🚨" },
];

export default function DoctorVisitLogPage() {
  const [doctorName, setDoctorName] = useState("");
  const [visitType, setVisitType] = useState<VisitType>("checkup");
  const [location, setLocation] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!doctorName.trim()) {
      toast.error("Please enter the doctor's name.");
      return;
    }
    
    setIsLoading(true);
    try {
      await api.health.doctorVisits.create({
        visitType,
        provider: doctorName.trim(),
        location: location.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        timestamp: timestamp.toISOString(),
        notes: note.trim() || undefined,
      });
      
      toast.success("Doctor visit logged!");
      router.push("/");
    } catch (err) {
      console.error("Failed to save doctor visit:", err);
      toast.error("Failed to save doctor visit. Please try again.");
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
          <h1 className="text-2xl font-heading font-bold text-foreground">Log Doctor Visit</h1>
        </div>

        {/* Visit Type */}
        <div className="space-y-2">
          <span id="visit-type-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visit Type</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {VISIT_TYPES.map((v) => (
              <button
                key={v.value}
                onClick={() => setVisitType(v.value)}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-2xl transition-all border-2",
                  visitType === v.value
                    ? "bg-teal-500 border-transparent text-white shadow-lg shadow-teal-500/25"
                    : "bg-card border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="text-xl">{v.emoji}</span>
                <span className="font-bold text-sm">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Doctor Name & Location */}
          <Card className="p-5 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
            <div className="space-y-2">
              <label htmlFor="doctor-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Doctor Name</label>
              <input
                id="doctor-name"
                name="doctor-name"
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Smith"
                className="w-full h-12 rounded-xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 px-4 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="clinic-hospital" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clinic/Hospital</label>
              <input
                id="clinic-hospital"
                name="clinic-hospital"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Children's Hospital"
                className="w-full h-12 rounded-xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 px-4 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
              />
            </div>
          </Card>

          {/* Diagnosis & Date */}
          <Card className="p-5 space-y-4 border-0 bg-gradient-to-br from-card to-muted/20">
            <div className="space-y-2">
              <label htmlFor="diagnosis" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagnosis/Findings</label>
              <input
                id="diagnosis"
                name="diagnosis"
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Healthy development, no concerns"
                className="w-full h-12 rounded-xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 px-4 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <span id="visit-date-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visit Date</span>
              <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
            </div>
          </Card>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="doctor-visit-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes & Recommendations</label>
          <textarea
            id="doctor-visit-notes"
            name="doctor-visit-notes"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Doctor's recommendations, prescriptions, next steps..."
            className="w-full rounded-2xl bg-muted/30 border border-transparent focus:bg-background focus:border-primary/20 p-4 text-sm resize-none outline-none transition-all placeholder:text-muted-foreground/50"
            rows={3}
          />
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <Button
            onClick={handleSave}
            disabled={!doctorName.trim() || isLoading}
            className="w-full h-16 rounded-full text-lg font-bold shadow-xl shadow-teal-500/20 bg-teal-500 hover:bg-teal-600 text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : <><Stethoscope className="w-5 h-5 mr-2" /> Save Visit</>}
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
