"use client";

import { useState } from "react";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, VisitType } from "@/lib/api-client";
import { TimeAgoPicker } from "@/components/ui/time-ago-picker";
import { LogFormWrapper } from "@/components/log/log-form-wrapper";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassTextarea } from "@/components/ui/glass-textarea";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";

/**
 * Doctor Visit Log Page
 *
 * Redesigned with glassmorphism UI components.
 *
 * @requirements 14.1 - PageHeader with title and back navigation (via LogFormWrapper)
 * @requirements 14.2 - GlassCard as form container (via LogFormWrapper)
 * @requirements 14.3 - GlassInput for text inputs, GlassTextarea for notes
 * @requirements 14.4 - GlassButton for submit/cancel actions
 * @requirements 14.5 - 48px minimum touch targets
 * @requirements 14.6 - Maintain existing form functionality
 */

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
    <LogFormWrapper
      title="Log Doctor Visit"
      backHref="/log"
      showCard={false}
      className="p-4 pb-32"
    >
      {/* Desktop: Side by Side Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Doctor Name & Location Card */}
        <GlassCard size="lg" className="space-y-4">
          {/* Doctor Name - Requirement 14.3 */}
          <div className="space-y-2">
            <label
              htmlFor="doctor-name"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Doctor Name
            </label>
            <GlassInput
              id="doctor-name"
              name="doctor-name"
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g. Dr. Smith"
              className="min-h-[48px]"
            />
          </div>

          {/* Clinic/Hospital - Requirement 14.3 */}
          <div className="space-y-2">
            <label
              htmlFor="clinic-hospital"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Clinic/Hospital
            </label>
            <GlassInput
              id="clinic-hospital"
              name="clinic-hospital"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Children's Hospital"
              className="min-h-[48px]"
            />
          </div>
        </GlassCard>

        {/* Diagnosis & Date Card */}
        <GlassCard size="lg" className="space-y-4">
          {/* Diagnosis - Requirement 14.3 */}
          <div className="space-y-2">
            <label
              htmlFor="diagnosis"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Diagnosis/Findings
            </label>
            <GlassInput
              id="diagnosis"
              name="diagnosis"
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Healthy development, no concerns"
              className="min-h-[48px]"
            />
          </div>

          {/* Visit Date */}
          <div className="space-y-2">
            <span
              id="visit-date-label"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Visit Date
            </span>
            <TimeAgoPicker value={timestamp} onChange={setTimestamp} />
          </div>
        </GlassCard>
      </div>

      {/* Visit Type Selection - Requirement 14.5: 48px touch targets */}
      <GlassCard size="lg" className="space-y-4">
        <span
          id="visit-type-label"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          Visit Type
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {VISIT_TYPES.map((v) => (
            <GlassButton
              key={v.value}
              variant={visitType === v.value ? "primary" : "default"}
              onClick={() => setVisitType(v.value)}
              className={cn(
                "flex items-center justify-center gap-2 min-h-[56px] rounded-2xl",
                visitType === v.value && "bg-teal-500 hover:bg-teal-600 hover:shadow-[0_0_20px_rgba(20,184,166,0.5)]"
              )}
            >
              <span className="text-xl">{v.emoji}</span>
              <span className="font-bold text-sm">{v.label}</span>
            </GlassButton>
          ))}
        </div>
      </GlassCard>

      {/* Notes - Requirement 14.3 */}
      <GlassCard size="lg" className="space-y-2">
        <label
          htmlFor="doctor-visit-notes"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          Notes & Recommendations
        </label>
        <GlassTextarea
          id="doctor-visit-notes"
          name="doctor-visit-notes"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Doctor's recommendations, prescriptions, next steps..."
          rows={3}
          className="min-h-[100px]"
        />
      </GlassCard>

      {/* Spacer for fixed button */}
      <div className="h-5" />

      {/* Save Button - Requirement 14.4 */}
      <div className="fixed bottom-32 left-4 right-4 z-50">
        <GlassButton
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={!doctorName.trim() || isLoading}
          className="w-full h-16 rounded-full text-lg font-bold shadow-xl bg-teal-500 hover:bg-teal-600 hover:shadow-[0_0_20px_rgba(20,184,166,0.5)]"
        >
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              <Stethoscope className="w-5 h-5 mr-2" />
              Save Visit
            </>
          )}
        </GlassButton>
      </div>
    </LogFormWrapper>
  );
}
