"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Pill, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
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
      <GlassCard size="default" className="relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 rounded-2xl flex items-center justify-center shadow-lg">
            <Pill className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="space-y-1">
            <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 animate-pulse">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-28 bg-white/10 rounded" />
                    <div className="h-5 w-14 bg-white/10 rounded-full" />
                  </div>
                  <div className="h-3 w-36 bg-white/10 rounded" />
                  <div className="h-3 w-24 bg-white/10 rounded" />
                </div>
                <div className="h-8 w-16 bg-white/10 rounded-lg flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
      </GlassCard>
    );
  }

  if (medications.length === 0) {
    return (
      <GlassCard size="default">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 rounded-2xl flex items-center justify-center shadow-lg">
            <Pill className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Medications</h4>
            <p className="text-xs text-muted-foreground">No upcoming doses</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          All medications are up to date.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard size="default" className="hover:shadow-2xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 rounded-2xl flex items-center justify-center shadow-lg">
            <Pill className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
              className="bg-white/30 dark:bg-white/5 p-3 rounded-xl border border-white/20 dark:border-white/10 backdrop-blur-sm"
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
                            ? "bg-red-500/20 text-red-700 dark:text-red-300"
                            : timeInfo.isSoon
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            : "bg-green-500/20 text-green-700 dark:text-green-300"
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
                  className="shrink-0 h-8 px-3 bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20 border-white/30 dark:border-white/20 backdrop-blur-sm"
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
    </GlassCard>
  );
}
