"use client";

import { useState, useEffect, useCallback } from "react";

import { Icons } from "@/components/icons";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassTextarea } from "@/components/ui/glass-textarea";
import { GlassModal } from "@/components/ui/glass-modal";
import { FilterPills, FilterOption } from "@/components/ui/filter-pills";
import { PageHeader } from "@/components/ui/page-header";
import {
  api,
  MilestoneCategory,
  MilestoneDefinitionResponse,
  MilestonesByCategoryResponse,
  MilestoneWithStatus,
  CreateMilestoneDto,
} from "@/lib/api-client";

const categoryConfig: Record<MilestoneCategory, { label: string; color: string; bgColor: string; iconBg: string; ringColor: string }> = {
  motor: { 
    label: "Motor", 
    color: "text-blue-500 dark:text-blue-400", 
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    iconBg: "bg-blue-500/20 dark:bg-blue-500/30",
    ringColor: "#3b82f6"
  },
  cognitive: { 
    label: "Cognitive", 
    color: "text-purple-500 dark:text-purple-400", 
    bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    iconBg: "bg-purple-500/20 dark:bg-purple-500/30",
    ringColor: "#a855f7"
  },
  social: { 
    label: "Social", 
    color: "text-pink-500 dark:text-pink-400", 
    bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
    iconBg: "bg-pink-500/20 dark:bg-pink-500/30",
    ringColor: "#ec4899"
  },
  language: { 
    label: "Language", 
    color: "text-green-500 dark:text-green-400", 
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
    iconBg: "bg-green-500/20 dark:bg-green-500/30",
    ringColor: "#22c55e"
  },
};

