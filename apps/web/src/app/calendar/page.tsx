"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { MobileContainer } from "@/components/layout/mobile-container";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassTextarea } from "@/components/ui/glass-textarea";
import { 
  GlassSelect, 
  GlassSelectTrigger, 
  GlassSelectContent, 
  GlassSelectItem, 
  GlassSelectValue 
} from "@/components/ui/glass-select";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Filter,
  Moon,
  Utensils,
  Droplets,
  Activity,
  Thermometer,
  Pill,
  Syringe,
  Stethoscope,
  Scale,
  Camera,
  Star,
  Edit2,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Icons } from "@/components/icons";

// Types for calendar entries
type EntryType = 'feeding' | 'sleep' | 'diaper' | 'activity' | 'growth' | 'symptom' | 'medication' | 'vaccination' | 'doctor_visit' | 'memory' | 'milestone';

interface CalendarEntry {
  id: string;
  type: EntryType;
  timestamp: Date;
  title: string;
  subtitle?: string;
  details: Record<string, unknown>;
}

interface DayData {
  date: Date;
  entries: CalendarEntry[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

// Activity type colors mapped to CSS variables for glassmorphism design
// Requirements 23.1, 23.2: Color-coded events by type using activity colors
const ENTRY_TYPES: { type: EntryType; label: string; colorVar: string; bgClass: string; icon: typeof Moon }[] = [
  { type: 'feeding', label: 'Feeding', colorVar: 'var(--color-feed)', bgClass: 'bg-[var(--color-feed)]', icon: Utensils },
  { type: 'sleep', label: 'Sleep', colorVar: 'var(--color-sleep)', bgClass: 'bg-[var(--color-sleep)]', icon: Moon },
  { type: 'diaper', label: 'Diaper', colorVar: 'var(--color-diaper)', bgClass: 'bg-[var(--color-diaper)]', icon: Droplets },
  { type: 'activity', label: 'Activity', colorVar: 'var(--color-activity)', bgClass: 'bg-[var(--color-activity)]', icon: Activity },
  { type: 'growth', label: 'Growth', colorVar: 'var(--color-growth)', bgClass: 'bg-[var(--color-growth)]', icon: Scale },
  { type: 'symptom', label: 'Symptom', colorVar: 'var(--color-health)', bgClass: 'bg-[var(--color-health)]', icon: Thermometer },
  { type: 'medication', label: 'Medication', colorVar: 'var(--color-nursing)', bgClass: 'bg-[var(--color-nursing)]', icon: Pill },
  { type: 'vaccination', label: 'Vaccination', colorVar: 'var(--color-activity)', bgClass: 'bg-[var(--color-activity)]', icon: Syringe },
  { type: 'doctor_visit', label: 'Doctor Visit', colorVar: 'var(--color-nursing)', bgClass: 'bg-[var(--color-nursing)]', icon: Stethoscope },
  { type: 'memory', label: 'Memory', colorVar: 'var(--color-memory)', bgClass: 'bg-[var(--color-memory)]', icon: Camera },
  { type: 'milestone', label: 'Milestone', colorVar: 'var(--color-nursing)', bgClass: 'bg-[var(--color-nursing)]', icon: Star },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<EntryType>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CalendarEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<CalendarEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all data for the current month
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      try {
        const allEntries: CalendarEntry[] = [];

        // Fetch all data types in parallel
        const [
          feedingsRes,
          sleepRes,
          diapersRes,
          activitiesRes,
          growthRes,
          symptomsRes,
          medicationsRes,
          vaccinationsRes,
          doctorVisitsRes,
          memoriesRes,
          milestonesRes,
        ] = await Promise.all([
          api.feedings.list({ pageSize: 100 }).catch(() => ({ data: [] })),
          api.sleep.list({ pageSize: 100 }).catch(() => ({ data: [] })),
          api.diapers.list({ pageSize: 100 }).catch(() => ({ data: [] })),
          api.activities.list({ pageSize: 100 }).catch(() => ({ data: [] })),
          api.growth.list({ pageSize: 100 }).catch(() => ({ data: [] })),
          api.health.symptoms.list({ pageSize: 100 }).catch(() => ({ data: [] })),
          api.health.medications.list({ pageSize: 100 }).catch(() => ({ data: [] })),
          api.health.vaccinations.list({ pageSize: 100 }).catch(() => ({ data: [] })),
          api.health.doctorVisits.list({ pageSize: 100 }).catch(() => ({ data: [] })),
          api.memories.list({ pageSize: 100 }).catch(() => ({ data: [] })),
          api.milestones.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        ]);

        // Process feedings
        feedingsRes.data.forEach(f => {
          const date = new Date(f.timestamp);
          if (date >= startOfMonth && date <= endOfMonth) {
            let title = 'Feeding';
            let subtitle = '';
            if (f.type === 'bottle') {
              title = 'Bottle';
              subtitle = f.amount ? `${f.amount}ml` : '';
            } else if (f.type === 'breastfeeding') {
              title = 'Nursing';
              const duration = (f.leftDuration || 0) + (f.rightDuration || 0);
              subtitle = duration > 0 ? `${duration} min` : '';
            } else if (f.type === 'solid') {
              title = 'Solids';
              subtitle = f.foodType || '';
            } else if (f.type === 'pumping') {
              title = 'Pumping';
              subtitle = f.pumpedAmount ? `${f.pumpedAmount}ml` : '';
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            allEntries.push({ id: f.id, type: 'feeding', timestamp: date, title, subtitle, details: f as any });
          }
        });

        // Process sleep
        sleepRes.data.forEach(s => {
          const date = new Date(s.startTime);
          if (date >= startOfMonth && date <= endOfMonth) {
            const duration = s.duration ? `${Math.floor(s.duration / 60)}h ${s.duration % 60}m` : '';
            allEntries.push({
              id: s.id,
              type: 'sleep',
              timestamp: date,
              title: s.sleepType === 'nap' ? 'Nap' : 'Night Sleep',
              subtitle: duration,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              details: s as any,
            });
          }
        });

        // Process diapers
        diapersRes.data.forEach(d => {
          const date = new Date(d.timestamp);
          if (date >= startOfMonth && date <= endOfMonth) {
            allEntries.push({
              id: d.id,
              type: 'diaper',
              timestamp: date,
              title: 'Diaper',
              subtitle: d.type.charAt(0).toUpperCase() + d.type.slice(1),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              details: d as any,
            });
          }
        });

        // Process activities
        activitiesRes.data.forEach(a => {
          const date = new Date(a.timestamp);
          if (date >= startOfMonth && date <= endOfMonth) {
            const typeLabel = a.activityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            allEntries.push({
              id: a.id,
              type: 'activity',
              timestamp: date,
              title: typeLabel,
              subtitle: a.duration ? `${a.duration} min` : '',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              details: a as any,
            });
          }
        });

        // Process growth
        growthRes.data.forEach(g => {
          const date = new Date(g.timestamp);
          if (date >= startOfMonth && date <= endOfMonth) {
            const parts = [];
            if (g.weight) parts.push(`${(g.weight / 1000).toFixed(1)}kg`);
            if (g.height) parts.push(`${(g.height / 10).toFixed(1)}cm`);
            allEntries.push({
              id: g.id,
              type: 'growth',
              timestamp: date,
              title: 'Growth',
              subtitle: parts.join(', '),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              details: g as any,
            });
          }
        });

        // Process symptoms
        symptomsRes.data.forEach(s => {
          const date = new Date(s.timestamp);
          if (date >= startOfMonth && date <= endOfMonth) {
            allEntries.push({
              id: s.id,
              type: 'symptom',
              timestamp: date,
              title: s.symptomType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              subtitle: s.severity,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              details: s as any,
            });
          }
        });

        // Process medications
        medicationsRes.data.forEach(m => {
          const date = new Date(m.timestamp);
          if (date >= startOfMonth && date <= endOfMonth) {
            allEntries.push({
              id: m.id,
              type: 'medication',
              timestamp: date,
              title: m.name,
              subtitle: `${m.dosage}${m.unit}`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              details: m as any,
            });
          }
        });

        // Process vaccinations
        vaccinationsRes.data.forEach(v => {
          const date = new Date(v.timestamp);
          if (date >= startOfMonth && date <= endOfMonth) {
            allEntries.push({
              id: v.id,
              type: 'vaccination',
              timestamp: date,
              title: v.vaccineName,
              subtitle: v.provider || '',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              details: v as any,
            });
          }
        });

        // Process doctor visits
        doctorVisitsRes.data.forEach(d => {
          const date = new Date(d.timestamp);
          if (date >= startOfMonth && date <= endOfMonth) {
            allEntries.push({
              id: d.id,
              type: 'doctor_visit',
              timestamp: date,
              title: 'Doctor Visit',
              subtitle: d.visitType.replace(/\b\w/g, l => l.toUpperCase()),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              details: d as any,
            });
          }
        });

        // Process memories
        memoriesRes.data.forEach(m => {
          const date = new Date(m.takenAt);
          if (date >= startOfMonth && date <= endOfMonth) {
            allEntries.push({
              id: m.id,
              type: 'memory',
              timestamp: date,
              title: m.title || 'Memory',
              subtitle: 'Photo Memory',
              details: { 
                ...m,
                photoUrl: m.photoUrl 
              } as unknown as Record<string, unknown>,
            });
          }
        });

        // Process milestones
        milestonesRes.data.forEach(m => {
          const date = new Date(m.achievedDate);
          if (date >= startOfMonth && date <= endOfMonth) {
            allEntries.push({
              id: m.id,
              type: 'milestone',
              timestamp: date,
              title: m.milestone?.name || 'Milestone',
              subtitle: m.milestone?.category || '',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              details: m as any,
            });
          }
        });

        setEntries(allEntries);
      } catch (err) {
        console.error("Failed to fetch calendar data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: DayData[] = [];

    // Add days from previous month
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, entries: [], isCurrentMonth: false, isToday: false });
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const isToday = date.getTime() === today.getTime();
      days.push({ date, entries: [], isCurrentMonth: true, isToday });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, entries: [], isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [currentDate]);

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Apply type filter
      if (activeFilters.size > 0 && !activeFilters.has(entry.type)) {
        return false;
      }
      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          entry.title.toLowerCase().includes(query) ||
          entry.subtitle?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [entries, activeFilters, searchQuery]);

  // Map entries to calendar days
  const calendarData = useMemo(() => {
    return calendarDays.map(day => {
      const dayStart = new Date(day.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day.date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayEntries = filteredEntries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= dayStart && entryDate <= dayEnd;
      });

      return { ...day, entries: dayEntries };
    });
  }, [calendarDays, filteredEntries]);

