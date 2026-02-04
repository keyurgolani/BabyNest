import { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { IconBadge, ActivityColor } from "@/components/ui/icon-badge";
import { cn } from "@/lib/utils";

/**
 * InsightCard Component
 * 
 * A glassmorphism-styled card for displaying AI insights and analytics.
 * Uses GlassCard for consistent glassmorphism styling across the insights section.
 * 
 * @requirements 24.4 - AI insight cards for anomalies, patterns, and recommendations
 */

type InsightCardVariant = "default" | "featured" | "flat" | "danger";

interface InsightCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  variant?: InsightCardVariant;
  iconColor?: ActivityColor;
  iconClassName?: string;
  interactive?: boolean;
}

export function InsightCard({ 
  title, 
  icon: Icon, 
  children, 
  className = "",
  variant = "default",
  iconColor = "activity",
  iconClassName,
  interactive = false,
}: InsightCardProps) {
  return (
    <GlassCard 
      variant={variant} 
      className={cn("overflow-hidden", className)}
      interactive={interactive}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          iconClassName ? (
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-colors",
              iconClassName
            )}>
              <Icon size={20} />
            </div>
          ) : (
            <IconBadge color={iconColor} icon={Icon} size="default" gradient />
          )
        )}
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
      </div>
      {/* Content */}
      <div>
        {children}
      </div>
    </GlassCard>
  );
}
