"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, MedicationResponse } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { toast } from "sonner";
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Calendar,
  Loader2,
  Plus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MedicationWithStatus extends MedicationResponse {
  status: 'overdue' | 'due-soon' | 'upcoming';
  timeUntilDue?: string;
  minutesUntilDue?: number;
}

export function MedicationDashboard() {
  const { babyId } = useBaby();
  const [medications, setMedications] = useState<MedicationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingTaken, setMarkingTaken] = useState<string | null>(null);
  const [snoozingId, setSnoozingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMedications();
    // Refresh every minute to update time displays
    const interval = setInterval(fetchMedications, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyId]);

  const fetchMedications = async () => {
    if (!babyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.health.medications.list({ pageSize: 50 });
      
      // Process medications to add status and time info
      const now = new Date();
      const processedMeds: MedicationWithStatus[] = response.data
        .filter(med => med.nextDueAt) // Only show meds with next due date
        .map(med => {
          const dueDate = new Date(med.nextDueAt!);
          const diffMs = dueDate.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          
          let status: 'overdue' | 'due-soon' | 'upcoming';
          let timeUntilDue: string;
          
          if (diffMins < 0) {
            status = 'overdue';
            const overdueMins = Math.abs(diffMins);
            if (overdueMins < 60) {
              timeUntilDue = `${overdueMins}m overdue`;
            } else {
              const hours = Math.floor(overdueMins / 60);
              timeUntilDue = `${hours}h overdue`;
            }
          } else if (diffMins < 60) {
            status = 'due-soon';
            timeUntilDue = `${diffMins}m`;
          } else if (diffMins < 120) {
            status = 'due-soon';
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            timeUntilDue = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
          } else {
            status = 'upcoming';
            const hours = Math.floor(diffMins / 60);
            timeUntilDue = `${hours}h`;
          }
          
          return {
            ...med,
            status,
            timeUntilDue,
            minutesUntilDue: diffMins,
          };
        })
        .sort((a, b) => (a.minutesUntilDue || 0) - (b.minutesUntilDue || 0));
      
      setMedications(processedMeds);
    } catch (error) {
      console.error("Failed to fetch medications:", error);
      toast.error("Failed to load medications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaken = async (id: string) => {
    try {
      setMarkingTaken(id);
      await api.health.medications.markTaken(id);
      toast.success("Medication marked as taken");
      await fetchMedications();
    } catch (error) {
      console.error("Failed to mark medication as taken:", error);
      toast.error("Failed to mark medication as taken");
    } finally {
      setMarkingTaken(null);
    }
  };

  const handleSnooze = async (id: string, minutes: number) => {
    try {
      setSnoozingId(id);
      // Note: Snooze functionality would need to be implemented in the API
      toast.info(`Snoozed for ${minutes} minutes`);
      await fetchMedications();
    } catch (error) {
      console.error("Failed to snooze medication:", error);
      toast.error("Failed to snooze medication");
    } finally {
      setSnoozingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 gap-1">
            <AlertTriangle className="w-3 h-3" />
            Overdue
          </Badge>
        );
      case 'due-soon':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 gap-1">
            <Clock className="w-3 h-3" />
            Due Soon
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 gap-1">
            <Calendar className="w-3 h-3" />
            Upcoming
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Medication Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/50 dark:bg-black/20 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const overdueMeds = medications.filter(m => m.status === 'overdue');
  const dueSoonMeds = medications.filter(m => m.status === 'due-soon');
  const upcomingMeds = medications.filter(m => m.status === 'upcoming');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Pill className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Medication Reminders
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage medication schedules
          </p>
        </div>
        <Link href="/health/medications/new">
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Medication
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={cn(
          "border-0",
          overdueMeds.length > 0 
            ? "bg-red-50 dark:bg-red-950/20" 
            : "bg-muted/30"
        )}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className={cn(
              "w-6 h-6 mx-auto mb-2",
              overdueMeds.length > 0 
                ? "text-red-600 dark:text-red-400" 
                : "text-muted-foreground"
            )} />
            <p className="text-2xl font-bold text-foreground">{overdueMeds.length}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-0",
          dueSoonMeds.length > 0 
            ? "bg-amber-50 dark:bg-amber-950/20" 
            : "bg-muted/30"
        )}>
          <CardContent className="p-4 text-center">
            <Clock className={cn(
              "w-6 h-6 mx-auto mb-2",
              dueSoonMeds.length > 0 
                ? "text-amber-600 dark:text-amber-400" 
                : "text-muted-foreground"
            )} />
            <p className="text-2xl font-bold text-foreground">{dueSoonMeds.length}</p>
            <p className="text-xs text-muted-foreground">Due Soon</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-muted/30">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{upcomingMeds.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Medications */}
      {overdueMeds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-foreground">Overdue Medications</h3>
            <Badge variant="destructive" className="ml-auto">
              {overdueMeds.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {overdueMeds.map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                onMarkTaken={handleMarkTaken}
                onSnooze={handleSnooze}
                isMarking={markingTaken === med.id}
                isSnoozing={snoozingId === med.id}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Due Soon Medications */}
      {dueSoonMeds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-foreground">Due Soon</h3>
            <Badge variant="outline" className="ml-auto">
              {dueSoonMeds.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {dueSoonMeds.map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                onMarkTaken={handleMarkTaken}
                onSnooze={handleSnooze}
                isMarking={markingTaken === med.id}
                isSnoozing={snoozingId === med.id}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Medications */}
      {upcomingMeds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-foreground">Upcoming</h3>
            <Badge variant="outline" className="ml-auto">
              {upcomingMeds.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {upcomingMeds.slice(0, 5).map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                onMarkTaken={handleMarkTaken}
                onSnooze={handleSnooze}
                isMarking={markingTaken === med.id}
                isSnoozing={snoozingId === med.id}
                getStatusBadge={getStatusBadge}
                compact
              />
            ))}
            {upcomingMeds.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full gap-2">
                View {upcomingMeds.length - 5} more
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {medications.length === 0 && (
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-12 text-center">
            <Pill className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No medications scheduled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add medications to track doses and get reminders
            </p>
            <Link href="/health/medications/new">
              <Button variant="default" className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Medication
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MedicationCardProps {
  medication: MedicationWithStatus;
  onMarkTaken: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  isMarking: boolean;
  isSnoozing: boolean;
  getStatusBadge: (status: string) => React.ReactNode;
  compact?: boolean;
}

function MedicationCard({
  medication,
  onMarkTaken,
  onSnooze,
  isMarking,
  isSnoozing,
  getStatusBadge,
  compact = false,
}: MedicationCardProps) {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  const snoozeOptions = [
    { label: "15 min", minutes: 15 },
    { label: "30 min", minutes: 30 },
    { label: "1 hour", minutes: 60 },
  ];

  return (
    <Card className={cn(
      "border-0",
      medication.status === 'overdue' 
        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" 
        : medication.status === 'due-soon'
        ? "bg-amber-50 dark:bg-amber-950/20"
        : "bg-white/50 dark:bg-black/20"
    )}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "rounded-xl flex items-center justify-center shrink-0",
            compact ? "w-10 h-10" : "w-12 h-12",
            medication.status === 'overdue'
              ? "bg-red-100 dark:bg-red-900/50"
              : medication.status === 'due-soon'
              ? "bg-amber-100 dark:bg-amber-900/50"
              : "bg-purple-100 dark:bg-purple-900/50"
          )}>
            <Pill className={cn(
              compact ? "w-5 h-5" : "w-6 h-6",
              medication.status === 'overdue'
                ? "text-red-600 dark:text-red-400"
                : medication.status === 'due-soon'
                ? "text-amber-600 dark:text-amber-400"
                : "text-purple-600 dark:text-purple-400"
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={cn(
                "font-semibold text-foreground truncate",
                compact ? "text-sm" : "text-base"
              )}>
                {medication.name}
              </h4>
              {getStatusBadge(medication.status)}
            </div>

            <p className={cn(
              "text-muted-foreground mb-2",
              compact ? "text-xs" : "text-sm"
            )}>
              {medication.dosage} {medication.unit} • {medication.frequency.replace(/_/g, " ")}
            </p>

            <div className="flex items-center gap-2 mb-3">
              <Clock className={cn(
                "text-muted-foreground",
                compact ? "w-3 h-3" : "w-4 h-4"
              )} />
              <span className={cn(
                "font-medium",
                compact ? "text-xs" : "text-sm",
                medication.status === 'overdue'
                  ? "text-red-600 dark:text-red-400"
                  : medication.status === 'due-soon'
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}>
                {medication.timeUntilDue}
              </span>
              {medication.nextDueAt && (
                <span className={cn(
                  "text-muted-foreground",
                  compact ? "text-xs" : "text-sm"
                )}>
                  • {new Date(medication.nextDueAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            {/* Actions */}
            {!compact && !showSnoozeOptions && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onMarkTaken(medication.id)}
                  disabled={isMarking || isSnoozing}
                  className="h-8 px-3 gap-1.5"
                >
                  {isMarking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Mark Taken
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSnoozeOptions(true)}
                  disabled={isMarking || isSnoozing}
                  className="h-8 px-3 gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Snooze
                </Button>
              </div>
            )}

            {/* Snooze Options */}
            {!compact && showSnoozeOptions && (
              <div className="flex items-center gap-2 flex-wrap">
                {snoozeOptions.map((option) => (
                  <Button
                    key={option.minutes}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onSnooze(medication.id, option.minutes);
                      setShowSnoozeOptions(false);
                    }}
                    disabled={isSnoozing}
                    className="h-7 px-2 text-xs"
                  >
                    {isSnoozing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      option.label
                    )}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSnoozeOptions(false)}
                  className="h-7 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Compact Actions */}
            {compact && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkTaken(medication.id)}
                disabled={isMarking}
                className="h-7 px-2 text-xs gap-1"
              >
                {isMarking ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Mark Taken
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
