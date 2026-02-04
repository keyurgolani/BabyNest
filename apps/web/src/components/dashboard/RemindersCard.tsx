"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Bell, Clock, ChevronRight, Check, AlarmClock, X, Loader2 } from "lucide-react";
import { api, NextReminderResponse } from "@/lib/api-client";
import { Reminder } from "@babynest/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBaby } from "@/context/baby-context";

// Snooze duration options in minutes
const SNOOZE_OPTIONS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
];

export function RemindersCard() {
  const { babyId } = useBaby();
  const [nextReminder, setNextReminder] = useState<NextReminderResponse | null>(null);
  const [allReminders, setAllReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    if (!babyId) {
      setLoading(false);
      return;
    }
    
    try {
      const [nextRes, listRes] = await Promise.all([
        api.dashboard.getNextReminder(),
        api.reminders.list(),
      ]);
      setNextReminder(nextRes);
      setAllReminders(listRes.data.filter((r: Reminder) => r.isActive).slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Live countdown timer
  useEffect(() => {
    if (!nextReminder?.nextTriggerTime) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const triggerTime = new Date(nextReminder.nextTriggerTime!);
      const diffMs = triggerTime.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setCountdown("Now!");
        return;
      }

      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;

      if (diffHours > 0) {
        setCountdown(`${diffHours}h ${remainingMins}m`);
      } else if (diffMins > 0) {
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setCountdown(diffMins < 5 ? `${diffMins}m ${diffSecs}s` : `${diffMins}m`);
      } else {
        const diffSecs = Math.floor(diffMs / 1000);
        setCountdown(`${diffSecs}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextReminder?.nextTriggerTime]);

  const getReminderIcon = (type: string) => {
    switch (type) {
      case "feeding":
      case "FEED":
        return "🍼";
      case "sleep":
      case "SLEEP":
        return "😴";
      case "diaper":
      case "DIAPER":
        return "👶";
      case "medication":
      case "medicine":
      case "MEDICINE":
        return "💊";
      case "vaccination":
        return "💉";
      case "doctor_visit":
        return "🏥";
      default:
        return "⏰";
    }
  };

  const handleComplete = async (reminderId: string) => {
    setActionLoading(`complete-${reminderId}`);
    try {
      await api.reminders.update(reminderId, { isActive: false });
      await fetchReminders();
    } catch (error) {
      console.error("Failed to complete reminder:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSnooze = async (reminderId: string, minutes: number) => {
    setActionLoading(`snooze-${reminderId}`);
    try {
      const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
      await api.reminders.update(reminderId, {
        isSnoozed: true,
        snoozedUntil,
      });
      setShowSnoozeOptions(false);
      await fetchReminders();
    } catch (error) {
      console.error("Failed to snooze reminder:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (reminderId: string) => {
    setActionLoading(`dismiss-${reminderId}`);
    try {
      await api.reminders.toggle(reminderId, false);
      await fetchReminders();
    } catch (error) {
      console.error("Failed to dismiss reminder:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <GlassCard className="relative overflow-hidden">
        <div className="pb-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            Reminders
          </h3>
        </div>
        <div className="space-y-3">
          {/* Featured reminder skeleton */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-3 w-20 bg-white/10 rounded" />
                <div className="flex gap-2 pt-2">
                  <div className="h-8 w-16 bg-white/10 rounded-lg" />
                  <div className="h-8 w-16 bg-white/10 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
          {/* Secondary reminders skeleton */}
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-white/10" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-28 bg-white/10 rounded" />
                <div className="h-2 w-20 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
      </GlassCard>
    );
  }

  const isOverdue = nextReminder?.minutesUntilTrigger !== null && 
                    nextReminder?.minutesUntilTrigger !== undefined && 
                    nextReminder.minutesUntilTrigger < 0;

  return (
    <GlassCard className="hover:shadow-2xl transition-shadow duration-200">
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            Reminders
          </h3>
          <Link href="/reminders" className="text-xs text-primary font-semibold hover:underline">
            Manage
          </Link>
        </div>
      </div>
      <div>
        {!nextReminder?.reminder && allReminders.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3 shadow-[0_4px_16px_rgba(251,191,36,0.3)]">
              <Bell className="w-7 h-7 text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No active reminders</p>
            <p className="text-xs text-muted-foreground mb-3">
              Set up reminders to stay on top of your baby&apos;s schedule
            </p>
            <Link
              href="/reminders"
              className="text-xs text-primary font-medium hover:underline"
            >
              Set up reminders →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Next upcoming reminder - highlighted with countdown and quick actions */}
            {nextReminder?.reminder && (
              <div className={cn(
                "p-4 rounded-xl border transition-all",
                isOverdue 
                  ? "bg-red-500/10 border-red-500/30 dark:bg-red-950/30 dark:border-red-800/30" 
                  : "bg-primary/10 border-primary/20"
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-lg",
                    isOverdue ? "bg-red-500/20 dark:bg-red-900/50" : "bg-primary/20"
                  )}>
                    {getReminderIcon(nextReminder.reminder.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn(
                        "text-sm font-semibold truncate",
                        isOverdue ? "text-red-700 dark:text-red-400" : "text-primary"
                      )}>
                        {nextReminder.reminder.name}
                      </p>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                        isOverdue 
                          ? "bg-red-500/20 text-red-600 dark:bg-red-800/30 dark:text-red-300" 
                          : "bg-primary/20 text-primary"
                      )}>
                        {isOverdue ? "Overdue" : "Next"}
                      </span>
                    </div>
                    
                    {/* Countdown display */}
                    <div className={cn(
                      "flex items-center gap-1.5 text-sm font-medium mb-3",
                      isOverdue ? "text-red-600 dark:text-red-400" : "text-primary"
                    )}>
                      <Clock className="w-4 h-4" />
                      <span className={cn(
                        "tabular-nums",
                        countdown === "Now!" && "animate-pulse"
                      )}>
                        {countdown || nextReminder.timeUntilTrigger || "Soon"}
                      </span>
                      {nextReminder.nextTriggerTime && (
                        <span className="text-xs opacity-70">
                          ({new Date(nextReminder.nextTriggerTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })})
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    {!showSnoozeOptions ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 px-3 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleComplete(nextReminder.reminder!.id)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `complete-${nextReminder.reminder.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 gap-1.5"
                          onClick={() => setShowSnoozeOptions(true)}
                          disabled={actionLoading !== null}
                        >
                          <AlarmClock className="w-3.5 h-3.5" />
                          Snooze
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => handleDismiss(nextReminder.reminder!.id)}
                          disabled={actionLoading !== null}
                          title="Dismiss reminder"
                        >
                          {actionLoading === `dismiss-${nextReminder.reminder.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {SNOOZE_OPTIONS.map((option) => (
                          <Button
                            key={option.minutes}
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              if (nextReminder?.reminder?.id) {
                                handleSnooze(nextReminder.reminder.id, option.minutes);
                              }
                            }}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading === `snooze-${nextReminder?.reminder?.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              option.label
                            )}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setShowSnoozeOptions(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other active reminders */}
            {allReminders
              .filter((r) => r.id !== nextReminder?.reminder?.id)
              .slice(0, 2)
              .map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-base shadow-sm">
                    {getReminderIcon(reminder.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{reminder.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {reminder.intervalMinutes
                        ? `Every ${Math.floor(reminder.intervalMinutes / 60)}h ${reminder.intervalMinutes % 60}m`
                        : reminder.scheduledTimes?.join(", ")}
                    </p>
                  </div>
                </div>
              ))}

            {allReminders.length > 3 && (
              <Link
                href="/reminders"
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground py-2"
              >
                View all reminders
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
