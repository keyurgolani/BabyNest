"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { api, SymptomResponse, MedicationResponse, VaccinationResponse } from "@/lib/api-client";
import { ChevronLeft, Plus, Thermometer, Pill, Syringe, Calendar, AlertCircle } from "lucide-react";

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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/tracking" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-foreground">Health Tracking</h1>
            <p className="text-sm text-muted-foreground">Symptoms, medications & vaccines</p>
          </div>
          <Link href={getLogLink()}>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </Link>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {[
            { key: "symptoms" as const, label: "Symptoms", icon: Thermometer, count: symptoms.length },
            { key: "medications" as const, label: "Meds", icon: Pill, count: medications.length },
            { key: "vaccinations" as const, label: "Vaccines", icon: Syringe, count: vaccinations.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="text-xs bg-muted px-1.5 rounded-full">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
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
      case "mild": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "moderate": return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      case "severe": return "bg-red-500/10 text-red-600 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (sortedSymptoms.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Thermometer className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No symptoms recorded</p>
        <p className="text-xs text-muted-foreground mt-1">That&apos;s great news! 🎉</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedSymptoms.map((symptom) => (
        <Card key={symptom.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
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
                <p className="text-sm text-muted-foreground mt-1">{symptom.notes}</p>
              )}
            </div>
          </div>
        </Card>
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
      <Card className="p-8 text-center">
        <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No medications recorded</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedMeds.map((med) => (
        <Card key={med.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Pill className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
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
        </Card>
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
      <Card className="p-8 text-center">
        <Syringe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No vaccinations recorded</p>
        <Link href="/log/vaccination">
          <Button className="mt-4" size="sm">Add Vaccination</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedVaccines.map((vaccine) => (
        <Card key={vaccine.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Syringe className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{vaccine.vaccineName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                {new Date(vaccine.timestamp).toLocaleDateString("en-US", { 
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
              {vaccine.provider && (
                <p className="text-xs text-muted-foreground">By: {vaccine.provider}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
