"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { IconBadge } from "@/components/ui/icon-badge";
import { api, VaccinationScheduleResponse, ScheduledVaccination } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { 
  Syringe, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Edit,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * VaccinationScheduleCard Component - Glassmorphism Redesign
 * 
 * Displays vaccination schedule with progress tracking, overdue alerts,
 * and the ability to mark vaccinations as complete.
 * 
 * Uses GlassCard, GlassButton, and GlassInput for consistent glassmorphism styling.
 */

interface VaccinationScheduleCardProps {
  onLogVaccination?: (vaccineName: string) => void;
}

export function VaccinationScheduleCard({ onLogVaccination }: VaccinationScheduleCardProps) {
  const { babyId } = useBaby();
  const [data, setData] = useState<VaccinationScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [markingComplete, setMarkingComplete] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  useEffect(() => {
    if (!babyId) {
      setLoading(false);
      return;
    }

    fetchSchedule();
  }, [babyId]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.health.vaccinations.getSchedule();
      setData(response);
    } catch (err) {
      // Don't show error for new users - just show empty state
      console.error("Failed to fetch vaccination schedule:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (vaccination: ScheduledVaccination) => {
    try {
      setMarkingComplete(vaccination.id);
      // Create a vaccination log entry
      await api.health.vaccinations.create({
        vaccineName: vaccination.vaccineName,
        timestamp: new Date().toISOString(),
        provider: vaccination.provider,
        location: vaccination.location,
        notes: "Marked complete from schedule",
      });
      // Refresh the schedule
      await fetchSchedule();
    } catch (error) {
      console.error("Failed to mark vaccination as complete:", error);
      alert("Failed to mark vaccination as complete");
    } finally {
      setMarkingComplete(null);
    }
  };

  const handleUpdateDate = async (vaccination: ScheduledVaccination, newDate: string) => {
    try {
      setEditingDate(vaccination.id);
      // Note: This would need an API endpoint to update scheduled vaccination dates
      // For now, we'll show a toast that this feature is coming soon
      console.log("Update vaccination date:", vaccination.id, newDate);
      alert("Date update feature coming soon");
      setEditingDate(null);
    } catch (error) {
      console.error("Failed to update vaccination date:", error);
      alert("Failed to update vaccination date");
    } finally {
      setEditingDate(null);
    }
  };

  // Loading state with glassmorphism styling
  if (loading) {
    return (
      <GlassCard className="bg-gradient-to-br from-cyan-100/80 to-teal-100/60 dark:from-cyan-950/60 dark:to-teal-950/40">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </GlassCard>
    );
  }

  // Empty/Error state with glassmorphism styling
  if (error || !data) {
    return (
      <GlassCard className="bg-gradient-to-br from-cyan-100/80 to-teal-100/60 dark:from-cyan-950/60 dark:to-teal-950/40">
        <div className="flex items-center gap-3 mb-4">
          <IconBadge icon={Syringe} color="activity" size="default" />
          <div>
            <h3 className="font-semibold text-foreground">Vaccination Schedule</h3>
            <p className="text-xs text-foreground/70 dark:text-muted-foreground">Track immunizations</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm flex items-center justify-center mb-3">
            <Syringe className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-foreground font-medium">No vaccination data yet</p>
          <p className="text-xs text-foreground/70 dark:text-muted-foreground mt-1 max-w-xs">
            Log vaccinations to track your baby&apos;s immunization schedule
          </p>
          {onLogVaccination && (
            <GlassButton 
              variant="primary"
              size="sm"
              onClick={() => onLogVaccination('')}
              className="mt-4"
            >
              Log First Vaccination
            </GlassButton>
          )}
        </div>
      </GlassCard>
    );
  }

  const { completed, upcoming, overdue, summary } = data;
  const totalCount = summary.completed + summary.upcoming + summary.overdue;
  const completionPercentage = totalCount > 0 ? Math.round((summary.completed / totalCount) * 100) : 0;
  const nextDue = upcoming.length > 0 ? upcoming[0] : (overdue.length > 0 ? overdue[0] : null);

  const getStatusBadge = (vaccination: ScheduledVaccination) => {
    if (vaccination.status === 'completed') {
      return (
        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 border gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Done
        </Badge>
      );
    }
    if (vaccination.status === 'overdue') {
      return (
        <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 border gap-1">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </Badge>
      );
    }
    if (vaccination.status === 'upcoming') {
      const dueDate = vaccination.nextDueAt ? new Date(vaccination.nextDueAt) : null;
      const now = new Date();
      const isDueSoon = dueDate && (dueDate.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000; // Within 7 days
      
      if (isDueSoon) {
        return (
          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 border gap-1">
            <Clock className="w-3 h-3" />
            Due Soon
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 border gap-1">
          <Calendar className="w-3 h-3" />
          Upcoming
        </Badge>
      );
    }
    return null;
  };

  return (
    <GlassCard className="bg-gradient-to-br from-cyan-100/80 to-teal-100/60 dark:from-cyan-950/60 dark:to-teal-950/40">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={Syringe} color="activity" size="default" />
          <div>
            <h3 className="font-semibold text-foreground">Vaccination Schedule</h3>
            <p className="text-xs text-foreground/70 dark:text-muted-foreground">
              {summary.completed} of {totalCount} completed ({completionPercentage}%)
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-white/20 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {overdue.length} overdue vaccination{overdue.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-500/80 mt-1">
                {overdue.map(v => v.vaccineName).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Due */}
      {nextDue && (
        <div className="mb-4 p-3 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Next Due</p>
              <p className="font-semibold text-foreground">{nextDue.vaccineName}</p>
              {nextDue.nextDueAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {new Date(nextDue.nextDueAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(nextDue)}
              {onLogVaccination && (
                <GlassButton 
                  size="sm" 
                  variant="default"
                  onClick={() => onLogVaccination(nextDue.vaccineName)}
                  className="text-xs"
                >
                  Log
                </GlassButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No vaccinations message */}
      {totalCount === 0 && (
        <div className="mb-4 p-4 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm text-center">
          <p className="text-sm text-muted-foreground">No vaccinations recorded yet</p>
          {onLogVaccination && (
            <GlassButton 
              size="sm" 
              variant="primary"
              onClick={() => onLogVaccination('')}
              className="mt-3"
            >
              Log First Vaccination
            </GlassButton>
          )}
        </div>
      )}

      {/* Expandable Full Schedule */}
      {totalCount > 0 && (
        <>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full justify-between text-muted-foreground hover:text-foreground"
          >
            <span>View Full Schedule</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </GlassButton>

          {expanded && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
              {/* Overdue */}
              {overdue.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-red-500 uppercase tracking-wide">
                    Overdue ({overdue.length})
                  </p>
                  {overdue.map((v) => (
                    <VaccinationItem 
                      key={v.id} 
                      vaccination={v} 
                      onLog={onLogVaccination}
                      onMarkComplete={handleMarkComplete}
                      onEditDate={handleUpdateDate}
                      isMarking={markingComplete === v.id}
                      isEditing={editingDate === v.id}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}

              {/* Upcoming */}
              {upcoming.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-medium text-blue-500 uppercase tracking-wide">
                    Upcoming ({upcoming.length})
                  </p>
                  {upcoming.map((v) => (
                    <VaccinationItem 
                      key={v.id} 
                      vaccination={v}
                      onLog={onLogVaccination}
                      onMarkComplete={handleMarkComplete}
                      onEditDate={handleUpdateDate}
                      isMarking={markingComplete === v.id}
                      isEditing={editingDate === v.id}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}

              {/* Completed */}
              {completed.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-medium text-green-500 uppercase tracking-wide">
                    Completed ({completed.length})
                  </p>
                  {completed.map((v) => (
                    <VaccinationItem 
                      key={v.id} 
                      vaccination={v}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}

/**
 * VaccinationItem Component
 * 
 * Individual vaccination item with glassmorphism styling.
 */
function VaccinationItem({ 
  vaccination, 
  onLog,
  onMarkComplete,
  onEditDate,
  isMarking,
  isEditing,
  getStatusBadge 
}: { 
  vaccination: ScheduledVaccination;
  onLog?: (name: string) => void;
  onMarkComplete?: (vaccination: ScheduledVaccination) => void;
  onEditDate?: (vaccination: ScheduledVaccination, newDate: string) => void;
  isMarking?: boolean;
  isEditing?: boolean;
  getStatusBadge: (v: ScheduledVaccination) => React.ReactNode;
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newDate, setNewDate] = useState(
    vaccination.nextDueAt 
      ? new Date(vaccination.nextDueAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );

  return (
    <div className={cn(
      "p-3 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm flex flex-col gap-2",
      vaccination.status === 'overdue' && "border border-red-500/30"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{vaccination.vaccineName}</p>
          {vaccination.provider && (
            <p className="text-xs text-muted-foreground truncate">Provider: {vaccination.provider}</p>
          )}
          {vaccination.status === 'completed' && vaccination.timestamp && (
            <p className="text-xs text-green-500 mt-1">
              Given: {new Date(vaccination.timestamp).toLocaleDateString()}
            </p>
          )}
          {vaccination.status !== 'completed' && vaccination.nextDueAt && !showDatePicker && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                Due: {new Date(vaccination.nextDueAt).toLocaleDateString()}
              </p>
              {onEditDate && (
                <button
                  onClick={() => setShowDatePicker(true)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 touch-target"
                  disabled={isEditing}
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {getStatusBadge(vaccination)}
        </div>
      </div>

      {/* Date Picker */}
      {showDatePicker && onEditDate && (
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <GlassInput
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="flex-1 text-xs h-8"
            disabled={isEditing}
          />
          <GlassButton
            size="sm"
            variant="primary"
            onClick={() => {
              onEditDate(vaccination, newDate);
              setShowDatePicker(false);
            }}
            disabled={isEditing}
            className="h-8 px-3 text-xs"
          >
            {isEditing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
          </GlassButton>
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={() => setShowDatePicker(false)}
            disabled={isEditing}
            className="h-8 px-3 text-xs"
          >
            Cancel
          </GlassButton>
        </div>
      )}

      {/* Actions */}
      {vaccination.status !== 'completed' && (
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          {onMarkComplete && (
            <GlassButton 
              size="sm" 
              variant="primary"
              onClick={() => onMarkComplete(vaccination)}
              disabled={isMarking}
              className="h-8 px-3 text-xs gap-1"
            >
              {isMarking ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Mark Complete
                </>
              )}
            </GlassButton>
          )}
          {onLog && (
            <GlassButton 
              size="sm" 
              variant="ghost"
              onClick={() => onLog(vaccination.vaccineName)}
              className="h-8 px-3 text-xs"
            >
              Log Details
            </GlassButton>
          )}
        </div>
      )}
    </div>
  );
}
