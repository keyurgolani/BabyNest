"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { api } from "@/lib/api-client";
import { Reminder, ReminderType, CreateReminderDto, UpdateReminderDto } from "@babynest/types";

// Frontend type for display
type FrontendReminderType = "feed" | "sleep" | "diaper" | "medicine" | "custom";

// Map frontend types to backend ReminderType enum
const frontendToBackendType: Record<FrontendReminderType, ReminderType> = {
  feed: ReminderType.FEED,
  sleep: ReminderType.SLEEP,
  diaper: ReminderType.DIAPER,
  medicine: ReminderType.MEDICINE,
  custom: ReminderType.CUSTOM,
};

// Map backend ReminderType to frontend types
const backendToFrontendType: Record<ReminderType, FrontendReminderType> = {
  [ReminderType.FEED]: "feed",
  [ReminderType.SLEEP]: "sleep",
  [ReminderType.DIAPER]: "diaper",
  [ReminderType.MEDICINE]: "medicine",
  [ReminderType.CUSTOM]: "custom",
};

// Snooze duration options in minutes
const SNOOZE_OPTIONS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "Custom", minutes: -1 },
];

interface ReminderWithTrigger extends Reminder {
  nextTriggerTime: Date | null;
  minutesUntilTrigger: number | null;
  isOverdue: boolean;
}

// Type configuration for icons and colors
const typeConfig: Record<FrontendReminderType, {
  icon: keyof typeof Icons;
  bgColor: string;
  iconColor: string;
  label: string;
}> = {
  feed: { icon: "Feed", bgColor: "bg-[#FFE8D6]", iconColor: "text-[#E07A5F]", label: "Feeding" },
  sleep: { icon: "Sleep", bgColor: "bg-[#E0F4FF]", iconColor: "text-[#4A9EBF]", label: "Sleep" },
  diaper: { icon: "Diaper", bgColor: "bg-[#F2F7D9]", iconColor: "text-[#A7C957]", label: "Diaper" },
  medicine: { icon: "Medication", bgColor: "bg-purple-100", iconColor: "text-purple-500", label: "Medicine" },
  custom: { icon: "Reminders", bgColor: "bg-gray-100", iconColor: "text-gray-500", label: "Custom" },
};

// Quick add options
const quickAddOptions = [
  { type: "feed" as const, label: "Feeding", defaultInterval: 180 },
  { type: "sleep" as const, label: "Nap Time", defaultInterval: 120 },
  { type: "diaper" as const, label: "Diaper Check", defaultInterval: 120 },
  { type: "medicine" as const, label: "Medicine", defaultInterval: null },
];

// Suggested reminders for empty state
const suggestedReminders = [
  { type: "feed" as const, title: "Feeding Reminder", description: "Every 3 hours", intervalMinutes: 180 },
  { type: "sleep" as const, title: "Nap Time", description: "Every 2 hours", intervalMinutes: 120 },
  { type: "diaper" as const, title: "Diaper Check", description: "Every 2 hours", intervalMinutes: 120 },
  { type: "medicine" as const, title: "Vitamin D", description: "Daily at 9:00 AM", scheduledTimes: ["09:00"] },
];

