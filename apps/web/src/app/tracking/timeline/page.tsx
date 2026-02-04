"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { FilterPills, FilterOption } from "@/components/ui/filter-pills";
import { TimelineItem } from "@/components/ui/timeline-item";
import { ActivityColor } from "@/components/ui/icon-badge";
import { Icons } from "@/components/icons";
import { api } from "@/lib/api-client";
import { Calendar, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TimelineItemData {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: Date;
  icon: keyof typeof Icons;
  color: ActivityColor;
  rawData?: Record<string, unknown>;
}

const TYPE_CONFIG: Record<string, { icon: keyof typeof Icons; color: ActivityColor }> = {
  feeding: { icon: "Feed", color: "feed" },
  sleep: { icon: "Sleep", color: "sleep" },
  diaper: { icon: "Diaper", color: "diaper" },
  activity: { icon: "Activity", color: "activity" },
  growth: { icon: "Growth", color: "growth" },
  medication: { icon: "Medication", color: "health" },
  symptom: { icon: "Symptom", color: "health" },
  vaccination: { icon: "Vaccination", color: "health" },
};

// Filter options for FilterPills - Requirement 15.3
const FILTER_OPTIONS: FilterOption[] = [
  { value: "all", label: "All", icon: Icons.Activity },
  { value: "feed", label: "Feed", icon: Icons.Feed },
  { value: "sleep", label: "Sleep", icon: Icons.Sleep },
  { value: "diaper", label: "Diaper", icon: Icons.Diaper },
  { value: "activity", label: "Activity", icon: Icons.Play },
];

// Helper to format date headers - Requirement 15.2
function formatDateHeader(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItemData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<TimelineItemData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      const [feedingsRes, sleepRes, diapersRes, activitiesRes, growthRes, medsRes, symptomsRes, vaccinesRes] = await Promise.all([
        api.feedings.list().catch(() => ({ data: [] })),
        api.sleep.list().catch(() => ({ data: [] })),
        api.diapers.list().catch(() => ({ data: [] })),
        api.activities.list().catch(() => ({ data: [] })),
        api.growth.list().catch(() => ({ data: [] })),
        api.health.medications.list().catch(() => ({ data: [] })),
        api.health.symptoms.list().catch(() => ({ data: [] })),
        api.health.vaccinations.list().catch(() => ({ data: [] })),
      ]);

      const allItems: TimelineItemData[] = [
        ...feedingsRes.data.map(f => ({
          id: f.id,
          type: "feeding",
          title: f.type === "breastfeeding" ? "Nursing" : f.type === "bottle" ? "Bottle" : "Feeding",
          subtitle: f.amount ? `${f.amount}ml` : f.leftDuration || f.rightDuration ? `${Math.round(((f.leftDuration || 0) + (f.rightDuration || 0)) / 60)}m` : "",
          timestamp: new Date(f.timestamp),
          rawData: f as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.feeding,
        })),
        ...sleepRes.data.map(s => ({
          id: s.id,
          type: "sleep",
          title: s.sleepType === "nap" ? "Nap" : "Night Sleep",
          subtitle: s.duration ? `${Math.round(s.duration)}m` : "",
          timestamp: new Date(s.startTime),
          rawData: s as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.sleep,
        })),
        ...diapersRes.data.map(d => ({
          id: d.id,
          type: "diaper",
          title: "Diaper",
          subtitle: d.type.charAt(0).toUpperCase() + d.type.slice(1),
          timestamp: new Date(d.timestamp),
          rawData: d as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.diaper,
        })),
        ...activitiesRes.data.filter(a => a.startTime).map(a => ({
          id: a.id,
          type: "activity",
          title: a.activityType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
          subtitle: a.duration ? `${a.duration}m` : "",
          timestamp: new Date(a.startTime!),
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
          rawData: g as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.growth,
        })),
        ...medsRes.data.map(m => ({
          id: m.id,
          type: "medication",
          title: m.name,
          subtitle: `${m.dosage} ${m.unit}`,
          timestamp: new Date(m.timestamp),
          rawData: m as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.medication,
        })),
        ...symptomsRes.data.map(s => ({
          id: s.id,
          type: "symptom",
          title: s.symptomType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
          subtitle: s.severity,
          timestamp: new Date(s.timestamp),
          rawData: s as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.symptom,
        })),
        ...vaccinesRes.data.map(v => ({
          id: v.id,
          type: "vaccination",
          title: v.vaccineName,
          subtitle: "",
          timestamp: new Date(v.timestamp),
          rawData: v as unknown as Record<string, unknown>,
          ...TYPE_CONFIG.vaccination,
        })),
      ];

      setItems(allItems);
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Filter items by type - Requirement 15.4
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply type filter
    if (typeFilter !== "all") {
      const typeMapping: Record<string, string[]> = {
        feed: ["feeding"],
        sleep: ["sleep"],
        diaper: ["diaper"],
        activity: ["activity", "growth"],
      };
      const allowedTypes = typeMapping[typeFilter] || [];
      filtered = filtered.filter(item => allowedTypes.includes(item.type));
    }

    // Sort by timestamp descending
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [items, typeFilter]);

  // Group items by date - Requirement 15.2
  const groupedByDate = useMemo(() => {
    const groups: Record<string, TimelineItemData[]> = {};
    filteredItems.forEach(item => {
      const dateKey = item.timestamp.toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Handle edit button click
  const handleEdit = (item: TimelineItemData) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (item: TimelineItemData) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      switch (deletingItem.type) {
        case "feeding":
          await api.feedings.delete(deletingItem.id);
          break;
        case "sleep":
          await api.sleep.delete(deletingItem.id);
          break;
        case "diaper":
          await api.diapers.delete(deletingItem.id);
          break;
        case "activity":
          await api.activities.delete(deletingItem.id);
          break;
        case "growth":
          await api.growth.delete(deletingItem.id);
          break;
        case "medication":
          await api.health.medications.delete(deletingItem.id);
          break;
        case "symptom":
          await api.health.symptoms.delete(deletingItem.id);
          break;
        case "vaccination":
          await api.health.vaccinations.delete(deletingItem.id);
          break;
      }

      toast.success("Entry deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      await fetchAllData();
    } catch (error) {
      console.error("Failed to delete entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete entry");
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
      }

      toast.success("Entry updated successfully");
      setEditModalOpen(false);
      setEditingItem(null);
      await fetchAllData();
    } catch (error) {
      console.error("Failed to update entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="p-4 space-y-6">
        {/* Page Header - Requirement 15.1 */}
        <PageHeader
          title="Timeline"
          subtitle={`${filteredItems.length} activities`}
          backHref="/tracking"
        />

        {/* Filter Pills - Requirement 15.3 */}
        <FilterPills
          options={FILTER_OPTIONS}
          selected={typeFilter}
          onChange={setTypeFilter}
        />

        {/* Timeline Content */}
        {isLoading ? (
          <div className="space-y-8">
            {/* Timeline loading skeleton with date groups */}
            {[1, 2].map((groupIndex) => (
              <div key={groupIndex} className="space-y-4">
                {/* Date header skeleton */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 animate-pulse" />
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                </div>
                {/* Timeline items skeleton */}
                <div className="ml-4">
                  {Array.from({ length: groupIndex === 1 ? 3 : 2 }).map((_, itemIndex, arr) => (
                    <div key={itemIndex} className="relative flex gap-4 pb-6">
                      {/* Connecting line */}
                      {itemIndex !== arr.length - 1 && (
                        <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-white/10" />
                      )}
                      {/* Dot indicator skeleton */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
                      </div>
                      {/* Content skeleton */}
                      <GlassCard size="sm" className="flex-1 relative overflow-hidden">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0 animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                              <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                            </div>
                            <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
                      </GlassCard>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No activities found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {typeFilter !== "all" ? "Try selecting a different filter" : "Start logging activities to see them here"}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-8">
            {/* Group events by date - Requirement 15.2 */}
            {Object.entries(groupedByDate).map(([dateKey, dayItems]) => (
              <div key={dateKey}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--glass-bg)] backdrop-blur-sm border border-[var(--glass-border)]">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatDateHeader(new Date(dateKey))}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({dayItems.length} {dayItems.length === 1 ? "event" : "events"})
                  </span>
                </div>

                {/* Timeline Items with vertical connecting lines - Requirement 15.1, 15.4 */}
                <div className="ml-4">
                  {dayItems.map((item, index) => {
                    const IconComponent = Icons[item.icon];
                    const isFirst = index === 0;
                    const isLast = index === dayItems.length - 1;

                    return (
                      <div key={item.id} className="relative">
                        <TimelineItem
                          icon={IconComponent}
                          time={item.timestamp}
                          title={item.title}
                          detail={item.subtitle}
                          color={item.color}
                          isFirst={isFirst}
                          isLast={isLast}
                        />
                        {/* Action buttons overlay */}
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100">
                          <GlassButton
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </GlassButton>
                          <GlassButton
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(item)}
                            className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </GlassButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
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

          {deletingItem && (
            <GlassCard size="sm">
              <p className="text-sm font-medium text-foreground">{deletingItem.title}</p>
              {deletingItem.subtitle && (
                <p className="text-xs text-muted-foreground">{deletingItem.subtitle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {deletingItem.timestamp.toLocaleString()}
              </p>
            </GlassCard>
          )}

          <DialogFooter className="flex gap-3 pt-2">
            <GlassButton
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
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
    </div>
  );
}


// Edit Entry Modal Component
interface EditEntryModalProps {
  item: TimelineItemData;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

function EditEntryModal({ item, open, onClose, onSubmit, isSubmitting }: EditEntryModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => item.rawData || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getString = (key: string): string | undefined => {
    const value = formData[key];
    return typeof value === 'string' ? value : undefined;
  };

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
                <SelectTrigger className="bg-transparent border-[var(--glass-border)]">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="leftDuration">Left Duration (min)</Label>
                  <Input
                    id="leftDuration"
                    type="number"
                    value={getValue("leftDuration")}
                    onChange={(e) => updateField("leftDuration", e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-transparent border-[var(--glass-border)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rightDuration">Right Duration (min)</Label>
                  <Input
                    id="rightDuration"
                    type="number"
                    value={getValue("rightDuration")}
                    onChange={(e) => updateField("rightDuration", e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-transparent border-[var(--glass-border)]"
                  />
                </div>
              </div>
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
                    className="bg-transparent border-[var(--glass-border)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bottleType">Bottle Type</Label>
                  <Select value={getString("bottleType")} onValueChange={(value) => updateField("bottleType", value)}>
                    <SelectTrigger className="bg-transparent border-[var(--glass-border)]">
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
                className="bg-transparent border-[var(--glass-border)]"
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
                <SelectTrigger className="bg-transparent border-[var(--glass-border)]">
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
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime ? new Date(String(formData.endTime)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("endTime", e.target.value)}
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select value={getString("quality")} onValueChange={(value) => updateField("quality", value)}>
                <SelectTrigger className="bg-transparent border-[var(--glass-border)]">
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
                className="bg-transparent border-[var(--glass-border)]"
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
                <SelectTrigger className="bg-transparent border-[var(--glass-border)]">
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
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className="bg-transparent border-[var(--glass-border)]"
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
                <SelectTrigger className="bg-transparent border-[var(--glass-border)]">
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
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className="bg-transparent border-[var(--glass-border)]"
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
                className="bg-transparent border-[var(--glass-border)]"
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
                className="bg-transparent border-[var(--glass-border)]"
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
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Date</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className="bg-transparent border-[var(--glass-border)]"
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
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={getValue("dosage")}
                  onChange={(e) => updateField("dosage", e.target.value)}
                  className="bg-transparent border-[var(--glass-border)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={getValue("unit")}
                  onChange={(e) => updateField("unit", e.target.value)}
                  className="bg-transparent border-[var(--glass-border)]"
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
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className="bg-transparent border-[var(--glass-border)]"
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
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={getString("severity")} onValueChange={(value) => updateField("severity", value)}>
                <SelectTrigger className="bg-transparent border-[var(--glass-border)]">
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
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Time</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className="bg-transparent border-[var(--glass-border)]"
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
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={getValue("provider")}
                onChange={(e) => updateField("provider", e.target.value)}
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={getValue("location")}
                onChange={(e) => updateField("location", e.target.value)}
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Date</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp ? new Date(String(formData.timestamp)).toISOString().slice(0, 16) : ""}
                onChange={(e) => updateField("timestamp", e.target.value)}
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={getValue("notes")}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className="bg-transparent border-[var(--glass-border)]"
              />
            </div>
          </>
        );

      default:
        return <p className="text-sm text-muted-foreground">No edit form available for this entry type.</p>;
    }
  };

  const IconComponent = Icons[item.icon];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `var(--color-${item.color})20` }}
            >
              {IconComponent && (
                <IconComponent
                  className="w-5 h-5"
                  style={{ color: `var(--color-${item.color})` }}
                />
              )}
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
            <GlassButton
              type="button"
              variant="ghost"
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
