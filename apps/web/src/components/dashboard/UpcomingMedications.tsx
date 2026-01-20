"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Pill, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, MedicationResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBaby } from "@/context/baby-context";

export function UpcomingMedications() {
  const { babyId } = useBaby();
  const [medications, setMedications] = useState<MedicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingTaken, setMarkingTaken] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingMedications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyId]);

  const fetchUpcomingMedications = useCallback(async () => {
    if (!babyId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await api.health.medications.getUpcoming();
      // Handle both array and paginated response formats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const medsArray = Array.isArray(data) ? data : (data as any)?.data || [];
      setMedications(medsArray);
    } catch (error) {
      console.error("Failed to fetch upcoming medications:", error);
      toast.error("Failed to load medications");
      setMedications([]);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  const handleMarkTaken = async (id: string) => {
    try {
      setMarkingTaken(id);
      await api.health.medications.markTaken(id);
      toast.success("Medication marked as taken");
      // Refresh the list
      await fetchUpcomingMedications();
    } catch (error) {
      console.error("Failed to mark medication as taken:", error);
      toast.error("Failed to mark medication as taken");
    } finally {
      setMarkingTaken(null);
    }
  };

  const getTimeUntilDue = (nextDueAt: string | null) => {
    if (!nextDueAt) return null;
    const now = new Date();
    const due = new Date(nextDueAt);
    const diffMs = due.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return { text: "Overdue", isDue: true, isSoon: false };
    if (diffMins === 0) return { text: "Due now", isDue: true, isSoon: false };
    if (diffMins < 60) return { text: `${diffMins}m`, isDue: false, isSoon: true };
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return { 
      text: mins > 0 ? `${hours}h ${mins}m` : `${hours}h`, 
      isDue: false, 
      isSoon: hours < 2 
    };
  };

  if (loading) {
    return (
      <Card className="p-4 border-0 bg-gradient-to-br from-purple-100 via-pink-100 to-fuchsia-100 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-fuchsia-950/40 shadow-[0_8px_24px_rgba(168,85,247,0.2),0_0_40px_rgba(168,85,247,0.15)]">
        <div className="h-32 bg-purple-300/30 dark:bg-purple-700/20 rounded-xl animate-pulse" />
      </Card>
    );
  }

  if (medications.length === 0) {
    return (
      <Card className="p-4 border-0 bg-gradient-to-br from-purple-100 via-pink-100 to-fuchsia-100 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-fuchsia-950/40 shadow-[0_8px_24px_rgba(168,85,247,0.2),0_0_40px_rgba(168,85,247,0.15)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800/60 dark:to-pink-800/60 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(168,85,247,0.3)]">
            <Pill className="w-6 h-6 text-purple-700 dark:text-purple-300" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Medications</h4>
            <p className="text-xs text-muted-foreground">No upcoming doses</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          All medications are up to date.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-0 bg-gradient-to-br from-purple-100 via-pink-100 to-fuchsia-100 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-fuchsia-950/40 shadow-[0_8px_24px_rgba(168,85,247,0.2),0_0_40px_rgba(168,85,247,0.15)] hover:shadow-[0_12px_32px_rgba(168,85,247,0.3),0_0_60px_rgba(168,85,247,0.2)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800/60 dark:to-pink-800/60 rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(168,85,247,0.3)]">
            <Pill className="w-6 h-6 text-purple-700 dark:text-purple-300" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Medications</h4>
            <p className="text-xs text-muted-foreground font-medium">{medications.length} upcoming</p>
          </div>
        </div>
      </div>

      {/* Medication List */}
      <div className="space-y-3">
        {medications.map((med) => {
          const timeInfo = getTimeUntilDue(med.nextDueAt);
          
          return (
            <div
              key={med.id}
              className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-purple-200/50 dark:border-purple-800/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold text-foreground text-sm truncate">
                      {med.name}
                    </h5>
                    {timeInfo && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                          timeInfo.isDue
                            ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                            : timeInfo.isSoon
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                            : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                        )}
                      >
                        {timeInfo.isDue && <AlertCircle className="w-3 h-3 inline mr-1" />}
                        {timeInfo.text}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {med.dosage} {med.unit} • {med.frequency.replace(/_/g, " ")}
                  </p>
                  {med.nextDueAt && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Due: {new Date(med.nextDueAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkTaken(med.id)}
                  disabled={markingTaken === med.id}
                  className="shrink-0 h-8 px-3 bg-white dark:bg-black/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-purple-200 dark:border-purple-800"
                >
                  {markingTaken === med.id ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      <span className="text-xs">Taken</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
