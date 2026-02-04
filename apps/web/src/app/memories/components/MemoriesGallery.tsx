"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Memory, CreateMemoryDto, MemoryEntryType, MemoryDateGroupDto } from "@babynest/types";
import { api } from "@/lib/api-client";
import { Icons } from "@/components/icons";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { MemoryCard } from "./MemoryCard";
import { TimelineMemoryCard } from "./TimelineMemoryCard";
import { AddMemoryModal } from "./AddMemoryModal";
import { MemoryDetailModal } from "./MemoryDetailModal";
import { EmptyState } from "./EmptyState";
import { motion } from "framer-motion";

const MEMORY_TYPES = [
  { value: "all", label: "All Memories", icon: Icons.Image },
  { value: MemoryEntryType.PHOTO, label: "Photos", icon: Icons.Memories },
  { value: MemoryEntryType.MILESTONE, label: "Milestones", icon: Icons.Milestone },
  { value: MemoryEntryType.FIRST, label: "Firsts", icon: Icons.Sparkles },
  { value: MemoryEntryType.NOTE, label: "Notes", icon: Icons.Log },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

const DATE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 3 months", days: 90 },
  { label: "Last year", days: 365 },
];

/**
 * MemoriesGallery Component
 * 
 * Redesigned memories page with glassmorphism styling featuring:
 * - Script-style "Memories" header (Requirement 16.1)
 * - Search bar with filter icon (Requirement 16.2)
 * - Masonry grid layout (Requirement 16.3)
 * - Responsive columns: 2 mobile, 3 tablet, 4-5 desktop (Requirement 16.4)
 * - FAB button for adding memories (Requirement 16.5)
 */
