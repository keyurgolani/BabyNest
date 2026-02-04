"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Pill, Syringe, Apple, Stethoscope, Moon, Baby, Droplets, type LucideIcon } from "lucide-react";
import { IconBadge, type ActivityColor } from "@/components/ui/icon-badge";
import { GlassCard } from "@/components/ui/glass-card";

/**
 * QuickActionsCard Component
 *
 * Displays quick action buttons for logging baby activities using IconBadge components.
 * Each action uses the appropriate activity color from the design system.
 *
 * @requirement 12.4 - Dashboard SHALL display quick action buttons using IconBadge components
 */

interface QuickAction {
  href: string;
  label: string;
  icon: LucideIcon;
  color: ActivityColor;
}

const actions: QuickAction[] = [
  {
    href: "/log/sleep",
    label: "Sleep",
    icon: Moon,
    color: "sleep",
  },
  {
    href: "/log/diaper",
    label: "Diaper",
    icon: Baby,
    color: "diaper",
  },
  {
    href: "/log/feed",
    label: "Feed",
    icon: Droplets,
    color: "feed",
  },
  {
    href: "/log/medication",
    label: "Medicine",
    icon: Pill,
    color: "health",
  },
  {
    href: "/log/feed?type=solid",
    label: "Solids",
    icon: Apple,
    color: "growth",
  },
  {
    href: "/log/vaccination",
    label: "Vaccine",
    icon: Syringe,
    color: "activity",
  },
  {
    href: "/log/doctor-visit",
    label: "Doctor",
    icon: Stethoscope,
    color: "health",
  },
];

export function QuickActionsCard() {
  return (
    <div className="space-y-3 px-1">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Quick Log
      </h2>
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
        {actions.map((action) => (
          <Link key={action.label} href={action.href} className="group">
            <GlassCard
              size="sm"
              interactive
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 md:gap-2",
                "p-2 md:p-3",
                "min-h-[72px] md:min-h-[88px]"
              )}
            >
              <IconBadge
                icon={action.icon}
                color={action.color}
                size="default"
                gradient
                className="transition-transform duration-200 group-hover:scale-110"
              />
              <span className="font-semibold text-[10px] md:text-xs text-foreground group-hover:text-foreground/90 transition-colors">
                {action.label}
              </span>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