  const toggleFilter = (type: EntryType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setActiveFilters(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
    setSearchQuery("");
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getEntryConfig = (type: EntryType) => {
    return ENTRY_TYPES.find(t => t.type === type) || ENTRY_TYPES[0];
  };

  // Refetch calendar data
  const refetchData = async () => {
    setIsLoading(true);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    try {
      const allEntries: CalendarEntry[] = [];

      const [
        feedingsRes,
        sleepRes,
        diapersRes,
        activitiesRes,
        growthRes,
        symptomsRes,
        medicationsRes,
        vaccinationsRes,
        doctorVisitsRes,
        memoriesRes,
        milestonesRes,
      ] = await Promise.all([
        api.feedings.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        api.sleep.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        api.diapers.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        api.activities.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        api.growth.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        api.health.symptoms.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        api.health.medications.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        api.health.vaccinations.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        api.health.doctorVisits.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        api.memories.list({ pageSize: 100 }).catch(() => ({ data: [] })),
        api.milestones.list({ pageSize: 100 }).catch(() => ({ data: [] })),
      ]);

      // Process all entries (same logic as in useEffect)
      feedingsRes.data.forEach(f => {
        const date = new Date(f.timestamp);
        if (date >= startOfMonth && date <= endOfMonth) {
          let title = 'Feeding';
          let subtitle = '';
          if (f.type === 'bottle') {
            title = 'Bottle';
            subtitle = f.amount ? `${f.amount}ml` : '';
          } else if (f.type === 'breastfeeding') {
            title = 'Nursing';
            const duration = (f.leftDuration || 0) + (f.rightDuration || 0);
            subtitle = duration > 0 ? `${duration} min` : '';
          } else if (f.type === 'solid') {
            title = 'Solids';
            subtitle = f.foodType || '';
          } else if (f.type === 'pumping') {
            title = 'Pumping';
            subtitle = f.pumpedAmount ? `${f.pumpedAmount}ml` : '';
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          allEntries.push({ id: f.id, type: 'feeding', timestamp: date, title, subtitle, details: f as any });
        }
      });

      sleepRes.data.forEach(s => {
        const date = new Date(s.startTime);
        if (date >= startOfMonth && date <= endOfMonth) {
          const duration = s.duration ? `${Math.floor(s.duration / 60)}h ${s.duration % 60}m` : '';
          allEntries.push({
            id: s.id,
            type: 'sleep',
            timestamp: date,
            title: s.sleepType === 'nap' ? 'Nap' : 'Night Sleep',
            subtitle: duration,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: s as any,
          });
        }
      });

      diapersRes.data.forEach(d => {
        const date = new Date(d.timestamp);
        if (date >= startOfMonth && date <= endOfMonth) {
          allEntries.push({
            id: d.id,
            type: 'diaper',
            timestamp: date,
            title: 'Diaper',
            subtitle: d.type.charAt(0).toUpperCase() + d.type.slice(1),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: d as any,
          });
        }
      });

      activitiesRes.data.forEach(a => {
        const date = new Date(a.timestamp);
        if (date >= startOfMonth && date <= endOfMonth) {
          const typeLabel = a.activityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          allEntries.push({
            id: a.id,
            type: 'activity',
            timestamp: date,
            title: typeLabel,
            subtitle: a.duration ? `${a.duration} min` : '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: a as any,
          });
        }
      });

      growthRes.data.forEach(g => {
        const date = new Date(g.timestamp);
        if (date >= startOfMonth && date <= endOfMonth) {
          const parts = [];
          if (g.weight) parts.push(`${(g.weight / 1000).toFixed(1)}kg`);
          if (g.height) parts.push(`${(g.height / 10).toFixed(1)}cm`);
          allEntries.push({
            id: g.id,
            type: 'growth',
            timestamp: date,
            title: 'Growth',
            subtitle: parts.join(', '),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: g as any,
          });
        }
      });

      symptomsRes.data.forEach(s => {
        const date = new Date(s.timestamp);
        if (date >= startOfMonth && date <= endOfMonth) {
          allEntries.push({
            id: s.id,
            type: 'symptom',
            timestamp: date,
            title: s.symptomType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            subtitle: s.severity,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: s as any,
          });
        }
      });

      medicationsRes.data.forEach(m => {
        const date = new Date(m.timestamp);
        if (date >= startOfMonth && date <= endOfMonth) {
          allEntries.push({
            id: m.id,
            type: 'medication',
            timestamp: date,
            title: m.name,
            subtitle: `${m.dosage}${m.unit}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: m as any,
          });
        }
      });

      vaccinationsRes.data.forEach(v => {
        const date = new Date(v.timestamp);
        if (date >= startOfMonth && date <= endOfMonth) {
          allEntries.push({
            id: v.id,
            type: 'vaccination',
            timestamp: date,
            title: v.vaccineName,
            subtitle: v.provider || '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: v as any,
          });
        }
      });

      doctorVisitsRes.data.forEach(d => {
        const date = new Date(d.timestamp);
        if (date >= startOfMonth && date <= endOfMonth) {
          allEntries.push({
            id: d.id,
            type: 'doctor_visit',
            timestamp: date,
            title: 'Doctor Visit',
            subtitle: d.visitType.replace(/\b\w/g, l => l.toUpperCase()),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: d as any,
          });
        }
      });

      memoriesRes.data.forEach(m => {
        const date = new Date(m.takenAt);
        if (date >= startOfMonth && date <= endOfMonth) {
          allEntries.push({
            id: m.id,
            type: 'memory',
            timestamp: date,
            title: m.title || 'Memory',
            subtitle: 'Photo Memory',
            details: { 
              ...m,
              photoUrl: m.photoUrl 
            } as unknown as Record<string, unknown>,
          });
        }
      });

      milestonesRes.data.forEach(m => {
        const date = new Date(m.achievedDate);
        if (date >= startOfMonth && date <= endOfMonth) {
          allEntries.push({
            id: m.id,
            type: 'milestone',
            timestamp: date,
            title: m.milestone?.name || 'Milestone',
            subtitle: m.milestone?.category || '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: m as any,
          });
        }
      });

      setEntries(allEntries);
    } catch (err) {
      console.error("Failed to fetch calendar data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (entry: CalendarEntry) => {
    setEditingEntry(entry);
    setEditModalOpen(true);
    setSelectedEntry(null);
    setSelectedDay(null);
  };

  // Handle delete button click
  const handleDeleteClick = (entry: CalendarEntry) => {
    setDeletingEntry(entry);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingEntry) return;

    setIsDeleting(true);
    try {
      // Call the appropriate delete API based on type
      switch (deletingEntry.type) {
        case "feeding":
          await api.feedings.delete(deletingEntry.id);
          break;
        case "sleep":
          await api.sleep.delete(deletingEntry.id);
          break;
        case "diaper":
          await api.diapers.delete(deletingEntry.id);
          break;
        case "activity":
          await api.activities.delete(deletingEntry.id);
          break;
        case "growth":
          await api.growth.delete(deletingEntry.id);
          break;
        case "medication":
          await api.health.medications.delete(deletingEntry.id);
          break;
        case "symptom":
          await api.health.symptoms.delete(deletingEntry.id);
          break;
        case "vaccination":
          await api.health.vaccinations.delete(deletingEntry.id);
          break;
        case "doctor_visit":
          await api.health.doctorVisits.delete(deletingEntry.id);
          break;
        case "memory":
          await api.memories.delete(deletingEntry.id);
          break;
        case "milestone":
          await api.milestones.delete(deletingEntry.id);
          break;
      }

      toast.success("Entry deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingEntry(null);
      setSelectedEntry(null);
      setSelectedDay(null);
      
      // Refresh the calendar
      await refetchData();
    } catch (error) {
      console.error("Failed to delete entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (formData: Record<string, unknown>) => {
    if (!editingEntry) return;

    setIsSubmitting(true);
    try {
      // Call the appropriate update API based on type
      switch (editingEntry.type) {
        case "feeding":
          await api.feedings.update(editingEntry.id, formData);
          break;
        case "sleep":
          await api.sleep.update(editingEntry.id, formData);
          break;
        case "diaper":
          await api.diapers.update(editingEntry.id, formData);
          break;
        case "activity":
          await api.activities.update(editingEntry.id, formData);
          break;
        case "growth":
          await api.growth.update(editingEntry.id, formData);
          break;
        case "medication":
          await api.health.medications.update(editingEntry.id, formData);
          break;
        case "symptom":
          await api.health.symptoms.update(editingEntry.id, formData);
          break;
        case "vaccination":
          await api.health.vaccinations.update(editingEntry.id, formData);
          break;
        case "doctor_visit":
          await api.health.doctorVisits.update(editingEntry.id, formData);
          break;
      }

      toast.success("Entry updated successfully");
      setEditModalOpen(false);
      setEditingEntry(null);
      
      // Refresh the calendar
      await refetchData();
    } catch (error) {
      console.error("Failed to update entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileContainer>
      <div className="p-4 space-y-4 pb-32 h-full flex flex-col">
        {/* Header with glassmorphism styling */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground">View all logged activities</p>
          </div>
          <GlassButton variant="default" size="sm" onClick={goToToday}>
            Today
          </GlassButton>
        </div>

        {/* Search and Filter Bar with glassmorphism */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <GlassInput
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <GlassButton
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 min-h-0 min-w-0"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </GlassButton>
            )}
          </div>
          <GlassButton
            variant={showFilters || activeFilters.size > 0 ? "primary" : "default"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="w-4 h-4" />
            {activeFilters.size > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-primary text-[10px] rounded-full flex items-center justify-center font-bold">
                {activeFilters.size}
              </span>
            )}
          </GlassButton>
        </div>

        {/* Filter Pills with glassmorphism styling */}
        {showFilters && (
          <GlassCard size="sm" className="overflow-x-auto">
            <div className="flex flex-wrap gap-2">
              {ENTRY_TYPES.map(({ type, label, bgClass, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    activeFilters.has(type)
                      ? `${bgClass} text-white shadow-lg`
                      : "bg-white/10 text-foreground hover:bg-white/20 border border-white/20"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
              {activeFilters.size > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all"
                >
                  Clear all
                </button>
              )}
            </div>
          </GlassCard>
        )}

        {/* Month Navigation with glassmorphism */}
        <div className="flex items-center justify-between">
          <GlassButton variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-5 h-5" />
          </GlassButton>
          <h2 className="text-lg font-semibold font-heading">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <GlassButton variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </GlassButton>
        </div>

        {/* Calendar Grid with glassmorphism - Requirements 23.1, 23.2 */}
        <GlassCard className="flex-1 p-2 overflow-hidden flex flex-col">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1 flex-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div 
                  key={i} 
                  className="relative p-1 rounded-xl min-h-[60px] bg-white/5 border border-white/10 overflow-hidden"
                >
                  <div className="h-5 w-5 bg-white/10 rounded-full mx-auto mb-1 animate-pulse" />
                  <div className="space-y-0.5">
                    <div className="h-1.5 w-full bg-white/10 rounded-full animate-pulse" />
                    <div className="h-1.5 w-3/4 bg-white/10 rounded-full animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 flex-1">
              {calendarData.map((day, index) => {
                // Get memory entries for this day
                const memoryEntries = day.entries.filter(e => e.type === 'memory' && e.details?.photoUrl);
                const hasMemories = memoryEntries.length > 0;
                
                return (
                  <button
                    key={index}
                    onClick={() => day.entries.length > 0 && setSelectedDay(day.date)}
                    className={cn(
                      "relative p-1 rounded-xl text-left transition-all min-h-[60px] flex flex-col overflow-hidden",
                      day.isCurrentMonth 
                        ? "bg-white/5 hover:bg-white/10 border border-white/10" 
                        : "bg-transparent opacity-40",
                      day.isToday && "ring-2 ring-primary shadow-[0_0_10px_var(--primary)]",
                      day.entries.length > 0 && "cursor-pointer"
                    )}
                  >
                    {/* Memory Photo Background */}
                    {hasMemories && (
                      <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
                        {memoryEntries.length === 1 ? (
                          <div className="w-full h-full relative">
                            <Image
                              src={memoryEntries[0].details.photoUrl as string}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 15vw, 100px"
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                          </div>
                        ) : memoryEntries.length === 2 ? (
                          <div className="w-full h-full flex">
                            {memoryEntries.slice(0, 2).map((entry, i) => (
                              <div key={i} className="flex-1 relative">
                                <Image
                                  src={entry.details.photoUrl as unknown as string}
                                  alt=""
                                  fill
                                  sizes="(max-width: 768px) 8vw, 50px"
                                  className="object-cover opacity-40"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                              </div>
                            ))}
                          </div>
                        ) : memoryEntries.length === 3 ? (
                          <div className="w-full h-full flex gap-0.5">
                            <div className="flex-1 relative">
                              <Image
                                src={memoryEntries[0].details.photoUrl as unknown as string}
                                alt=""
                                fill
                                sizes="(max-width: 768px) 8vw, 50px"
                                className="object-cover opacity-40"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            </div>
                            <div className="flex-1 flex flex-col gap-0.5">
                              {memoryEntries.slice(1, 3).map((entry, i) => (
                                <div key={i} className="flex-1 relative">
                                  <Image
                                    src={entry.details.photoUrl as unknown as string}
                                    alt=""
                                    fill
                                    sizes="(max-width: 768px) 8vw, 50px"
                                    className="object-cover opacity-40"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full grid grid-cols-2 gap-0.5">
                            {memoryEntries.slice(0, 4).map((entry, i) => (
                              <div key={i} className="relative">
                                <Image
                                  src={entry.details.photoUrl as unknown as string}
                                  alt=""
                                  fill
                                  sizes="(max-width: 768px) 8vw, 50px"
                                  className="object-cover opacity-40"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                {i === 3 && memoryEntries.length > 4 && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">+{memoryEntries.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <span className={cn(
                      "text-xs font-medium relative z-10",
                      day.isToday ? "text-primary font-bold" : hasMemories ? "text-white drop-shadow-md" : "text-foreground"
                    )}>
                      {day.date.getDate()}
                    </span>
                    
                    {/* Entry dots with activity colors - Requirement 23.2 */}
                    {day.entries.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1 relative z-10">
                        {day.entries.slice(0, 6).map((entry, i) => {
                          const config = getEntryConfig(entry.type);
                          return (
                            <div
                              key={i}
                              className={cn(
                                "w-2 h-2 rounded-full shadow-sm",
                                config.bgClass,
                                hasMemories && "ring-1 ring-white/50"
                              )}
                              title={entry.title}
                            />
                          );
                        })}
                        {day.entries.length > 6 && (
                          <span className={cn(
                            "text-[8px]",
                            hasMemories ? "text-white drop-shadow-md" : "text-muted-foreground"
                          )}>
                            +{day.entries.length - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Legend with activity colors */}
        <div className="flex flex-wrap gap-2 justify-center">
          {ENTRY_TYPES.slice(0, 6).map(({ type, label, bgClass }) => (
            <div key={type} className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full shadow-sm", bgClass)} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Modal with glassmorphism */}
      {selectedDay && (
        <DayDetailModal
          date={selectedDay}
          entries={filteredEntries.filter(e => {
            const entryDate = new Date(e.timestamp);
            return (
              entryDate.getDate() === selectedDay.getDate() &&
              entryDate.getMonth() === selectedDay.getMonth() &&
              entryDate.getFullYear() === selectedDay.getFullYear()
            );
          })}
          onClose={() => setSelectedDay(null)}
          onSelectEntry={setSelectedEntry}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          getEntryConfig={getEntryConfig}
          formatTime={formatTime}
        />
      )}

      {/* Entry Detail Modal with glassmorphism */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          getEntryConfig={getEntryConfig}
          formatTime={formatTime}
        />
      )}

      {/* Delete Confirmation Dialog with glassmorphism */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Delete Entry</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this entry?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deletingEntry && (
            <GlassCard size="sm" className="bg-white/5">
              <p className="text-sm font-medium text-foreground">{deletingEntry.title}</p>
              {deletingEntry.subtitle && (
                <p className="text-xs text-muted-foreground">{deletingEntry.subtitle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {deletingEntry.timestamp.toLocaleString()}
              </p>
            </GlassCard>
          )}

          <DialogFooter className="flex gap-3 pt-2">
            <GlassButton
              type="button"
              variant="default"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Icons.Loader className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </GlassButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingEntry(null);
          }}
          onSubmit={handleEditSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </MobileContainer>
  );
}


// Day Detail Modal - Shows all entries for a selected day with glassmorphism
function DayDetailModal({
  date,
  entries,
  onClose,
  onSelectEntry,
  onEdit,
  onDelete,
  getEntryConfig,
  formatTime,
}: {
  date: Date;
  entries: CalendarEntry[];
  onClose: () => void;
  onSelectEntry: (entry: CalendarEntry) => void;
  onEdit: (entry: CalendarEntry) => void;
  onDelete: (entry: CalendarEntry) => void;
  getEntryConfig: (type: EntryType) => { type: EntryType; label: string; colorVar: string; bgClass: string; icon: typeof Moon };
  formatTime: (date: Date) => string;
}) {
  // Sort entries by time
  const sortedEntries = [...entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <GlassCard 
        className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg font-heading">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-sm text-muted-foreground">{entries.length} entries</p>
          </div>
          <GlassButton variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </GlassButton>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sortedEntries.map((entry) => {
            const config = getEntryConfig(entry.type);
            const Icon = config.icon;
            return (
              <div
                key={entry.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <button
                  onClick={() => onSelectEntry(entry)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", config.bgClass)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.title}</p>
                    {entry.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{entry.subtitle}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(entry.timestamp)}
                  </span>
                </button>
                <div className="flex gap-1">
                  <GlassButton
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(entry);
                    }}
                    className="h-8 w-8 min-h-0 min-w-0"
                    title="Edit entry"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(entry);
                    }}
                    className="h-8 w-8 min-h-0 min-w-0 hover:bg-red-500/10"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                  </GlassButton>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}


// Entry Detail Modal - Shows full details of a single entry with glassmorphism
function EntryDetailModal({
  entry,
  onClose,
  onEdit,
  onDelete,
  getEntryConfig,
  formatTime,
}: {
  entry: CalendarEntry;
  onClose: () => void;
  onEdit: (entry: CalendarEntry) => void;
  onDelete: (entry: CalendarEntry) => void;
  getEntryConfig: (type: EntryType) => { type: EntryType; label: string; colorVar: string; bgClass: string; icon: typeof Moon };
  formatTime: (date: Date) => string;
}) {
  const config = getEntryConfig(entry.type);
  const Icon = config.icon;
  const details = entry.details as Record<string, unknown>;

  // Format detail value for display
  const formatValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'string' && (key.includes('Time') || key.includes('Date') || key.includes('At'))) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  // Filter out internal fields
  const displayFields = Object.entries(details).filter(([key]) => 
    !['id', 'babyId', 'caregiverId', 'createdAt', 'updatedAt', 'syncedAt', 'isDeleted'].includes(key)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <GlassCard 
        className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with activity color */}
        <div className={cn("p-4 flex items-center gap-3", config.bgClass)}>
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-white">
            <h3 className="font-semibold text-lg font-heading">{entry.title}</h3>
            {entry.subtitle && <p className="text-sm opacity-90">{entry.subtitle}</p>}
          </div>
          <GlassButton 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 min-h-0 min-w-0 h-10 w-10" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </GlassButton>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-sm text-muted-foreground">Date & Time</span>
              <span className="text-sm font-medium">
                {entry.timestamp.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })} at {formatTime(entry.timestamp)}
              </span>
            </div>
            
            {displayFields.map(([key, value]) => {
              // Skip empty values
              if (value === null || value === undefined || value === '') return null;
              
              // Format key for display
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              
              return (
                <div key={key} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-right max-w-[60%] truncate">
                    {formatValue(key, value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 border-t border-white/10 flex gap-2">
          <GlassButton 
            variant="default" 
            className="flex-1"
            onClick={() => onEdit(entry)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </GlassButton>
          <GlassButton 
            variant="danger" 
            className="flex-1"
            onClick={() => onDelete(entry)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}


// Edit Entry Modal Component with glassmorphism
interface EditEntryModalProps {
  entry: CalendarEntry;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

function EditEntryModal({ entry, open, onClose, onSubmit, isSubmitting }: EditEntryModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => entry.details || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper to safely get string values from formData
  const getString = (key: string): string | undefined => {
    const value = formData[key];
    return typeof value === 'string' ? value : undefined;
  };

  // Helper to safely get values for inputs (handles string, number, or empty)
  const getValue = (key: string): string | number => {
    const value = formData[key];
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return value;
    return '';
  };

  const renderFormFields = () => {
    switch (entry.type) {
      case "feeding":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <GlassSelect value={getString("type")} onValueChange={(value) => updateField("type", value)}>
                <GlassSelectTrigger>
                  <GlassSelectValue placeholder="Select type" />
                </GlassSelectTrigger>
                <GlassSelectContent>
                  <GlassSelectItem value="breastfeeding">Breastfeeding</GlassSelectItem>
                  <GlassSelectItem value="bottle">Bottle</GlassSelectItem>
                  <GlassSelectItem value="pumping">Pumping</GlassSelectItem>
                  <GlassSelectItem value="solid">Solid Food</GlassSelectItem>
                </GlassSelectContent>
              </GlassSelect>
            </div>

            {formData.type === "breastfeeding" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="leftDuration">Left Duration (min)</Label>
                  <GlassInput
                    id="leftDuration"
                    type="number"
                    value={getValue("leftDuration")}
                    onChange={(e) => updateField("leftDuration", e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rightDuration">Right Duration (min)</Label>
                  <GlassInput
                    id="rightDuration"
                    type="number"
                    value={getValue("rightDuration")}
                    onChange={(e) => updateField("rightDuration", e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
              </div>
            )}

            {formData.type === "bottle" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (ml)</Label>
                  <GlassInput
                    id="amount"
                    type="number"
                    value={getValue("amount")}
                    onChange={(e) => updateField("amount", e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bottleType">Bottle Type</Label>
                  <GlassSelect value={getString("bottleType")} onValueChange={(value) => updateField("bottleType", value)}>
                    <GlassSelectTrigger>
                      <GlassSelectValue placeholder="Select bottle type" />
                    </GlassSelectTrigger>
                    <GlassSelectContent>
                      <GlassSelectItem value="formula">Formula</GlassSelectItem>
                      <GlassSelectItem value="breastMilk">Breast Milk</GlassSelectItem>
                      <GlassSelectItem value="water">Water</GlassSelectItem>
                    </GlassSelectContent>
                  </GlassSelect>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <GlassTextarea
                id="notes"
                value={getValue("notes") as string}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      case "sleep":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="sleepType">Type</Label>
              <GlassSelect value={getString("sleepType")} onValueChange={(value) => updateField("sleepType", value)}>
                <GlassSelectTrigger>
                  <GlassSelectValue placeholder="Select type" />
                </GlassSelectTrigger>
                <GlassSelectContent>
                  <GlassSelectItem value="nap">Nap</GlassSelectItem>
                  <GlassSelectItem value="night">Night Sleep</GlassSelectItem>
                </GlassSelectContent>
              </GlassSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <GlassInput
                id="startTime"
                type="datetime-local"
                value={formData.startTime ? new Date(String(formData.startTime)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("startTime", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <GlassInput
                id="endTime"
                type="datetime-local"
                value={formData.endTime ? new Date(String(formData.endTime)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("endTime", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <GlassSelect value={getString("quality")} onValueChange={(value) => updateField("quality", value)}>
                <GlassSelectTrigger>
                  <GlassSelectValue placeholder="Select quality" />
                </GlassSelectTrigger>
                <GlassSelectContent>
                  <GlassSelectItem value="good">Good</GlassSelectItem>
                  <GlassSelectItem value="fair">Fair</GlassSelectItem>
                  <GlassSelectItem value="poor">Poor</GlassSelectItem>
                </GlassSelectContent>
              </GlassSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <GlassTextarea
                id="notes"
                value={getValue("notes") as string}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      case "diaper":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <GlassSelect value={getString("type")} onValueChange={(value) => updateField("type", value)}>
                <GlassSelectTrigger>
                  <GlassSelectValue placeholder="Select type" />
                </GlassSelectTrigger>
                <GlassSelectContent>
                  <GlassSelectItem value="wet">Wet</GlassSelectItem>
                  <GlassSelectItem value="dirty">Dirty</GlassSelectItem>
                  <GlassSelectItem value="mixed">Mixed</GlassSelectItem>
                  <GlassSelectItem value="dry">Dry</GlassSelectItem>
                </GlassSelectContent>
              </GlassSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Time</Label>
              <GlassInput
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <GlassTextarea
                id="notes"
                value={getValue("notes") as string}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      case "activity":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="activityType">Type</Label>
              <GlassSelect value={getString("activityType")} onValueChange={(value) => updateField("activityType", value)}>
                <GlassSelectTrigger>
                  <GlassSelectValue placeholder="Select activity type" />
                </GlassSelectTrigger>
                <GlassSelectContent>
                  <GlassSelectItem value="tummy_time">Tummy Time</GlassSelectItem>
                  <GlassSelectItem value="bath">Bath</GlassSelectItem>
                  <GlassSelectItem value="outdoor">Outdoor</GlassSelectItem>
                  <GlassSelectItem value="play">Play</GlassSelectItem>
                </GlassSelectContent>
              </GlassSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <GlassInput
                id="duration"
                type="number"
                value={getValue("duration")}
                onChange={(e) => updateField("duration", e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <GlassTextarea
                id="notes"
                value={getValue("notes") as string}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      case "growth":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <GlassInput
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight ? (Number(formData.weight) / 1000).toFixed(2) : ""}
                onChange={(e) => updateField("weight", e.target.value ? Math.round(parseFloat(e.target.value) * 1000) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <GlassInput
                id="height"
                type="number"
                step="0.1"
                value={formData.height ? (Number(formData.height) / 10).toFixed(1) : ""}
                onChange={(e) => updateField("height", e.target.value ? Math.round(parseFloat(e.target.value) * 10) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headCircumference">Head Circumference (cm)</Label>
              <GlassInput
                id="headCircumference"
                type="number"
                step="0.1"
                value={formData.headCircumference ? (Number(formData.headCircumference) / 10).toFixed(1) : ""}
                onChange={(e) => updateField("headCircumference", e.target.value ? Math.round(parseFloat(e.target.value) * 10) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Date</Label>
              <GlassInput
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <GlassTextarea
                id="notes"
                value={getValue("notes") as string}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      case "medication":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Medication Name</Label>
              <GlassInput
                id="name"
                value={getValue("name")}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <GlassInput
                  id="dosage"
                  value={getValue("dosage")}
                  onChange={(e) => updateField("dosage", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <GlassInput
                  id="unit"
                  value={getValue("unit")}
                  onChange={(e) => updateField("unit", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Time</Label>
              <GlassInput
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <GlassTextarea
                id="notes"
                value={getValue("notes") as string}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      case "symptom":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="symptomType">Symptom Type</Label>
              <GlassInput
                id="symptomType"
                value={getValue("symptomType")}
                onChange={(e) => updateField("symptomType", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <GlassSelect value={getString("severity")} onValueChange={(value) => updateField("severity", value)}>
                <GlassSelectTrigger>
                  <GlassSelectValue placeholder="Select severity" />
                </GlassSelectTrigger>
                <GlassSelectContent>
                  <GlassSelectItem value="mild">Mild</GlassSelectItem>
                  <GlassSelectItem value="moderate">Moderate</GlassSelectItem>
                  <GlassSelectItem value="severe">Severe</GlassSelectItem>
                </GlassSelectContent>
              </GlassSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <GlassInput
                id="temperature"
                type="number"
                step="0.1"
                value={getValue("temperature")}
                onChange={(e) => updateField("temperature", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Time</Label>
              <GlassInput
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <GlassTextarea
                id="notes"
                value={getValue("notes") as string}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      case "vaccination":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="vaccineName">Vaccine Name</Label>
              <GlassInput
                id="vaccineName"
                value={getValue("vaccineName")}
                onChange={(e) => updateField("vaccineName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <GlassInput
                id="provider"
                value={getValue("provider")}
                onChange={(e) => updateField("provider", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <GlassInput
                id="location"
                value={getValue("location")}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Date</Label>
              <GlassInput
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <GlassTextarea
                id="notes"
                value={getValue("notes") as string}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      case "doctor_visit":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="visitType">Visit Type</Label>
              <GlassInput
                id="visitType"
                value={getValue("visitType")}
                onChange={(e) => updateField("visitType", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <GlassInput
                id="provider"
                value={getValue("provider")}
                onChange={(e) => updateField("provider", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <GlassInput
                id="location"
                value={getValue("location")}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Date</Label>
              <GlassInput
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <GlassTextarea
                id="notes"
                value={getValue("notes") as string}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      default:
        return <p className="text-sm text-muted-foreground">Editing is not available for this entry type.</p>;
    }
  };

  const config = ENTRY_TYPES.find(t => t.type === entry.type) || ENTRY_TYPES[0];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", config.bgClass)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="font-heading">Edit {entry.title}</DialogTitle>
              <DialogDescription>
                Update the details for this entry
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}

          <DialogFooter className="flex gap-3 pt-2">
            <GlassButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </GlassButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
