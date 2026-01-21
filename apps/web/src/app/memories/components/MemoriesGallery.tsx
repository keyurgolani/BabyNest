"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Memory, CreateMemoryDto, MemoryEntryType, MemoryDateGroupDto } from "@babynest/types";
import { api } from "@/lib/api-client";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MemoryCard } from "./MemoryCard";
import { TimelineMemoryCard } from "./TimelineMemoryCard";
import { AddMemoryModal } from "./AddMemoryModal";
import { MemoryDetailModal } from "./MemoryDetailModal";
import { FilterBar } from "./FilterBar";
import { EmptyState } from "./EmptyState";

const MEMORY_TYPES = [
  { value: "all", label: "All Memories", icon: Icons.Image },
  { value: MemoryEntryType.PHOTO, label: "Photos", icon: Icons.Memories },
  { value: MemoryEntryType.MILESTONE, label: "Milestones", icon: Icons.Milestone },
  { value: MemoryEntryType.FIRST, label: "Firsts", icon: Icons.Sparkles },
  { value: MemoryEntryType.NOTE, label: "Notes", icon: Icons.Log },
];

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

  if (isLoading) {
    return (
      <main className="flex flex-col gap-6 p-6 pt-12 pb-32">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-foreground text-shadow-soft">Memories</h1>
            <span className="text-muted-foreground text-sm">Photo Journal</span>
          </div>
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
    <main className="flex flex-col gap-6 p-6 pt-12 pb-32 relative">
      {/* Aurora background effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="glow-orb glow-orb-primary w-96 h-96 absolute -top-48 -right-48 animate-aurora-pulse" />
        <div className="glow-orb glow-orb-secondary w-80 h-80 absolute top-1/3 -left-40 animate-aurora-pulse" style={{ animationDelay: "2s" }} />
        <div className="glow-orb glow-orb-accent w-72 h-72 absolute bottom-1/4 right-1/4 animate-aurora-pulse" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-foreground text-shadow-soft">Memories</h1>
            <span className="text-muted-foreground text-sm">
              {displayCount} {displayCount === 1 ? "memory" : "memories"}
            </span>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="gap-2 glow-primary hidden md:flex">
            <Icons.Plus className="w-4 h-4" />
            Add Memory
          </Button>
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          memoryTypes={MEMORY_TYPES}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />

        {/* Error message */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/20 p-4 mb-6 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <Icons.AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-destructive text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Memories display */}
        {viewMode === "grid" ? (
          // Grid View
          filteredMemories.length === 0 ? (
            <EmptyState 
              hasMemories={memories.length > 0} 
              onAddMemory={() => setShowAddModal(true)}
              onClearFilters={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setDateRange({});
              }}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
              {filteredMemories.map((memory, index) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onDelete={handleDeleteMemory}
                  onView={setSelectedMemory}
                  index={index}
                />
              ))}
            </div>
          )
        ) : (
          // Timeline View (using API data)
          timelineGroups.length === 0 ? (
            <EmptyState 
              hasMemories={memories.length > 0} 
              onAddMemory={() => setShowAddModal(true)}
              onClearFilters={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setDateRange({});
              }}
            />
          ) : (
            <div className="flex flex-col gap-8 animate-in fade-in duration-500">
              {timelineByMonth.map(([monthKey, dayGroups]) => {
                const monthLabel = formatMonthLabel(monthKey + "-01");
                const monthMemoryCount = dayGroups.reduce((sum, g) => sum + g.count, 0);
                
                return (
                  <div key={monthKey} className="relative">
                    {/* Month Header */}
                    <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-3 z-10 mb-4 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-foreground text-shadow-soft">
                          {monthLabel}
                        </h2>
                        <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
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
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Icons.Calendar className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{dayLabel}</p>
                                <p className="text-xs text-muted-foreground">
                                  {dayGroup.count} {dayGroup.count === 1 ? "memory" : "memories"}
                                </p>
                              </div>
                            </div>
                            
                            {/* Memories for this day */}
                            <div className="flex flex-col gap-3 ml-5 pl-5 border-l-2 border-primary/20">
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
                  </div>
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
                    <Button
                      variant="outline"
                      onClick={() => fetchTimeline(nextCursor ?? undefined, true)}
                      className="gap-2"
                    >
                      <Icons.ChevronDown className="w-4 h-4" />
                      Load More
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        )}

        {/* Floating Action Button for mobile */}
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-32 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground fab-glow flex items-center justify-center hover:scale-110 transition-transform md:hidden z-40"
          aria-label="Add memory"
        >
          <Icons.Plus className="w-6 h-6" />
        </button>

        {/* Add Memory Modal */}
        {showAddModal && (
          <AddMemoryModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleCreateMemory}
          />
        )}

        {/* Memory Detail Modal */}
        {selectedMemory && (
          <MemoryDetailModal
            memory={selectedMemory}
            onClose={() => setSelectedMemory(null)}
            onDelete={handleDeleteMemory}
          />
        )}
      </div>
    </main>
  );
}