function calculateNextTrigger(reminder: Reminder): { nextTriggerTime: Date | null; minutesUntilTrigger: number | null; isOverdue: boolean } {
  if (!reminder.isActive || reminder.isSnoozed) {
    return { nextTriggerTime: null, minutesUntilTrigger: null, isOverdue: false };
  }

  const now = new Date();
  
  // If reminder has nextTriggerAt from backend, use it
  if (reminder.nextTriggerAt) {
    const triggerTime = new Date(reminder.nextTriggerAt);
    const minutesUntil = Math.round((triggerTime.getTime() - now.getTime()) / (1000 * 60));
    return { 
      nextTriggerTime: triggerTime, 
      minutesUntilTrigger: minutesUntil,
      isOverdue: minutesUntil < 0
    };
  }

  // Calculate based on interval
  if (reminder.intervalMinutes) {
    const lastTriggered = reminder.lastTriggeredAt ? new Date(reminder.lastTriggeredAt) : new Date(reminder.createdAt);
    const nextTrigger = new Date(lastTriggered.getTime() + reminder.intervalMinutes * 60 * 1000);
    const minutesUntil = Math.round((nextTrigger.getTime() - now.getTime()) / (1000 * 60));
    return { 
      nextTriggerTime: nextTrigger, 
      minutesUntilTrigger: minutesUntil,
      isOverdue: minutesUntil < 0
    };
  }

  // Calculate based on scheduled times
  if (reminder.scheduledTimes && reminder.scheduledTimes.length > 0) {
    const todayTimes = reminder.scheduledTimes.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    });

    // Find next scheduled time
    const futureTimes = todayTimes.filter(t => t > now);
    if (futureTimes.length > 0) {
      const nextTrigger = futureTimes[0];
      const minutesUntil = Math.round((nextTrigger.getTime() - now.getTime()) / (1000 * 60));
      return { 
        nextTriggerTime: nextTrigger, 
        minutesUntilTrigger: minutesUntil,
        isOverdue: false
      };
    }

    // Check if any times today are overdue
    const pastTimes = todayTimes.filter(t => t <= now);
    if (pastTimes.length > 0) {
      const lastTime = pastTimes[pastTimes.length - 1];
      const minutesUntil = Math.round((lastTime.getTime() - now.getTime()) / (1000 * 60));
      return {
        nextTriggerTime: lastTime,
        minutesUntilTrigger: minutesUntil,
        isOverdue: true
      };
    }

    // If no future times today, get first time tomorrow
    const tomorrow = new Date(todayTimes[0]);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minutesUntil = Math.round((tomorrow.getTime() - now.getTime()) / (1000 * 60));
    return { 
      nextTriggerTime: tomorrow, 
      minutesUntilTrigger: minutesUntil,
      isOverdue: false
    };
  }

  return { nextTriggerTime: null, minutesUntilTrigger: null, isOverdue: false };
}

