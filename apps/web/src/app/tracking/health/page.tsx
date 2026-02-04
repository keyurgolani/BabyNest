"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { IconBadge } from "@/components/ui/icon-badge";

import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { api, SymptomResponse, MedicationResponse, VaccinationResponse } from "@/lib/api-client";
import { Plus, Thermometer, Pill, Syringe, Calendar, AlertCircle } from "lucide-react";

type TabType = "symptoms" | "medications" | "vaccinations";

export default function HealthTrackingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("symptoms");
  const [symptoms, setSymptoms] = useState<SymptomResponse[]>([]);
  const [medications, setMedications] = useState<MedicationResponse[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [symptomsRes, medsRes, vaccinesRes] = await Promise.all([
        api.health.symptoms.list().catch(() => ({ data: [] })),
        api.health.medications.list().catch(() => ({ data: [] })),
        api.health.vaccinations.list().catch(() => ({ data: [] })),
      ]);
      setSymptoms(symptomsRes.data);
      setMedications(medsRes.data);
      setVaccinations(vaccinesRes.data);
    } catch (err) {
      console.error("Failed to fetch health data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getLogLink = () => {
    switch (activeTab) {
      case "symptoms": return "/log/symptom";
      case "medications": return "/log/medication";
      case "vaccinations": return "/log/vaccination";
    }
  };

  return (
    <MobileContainer>
      <div className="p-4 space-y-6 pb-32">
        {/* Header with PageHeader component */}
        <PageHeader
          title="Health Tracking"
          subtitle="Symptoms, medications & vaccines"
          backHref="/tracking"
          action={
            <Link href={getLogLink()}>
              <GlassButton size="sm" variant="primary" className="gap-1">
                <Plus className="w-4 h-4" />
                Add
              </GlassButton>
            </Link>
          }
        />

        {/* Tab Selector with GlassCard styling */}
        <GlassCard size="sm" className="p-1.5">
          <div className="flex gap-1">
            {[
              { key: "symptoms" as const, label: "Symptoms", icon: Thermometer, count: symptoms.length },
              { key: "medications" as const, label: "Meds", icon: Pill, count: medications.length },
              { key: "vaccinations" as const, label: "Vaccines", icon: Syringe, count: vaccinations.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  activeTab === tab.key
                    ? "bg-white/20 dark:bg-white/10 text-foreground shadow-sm backdrop-blur-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-medium",
                  activeTab === tab.key
                    ? "bg-white/20 dark:bg-white/10"
                    : "bg-muted/50"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {activeTab === "symptoms" && <SymptomsTab symptoms={symptoms} />}
            {activeTab === "medications" && <MedicationsTab medications={medications} />}
            {activeTab === "vaccinations" && <VaccinationsTab vaccinations={vaccinations} />}
          </>
        )}
      </div>
    </MobileContainer>
  );
}

function SymptomsTab({ symptoms }: { symptoms: SymptomResponse[] }) {
  const sortedSymptoms = [...symptoms].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "mild": return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "moderate": return "bg-orange-500/20 text-orange-600 dark:text-orange-400";
      case "severe": return "bg-red-500/20 text-red-600 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (sortedSymptoms.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <IconBadge color="health" icon={Thermometer} size="lg" className="mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No symptoms recorded</p>
        <p className="text-xs text-muted-foreground mt-1">That&apos;s great news! 🎉</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {sortedSymptoms.map((symptom) => (
        <GlassCard key={symptom.id} interactive>
          <div className="flex items-start gap-3">
            <IconBadge color="health" icon={AlertCircle} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground capitalize">{symptom.symptomType.replace("_", " ")}</p>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getSeverityColor(symptom.severity))}>
                  {symptom.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(symptom.timestamp).toLocaleDateString("en-US", { 
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                })}
              </p>
              {symptom.temperature && (
                <p className="text-sm text-foreground mt-1">🌡️ {symptom.temperature}°C</p>
              )}
              {symptom.notes && (
                <p className="text-sm text-muted-foreground mt-1 truncate">{symptom.notes}</p>
              )}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function MedicationsTab({ medications }: { medications: MedicationResponse[] }) {
  const sortedMeds = [...medications].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedMeds.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <IconBadge color="sleep" icon={Pill} size="lg" className="mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No medications recorded</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {sortedMeds.map((med) => (
        <GlassCard key={med.id} interactive>
          <div className="flex items-start gap-3">
            <IconBadge color="sleep" icon={Pill} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{med.name}</p>
              <p className="text-sm text-muted-foreground">
                {med.dosage} {med.unit} • {med.frequency?.replace("_", " ")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(med.timestamp).toLocaleDateString("en-US", { 
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                })}
              </p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function VaccinationsTab({ vaccinations }: { vaccinations: VaccinationResponse[] }) {
  const sortedVaccines = [...vaccinations].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedVaccines.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <IconBadge color="diaper" icon={Syringe} size="lg" className="mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No vaccinations recorded</p>
        <Link href="/log/vaccination">
          <GlassButton variant="primary" className="mt-4" size="sm">Add Vaccination</GlassButton>
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {sortedVaccines.map((vaccine) => (
        <GlassCard key={vaccine.id} interactive>
          <div className="flex items-start gap-3">
            <IconBadge color="diaper" icon={Syringe} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{vaccine.vaccineName}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(vaccine.timestamp).toLocaleDateString("en-US", { 
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
              {vaccine.provider && (
                <p className="text-xs text-muted-foreground">By: {vaccine.provider}</p>
              )}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
