"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Baby, Moon, Utensils, Droplets, Activity, Scale, Camera, 
  Star, Heart, Calendar, TrendingUp, Sparkles, Plus
} from "lucide-react";

type EmptyStateType = 
  | "feeding" 
  | "sleep" 
  | "diaper" 
  | "activity" 
  | "growth" 
  | "memory" 
  | "milestone" 
  | "health" 
  | "calendar" 
  | "insights" 
  | "timeline"
  | "general";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  compact?: boolean;
  className?: string;
}

const EMPTY_STATE_CONFIG: Record<EmptyStateType, {
  icon: typeof Baby;
  defaultTitle: string;
  defaultDescription: string;
  color: string;
  bgColor: string;
}> = {
  feeding: {
    icon: Utensils,
    defaultTitle: "No feedings logged yet",
    defaultDescription: "Start tracking your baby's feeding schedule to see patterns and insights.",
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  sleep: {
    icon: Moon,
    defaultTitle: "No sleep data yet",
    defaultDescription: "Log sleep sessions to track patterns and get personalized recommendations.",
    color: "text-indigo-500",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  diaper: {
    icon: Droplets,
    defaultTitle: "No diaper changes logged",
    defaultDescription: "Track diaper changes to monitor your baby's health and hydration.",
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  activity: {
    icon: Activity,
    defaultTitle: "No activities recorded",
    defaultDescription: "Log tummy time, play sessions, and other activities to track development.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  growth: {
    icon: Scale,
    defaultTitle: "No growth measurements",
    defaultDescription: "Record weight, height, and head circumference to track your baby's growth.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  memory: {
    icon: Camera,
    defaultTitle: "No memories captured",
    defaultDescription: "Save special moments with photos and notes to cherish forever.",
    color: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  milestone: {
    icon: Star,
    defaultTitle: "No milestones recorded",
    defaultDescription: "Track your baby's developmental milestones as they grow.",
    color: "text-pink-500",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  health: {
    icon: Heart,
    defaultTitle: "No health records",
    defaultDescription: "Keep track of symptoms, medications, and doctor visits.",
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  calendar: {
    icon: Calendar,
    defaultTitle: "No entries this month",
    defaultDescription: "Start logging activities to see them on your calendar.",
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  insights: {
    icon: Sparkles,
    defaultTitle: "Not enough data for insights",
    defaultDescription: "Log more activities to unlock AI-powered insights and recommendations.",
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  timeline: {
    icon: TrendingUp,
    defaultTitle: "No recent activity",
    defaultDescription: "Your timeline will show recent logs once you start tracking.",
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-900/30",
  },
  general: {
    icon: Baby,
    defaultTitle: "No data yet",
    defaultDescription: "Start tracking to see your baby's information here.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  compact = false,
  className,
}: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;

  if (compact) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-4 text-center", className)}>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2", config.bgColor)}>
          <Icon className={cn("w-5 h-5", config.color)} />
        </div>
        <p className="text-xs text-muted-foreground">{displayTitle}</p>
        {(actionLabel && (actionHref || onAction)) && (
          actionHref ? (
            <Link href={actionHref}>
              <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={onAction}>
              <Plus className="w-3 h-3 mr-1" />
              {actionLabel}
            </Button>
          )
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-8 px-4 text-center", className)}>
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4", config.bgColor)}>
        <Icon className={cn("w-8 h-8", config.color)} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{displayTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{displayDescription}</p>
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Link href={actionHref}>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button size="sm" className="gap-1" onClick={onAction}>
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}

// Welcome state for new users with no data at all
interface WelcomeStateProps {
  babyName?: string;
  className?: string;
}

export function WelcomeState({ babyName = "your baby", className }: WelcomeStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
        <Baby className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Welcome to BabyNest! 👋</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Start tracking {babyName}&apos;s daily activities to unlock insights, patterns, and personalized recommendations.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/quick-log/feeding">
          <Button variant="outline" size="sm" className="gap-1">
            <Utensils className="w-4 h-4" />
            Log Feeding
          </Button>
        </Link>
        <Link href="/quick-log/sleep">
          <Button variant="outline" size="sm" className="gap-1">
            <Moon className="w-4 h-4" />
            Log Sleep
          </Button>
        </Link>
        <Link href="/quick-log/diaper">
          <Button variant="outline" size="sm" className="gap-1">
            <Droplets className="w-4 h-4" />
            Log Diaper
          </Button>
        </Link>
      </div>
    </div>
  );
}
