"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

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

const ENTRY_TYPES: { type: EntryType; label: string; color: string; icon: typeof Moon }[] = [
  { type: 'feeding', label: 'Feeding', color: 'bg-orange-500', icon: Utensils },
  { type: 'sleep', label: 'Sleep', color: 'bg-indigo-500', icon: Moon },
  { type: 'diaper', label: 'Diaper', color: 'bg-green-500', icon: Droplets },
  { type: 'activity', label: 'Activity', color: 'bg-cyan-500', icon: Activity },
  { type: 'growth', label: 'Growth', color: 'bg-emerald-500', icon: Scale },
  { type: 'symptom', label: 'Symptom', color: 'bg-red-500', icon: Thermometer },
  { type: 'medication', label: 'Medication', color: 'bg-blue-500', icon: Pill },
  { type: 'vaccination', label: 'Vaccination', color: 'bg-teal-500', icon: Syringe },
  { type: 'doctor_visit', label: 'Doctor Visit', color: 'bg-purple-500', icon: Stethoscope },
  { type: 'memory', label: 'Memory', color: 'bg-amber-500', icon: Camera },
  { type: 'milestone', label: 'Milestone', color: 'bg-pink-500', icon: Star },
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
              subtitle: m.entryType,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              details: m as any,
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

  return (
    <MobileContainer>
      <div className="p-4 space-y-4 pb-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground">View all logged activities</p>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </Button>
            )}
          </div>
          <Button
            variant={showFilters || activeFilters.size > 0 ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            {activeFilters.size > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                {activeFilters.size}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Pills */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            {ENTRY_TYPES.map(({ type, label, color, icon: Icon }) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                onClick={() => toggleFilter(type)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all h-auto",
                  activeFilters.has(type)
                    ? `${color} text-white hover:text-white hover:opacity-90`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </Button>
            ))}
            {activeFilters.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-red-500 hover:bg-red-500/10 hover:text-red-600 h-auto"
              >
                Clear all
              </Button>
            )}
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <Card className="flex-1 p-2 border-0 bg-card/50 overflow-hidden flex flex-col">
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
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
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
                      "relative p-1 rounded-lg text-left transition-all min-h-[60px] flex flex-col overflow-hidden",
                      day.isCurrentMonth ? "bg-muted/30" : "bg-transparent opacity-40",
                      day.isToday && "ring-2 ring-primary",
                      day.entries.length > 0 && "hover:bg-muted/50 cursor-pointer"
                    )}
                  >
                    {/* Memory Photo Background */}
                    {hasMemories && (
                      <div className="absolute inset-0 -z-10">
                        {memoryEntries.length === 1 ? (
                          // Single memory - full background
                          <div className="w-full h-full relative">
                            <Image
                              src={memoryEntries[0].details.photoUrl as string}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 15vw, 100px"
                              className="object-cover opacity-40"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          </div>
                        ) : memoryEntries.length === 2 ? (
                          // Two memories - split vertically
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
                          // Three memories - one large, two small
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
                          // Four or more memories - 2x2 grid
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
                    
                    {/* Entry dots */}
                    {day.entries.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1 relative z-10">
                        {day.entries.slice(0, 6).map((entry, i) => {
                          const config = getEntryConfig(entry.type);
                          return (
                            <div
                              key={i}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                config.color,
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
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 justify-center">
          {ENTRY_TYPES.slice(0, 6).map(({ type, label, color }) => (
            <div key={type} className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", color)} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Modal */}
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
          getEntryConfig={getEntryConfig}
          formatTime={formatTime}
        />
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          getEntryConfig={getEntryConfig}
          formatTime={formatTime}
        />
      )}
    </MobileContainer>
  );
}


// Day Detail Modal - Shows all entries for a selected day
function DayDetailModal({
  date,
  entries,
  onClose,
  onSelectEntry,
  getEntryConfig,
  formatTime,
}: {
  date: Date;
  entries: CalendarEntry[];
  onClose: () => void;
  onSelectEntry: (entry: CalendarEntry) => void;
  getEntryConfig: (type: EntryType) => { type: EntryType; label: string; color: string; icon: typeof Moon };
  formatTime: (date: Date) => string;
}) {
  // Sort entries by time
  const sortedEntries = [...entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <Card 
        className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-sm text-muted-foreground">{entries.length} entries</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sortedEntries.map((entry) => {
            const config = getEntryConfig(entry.type);
            const Icon = config.icon;
            return (
              <button
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.color)}>
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
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// Entry Detail Modal - Shows full details of a single entry
function EntryDetailModal({
  entry,
  onClose,
  getEntryConfig,
  formatTime,
}: {
  entry: CalendarEntry;
  onClose: () => void;
  getEntryConfig: (type: EntryType) => { type: EntryType; label: string; color: string; icon: typeof Moon };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <Card 
        className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn("p-4 flex items-center gap-3", config.color)}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-white">
            <h3 className="font-semibold text-lg">{entry.title}</h3>
            {entry.subtitle && <p className="text-sm opacity-90">{entry.subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
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
                <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-right max-w-[60%] truncate">
                    {formatValue(key, value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