// Progress Ring Component for circular progress indicators
function ProgressRing({ 
  progress, 
  size = 64, 
  strokeWidth = 6, 
  color 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number; 
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/10"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
}

export default function MilestonesPage() {
  const [milestonesData, setMilestonesData] = useState<MilestonesByCategoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<MilestoneCategory | "all">("all");
  const [showAchieveModal, setShowAchieveModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneDefinitionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter options for FilterPills component
  const filterOptions: FilterOption[] = [
    { value: "all", label: "All" },
    { value: "motor", label: "Motor" },
    { value: "cognitive", label: "Cognitive" },
    { value: "social", label: "Social" },
    { value: "language", label: "Language" },
  ];

  const fetchMilestones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.milestones.getByCategory();
      setMilestonesData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load milestones");
      console.error("Error fetching milestones:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  // Get all milestones as a flat array
  const getAllMilestones = (): MilestoneWithStatus[] => {
    if (!milestonesData) return [];
    return [
      ...milestonesData.motor,
      ...milestonesData.cognitive,
      ...milestonesData.social,
      ...milestonesData.language,
    ];
  };

  const getFilteredMilestones = (): MilestoneWithStatus[] => {
    if (!milestonesData) return [];
    if (activeCategory === "all") {
      return getAllMilestones();
    }
    return milestonesData[activeCategory] || [];
  };

  const totalMilestones = milestonesData?.summary.totalMilestones ?? 0;
  const achievedCount = milestonesData?.summary.achievedCount ?? 0;
  const overallProgress = totalMilestones > 0 ? (achievedCount / totalMilestones) * 100 : 0;

  const handleMilestoneClick = useCallback((milestone: MilestoneWithStatus) => {
    if (!milestone.isAchieved) {
      setSelectedMilestone(milestone.definition);
      setShowAchieveModal(true);
    }
  }, []);

  const handleAchieveMilestone = async (milestoneId: string, date: Date, notes?: string) => {
    try {
      setIsSubmitting(true);
      const dto: CreateMilestoneDto = {
        milestoneId,
        achievedDate: date.toISOString(),
        notes,
      };
      await api.milestones.create(dto);
      // Refresh data after successful creation
      await fetchMilestones();
      setShowAchieveModal(false);
      setSelectedMilestone(null);
    } catch (err) {
      console.error("Error achieving milestone:", err);
      setError(err instanceof Error ? err.message : "Failed to save milestone");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnachieveMilestone = async (entryId: string) => {
    try {
      await api.milestones.delete(entryId);
      // Refresh data after deletion
      await fetchMilestones();
    } catch (err) {
      console.error("Error removing milestone:", err);
      setError(err instanceof Error ? err.message : "Failed to remove milestone");
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAgeRange = (min: number, max: number): string => {
    return `${min}-${max} months`;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 pb-32 space-y-6">
        {/* Page header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
        </div>
        
        {/* Progress summary skeleton */}
        <GlassCard className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
            <div className="h-6 w-12 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-4 w-full bg-white/10 rounded-full animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
        </GlassCard>
        
        {/* Category filter skeleton */}
        <div className="flex gap-2 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-white/10 rounded-full flex-shrink-0 animate-pulse" />
          ))}
        </div>
        
        {/* Milestone categories skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, categoryIndex) => (
            <div key={categoryIndex} className="space-y-3">
              {/* Category header skeleton */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                </div>
                {/* Progress ring skeleton */}
                <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
              </div>
              {/* Milestone items skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <GlassCard key={i} size="sm" className="relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-36 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
                  </GlassCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Icons.Close className="w-12 h-12 text-red-500" />
          <p className="text-red-500 font-medium">{error}</p>
          <GlassButton onClick={fetchMilestones} variant="default">
            Try Again
          </GlassButton>
        </div>
      </div>
    );
  }

  const filteredMilestones = getFilteredMilestones();

  return (
    <div className="p-4 md:p-6 space-y-6 animate-slide-up pb-32 max-w-4xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Milestones"
        subtitle="Track development progress"
      />

      {/* Overall Progress Summary with Progress Ring */}
      <GlassCard variant="featured" size="lg" className="overflow-hidden">
        <div className="flex items-center gap-6">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <ProgressRing 
              progress={overallProgress} 
              size={80} 
              strokeWidth={8} 
              color="var(--primary)" 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">
                {Math.round(overallProgress)}%
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-semibold text-lg text-foreground mb-1">
              Overall Progress
            </h2>
            <p className="text-sm text-muted-foreground">
              {achievedCount} of {totalMilestones} milestones achieved
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Category Stats with Progress Rings */}
      {milestonesData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(categoryConfig) as MilestoneCategory[]).map((category) => {
            const categoryMilestones = milestonesData[category] || [];
            const categoryAchieved = categoryMilestones.filter((m) => m.isAchieved).length;
            const categoryTotal = categoryMilestones.length;
            const categoryProgress = categoryTotal > 0 ? (categoryAchieved / categoryTotal) * 100 : 0;
            const config = categoryConfig[category];
            
            return (
              <GlassCard 
                key={category} 
                interactive
                className={`${config.bgColor} border-0`}
                onClick={() => setActiveCategory(category)}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  {/* Category Progress Ring */}
                  <div className="relative">
                    <ProgressRing 
                      progress={categoryProgress} 
                      size={56} 
                      strokeWidth={5} 
                      color={config.ringColor} 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-bold ${config.color}`}>
                        {Math.round(categoryProgress)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={`text-lg font-heading font-bold ${config.color}`}>
                      {categoryAchieved}/{categoryTotal}
                    </span>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {config.label}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Category Filter Pills */}
      <FilterPills
        options={filterOptions}
        selected={activeCategory}
        onChange={(value) => setActiveCategory(value as MilestoneCategory | "all")}
      />

      {/* Milestones List */}
      <div className="flex flex-col gap-3">
        {filteredMilestones.map((milestone, index) => {
          const config = categoryConfig[milestone.definition.category];
          const status = milestone.isAchieved ? "achieved" : milestone.isDelayed ? "delayed" : "upcoming";

          return (
            <GlassCard
              key={milestone.definition.id}
              interactive
              className={`
                ${milestone.isAchieved ? "border-l-4 border-l-green-500 dark:border-l-green-400" : ""} 
                ${status === "delayed" ? "border-l-4 border-l-amber-500 dark:border-l-amber-400" : ""}
              `}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleMilestoneClick(milestone)}
            >
              <div className="flex items-start gap-4">
                {/* Status Indicator */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (milestone.isAchieved && milestone.achievement) {
                      handleUnachieveMilestone(milestone.achievement.id);
                    } else {
                      handleMilestoneClick(milestone);
                    }
                  }}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 min-h-[48px] min-w-[48px] ${
                    milestone.isAchieved
                      ? "bg-green-500 dark:bg-green-400 border-green-500 dark:border-green-400 text-white"
                      : status === "delayed"
                      ? "border-amber-500 dark:border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50"
                      : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {milestone.isAchieved && <Icons.Check className="w-4 h-4" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-heading font-semibold text-foreground">
                      {milestone.definition.name}
                    </h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{milestone.definition.description}</p>
                  <div className="flex items-center gap-4 text-xs flex-wrap">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Icons.Calendar className="w-3.5 h-3.5" />
                      Expected: {formatAgeRange(milestone.definition.expectedAgeMonthsMin, milestone.definition.expectedAgeMonthsMax)}
                    </span>
                    {milestone.isAchieved && milestone.achievement && (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                        <Icons.Check className="w-3.5 h-3.5" />
                        Achieved: {formatDate(milestone.achievement.achievedDate)}
                      </span>
                    )}
                    {status === "delayed" && (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                        <Icons.Clock className="w-3.5 h-3.5" />
                        May need attention
                      </span>
                    )}
                  </div>
                  {milestone.isAchieved && milestone.achievement?.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic bg-white/5 rounded-lg px-3 py-2">
                      &quot;{milestone.achievement.notes}&quot;
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Achieve Milestone Modal */}
      {selectedMilestone && (
        <AchieveMilestoneModal
          key={selectedMilestone.id}
          milestone={selectedMilestone}
          isOpen={showAchieveModal}
          onClose={() => {
            setShowAchieveModal(false);
            setSelectedMilestone(null);
          }}
          onAchieve={handleAchieveMilestone}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

function AchieveMilestoneModal({
  milestone,
  isOpen,
  onClose,
  onAchieve,
  isSubmitting,
}: {
  milestone: MilestoneDefinitionResponse;
  isOpen: boolean;
  onClose: () => void;
  onAchieve: (milestoneId: string, date: Date, notes?: string) => void;
  isSubmitting: boolean;
}) {
  // Use lazy initialization to avoid hydration mismatch
  const [date, setDate] = useState(() => {
    // Return empty string on server, will be set on first render on client
    if (typeof window === 'undefined') return '';
    return new Date().toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date) {
      onAchieve(milestone.id, new Date(date), notes.trim() || undefined);
    }
  };

  const config = categoryConfig[milestone.category];

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark as Achieved"
      size="default"
    >
      <div className="space-y-6">
        {/* Milestone Info */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center shadow-sm`}>
            <Icons.Milestone className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-foreground">{milestone.name}</h3>
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">{milestone.description}</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date Achieved
            </label>
            <GlassInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (optional)
            </label>
            <GlassTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special memories or details..."
              rows={3}
              disabled={isSubmitting}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <GlassButton 
              type="button" 
              variant="default" 
              onClick={onClose} 
              className="flex-1" 
              disabled={isSubmitting}
            >
              Cancel
            </GlassButton>
            <GlassButton 
              type="submit" 
              variant="primary" 
              className="flex-1 gap-2" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icons.Check className="w-4 h-4" />
              )}
              {isSubmitting ? "Saving..." : "Mark Achieved"}
            </GlassButton>
          </div>
        </form>
      </div>
    </GlassModal>
  );
}