function formatTimeUntil(minutes: number | null, isOverdue: boolean): string {
  if (minutes === null) return "Not scheduled";
  if (isOverdue) return "Overdue";
  if (minutes < 1) return "Now";
  if (minutes < 60) return `In ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return mins > 0 ? `In ${hours}h ${mins}m` : `In ${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `In ${days} day${days > 1 ? 's' : ''}`;
}

function formatTriggerTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatReminderSchedule(reminder: Reminder): string {
  if (reminder.intervalMinutes) {
    const hours = Math.floor(reminder.intervalMinutes / 60);
    const minutes = reminder.intervalMinutes % 60;
    if (hours > 0 && minutes > 0) {
      return `Every ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `Every ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `Every ${minutes} min`;
    }
  }
  if (reminder.scheduledTimes && reminder.scheduledTimes.length > 0) {
    if (reminder.scheduledTimes.length <= 3) {
      return `Daily at ${reminder.scheduledTimes.join(", ")}`;
    }
    return `${reminder.scheduledTimes.length} times daily`;
  }
  return "No schedule set";
}

type ReminderGroup = "overdue" | "today" | "tomorrow" | "thisWeek" | "later" | "snoozed" | "inactive";

function groupReminders(reminders: ReminderWithTrigger[]): Record<ReminderGroup, ReminderWithTrigger[]> {
  const groups: Record<ReminderGroup, ReminderWithTrigger[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    snoozed: [],
    inactive: [],
  };

  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  reminders.forEach(reminder => {
    if (!reminder.isActive) {
      groups.inactive.push(reminder);
    } else if (reminder.isSnoozed) {
      groups.snoozed.push(reminder);
    } else if (reminder.isOverdue) {
      groups.overdue.push(reminder);
    } else if (reminder.nextTriggerTime) {
      const triggerTime = new Date(reminder.nextTriggerTime);
      if (triggerTime <= todayEnd) {
        groups.today.push(reminder);
      } else if (triggerTime <= tomorrowEnd) {
        groups.tomorrow.push(reminder);
      } else if (triggerTime <= weekEnd) {
        groups.thisWeek.push(reminder);
      } else {
        groups.later.push(reminder);
      }
    } else {
      groups.later.push(reminder);
    }
  });

  // Sort each group by next trigger time
  const sortByTrigger = (a: ReminderWithTrigger, b: ReminderWithTrigger) => {
    if (a.minutesUntilTrigger === null) return 1;
    if (b.minutesUntilTrigger === null) return -1;
    return a.minutesUntilTrigger - b.minutesUntilTrigger;
  };

  Object.keys(groups).forEach(key => {
    groups[key as ReminderGroup].sort(sortByTrigger);
  });

  return groups;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [selectedType, setSelectedType] = useState<FrontendReminderType | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [snoozeModalId, setSnoozeModalId] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchReminders = useCallback(async () => {
    try {
      setError(null);
      const response = await api.reminders.list();
      setReminders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reminders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReminders();
  }, [fetchReminders]);

  // Calculate trigger times and group reminders
  const remindersWithTrigger: ReminderWithTrigger[] = useMemo(() => {
    return reminders.map(reminder => ({
      ...reminder,
      ...calculateNextTrigger(reminder),
    }));
  }, [reminders]);

  const groupedReminders = useMemo(() => {
    return groupReminders(remindersWithTrigger);
  }, [remindersWithTrigger]);

  const toggleReminder = async (id: string, currentEnabled: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(id));
    try {
      const updatedReminder = await api.reminders.toggle(id, !currentEnabled);
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? updatedReminder : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle reminder");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const completeReminder = async (id: string) => {
    setCompletingIds((prev) => new Set(prev).add(id));
    try {
      // Mark as completed by updating lastTriggeredAt to now
      const updatedReminder = await api.reminders.update(id, {
        isActive: false,
      });
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? updatedReminder : r))
      );
      
      // Show success message
      setTimeout(() => {
        setError(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete reminder");
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const snoozeReminder = async (id: string, minutes: number) => {
    try {
      const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
      const updatedReminder = await api.reminders.update(id, {
        isSnoozed: true,
        snoozedUntil,
      });
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? updatedReminder : r))
      );
      setSnoozeModalId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to snooze reminder");
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await api.reminders.delete(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete reminder");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} reminder(s)?`)) return;
    
    const idsToDelete = Array.from(selectedIds);
    for (const id of idsToDelete) {
      setDeletingIds((prev) => new Set(prev).add(id));
    }
    
    try {
      await Promise.all(idsToDelete.map(id => api.reminders.delete(id)));
      setReminders((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      setBatchMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete reminders");
    } finally {
      idsToDelete.forEach(id => {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
    }
  };

  const handleBatchToggle = async (enabled: boolean) => {
    const idsToToggle = Array.from(selectedIds);
    for (const id of idsToToggle) {
      setTogglingIds((prev) => new Set(prev).add(id));
    }
    
    try {
      const updates = await Promise.all(
        idsToToggle.map(id => api.reminders.toggle(id, enabled))
      );
      setReminders((prev) =>
        prev.map((r) => {
          const updated = updates.find(u => u.id === r.id);
          return updated || r;
        })
      );
      setSelectedIds(new Set());
      setBatchMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update reminders");
    } finally {
      idsToToggle.forEach(id => {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleQuickAdd = (type: FrontendReminderType) => {
    setSelectedType(type);
    setEditingReminder(null);
    setShowModal(true);
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setSelectedType(backendToFrontendType[reminder.type]);
    setShowModal(true);
  };

  const handleAddReminder = async (data: CreateReminderDto) => {
    try {
      const newReminder = await api.reminders.create(data);
      setReminders((prev) => [newReminder, ...prev]);
      setShowModal(false);
      setSelectedType(null);
      setEditingReminder(null);
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateReminder = async (id: string, data: UpdateReminderDto) => {
    try {
      const updatedReminder = await api.reminders.update(id, data);
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? updatedReminder : r))
      );
      setShowModal(false);
      setEditingReminder(null);
      setSelectedType(null);
    } catch (err) {
      throw err;
    }
  };

  const handleSuggestedReminder = async (suggestion: typeof suggestedReminders[0]) => {
    const data: CreateReminderDto = {
      type: frontendToBackendType[suggestion.type],
      title: suggestion.title,
      isActive: true,
      intervalMinutes: suggestion.intervalMinutes,
      scheduledTimes: suggestion.scheduledTimes,
    };
    
    try {
      const newReminder = await api.reminders.create(data);
      setReminders((prev) => [newReminder, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create reminder");
    }
  };

  if (loading) {
    return (
      <main className="flex flex-col gap-6 p-4 pt-12 pb-32">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-foreground">Reminders</h1>
            <span className="text-muted-foreground text-sm">Never miss a moment</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  const hasReminders = reminders.length > 0;

  return (
    <main 
      ref={scrollContainerRef}
      className="flex flex-col gap-6 p-4 pt-12 pb-32 scroll-smooth"
      onTouchStart={(e) => {
        const touch = e.touches[0];
        const startY = touch.clientY;
        const scrollTop = scrollContainerRef.current?.scrollTop || 0;
        
        if (scrollTop === 0 && startY < 100) {
          // Pull to refresh gesture detected
          const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentY = moveEvent.touches[0].clientY;
            const diff = currentY - startY;
            if (diff > 80 && !refreshing) {
              handleRefresh();
              document.removeEventListener('touchmove', handleTouchMove);
            }
          };
          document.addEventListener('touchmove', handleTouchMove, { once: true });
        }
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-foreground">Reminders</h1>
          <span className="text-muted-foreground text-sm">
            {refreshing ? "Refreshing..." : "Never miss a moment"}
          </span>
        </div>
        <div className="flex gap-2">
          {hasReminders && (
            <Button
              onClick={() => setBatchMode(!batchMode)}
              variant={batchMode ? "default" : "outline"}
              size="sm"
              className="gap-2"
            >
              {batchMode ? <Icons.Close className="w-4 h-4" /> : <Icons.Check className="w-4 h-4" />}
              {batchMode ? "Cancel" : "Select"}
            </Button>
          )}
          <Button onClick={() => { setSelectedType(null); setEditingReminder(null); setShowModal(true); }} className="gap-2">
            <Icons.Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {batchMode && selectedIds.size > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBatchToggle(true)}>
                Enable
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBatchToggle(false)}>
                Disable
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBatchDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200 p-4">
          <div className="flex items-center gap-3">
            <Icons.AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Quick Add Buttons */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Add</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickAddOptions.map((option) => {
            const config = typeConfig[option.type];
            const IconComponent = Icons[config.icon];
            return (
              <button
                key={option.type}
                onClick={() => handleQuickAdd(option.type)}
                className={`flex items-center gap-3 p-4 rounded-xl ${config.bgColor} hover:opacity-80 transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                <span className={`font-medium ${config.iconColor}`}>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {!hasReminders && (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Icons.Reminders className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No reminders yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Set up reminders to stay on track with feedings, naps, diaper changes, and more.
          </p>
          
          <div className="w-full max-w-md">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Suggested Reminders</h4>
            <div className="flex flex-col gap-2">
              {suggestedReminders.map((suggestion, index) => {
                const config = typeConfig[suggestion.type];
                const IconComponent = Icons[config.icon];
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestedReminder(suggestion)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{suggestion.title}</p>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                    <Icons.Plus className="w-5 h-5 text-primary" />
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Reminders List */}
      {hasReminders && (
        <div className="flex flex-col gap-6">
          {/* Overdue */}
          {groupedReminders.overdue.length > 0 && (
            <ReminderSection
              title="Overdue"
              subtitle="Needs attention"
              reminders={groupedReminders.overdue}
              onToggle={toggleReminder}
              onEdit={handleEdit}
              onDelete={deleteReminder}
              onComplete={completeReminder}
              onSnooze={(id) => setSnoozeModalId(id)}
              togglingIds={togglingIds}
              deletingIds={deletingIds}
              completingIds={completingIds}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              variant="overdue"
            />
          )}

          {/* Today */}
          {groupedReminders.today.length > 0 && (
            <ReminderSection
              title="Today"
              subtitle="Due today"
              reminders={groupedReminders.today}
              onToggle={toggleReminder}
              onEdit={handleEdit}
              onDelete={deleteReminder}
              onComplete={completeReminder}
              onSnooze={(id) => setSnoozeModalId(id)}
              togglingIds={togglingIds}
              deletingIds={deletingIds}
              completingIds={completingIds}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              variant="today"
            />
          )}

          {/* Tomorrow */}
          {groupedReminders.tomorrow.length > 0 && (
            <ReminderSection
              title="Tomorrow"
              subtitle="Due tomorrow"
              reminders={groupedReminders.tomorrow}
              onToggle={toggleReminder}
              onEdit={handleEdit}
              onDelete={deleteReminder}
              onComplete={completeReminder}
              onSnooze={(id) => setSnoozeModalId(id)}
              togglingIds={togglingIds}
              deletingIds={deletingIds}
              completingIds={completingIds}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
            />
          )}

          {/* This Week */}
          {groupedReminders.thisWeek.length > 0 && (
            <ReminderSection
              title="This Week"
              subtitle="Next 7 days"
              reminders={groupedReminders.thisWeek}
              onToggle={toggleReminder}
              onEdit={handleEdit}
              onDelete={deleteReminder}
              onComplete={completeReminder}
              onSnooze={(id) => setSnoozeModalId(id)}
              togglingIds={togglingIds}
              deletingIds={deletingIds}
              completingIds={completingIds}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
            />
          )}

          {/* Later */}
          {groupedReminders.later.length > 0 && (
            <ReminderSection
              title="Later"
              subtitle="More than a week away"
              reminders={groupedReminders.later}
              onToggle={toggleReminder}
              onEdit={handleEdit}
              onDelete={deleteReminder}
              onComplete={completeReminder}
              onSnooze={(id) => setSnoozeModalId(id)}
              togglingIds={togglingIds}
              deletingIds={deletingIds}
              completingIds={completingIds}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
            />
          )}

          {/* Snoozed */}
          {groupedReminders.snoozed.length > 0 && (
            <ReminderSection
              title="Snoozed"
              subtitle="Temporarily paused"
              reminders={groupedReminders.snoozed}
              onToggle={toggleReminder}
              onEdit={handleEdit}
              onDelete={deleteReminder}
              onComplete={completeReminder}
              onSnooze={(id) => setSnoozeModalId(id)}
              togglingIds={togglingIds}
              deletingIds={deletingIds}
              completingIds={completingIds}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              dimmed
            />
          )}

          {/* Inactive */}
          {groupedReminders.inactive.length > 0 && (
            <ReminderSection
              title="Inactive"
              subtitle="Disabled reminders"
              reminders={groupedReminders.inactive}
              onToggle={toggleReminder}
              onEdit={handleEdit}
              onDelete={deleteReminder}
              onComplete={completeReminder}
              onSnooze={(id) => setSnoozeModalId(id)}
              togglingIds={togglingIds}
              deletingIds={deletingIds}
              completingIds={completingIds}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              dimmed
            />
          )}
        </div>
      )}

      {/* Add/Edit Reminder Modal */}
      {showModal && (
        <ReminderModal
          onClose={() => { setShowModal(false); setSelectedType(null); setEditingReminder(null); }}
          onAdd={handleAddReminder}
          onUpdate={handleUpdateReminder}
          initialType={selectedType}
          editingReminder={editingReminder}
        />
      )}

      {/* Snooze Modal */}
      {snoozeModalId && (
        <SnoozeModal
          onClose={() => setSnoozeModalId(null)}
          onSnooze={(minutes) => snoozeReminder(snoozeModalId, minutes)}
        />
      )}
    </main>
  );
}

// Snooze Modal Component
function SnoozeModal({
  onClose,
  onSnooze,
}: {
  onClose: () => void;
  onSnooze: (minutes: number) => void;
}) {
  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleSnooze = (minutes: number) => {
    if (minutes === -1) {
      setShowCustom(true);
    } else {
      onSnooze(minutes);
    }
  };

  const handleCustomSnooze = () => {
    const minutes = parseInt(customMinutes);
    if (minutes > 0) {
      onSnooze(minutes);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-foreground">Snooze Reminder</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>

          {!showCustom ? (
            <div className="flex flex-col gap-2">
              {SNOOZE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleSnooze(option.minutes)}
                  className="w-full py-3 px-4 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-left font-medium"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Minutes
                </label>
                <input
                  type="number"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Enter minutes"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCustom(false)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleCustomSnooze} className="flex-1" disabled={!customMinutes || parseInt(customMinutes) <= 0}>
                  Snooze
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Reminder Section Component
function ReminderSection({
  title,
  subtitle,
  reminders,
  onToggle,
  onEdit,
  onDelete,
  onComplete,
  onSnooze,
  togglingIds,
  deletingIds,
  completingIds,
  batchMode,
  selectedIds,
  onToggleSelection,
  variant,
  dimmed = false,
}: {
  title: string;
  subtitle: string;
  reminders: ReminderWithTrigger[];
  onToggle: (id: string, currentEnabled: boolean) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  togglingIds: Set<string>;
  deletingIds: Set<string>;
  completingIds: Set<string>;
  batchMode: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  variant?: "overdue" | "today" | "tomorrow" | string;
  dimmed?: boolean;
}) {
  const getBadgeVariant = () => {
    if (variant === "overdue") return "destructive";
    if (variant === "today") return "default";
    return "secondary";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
        <Badge variant={getBadgeVariant()} className="text-xs">
          {reminders.length}
        </Badge>
        <span className="text-xs text-muted-foreground">• {subtitle}</span>
      </div>
      <div className={`flex flex-col gap-3 ${dimmed ? 'opacity-60' : ''}`}>
        {reminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
            onSnooze={onSnooze}
            isToggling={togglingIds.has(reminder.id)}
            isDeleting={deletingIds.has(reminder.id)}
            isCompleting={completingIds.has(reminder.id)}
            isOverdue={variant === "overdue"}
            batchMode={batchMode}
            isSelected={selectedIds.has(reminder.id)}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
    </div>
  );
}

// Reminder Card Component
function ReminderCard({
  reminder,
  onToggle,
  onEdit,
  onDelete,
  onComplete,
  onSnooze,
  isToggling,
  isDeleting,
  isCompleting,
  isOverdue = false,
  batchMode,
  isSelected,
  onToggleSelection,
}: {
  reminder: ReminderWithTrigger;
  onToggle: (id: string, currentEnabled: boolean) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
  isCompleting: boolean;
  isOverdue?: boolean;
  batchMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);

  const frontendType = backendToFrontendType[reminder.type];
  const config = typeConfig[frontendType];
  const IconComponent = Icons[config.icon];
  const schedule = formatReminderSchedule(reminder);
  const timeUntil = formatTimeUntil(reminder.minutesUntilTrigger, reminder.isOverdue);
  const triggerTime = formatTriggerTime(reminder.nextTriggerTime);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (batchMode) return;
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (batchMode || !isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    // Only allow left swipe
    if (diff < 0) {
      setSwipeX(Math.max(diff, -200));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeX < -100) {
      setShowActions(true);
      setSwipeX(-200);
    } else {
      setSwipeX(0);
      setShowActions(false);
    }
  };

  const getStatusBadge = () => {
    if (reminder.isSnoozed) {
      return <Badge variant="soft" className="text-xs">Snoozed</Badge>;
    }
    if (!reminder.isActive) {
      return <Badge variant="outline" className="text-xs">Inactive</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive" className="text-xs animate-pulse">Overdue</Badge>;
    }
    return null;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Actions Background */}
      {showActions && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-4">
          <button
            onClick={() => { onComplete(reminder.id); setShowActions(false); setSwipeX(0); }}
            className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
            disabled={isCompleting}
          >
            <Icons.Check className="w-5 h-5" />
          </button>
          <button
            onClick={() => { onSnooze(reminder.id); setShowActions(false); setSwipeX(0); }}
            className="w-12 h-12 rounded-xl bg-yellow-500 text-white flex items-center justify-center hover:bg-yellow-600 transition-colors"
          >
            <Icons.Clock className="w-5 h-5" />
          </button>
          <button
            onClick={() => { onDelete(reminder.id); setShowActions(false); setSwipeX(0); }}
            className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            disabled={isDeleting}
          >
            <Icons.Trash className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Card Content */}
      <Card 
        className={`transition-all ${isDeleting ? 'opacity-50 scale-95' : ''} ${
          isOverdue ? 'ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/20' : ''
        } ${isSelected ? 'ring-2 ring-primary' : ''} ${
          reminder.isActive && !reminder.isSnoozed && reminder.minutesUntilTrigger !== null && reminder.minutesUntilTrigger <= 60 && !isOverdue
            ? 'animate-pulse-subtle'
            : ''
        }`}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Checkbox for batch mode */}
            {batchMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelection(reminder.id)}
                className="w-5 h-5 rounded border-muted-foreground text-primary focus:ring-primary"
              />
            )}

            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
              <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">{reminder.title}</h3>
                {getStatusBadge()}
              </div>
              {reminder.description && (
                <p className="text-sm text-muted-foreground truncate">{reminder.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icons.Clock className="w-3 h-3" />
                  {schedule}
                </span>
                {reminder.isActive && !reminder.isSnoozed && reminder.nextTriggerTime && (
                  <span className={`text-xs font-medium flex items-center gap-1 ${
                    isOverdue
                      ? 'text-red-500'
                      : reminder.minutesUntilTrigger !== null && reminder.minutesUntilTrigger <= 60 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}>
                    <Icons.Reminders className="w-3 h-3" />
                    {timeUntil}
                    {triggerTime && !isOverdue && ` (${triggerTime})`}
                  </span>
                )}
                {reminder.isSnoozed && reminder.snoozedUntil && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                    <Icons.Clock className="w-3 h-3" />
                    Until {new Date(reminder.snoozedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {!batchMode && (
              <div className="flex items-center gap-2">
                {/* Toggle Switch */}
                <button
                  onClick={() => onToggle(reminder.id, reminder.isActive)}
                  disabled={isToggling || isDeleting}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    reminder.isActive ? "bg-primary" : "bg-muted"
                  } ${isToggling ? 'opacity-50' : ''}`}
                  title={reminder.isActive ? "Disable reminder" : "Enable reminder"}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      reminder.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>

                {/* More actions button */}
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="More actions"
                >
                  <Icons.MoreVertical className="w-4 h-4" />
                </button>

                {/* Edit button */}
                <button
                  onClick={() => onEdit(reminder)}
                  disabled={isDeleting || isToggling}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit reminder"
                >
                  <Icons.Settings className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions (visible when showActions is true on desktop) */}
          {showActions && !batchMode && (
            <div className="mt-4 pt-4 border-t border-border flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { onComplete(reminder.id); setShowActions(false); }}
                disabled={isCompleting}
                className="flex-1 gap-2"
              >
                {isCompleting ? (
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Icons.Check className="w-4 h-4" />
                )}
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { onSnooze(reminder.id); setShowActions(false); }}
                className="flex-1 gap-2"
              >
                <Icons.Clock className="w-4 h-4" />
                Snooze
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => { onDelete(reminder.id); setShowActions(false); }}
                disabled={isDeleting}
                className="flex-1 gap-2"
              >
                {isDeleting ? (
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Icons.Trash className="w-4 h-4" />
                )}
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Add/Edit Reminder Modal
function ReminderModal({
  onClose,
  onAdd,
  onUpdate,
  initialType,
  editingReminder,
}: {
  onClose: () => void;
  onAdd: (data: CreateReminderDto) => Promise<void>;
  onUpdate: (id: string, data: UpdateReminderDto) => Promise<void>;
  initialType: FrontendReminderType | null;
  editingReminder: Reminder | null;
}) {
  const isEditing = !!editingReminder;
  
  // Get default title for a type
  const getDefaultTitle = (reminderType: FrontendReminderType): string => {
    const defaultTitles: Record<FrontendReminderType, string> = {
      feed: "Feeding Reminder",
      sleep: "Nap Time Reminder",
      diaper: "Diaper Check",
      medicine: "Medicine Reminder",
      custom: "",
    };
    return defaultTitles[reminderType];
  };

  const [title, setTitle] = useState(editingReminder?.title || getDefaultTitle(initialType || "custom"));
  const [description, setDescription] = useState(editingReminder?.description || "");
  const [type, setType] = useState<FrontendReminderType>(
    editingReminder ? backendToFrontendType[editingReminder.type] : (initialType || "custom")
  );
  const [scheduleType, setScheduleType] = useState<"interval" | "scheduled">(
    editingReminder?.scheduledTimes && editingReminder.scheduledTimes.length > 0 ? "scheduled" : "interval"
  );
  const [intervalHours, setIntervalHours] = useState(
    editingReminder?.intervalMinutes ? Math.floor(editingReminder.intervalMinutes / 60).toString() : "3"
  );
  const [intervalMinutes, setIntervalMinutes] = useState(
    editingReminder?.intervalMinutes ? (editingReminder.intervalMinutes % 60).toString() : "0"
  );
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(
    editingReminder?.scheduledTimes || ["09:00"]
  );
  const [basedOnLastEntry, setBasedOnLastEntry] = useState(editingReminder?.basedOnLastEntry || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle type change - update title if it's still the default for the previous type
  const handleTypeChange = (newType: FrontendReminderType) => {
    const currentDefault = getDefaultTitle(type);
    // If title is empty or matches the current type's default, update it
    if (!title || title === currentDefault) {
      setTitle(getDefaultTitle(newType));
    }
    setType(newType);
  };

  const addScheduledTime = () => {
    setScheduledTimes([...scheduledTimes, "12:00"]);
  };

  const removeScheduledTime = (index: number) => {
    setScheduledTimes(scheduledTimes.filter((_, i) => i !== index));
  };

  const updateScheduledTime = (index: number, value: string) => {
    const newTimes = [...scheduledTimes];
    newTimes[index] = value;
    setScheduledTimes(newTimes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        const data: UpdateReminderDto = {
          type: frontendToBackendType[type],
          title: title.trim(),
          description: description.trim() || undefined,
        };

        if (scheduleType === "interval") {
          const totalMinutes = parseInt(intervalHours || "0") * 60 + parseInt(intervalMinutes || "0");
          if (totalMinutes > 0) {
            data.intervalMinutes = totalMinutes;
            data.scheduledTimes = [];
            data.basedOnLastEntry = basedOnLastEntry;
          }
        } else {
          data.scheduledTimes = scheduledTimes.filter(t => t);
          data.intervalMinutes = null;
          data.basedOnLastEntry = false;
        }

        await onUpdate(editingReminder!.id, data);
      } else {
        const data: CreateReminderDto = {
          type: frontendToBackendType[type],
          title: title.trim(),
          description: description.trim() || undefined,
          isActive: true,
        };

        if (scheduleType === "interval") {
          const totalMinutes = parseInt(intervalHours || "0") * 60 + parseInt(intervalMinutes || "0");
          if (totalMinutes > 0) {
            data.intervalMinutes = totalMinutes;
            data.basedOnLastEntry = basedOnLastEntry;
          }
        } else {
          data.scheduledTimes = scheduledTimes.filter(t => t);
        }

        await onAdd(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} reminder`);
      setIsSubmitting(false);
    }
  };

  const config = typeConfig[type];
  const IconComponent = Icons[config.icon];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {isEditing ? "Edit Reminder" : "Add Reminder"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <Icons.AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Type</label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(typeConfig) as FrontendReminderType[]).map((t) => {
                  const tConfig = typeConfig[t];
                  const TIcon = Icons[tConfig.icon];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeChange(t)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        type === t
                          ? "border-primary bg-primary/10"
                          : "border-transparent bg-muted hover:border-primary/30"
                      }`}
                    >
                      <TIcon className={`w-5 h-5 ${type === t ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-xs font-medium capitalize">{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reminder name"
                className="w-full px-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary outline-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details..."
                className="w-full px-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary outline-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Schedule Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Schedule</label>
              <div className="flex gap-2 p-1 bg-muted rounded-xl">
                <button
                  type="button"
                  onClick={() => setScheduleType("interval")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    scheduleType === "interval"
                      ? "bg-white shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Interval
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType("scheduled")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    scheduleType === "scheduled"
                      ? "bg-white shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Specific Times
                </button>
              </div>
            </div>

            {/* Interval Settings */}
            {scheduleType === "interval" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Repeat Every</label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={intervalHours}
                          onChange={(e) => setIntervalHours(e.target.value)}
                          min="0"
                          max="24"
                          className="w-full px-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary outline-none"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm text-muted-foreground">hours</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={intervalMinutes}
                          onChange={(e) => setIntervalMinutes(e.target.value)}
                          min="0"
                          max="59"
                          className="w-full px-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary outline-none"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Based on last entry option */}
                <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={basedOnLastEntry}
                    onChange={(e) => setBasedOnLastEntry(e.target.checked)}
                    className="w-5 h-5 rounded border-muted-foreground text-primary focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Based on last entry</p>
                    <p className="text-xs text-muted-foreground">
                      Start countdown from the last logged {type} entry
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Scheduled Times */}
            {scheduleType === "scheduled" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Times</label>
                <div className="space-y-2">
                  {scheduledTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateScheduledTime(index, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary outline-none"
                        disabled={isSubmitting}
                      />
                      {scheduledTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduledTime(index)}
                          className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"
                          disabled={isSubmitting}
                        >
                          <Icons.Close className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addScheduledTime}
                    className="w-full py-2 rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    <Icons.Plus className="w-4 h-4" />
                    Add Time
                  </button>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 mt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || !title.trim()}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditing ? "Saving..." : "Adding..."}
                  </div>
                ) : (
                  isEditing ? "Save Changes" : "Add Reminder"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
