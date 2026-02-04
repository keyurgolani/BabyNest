import React, { useState } from "react";
import { AlertTriangle, AlertCircle, Info, X, CheckCircle, ChevronRight, Shield } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { IconBadge } from "@/components/ui/icon-badge";
import { cn } from "@/lib/utils";

export type AlertSeverity = "info" | "warning" | "critical";

export interface HealthAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
  category: string;
  timestamp: string;
  dismissed?: boolean;
}

interface AlertsSectionProps {
  alerts: HealthAlert[];
  onDismiss?: (id: string) => void;
  onMarkAddressed?: (id: string) => void;
}

const severityConfig = {
  info: {
    icon: Info,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500 dark:text-blue-400",
    titleColor: "text-blue-900 dark:text-blue-100",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500 dark:text-amber-400",
    titleColor: "text-amber-900 dark:text-amber-100",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  critical: {
    icon: AlertTriangle,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    iconColor: "text-red-500 dark:text-red-400",
    titleColor: "text-red-900 dark:text-red-100",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
};

export function AlertsSection({ alerts, onDismiss, onMarkAddressed }: AlertsSectionProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter((alert) => !dismissedIds.has(alert.id) && !alert.dismissed);
  const criticalCount = visibleAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = visibleAlerts.filter((a) => a.severity === "warning").length;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    onDismiss?.(id);
  };

  const handleMarkAddressed = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    onMarkAddressed?.(id);
  };

  if (visibleAlerts.length === 0) {
    return (
      <GlassCard className="border-0 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/30 dark:to-emerald-950/30">
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1">All Clear!</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            No health concerns detected. Your baby&apos;s patterns look healthy and consistent.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconBadge color="health" icon={AlertTriangle} size="default" gradient />
          <div>
            <h3 className="font-semibold text-foreground">Health Alerts</h3>
            <p className="text-xs text-muted-foreground">
              {criticalCount > 0 && <span className="text-red-600 dark:text-red-400 font-medium">{criticalCount} critical</span>}
              {criticalCount > 0 && warningCount > 0 && " · "}
              {warningCount > 0 && <span className="text-amber-600 dark:text-amber-400 font-medium">{warningCount} warnings</span>}
              {criticalCount === 0 && warningCount === 0 && `${visibleAlerts.length} notifications`}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {visibleAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <GlassCard
              key={alert.id}
              size="sm"
              className={cn(
                "border-l-4 transition-all duration-200",
                config.bg,
                config.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5", config.iconColor)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={cn("font-semibold text-sm", config.titleColor)}>
                          {alert.title}
                        </h4>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", config.badge)}>
                          {alert.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 min-h-[48px] min-w-[48px] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {alert.recommendation && (
                    <div className="mt-3 p-3 bg-white/30 dark:bg-black/20 rounded-xl backdrop-blur-sm">
                      <div className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <span className="font-medium text-foreground">Recommendation:</span>{" "}
                          {alert.recommendation}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <GlassButton
                      size="sm"
                      variant="default"
                      onClick={() => handleMarkAddressed(alert.id)}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Mark as Addressed
                    </GlassButton>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
