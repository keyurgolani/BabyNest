import React from "react";
import { Award, CheckCircle, Clock, Target, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { IconBadge } from "@/components/ui/icon-badge";
import { cn } from "@/lib/utils";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category: "motor" | "cognitive" | "social" | "language";
  status: "achieved" | "upcoming" | "in-progress";
  expectedAge?: string;
  achievedDate?: string;
  tips?: string;
}

interface MilestoneInsightsProps {
  milestones: Milestone[];
  babyAgeMonths: number;
}

const categoryConfig = {
  motor: {
    emoji: "🏃",
    label: "Motor Skills",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/50",
  },
  cognitive: {
    emoji: "🧠",
    label: "Cognitive",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/50",
  },
  social: {
    emoji: "👋",
    label: "Social",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-900/50",
  },
  language: {
    emoji: "💬",
    label: "Language",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/50",
  },
};

const statusConfig = {
  achieved: {
    icon: CheckCircle,
    label: "Achieved",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
  },
  upcoming: {
    icon: Clock,
    label: "Upcoming",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  "in-progress": {
    icon: Target,
    label: "In Progress",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
};

export function MilestoneInsights({ milestones, babyAgeMonths }: MilestoneInsightsProps) {
  const achieved = milestones.filter((m) => m.status === "achieved");
  const inProgress = milestones.filter((m) => m.status === "in-progress");
  const upcoming = milestones.filter((m) => m.status === "upcoming");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <IconBadge color="memory" icon={Award} size="default" gradient />
        <div>
          <h3 className="font-semibold text-foreground">Milestone Insights</h3>
          <p className="text-xs text-muted-foreground">
            Development tracking for {babyAgeMonths} month{babyAgeMonths !== 1 ? "s" : ""} old
          </p>
        </div>
      </div>

      {/* Progress Summary */}
      <GlassCard size="sm" className="border-0 bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{achieved.length}</div>
            <div className="text-xs text-muted-foreground">Achieved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{inProgress.length}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{upcoming.length}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </div>
        </div>
      </GlassCard>

      {/* In Progress Milestones */}
      {inProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            Working On
          </h4>
          <div className="space-y-2">
            {inProgress.map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Milestones */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Coming Up
          </h4>
          <div className="space-y-2">
            {upcoming.slice(0, 3).map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Achievements */}
      {achieved.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-500" />
            Recent Achievements
          </h4>
          <div className="space-y-2">
            {achieved.slice(0, 3).map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const category = categoryConfig[milestone.category];
  const status = statusConfig[milestone.status];
  const StatusIcon = status.icon;

  return (
    <GlassCard size="sm" className={cn("border-l-4", status.bg, status.border)}>
      <div className="flex items-start gap-3">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 backdrop-blur-sm", category.bg)}>
          {category.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="font-medium text-sm text-foreground">{milestone.title}</h5>
            <StatusIcon className={cn("w-3.5 h-3.5", status.color)} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-xs font-medium", category.color)}>{category.label}</span>
            {milestone.expectedAge && (
              <span className="text-xs text-muted-foreground">• Expected: {milestone.expectedAge}</span>
            )}
            {milestone.achievedDate && (
              <span className="text-xs text-green-600 dark:text-green-400">
                • Achieved: {new Date(milestone.achievedDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {milestone.tips && (
            <p className="text-xs text-muted-foreground mt-2 p-2 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm">
              💡 {milestone.tips}
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
