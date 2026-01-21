"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { MobileContainer } from "@/components/layout/mobile-container";
import { api } from "@/lib/api-client";
import { 
  ChevronLeft, 
  Edit2, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  X,
  SlidersHorizontal,
  Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: Date;
  icon: keyof typeof Icons;
  color: string;
  bgColor: string;
  rawData?: Record<string, unknown>;
  notes?: string | null;
}

const TYPE_CONFIG: Record<string, { icon: keyof typeof Icons; color: string; bgColor: string; label: string }> = {
  feeding: { icon: "Feed", color: "text-orange-500", bgColor: "bg-orange-500/10", label: "Feeding" },
  sleep: { icon: "Sleep", color: "text-indigo-500", bgColor: "bg-indigo-500/10", label: "Sleep" },
  diaper: { icon: "Diaper", color: "text-green-500", bgColor: "bg-green-500/10", label: "Diaper" },
  activity: { icon: "Activity", color: "text-cyan-500", bgColor: "bg-cyan-500/10", label: "Activity" },
  growth: { icon: "Growth", color: "text-emerald-500", bgColor: "bg-emerald-500/10", label: "Growth" },
  medication: { icon: "Medication", color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Medication" },
  symptom: { icon: "Symptom", color: "text-red-500", bgColor: "bg-red-500/10", label: "Symptom" },
  vaccination: { icon: "Vaccination", color: "text-purple-500", bgColor: "bg-purple-500/10", label: "Vaccination" },
  doctor_visit: { icon: "DoctorVisit", color: "text-pink-500", bgColor: "bg-pink-500/10", label: "Doctor Visit" },
  memory: { icon: "Memories", color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "Memory" },
  milestone: { icon: "Milestone", color: "text-teal-500", bgColor: "bg-teal-500/10", label: "Milestone" },
};

type DateRangeFilter = "today" | "week" | "month" | "custom";
type SortOption = "newest" | "oldest" | "type";

export default function ActivityLogPage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(Object.keys(TYPE_CONFIG));
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>("week");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItems, setDeletingItems] = useState<TimelineItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        feedingsRes, 
        sleepRes, 
        diapersRes, 
        activitiesRes, 
        growthRes, 
        medsRes, 
        symptomsRes, 
        vaccinesRes,
        doctorVisitsRes,
        memoriesRes,
        milestonesRes
      ] = await Promise.all([
        api.feedings.list().catch(() => ({ data: [] })),
        api.sleep.list().catch(() => ({ data: [] })),
        api.diapers.list().catch(() => ({ data: [] })),
        api.activities.list().catch(() => ({ data: [] })),
        api.growth.list().catch(() => ({ data: [] })),
        api.health.medications.list().catch(() => ({ data: [] })),
        api.health.symptoms.list().catch(() => ({ data: [] })),
        api.health.vaccinations.list().catch(() => ({ data: [] })),
        api.health.doctorVisits.list().catch(() => ({ data: [] })),
        api.memories.list().catch(() => ({ data: [] })),
        api.milestones.list().catch(() => ({ data: [] })),
      ]);

      const allItems: TimelineItem[] = [
        ...feedingsRes.data.map(f => ({
          id: f.id,
          type: "feeding",
          title: f.type === "breastfeeding" ? "Nursing" : f.type === "bottle" ? "Bottle" : "Feeding",
          subtitle: f.amount ? `${f.amount}ml` : f.leftDuration || f.rightDuration ? `${Math.round(((f.leftDuration || 0) + (f.rightDuration || 0)) / 60)}m` : "",
          timestamp: new Date(f.timestamp),
          notes: f.notes,
          rawData: f as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.feeding,
        })),
        ...sleepRes.data.map(s => ({
          id: s.id,
          type: "sleep",
          title: s.sleepType === "nap" ? "Nap" : "Night Sleep",
          subtitle: s.duration ? `${Math.round(s.duration)}m` : "",
          timestamp: new Date(s.startTime),
          notes: s.notes,
          rawData: s as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.sleep,
        })),
        ...diapersRes.data.map(d => ({
          id: d.id,
          type: "diaper",
          title: "Diaper",
          subtitle: d.type.charAt(0).toUpperCase() + d.type.slice(1),
          timestamp: new Date(d.timestamp),
          notes: d.notes,
          rawData: d as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.diaper,
        })),
        ...activitiesRes.data.filter(a => a.startTime).map(a => ({
          id: a.id,
          type: "activity",
          title: a.activityType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
          subtitle: a.duration ? `${a.duration}m` : "",
          timestamp: new Date(a.startTime!),
          notes: a.notes,
          rawData: a as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.activity,
        })),
        ...growthRes.data.map(g => ({
          id: g.id,
          type: "growth",
          title: "Growth Measurement",
          subtitle: [
            g.weight ? `${(g.weight / 1000).toFixed(1)}kg` : null,
            g.height ? `${(g.height / 10).toFixed(1)}cm` : null,
          ].filter(Boolean).join(" • "),
          timestamp: new Date(g.timestamp),
          notes: g.notes,
          rawData: g as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.growth,
        })),
        ...medsRes.data.map(m => ({
          id: m.id,
          type: "medication",
          title: m.name,
          subtitle: `${m.dosage} ${m.unit}`,
          timestamp: new Date(m.timestamp),
          notes: m.notes,
          rawData: m as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.medication,
        })),
        ...symptomsRes.data.map(s => ({
          id: s.id,
          type: "symptom",
          title: s.symptomType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
          subtitle: s.severity,
          timestamp: new Date(s.timestamp),
          notes: s.notes,
          rawData: s as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.symptom,
        })),
        ...vaccinesRes.data.map(v => ({
          id: v.id,
          type: "vaccination",
          title: v.vaccineName,
          subtitle: v.provider || "",
          timestamp: new Date(v.timestamp),
          notes: v.notes,
          rawData: v as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.vaccination,
        })),
        ...doctorVisitsRes.data.map(dv => ({
          id: dv.id,
          type: "doctor_visit",
          title: "Doctor Visit",
          subtitle: dv.provider || dv.visitType || "",
          timestamp: new Date(dv.timestamp),
          notes: dv.notes,
          rawData: dv as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.doctor_visit,
        })),
        ...memoriesRes.data.map(m => ({
          id: m.id,
          type: "memory",
          title: m.title || "Memory",
          subtitle: m.note || "",
          timestamp: new Date(m.takenAt),
          notes: m.note,
          rawData: m as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.memory,
        })),
        ...milestonesRes.data.map(m => ({
          id: m.id,
          type: "milestone",
          title: "Milestone",
          subtitle: m.notes || "",
          timestamp: new Date(m.achievedDate),
          notes: m.notes,
          rawData: m as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.milestone,
        })),
      ];

      setItems(allItems);
    } catch (err) {
      console.error("Failed to fetch activity log:", err);
      toast.error("Failed to load activity log");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Filter by type
    filtered = filtered.filter(item => selectedTypes.includes(item.type));

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        (item.notes && item.notes.toLowerCase().includes(query))
      );
    }

    // Filter by date range
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateFilter) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "custom":
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) endDate = new Date(customEndDate);
        break;
    }

    if (startDate) {
      filtered = filtered.filter(item => item.timestamp >= startDate!);
    }
    if (endDate) {
      filtered = filtered.filter(item => item.timestamp <= endDate!);
    }

    // Sort items
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        break;
      case "type":
        filtered.sort((a, b) => {
          if (a.type === b.type) {
            return b.timestamp.getTime() - a.timestamp.getTime();
          }
          return a.type.localeCompare(b.type);
        });
        break;
    }

    return filtered;
  }, [items, selectedTypes, searchQuery, dateFilter, customStartDate, customEndDate, sortBy]);

  // Paginate items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, endIndex);
  }, [filteredAndSortedItems, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);

  // Statistics
  const statistics = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredAndSortedItems.forEach(item => {
      stats[item.type] = (stats[item.type] || 0) + 1;
    });
    return stats;
  }, [filteredAndSortedItems]);

  // Handle type filter toggle
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
    setCurrentPage(1);
  };

  // Handle select all types
  const selectAllTypes = () => {
    setSelectedTypes(Object.keys(TYPE_CONFIG));
    setCurrentPage(1);
  };

  // Handle deselect all types
  const deselectAllTypes = () => {
    setSelectedTypes([]);
    setCurrentPage(1);
  };

  // Handle item selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle select all on page
  const selectAllOnPage = () => {
    const newSet = new Set(selectedItems);
    paginatedItems.forEach(item => newSet.add(item.id));
    setSelectedItems(newSet);
  };

  // Handle deselect all
  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  // Handle edit button click
  const handleEdit = (item: TimelineItem) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (items: TimelineItem[]) => {
    setDeletingItems(items);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (deletingItems.length === 0) return;

    setIsDeleting(true);
    try {
      // Delete all selected items
      await Promise.all(deletingItems.map(async (item) => {
        switch (item.type) {
          case "feeding":
            await api.feedings.delete(item.id);
            break;
          case "sleep":
            await api.sleep.delete(item.id);
            break;
          case "diaper":
            await api.diapers.delete(item.id);
            break;
          case "activity":
            await api.activities.delete(item.id);
            break;
          case "growth":
            await api.growth.delete(item.id);
            break;
          case "medication":
            await api.health.medications.delete(item.id);
            break;
          case "symptom":
            await api.health.symptoms.delete(item.id);
            break;
          case "vaccination":
            await api.health.vaccinations.delete(item.id);
            break;
          case "doctor_visit":
            await api.health.doctorVisits.delete(item.id);
            break;
          case "memory":
            await api.memories.delete(item.id);
            break;
          case "milestone":
            await api.milestones.delete(item.id);
            break;
        }
      }));

      toast.success(`${deletingItems.length} ${deletingItems.length === 1 ? 'entry' : 'entries'} deleted successfully`);
      setDeleteDialogOpen(false);
      setDeletingItems([]);
      setSelectedItems(new Set());
      
      // Refresh the activity log
      await fetchAllData();
    } catch (error) {
      console.error("Failed to delete entries:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete entries");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (formData: Record<string, unknown>) => {
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      switch (editingItem.type) {
        case "feeding":
          await api.feedings.update(editingItem.id, formData);
          break;
        case "sleep":
          await api.sleep.update(editingItem.id, formData);
          break;
        case "diaper":
          await api.diapers.update(editingItem.id, formData);
          break;
        case "activity":
          await api.activities.update(editingItem.id, formData);
          break;
        case "growth":
          await api.growth.update(editingItem.id, formData);
          break;
        case "medication":
          await api.health.medications.update(editingItem.id, formData);
          break;
        case "symptom":
          await api.health.symptoms.update(editingItem.id, formData);
          break;
        case "vaccination":
          await api.health.vaccinations.update(editingItem.id, formData);
          break;
        case "milestone":
          await api.milestones.update(editingItem.id, formData);
          break;
      }

      toast.success("Entry updated successfully");
      setEditModalOpen(false);
      setEditingItem(null);
      
      // Refresh the activity log
      await fetchAllData();
    } catch (error) {
      console.error("Failed to update entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    try {
      const headers = ["Type", "Title", "Subtitle", "Date", "Time", "Notes"];
      const rows = filteredAndSortedItems.map(item => [
        TYPE_CONFIG[item.type]?.label || item.type,
        item.title,
        item.subtitle,
        item.timestamp.toLocaleDateString(),
        item.timestamp.toLocaleTimeString(),
        item.notes || ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `activity-log-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Activity log exported successfully");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export activity log");
    }
  };

  // Handle export to JSON
  const handleExportJSON = () => {
    try {
      const exportData = filteredAndSortedItems.map(item => ({
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        timestamp: item.timestamp.toISOString(),
        notes: item.notes,
        data: item.rawData
      }));

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `activity-log-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Activity log exported successfully");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export activity log");
    }
  };

  return (
    <MobileContainer>
      <div className="p-4 space-y-4 pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/tracking" className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-foreground">Activity Log</h1>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'entry' : 'entries'}
              {selectedItems.size > 0 && ` • ${selectedItems.size} selected`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-4 space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, subtitle, or notes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Type Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Entry Types</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllTypes} className="h-7 text-xs">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAllTypes} className="h-7 text-xs">
                    Clear
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TYPE_CONFIG).map(([type, config]) => {
                  const isSelected = selectedTypes.includes(type);
                  const count = statistics[type] || 0;
                  return (
                    <Badge
                      key={type}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected && config.bgColor,
                        isSelected && config.color
                      )}
                      onClick={() => toggleTypeFilter(type)}
                    >
                      {config.label} ({count})
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                {[
                  { key: "today" as const, label: "Today" },
                  { key: "week" as const, label: "7 Days" },
                  { key: "month" as const, label: "30 Days" },
                  { key: "custom" as const, label: "Custom" },
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={dateFilter === filter.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDateFilter(filter.key);
                      setCurrentPage(1);
                    }}
                    className="flex-1"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
              {dateFilter === "custom" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Sort Options */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="type">By Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {/* Bulk Actions Bar */}
        {selectedItems.size > 0 && (
          <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedItems.size === paginatedItems.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAllOnPage();
                    } else {
                      deselectAll();
                    }
                  }}
                />
                <span className="text-sm font-medium">
                  {selectedItems.size} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                >
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const itemsToDelete = items.filter(item => selectedItems.has(item.id));
                    handleDeleteClick(itemsToDelete);
                  }}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex-1 gap-2"
            disabled={filteredAndSortedItems.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="flex-1 gap-2"
            disabled={filteredAndSortedItems.length === 0}
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        </div>

        {/* Activity List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <Card className="p-8 text-center">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No entries found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or search query
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedItems.map((item) => {
                const IconComponent = Icons[item.icon];
                const isSelected = selectedItems.has(item.id);
                
                return (
                  <Card 
                    key={item.id} 
                    className={cn(
                      "p-3 transition-all",
                      isSelected && "ring-2 ring-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", item.bgColor)}>
                        <IconComponent className={cn("w-5 h-5", item.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{item.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {TYPE_CONFIG[item.type]?.label}
                          </Badge>
                        </div>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {item.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0 hover:bg-muted"
                          title="Edit entry"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick([item])}
                          className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-600 dark:hover:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Delete {deletingItems.length === 1 ? 'Entry' : 'Entries'}</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {deletingItems.length === 1 ? 'this entry' : `these ${deletingItems.length} entries`}? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deletingItems.length > 0 && deletingItems.length <= 3 && (
            <div className="space-y-2">
              {deletingItems.map(item => (
                <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.timestamp.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {editingItem && (
        <EditEntryModal
          item={editingItem}
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleEditSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </MobileContainer>
  );
}

// Edit Entry Modal Component (reused from Timeline page)
interface EditEntryModalProps {
  item: TimelineItem;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

function EditEntryModal({ item, open, onClose, onSubmit, isSubmitting }: EditEntryModalProps) {
  // Initialize form data directly from item.rawData, will reset when item.id changes
  const [formData, setFormData] = useState<Record<string, unknown>>(() => item.rawData || {});

  // Use a key on the Dialog component instead of useEffect to reset state
  // This is handled by the parent component passing item.id as key

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
    switch (item.type) {
      case "feeding":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={getString("type")} onValueChange={(value) => updateField("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breastfeeding">Breastfeeding</SelectItem>
                  <SelectItem value="bottle">Bottle</SelectItem>
                  <SelectItem value="pumping">Pumping</SelectItem>
                  <SelectItem value="solid">Solid Food</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === "breastfeeding" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="leftDuration">Left Duration (min)</Label>
                    <Input
                      id="leftDuration"
                      type="number"
                      value={getValue("leftDuration")}
                      onChange={(e) => updateField("leftDuration", e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rightDuration">Right Duration (min)</Label>
                    <Input
                      id="rightDuration"
                      type="number"
                      value={getValue("rightDuration")}
                      onChange={(e) => updateField("rightDuration", e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                </div>
              </>
            )}

            {formData.type === "bottle" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (ml)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={getValue("amount")}
                    onChange={(e) => updateField("amount", e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bottleType">Bottle Type</Label>
                  <Select value={getString("bottleType")} onValueChange={(value) => updateField("bottleType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formula">Formula</SelectItem>
                      <SelectItem value="breastMilk">Breast Milk</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
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
              <Select value={getString("sleepType")} onValueChange={(value) => updateField("sleepType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nap">Nap</SelectItem>
                  <SelectItem value="night">Night Sleep</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime ? new Date(String(formData.startTime)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("startTime", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime ? new Date(String(formData.endTime)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("endTime", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select value={getString("quality")} onValueChange={(value) => updateField("quality", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
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
              <Select value={getString("type")} onValueChange={(value) => updateField("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wet">Wet</SelectItem>
                  <SelectItem value="dirty">Dirty</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="dry">Dry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Time</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
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
              <Select value={getString("activityType")} onValueChange={(value) => updateField("activityType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tummy_time">Tummy Time</SelectItem>
                  <SelectItem value="bath">Bath</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="play">Play</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={getValue("duration")}
                onChange={(e) => updateField("duration", e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
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
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight ? (Number(formData.weight) / 1000).toFixed(2) : ""}
                onChange={(e) => updateField("weight", e.target.value ? Math.round(parseFloat(e.target.value) * 1000) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={formData.height ? (Number(formData.height) / 10).toFixed(1) : ""}
                onChange={(e) => updateField("height", e.target.value ? Math.round(parseFloat(e.target.value) * 10) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headCircumference">Head Circumference (cm)</Label>
              <Input
                id="headCircumference"
                type="number"
                step="0.1"
                value={formData.headCircumference ? (Number(formData.headCircumference) / 10).toFixed(1) : ""}
                onChange={(e) => updateField("headCircumference", e.target.value ? Math.round(parseFloat(e.target.value) * 10) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Date</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
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
              <Input
                id="name"
                value={getValue("name")}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={getValue("dosage")}
                  onChange={(e) => updateField("dosage", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={getValue("unit")}
                  onChange={(e) => updateField("unit", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Time</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
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
              <Input
                id="symptomType"
                value={getValue("symptomType")}
                onChange={(e) => updateField("symptomType", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={getString("severity")} onValueChange={(value) => updateField("severity", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={getValue("temperature")}
                onChange={(e) => updateField("temperature", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Time</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
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
              <Input
                id="vaccineName"
                value={getValue("vaccineName")}
                onChange={(e) => updateField("vaccineName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={getValue("provider")}
                onChange={(e) => updateField("provider", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={getValue("location")}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Date</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      case "milestone":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="achievedDate">Achieved Date</Label>
              <Input
                id="achievedDate"
                type="datetime-local"
                value={formData.achievedDate ? new Date(String(formData.achievedDate)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("achievedDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      default:
        return <p className="text-sm text-muted-foreground">No edit form available for this entry type.</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bgColor)}>
              {(() => {
                const IconComponent = Icons[item.icon];
                return IconComponent ? <IconComponent className={cn("w-5 h-5", item.color)} /> : null;
              })()}
            </div>
            <div>
              <DialogTitle>Edit {item.title}</DialogTitle>
              <DialogDescription>
                Update the details for this entry
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}

          <DialogFooter className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
