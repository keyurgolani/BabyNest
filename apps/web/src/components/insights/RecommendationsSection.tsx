import React from "react";
import { Lightbulb, ExternalLink, Clock, Star, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: "routine" | "health" | "development" | "nutrition" | "sleep";
  priority: "high" | "medium" | "low";
  actionable: boolean;
  learnMoreUrl?: string;
  estimatedTime?: string;
}

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  onLearnMore?: (url: string) => void;
}

const categoryConfig = {
  routine: {
    emoji: "📅",
    label: "Routine",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  health: {
    emoji: "💊",
    label: "Health",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
  development: {
    emoji: "🎯",
    label: "Development",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  nutrition: {
    emoji: "🍼",
    label: "Nutrition",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  sleep: {
    emoji: "😴",
    label: "Sleep",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
  },
};

const priorityConfig = {
  high: {
    icon: Star,
    label: "High Priority",
    color: "text-amber-500",
    fill: "fill-amber-500",
  },
  medium: {
    icon: Star,
    label: "Medium Priority",
    color: "text-gray-400",
    fill: "fill-gray-400",
  },
  low: {
    icon: Star,
    label: "Low Priority",
    color: "text-gray-300",
    fill: "fill-transparent",
  },
};

export function RecommendationsSection({ recommendations, onLearnMore }: RecommendationsSectionProps) {
  // Sort by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Personalized Recommendations</h3>
          <p className="text-xs text-muted-foreground">
            AI-powered tips based on your baby&apos;s data
          </p>
        </div>
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-3">
        {sortedRecommendations.map((rec) => {
          const category = categoryConfig[rec.category];
          const priority = priorityConfig[rec.priority];
          const PriorityIcon = priority.icon;

          return (
            <Card key={rec.id} className="p-4 border-0 bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0", category.bg)}>
                  {category.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-foreground">{rec.title}</h4>
                    <PriorityIcon className={cn("w-3 h-3", priority.color, priority.fill)} />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rec.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", category.bg, category.color)}>
                      {category.label}
                    </span>
                    {rec.estimatedTime && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rec.estimatedTime}
                      </span>
                    )}
                    {rec.learnMoreUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2 text-primary"
                        onClick={() => onLearnMore?.(rec.learnMoreUrl!)}
                      >
                        Learn More
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