export function MemoriesGallery() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [timelineGroups, setTimelineGroups] = useState<MemoryDateGroupDto[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalMemories, setTotalMemories] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  // Ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchMemories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.memories.list();
      setMemories(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTimeline = useCallback(async (cursor?: string, append = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      
      const response = await api.memories.getTimeline({
        cursor,
        limit: 10,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      
      if (append && cursor) {
        setTimelineGroups(prev => [...prev, ...response.groups]);
      } else {
        setTimelineGroups(response.groups);
      }
      
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
      setTotalMemories(response.totalMemories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Fetch data based on view mode
  useEffect(() => {
    if (viewMode === "timeline") {
      fetchTimeline();
    } else {
      fetchMemories();
    }
  }, [viewMode, fetchMemories, fetchTimeline]);

  // Refetch timeline when date range changes
  useEffect(() => {
    if (viewMode === "timeline" && (dateRange.startDate || dateRange.endDate)) {
      fetchTimeline();
    }
  }, [dateRange, viewMode, fetchTimeline]);

  // Infinite scroll observer for timeline
  useEffect(() => {
    if (viewMode !== "timeline" || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && nextCursor && !isLoadingMore) {
          fetchTimeline(nextCursor, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [viewMode, hasMore, nextCursor, isLoadingMore, fetchTimeline]);


  // Apply filters and sorting for grid view
  useEffect(() => {
    let result = [...memories];

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter((m) => m.entryType === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title?.toLowerCase().includes(query) ||
          m.note?.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      result = result.filter((m) => new Date(m.takenAt) >= startDate);
    }
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter((m) => new Date(m.takenAt) <= endDate);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.takenAt).getTime();
      const dateB = new Date(b.takenAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredMemories(result);
  }, [memories, typeFilter, searchQuery, sortOrder, dateRange]);

  const handleCreateMemory = async (data: CreateMemoryDto) => {
    try {
      const newMemory = await api.memories.create(data);
      setMemories([newMemory, ...memories]);
      // Refresh timeline if in timeline view
      if (viewMode === "timeline") {
        fetchTimeline();
      }
      setShowAddModal(false);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.memories.delete(id);
      setMemories(memories.filter((m) => m.id !== id));
      // Update timeline groups
      setTimelineGroups(groups => 
        groups.map(group => ({
          ...group,
          memories: group.memories.filter(m => m.id !== id),
          count: group.memories.filter(m => m.id !== id).length,
        })).filter(group => group.count > 0)
      );
      setSelectedMemory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete memory");
    }
  };

  // Format month label from date string
  const formatMonthLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // Group timeline groups by month for display
  const timelineByMonth = useMemo(() => {
    const monthGroups: { [key: string]: MemoryDateGroupDto[] } = {};
    
    timelineGroups.forEach((group) => {
      const date = new Date(group.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(group);
    });
    
    return Object.entries(monthGroups).sort((a, b) => 
      sortOrder === "newest" ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0])
    );
  }, [timelineGroups, sortOrder]);

  const displayCount = viewMode === "timeline" ? totalMemories : filteredMemories.length;
  const hasDateFilter = dateRange.startDate || dateRange.endDate;

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setDateRange({});
  };

  const handlePresetClick = (days: number) => {
    const now = new Date();
    const endDate = now.toISOString().split("T")[0];
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setDateRange({ startDate, endDate });
  };

  const getIsPresetActive = (days: number) => {
    if (!dateRange.startDate || !dateRange.endDate) return false;
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const isEndToday = Math.abs(end.getTime() - today.getTime()) < 24 * 60 * 60 * 1000;
    return isEndToday && Math.abs(diffDays - days) <= 1;
  };


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  if (isLoading) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6 pt-8 pb-32">
        {/* Script-style Header - Requirement 16.1 */}
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground tracking-tight" style={{ fontFamily: "'Outfit', sans-serif", fontStyle: "italic" }}>
            Memories
          </h1>
          <span className="text-muted-foreground text-sm">Photo Journal</span>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <Icons.Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading memories...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6 pt-8 pb-32 relative">
      {/* Script-style Header - Requirement 16.1 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-start"
      >
        <div className="flex flex-col gap-1">
          <h1 
            className="text-4xl md:text-5xl font-bold text-foreground tracking-tight"
            style={{ 
              fontFamily: "'Outfit', sans-serif", 
              fontStyle: "italic",
              textShadow: "0 2px 10px rgba(0,0,0,0.1)"
            }}
          >
            Memories
          </h1>
          <span className="text-muted-foreground text-sm">
            {displayCount} {displayCount === 1 ? "memory" : "memories"}
          </span>
        </div>
        {/* Desktop Add Button */}
        <GlassButton 
          variant="primary" 
          onClick={() => setShowAddModal(true)} 
          className="hidden md:flex gap-2"
        >
          <Icons.Plus className="w-4 h-4" />
          Add Memory
        </GlassButton>
      </motion.div>

      {/* Search Bar with Filter Icon - Requirement 16.2 */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col gap-4"
      >
        <div className="flex gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor="memories-search" className="sr-only">Search memories</label>
            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <GlassInput
              id="memories-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="pl-12 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Clear search"
              >
                <Icons.Close className="w-3 h-3" />
              </button>
            )}
          </div>
          {/* Filter Button */}
          <GlassButton
            variant={showFilters ? "primary" : "default"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <Icons.Filter className="w-5 h-5" />
          </GlassButton>
        </div>


        {/* Active Filter Indicators */}
        {(hasDateFilter || typeFilter !== "all") && (
          <div className="flex flex-wrap items-center gap-2">
            {typeFilter !== "all" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                <Icons.Image className="w-3 h-3" />
                <span>{MEMORY_TYPES.find(t => t.value === typeFilter)?.label}</span>
                <button
                  onClick={() => setTypeFilter("all")}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Clear type filter"
                >
                  <Icons.Close className="w-3 h-3" />
                </button>
              </div>
            )}
            {hasDateFilter && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                <Icons.Calendar className="w-3 h-3" />
                <span>Date filter active</span>
                <button
                  onClick={() => setDateRange({})}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="Clear date filter"
                >
                  <Icons.Close className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl p-1 border border-[var(--glass-border)]">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white/20 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === "timeline"
                  ? "bg-white/20 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Expanded Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard className="flex flex-col gap-5">
              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Memory Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {MEMORY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setTypeFilter(type.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          typeFilter === type.value
                            ? "bg-primary text-primary-foreground shadow-[0_0_15px_var(--primary)]"
                            : "bg-white/10 text-muted-foreground hover:text-foreground hover:bg-white/20"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Date Range
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="date-range-start" className="text-xs text-muted-foreground">From:</label>
                    <input
                      id="date-range-start"
                      type="date"
                      value={dateRange.startDate || ""}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value || undefined })}
                      className="px-3 py-2 rounded-xl bg-white/10 text-foreground text-sm border border-[var(--glass-border)] focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="date-range-end" className="text-xs text-muted-foreground">To:</label>
                    <input
                      id="date-range-end"
                      type="date"
                      value={dateRange.endDate || ""}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value || undefined })}
                      className="px-3 py-2 rounded-xl bg-white/10 text-foreground text-sm border border-[var(--glass-border)] focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>
                  {hasDateFilter && (
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange({})}
                    >
                      Clear dates
                    </GlassButton>
                  )}
                </div>
                {/* Quick date presets */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {DATE_PRESETS.map((preset) => {
                    const isActive = getIsPresetActive(preset.days);
                    return (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetClick(preset.days)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/10 text-muted-foreground hover:text-foreground hover:bg-white/20"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Sort By
                </label>
                <div className="flex gap-2">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortOrder(option.value as "newest" | "oldest")}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        sortOrder === option.value
                          ? "bg-primary text-primary-foreground shadow-[0_0_15px_var(--primary)]"
                          : "bg-white/10 text-muted-foreground hover:text-foreground hover:bg-white/20"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>


      {/* Error message */}
      {error && (
        <GlassCard variant="danger" className="animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Icons.AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-destructive text-sm flex-1">{error}</p>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
            >
              Dismiss
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Memories Display */}
      {viewMode === "grid" ? (
        // Grid View - Masonry Layout (Requirements 16.3, 16.4)
        filteredMemories.length === 0 ? (
          <EmptyState 
            hasMemories={memories.length > 0} 
            onAddMemory={() => setShowAddModal(true)}
            onClearFilters={clearFilters}
          />
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4"
          >
            {filteredMemories.map((memory, index) => (
              <motion.div 
                key={memory.id} 
                variants={itemVariants}
                className="break-inside-avoid"
              >
                <MemoryCard
                  memory={memory}
                  onDelete={handleDeleteMemory}
                  onView={setSelectedMemory}
                  index={index}
                />
              </motion.div>
            ))}
          </motion.div>
        )
      ) : (
        // Timeline View
        timelineGroups.length === 0 ? (
          <EmptyState 
            hasMemories={memories.length > 0} 
            onAddMemory={() => setShowAddModal(true)}
            onClearFilters={clearFilters}
          />
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8"
          >
            {timelineByMonth.map(([monthKey, dayGroups]) => {
              const monthLabel = formatMonthLabel(monthKey + "-01");
              const monthMemoryCount = dayGroups.reduce((sum, g) => sum + g.count, 0);
              
              return (
                <motion.div key={monthKey} variants={itemVariants} className="relative">
                  {/* Month Header */}
                  <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-3 z-10 mb-4 border-b border-[var(--glass-border)]">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">
                        {monthLabel}
                      </h2>
                      <span className="text-sm text-muted-foreground bg-white/10 px-3 py-1 rounded-full">
                        {monthMemoryCount} {monthMemoryCount === 1 ? "memory" : "memories"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Days within month */}
                  <div className="flex flex-col gap-6">
                    {dayGroups.map((dayGroup) => {
                      const dayDate = new Date(dayGroup.date);
                      const dayLabel = dayDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      });
                      
                      return (
                        <div key={dayGroup.date} className="relative">
                          {/* Day Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-memory)]/20 flex items-center justify-center">
                              <Icons.Calendar className="w-5 h-5 text-[var(--color-memory)]" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{dayLabel}</p>
                              <p className="text-xs text-muted-foreground">
                                {dayGroup.count} {dayGroup.count === 1 ? "memory" : "memories"}
                              </p>
                            </div>
                          </div>
                          
                          {/* Memories for this day */}
                          <div className="flex flex-col gap-3 ml-5 pl-5 border-l-2 border-[var(--color-memory)]/20">
                            {dayGroup.memories.map((memory, index) => (
                              <TimelineMemoryCard
                                key={memory.id}
                                memory={memory as Memory}
                                isLast={index === dayGroup.memories.length - 1}
                                onDelete={handleDeleteMemory}
                                onView={setSelectedMemory}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
            
            {/* Load more indicator */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isLoadingMore ? (
                  <div className="flex items-center gap-3">
                    <Icons.Loader className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading more memories...</span>
                  </div>
                ) : (
                  <GlassButton
                    variant="default"
                    onClick={() => fetchTimeline(nextCursor ?? undefined, true)}
                    className="gap-2"
                  >
                    <Icons.ChevronDown className="w-4 h-4" />
                    Load More
                  </GlassButton>
                )}
              </div>
            )}
          </motion.div>
        )
      )}


      {/* FAB Button for Adding Memories - Requirement 16.5 */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl flex items-center justify-center hover:scale-110 hover:shadow-[0_0_30px_var(--primary)] active:scale-95 transition-all md:hidden z-40"
        aria-label="Add memory"
      >
        <Icons.Plus className="w-6 h-6" />
      </motion.button>

      {/* Add Memory Modal */}
      {showAddModal && (
        <AddMemoryModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleCreateMemory}
        />
      )}

      {/* Memory Detail Modal - Lightbox with navigation (Requirement 16.6) */}
      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          memories={viewMode === "grid" ? filteredMemories : memories}
          onClose={() => setSelectedMemory(null)}
          onDelete={handleDeleteMemory}
          onNavigate={setSelectedMemory}
        />
      )}
    </main>
  );
}