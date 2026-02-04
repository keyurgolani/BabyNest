import React from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface PatternCardProps {
  title: string;
  icon: LucideIcon;
  value: string;
  subtitle: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  color: "indigo" | "orange" | "emerald" | "pink" | "blue" | "purple";
  details?: { label: string; value: string }[];
}

const colorClasses = {
  indigo: {
    bg: "from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30",
    icon: "text-indigo-500 dark:text-indigo-400",
    label: "text-indigo-600 dark:text-indigo-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      stable: "text-gray-600 dark:text-gray-400",
    },
  },
  orange: {
    bg: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
    icon: "text-orange-500 dark:text-orange-400",
    label: "text-orange-600 dark:text-orange-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      stable: "text-gray-600 dark:text-gray-400",
    },
  },
  emerald: {
    bg: "from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
    icon: "text-emerald-500 dark:text-emerald-400",
    label: "text-emerald-600 dark:text-emerald-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      stable: "text-gray-600 dark:text-gray-400",
    },
  },
  pink: {
    bg: "from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30",
    icon: "text-pink-500 dark:text-pink-400",
    label: "text-pink-600 dark:text-pink-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      stable: "text-gray-600 dark:text-gray-400",
    },
  },
  blue: {
    bg: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
    icon: "text-blue-500 dark:text-blue-400",
    label: "text-blue-600 dark:text-blue-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      stable: "text-gray-600 dark:text-gray-400",
    },
  },
  purple: {
    bg: "from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
    icon: "text-purple-500 dark:text-purple-400",
    label: "text-purple-600 dark:text-purple-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      stable: "text-gray-600 dark:text-gray-400",
    },
  },
};

export function PatternCard({
  title,
  icon: Icon,
  value,
  subtitle,
  trend,
  trendValue,
  color,
  details,
}: PatternCardProps) {
  const colors = colorClasses[color];
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <GlassCard size="sm" className={cn("border-0 bg-gradient-to-br", colors.bg)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", colors.icon)} />
        <span className={cn("text-xs font-medium", colors.label)}>{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {trend && trendValue && (
          <div className={cn("flex items-center gap-0.5 text-xs font-medium", colors.trend[trend])}>
            <TrendIcon className="w-3 h-3" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      
      {details && details.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/20 dark:border-white/10 space-y-1">
          {details.map((detail, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{detail.label}</span>
              <span className="font-medium text-foreground">{detail.value}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
