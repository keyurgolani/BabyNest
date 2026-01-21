"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Pill, Syringe, Apple, Stethoscope, Moon, Baby, Droplets } from "lucide-react";

const actions = [
  {
    href: "/log/sleep",
    label: "Sleep",
    icon: Moon,
    color: "text-[#5A9AB8] dark:text-[#7EB8DA]",
    bg: "bg-gradient-to-br from-[#EDF7FA] to-[#D6EEFA] dark:from-[#263540] dark:to-[#162530]",
    borderColor: "border-[#C4E0ED]/50 dark:border-[#3A5060]",
    glow: "shadow-[0_4px_16px_rgba(90,154,184,0.2),0_0_25px_rgba(90,154,184,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(90,154,184,0.3),0_0_40px_rgba(90,154,184,0.25)]",
  },
  {
    href: "/log/diaper",
    label: "Diaper",
    icon: Baby,
    color: "text-[#6BA87A] dark:text-[#A8D5BA]",
    bg: "bg-gradient-to-br from-[#F0FAF3] to-[#DCEEE3] dark:from-[#263D2E] dark:to-[#162D1E]",
    borderColor: "border-[#C4E4CE]/50 dark:border-[#3A5A45]",
    glow: "shadow-[0_4px_16px_rgba(107,168,122,0.2),0_0_25px_rgba(107,168,122,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(107,168,122,0.3),0_0_40px_rgba(107,168,122,0.25)]",
  },
  {
    href: "/log/feed",
    label: "Feed",
    icon: Droplets,
    color: "text-[#C97B8B] dark:text-[#E8959A]",
    bg: "bg-gradient-to-br from-[#FFF5F7] to-[#FFE8EC] dark:from-[#3D2A2E] dark:to-[#2D1A1E]",
    borderColor: "border-[#F4D4D8]/50 dark:border-[#5A3540]",
    glow: "shadow-[0_4px_16px_rgba(201,123,139,0.2),0_0_25px_rgba(201,123,139,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(201,123,139,0.3),0_0_40px_rgba(201,123,139,0.25)]",
  },
  {
    href: "/log/medication",
    label: "Medicine",
    icon: Pill,
    color: "text-[#9B7BB0] dark:text-[#D4C5E2]",
    bg: "bg-gradient-to-br from-[#F8F5FA] to-[#EDE6F5] dark:from-[#332840] dark:to-[#231830]",
    borderColor: "border-[#E0D4E8]/50 dark:border-[#4A3D5C]",
    glow: "shadow-[0_4px_16px_rgba(155,123,176,0.2),0_0_25px_rgba(155,123,176,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(155,123,176,0.3),0_0_40px_rgba(155,123,176,0.25)]",
  },
  {
    href: "/log/feed?type=solid",
    label: "Solids",
    icon: Apple,
    color: "text-[#7BAF8E] dark:text-[#A8D5BA]",
    bg: "bg-gradient-to-br from-[#F3FAF5] to-[#DFEEE5] dark:from-[#2A3D30] dark:to-[#1A2D20]",
    borderColor: "border-[#D0E8D8]/50 dark:border-[#405A48]",
    glow: "shadow-[0_4px_16px_rgba(123,175,142,0.2),0_0_25px_rgba(123,175,142,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(123,175,142,0.3),0_0_40px_rgba(123,175,142,0.25)]",
  },
  {
    href: "/log/vaccination",
    label: "Vaccine",
    icon: Syringe,
    color: "text-[#5A9AB8] dark:text-[#7EB8DA]",
    bg: "bg-gradient-to-br from-[#EDF7FA] to-[#D6EEFA] dark:from-[#263540] dark:to-[#162530]",
    borderColor: "border-[#C4E0ED]/50 dark:border-[#3A5060]",
    glow: "shadow-[0_4px_16px_rgba(90,154,184,0.2),0_0_25px_rgba(90,154,184,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(90,154,184,0.3),0_0_40px_rgba(90,154,184,0.25)]",
  },
  {
    href: "/log/doctor-visit",
    label: "Doctor",
    icon: Stethoscope,
    color: "text-[#9B7BB0] dark:text-[#B8A5CC]",
    bg: "bg-gradient-to-br from-[#F8F5FA] to-[#EDE6F5] dark:from-[#332840] dark:to-[#231830]",
    borderColor: "border-[#E0D4E8]/50 dark:border-[#4A3D5C]",
    glow: "shadow-[0_4px_16px_rgba(155,123,176,0.2),0_0_25px_rgba(155,123,176,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(155,123,176,0.3),0_0_40px_rgba(155,123,176,0.25)]",
  },
];

export function QuickActionsCard() {
  return (
    <div className="space-y-3 px-1">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Quick Log
      </h2>
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3 p-1 -m-1">
        {actions.map((action) => (
          <Link key={action.label} href={action.href} className="group">
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1 md:gap-1.5 p-2 md:p-3 rounded-xl border-2 transition-all duration-300",
                action.bg,
                action.borderColor,
                action.glow,
                action.hoverGlow,
                "hover:scale-105 hover:-translate-y-0.5 active:scale-95"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center bg-white/80 dark:bg-black/30 backdrop-blur-sm transition-all duration-300",
                  action.color,
                  "group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-black/40"
                )}
              >
                <action.icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
              </div>
              <span className={cn("font-semibold text-[10px] md:text-xs", action.color)}>
                {action.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
