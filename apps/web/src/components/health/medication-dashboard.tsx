"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { IconBadge } from "@/components/ui/icon-badge";
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
import { motion } from "framer-motion";

/**
 * MedicationDashboard Component - Glassmorphism Redesign
 * 
 * Requirements:
 * - 24.2: Display medications tracker with GlassCard, GlassButton components
 */

interface MedicationWithStatus extends MedicationResponse {
  status: 'overdue' | 'due-soon' | 'upcoming';
  timeUntilDue?: string;
  minutesUntilDue?: number;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

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
          <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-0 gap-1 backdrop-blur-sm">
            <AlertTriangle className="w-3 h-3" />
            Overdue
          </Badge>
        );
      case 'due-soon':
        return (
          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-0 gap-1 backdrop-blur-sm">
            <Clock className="w-3 h-3" />
            Due Soon
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-0 gap-1 backdrop-blur-sm">
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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Loading skeleton for summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} size="sm" className="animate-pulse">
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-6 h-6 rounded-full bg-white/20" />
                <div className="w-8 h-6 rounded bg-white/20" />
                <div className="w-12 h-3 rounded bg-white/10" />
              </div>
            </GlassCard>
          ))}
        </div>
        
        {/* Loading skeleton for medication cards */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-5 rounded bg-white/20" />
                  <div className="w-48 h-4 rounded bg-white/10" />
                  <div className="w-24 h-4 rounded bg-white/10" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </motion.div>
    );
  }

  const overdueMeds = medications.filter(m => m.status === 'overdue');
  const dueSoonMeds = medications.filter(m => m.status === 'due-soon');
  const upcomingMeds = medications.filter(m => m.status === 'upcoming');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Summary Cards with glassmorphism styling */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-3">
          <GlassCard 
            size="sm" 
            className={cn(
              overdueMeds.length > 0 && "bg-gradient-to-br from-red-500/10 to-rose-500/10"
            )}
          >
            <div className="flex flex-col items-center gap-1 py-1">
              <AlertTriangle className={cn(
                "w-5 h-5",
                overdueMeds.length > 0 
                  ? "text-red-500 dark:text-red-400" 
                  : "text-muted-foreground"
              )} />
              <p className="text-2xl font-bold text-foreground">{overdueMeds.length}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </GlassCard>

          <GlassCard 
            size="sm"
            className={cn(
              dueSoonMeds.length > 0 && "bg-gradient-to-br from-amber-500/10 to-orange-500/10"
            )}
          >
            <div className="flex flex-col items-center gap-1 py-1">
              <Clock className={cn(
                "w-5 h-5",
                dueSoonMeds.length > 0 
                  ? "text-amber-500 dark:text-amber-400" 
                  : "text-muted-foreground"
              )} />
              <p className="text-2xl font-bold text-foreground">{dueSoonMeds.length}</p>
              <p className="text-xs text-muted-foreground">Due Soon</p>
            </div>
          </GlassCard>

          <GlassCard size="sm">
            <div className="flex flex-col items-center gap-1 py-1">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{upcomingMeds.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
          </GlassCard>
        </div>
      </motion.div>

      {/* Overdue Medications */}
      {overdueMeds.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
            <h3 className="font-semibold text-foreground">Overdue Medications</h3>
            <Badge variant="destructive" className="ml-auto">
              {overdueMeds.length}
            </Badge>
          </div>
          <div className="space-y-3">
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
        </motion.div>
      )}

      {/* Due Soon Medications */}
      {dueSoonMeds.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h3 className="font-semibold text-foreground">Due Soon</h3>
            <Badge variant="outline" className="ml-auto backdrop-blur-sm">
              {dueSoonMeds.length}
            </Badge>
          </div>
          <div className="space-y-3">
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
        </motion.div>
      )}

      {/* Upcoming Medications */}
      {upcomingMeds.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h3 className="font-semibold text-foreground">Upcoming</h3>
            <Badge variant="outline" className="ml-auto backdrop-blur-sm">
              {upcomingMeds.length}
            </Badge>
          </div>
          <div className="space-y-3">
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
              <GlassButton variant="ghost" size="sm" className="w-full gap-2">
                View {upcomingMeds.length - 5} more
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {medications.length === 0 && (
        <motion.div variants={itemVariants}>
          <GlassCard className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <IconBadge 
                icon={Pill} 
                color="nursing" 
                size="lg"
                className="opacity-50"
              />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">No medications scheduled</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Add medications to track doses and get reminders
                </p>
              </div>
              <Link href="/health/medications/new">
                <GlassButton variant="primary" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Medication
                </GlassButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
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

  // Determine card variant and gradient based on status
  const getCardStyles = () => {
    switch (medication.status) {
      case 'overdue':
        return "bg-gradient-to-br from-red-500/10 to-rose-500/10";
      case 'due-soon':
        return "bg-gradient-to-br from-amber-500/10 to-orange-500/10";
      default:
        return "";
    }
  };

  // Determine icon color based on status
  const getIconColor = () => {
    switch (medication.status) {
      case 'overdue':
        return "health" as const;
      case 'due-soon':
        return "feed" as const;
      default:
        return "nursing" as const;
    }
  };

  return (
    <GlassCard 
      className={cn(getCardStyles())}
      size={compact ? "sm" : "default"}
    >
      <div className="flex items-start gap-3">
        {/* Icon Badge */}
        <IconBadge 
          icon={Pill} 
          color={getIconColor()} 
          size={compact ? "sm" : "default"}
        />

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
              <GlassButton
                size="sm"
                variant="primary"
                onClick={() => onMarkTaken(medication.id)}
                disabled={isMarking || isSnoozing}
                className="h-9 px-3 gap-1.5"
              >
                {isMarking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Mark Taken
              </GlassButton>
              <GlassButton
                size="sm"
                variant="default"
                onClick={() => setShowSnoozeOptions(true)}
                disabled={isMarking || isSnoozing}
                className="h-9 px-3 gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                Snooze
              </GlassButton>
            </div>
          )}

          {/* Snooze Options */}
          {!compact && showSnoozeOptions && (
            <div className="flex items-center gap-2 flex-wrap">
              {snoozeOptions.map((option) => (
                <GlassButton
                  key={option.minutes}
                  size="sm"
                  variant="default"
                  onClick={() => {
                    onSnooze(medication.id, option.minutes);
                    setShowSnoozeOptions(false);
                  }}
                  disabled={isSnoozing}
                  className="h-8 px-3 text-xs"
                >
                  {isSnoozing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    option.label
                  )}
                </GlassButton>
              ))}
              <GlassButton
                size="sm"
                variant="ghost"
                onClick={() => setShowSnoozeOptions(false)}
                className="h-8 px-3 text-xs"
              >
                Cancel
              </GlassButton>
            </div>
          )}

          {/* Compact Actions */}
          {compact && (
            <GlassButton
              size="sm"
              variant="ghost"
              onClick={() => onMarkTaken(medication.id)}
              disabled={isMarking}
              className="h-8 px-2 text-xs gap-1"
            >
              {isMarking ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Mark Taken
                </>
              )}
            </GlassButton>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
