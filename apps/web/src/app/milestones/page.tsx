"use client";

import { useState, useEffect, useCallback } from "react";

import { Icons } from "@/components/icons";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  api,
  MilestoneCategory,
  MilestoneDefinitionResponse,
  MilestonesByCategoryResponse,
  MilestoneWithStatus,
  CreateMilestoneDto,
} from "@/lib/api-client";

const categoryConfig: Record<MilestoneCategory, { label: string; color: string; bgColor: string; iconBg: string }> = {
  motor: { 
    label: "Motor", 
    color: "text-blue-500 dark:text-blue-400", 
    bgColor: "bg-blue-100 dark:bg-blue-950/50",
    iconBg: "bg-blue-100 dark:bg-blue-950/50"
  },
  cognitive: { 
    label: "Cognitive", 
    color: "text-purple-500 dark:text-purple-400", 
    bgColor: "bg-purple-100 dark:bg-purple-950/50",
    iconBg: "bg-purple-100 dark:bg-purple-950/50"
  },
  social: { 
    label: "Social", 
    color: "text-pink-500 dark:text-pink-400", 
    bgColor: "bg-pink-100 dark:bg-pink-950/50",
    iconBg: "bg-pink-100 dark:bg-pink-950/50"
  },
  language: { 
    label: "Language", 
    color: "text-green-500 dark:text-green-400", 
    bgColor: "bg-green-100 dark:bg-green-950/50",
    iconBg: "bg-green-100 dark:bg-green-950/50"
  },
};

export default function MilestonesPage() {
  const [milestonesData, setMilestonesData] = useState<MilestonesByCategoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<MilestoneCategory | "all">("all");
  const [showAchieveModal, setShowAchieveModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneDefinitionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: (MilestoneCategory | "all")[] = ["all", "motor", "cognitive", "social", "language"];

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
      <MobileContainer>
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading milestones...</p>
          </div>
        </div>
      </MobileContainer>
    );
  }

  if (error) {
    return (
      <MobileContainer>
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4 text-center">
            <Icons.Close className="w-12 h-12 text-red-500" />
            <p className="text-red-500 font-medium">{error}</p>
            <Button onClick={fetchMilestones} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </MobileContainer>
    );
  }

  const filteredMilestones = getFilteredMilestones();

  return (
    <MobileContainer>
      <div className="p-6 space-y-6 animate-slide-up">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <Icons.Milestone className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-bold text-foreground">Milestones</h1>
            <p className="text-muted-foreground text-sm">Track development progress</p>
          </div>
        </div>

        {/* Progress Summary */}
        <Card variant="aurora-static" className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Icons.Milestone className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-heading font-semibold text-foreground">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {achievedCount} of {totalMilestones} achieved
                  </span>
                </div>
                <div className="w-full h-3 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                    style={{ width: `${totalMilestones > 0 ? (achievedCount / totalMilestones) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Stats */}
        {milestonesData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(categoryConfig) as MilestoneCategory[]).map((category) => {
              const categoryMilestones = milestonesData[category] || [];
              const categoryAchieved = categoryMilestones.filter((m) => m.isAchieved).length;
              const config = categoryConfig[category];
              return (
                <Card 
                  key={category} 
                  variant="glass" 
                  className={`p-4 ${config.bgColor} border-0 hover:scale-[1.02] transition-transform duration-200`}
                >
                  <div className="flex flex-col items-center text-center">
                    <span className={`text-2xl font-heading font-bold ${config.color}`}>
                      {categoryAchieved}/{categoryMilestones.length}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">{config.label}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 bg-muted/50 rounded-xl p-1.5 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap focus-ring ${
                activeCategory === category
                  ? "bg-background text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {category === "all" ? "All" : categoryConfig[category].label}
            </button>
          ))}
        </div>

        {/* Milestones List */}
        <div className="flex flex-col gap-3">
          {filteredMilestones.map((milestone, index) => {
            const config = categoryConfig[milestone.definition.category];
            const status = milestone.isAchieved ? "achieved" : milestone.isDelayed ? "delayed" : "upcoming";

            return (
              <Card
                key={milestone.definition.id}
                variant="default"
                className={`p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                  milestone.isAchieved ? "border-l-4 border-l-green-500 dark:border-l-green-400" : ""
                } ${status === "delayed" ? "border-l-4 border-l-amber-500 dark:border-l-amber-400" : ""}`}
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
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
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
                      <p className="text-sm text-muted-foreground mt-2 italic bg-muted/30 rounded-lg px-3 py-2">
                        &quot;{milestone.achievement.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Achieve Milestone Modal */}
        {showAchieveModal && selectedMilestone && (
          <AchieveMilestoneModal
            key={selectedMilestone.id}
            milestone={selectedMilestone}
            onClose={() => {
              setShowAchieveModal(false);
              setSelectedMilestone(null);
            }}
            onAchieve={handleAchieveMilestone}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </MobileContainer>
  );
}

function AchieveMilestoneModal({
  milestone,
  onClose,
  onAchieve,
  isSubmitting,
}: {
  milestone: MilestoneDefinitionResponse;
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card variant="default" className="w-full max-w-md p-6 animate-scale-in shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-foreground">Mark as Achieved</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors focus-ring"
            disabled={isSubmitting}
          >
            <Icons.Close className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center shadow-sm`}>
              <Icons.Milestone className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground">{milestone.name}</h3>
              <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{milestone.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date Achieved
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-muted-foreground/10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special memories or details..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-muted-foreground/10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-all"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="glow" className="flex-1 gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icons.Check className="w-4 h-4" />
              )}
              {isSubmitting ? "Saving..." : "Mark Achieved"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
