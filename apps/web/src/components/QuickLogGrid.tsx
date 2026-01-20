"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Baby, Moon, Utensils, Droplets } from "lucide-react";

export function QuickLogGrid() {
  const actions = [
    {
      href: "/log/feed?type=bottle",
      label: "Feed",
      icon: Utensils,
      color: "text-[#F4A261]", // Using --color-feed
      bg: "bg-[#F4A261]/10",
      borderColor: "border-[#F4A261]/20",
      hoverGlow: "hover:shadow-[0_0_20px_rgba(244,162,97,0.15)]"
    },
    {
      href: "/log/sleep",
      label: "Sleep",
      icon: Moon,
      color: "text-[#A8DADC]", // Using --color-sleep
      bg: "bg-[#A8DADC]/10",
      borderColor: "border-[#A8DADC]/20",
      hoverGlow: "hover:shadow-[0_0_20px_rgba(168,218,220,0.15)]"
    },
    {
      href: "/log/diaper",
      label: "Diaper",
      icon: Baby,
      color: "text-[#A7C957]", // Using --color-diaper
      bg: "bg-[#A7C957]/10",
      borderColor: "border-[#A7C957]/20",
      hoverGlow: "hover:shadow-[0_0_20px_rgba(167,201,87,0.15)]"
    },
    {
      href: "/log/feed?type=pumping",
      label: "Pump",
      icon: Droplets,
      color: "text-[#F28482]", // Using --color-tummy (pink/coral)
      bg: "bg-[#F28482]/10",
      borderColor: "border-[#F28482]/20",
      hoverGlow: "hover:shadow-[0_0_20px_rgba(242,132,130,0.15)]"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mt-6">
      {actions.map((action) => (
        <Link key={action.label} href={action.href} className="group">
          <div className={cn(
            "flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-300",
             action.bg,
             action.borderColor,
             action.hoverGlow,
             "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 card-hover"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center bg-white/60 dark:bg-black/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110",
              action.color
            )}>
              <action.icon className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className={cn(
              "font-bold text-base",
              action.color
            )}>
              {action.label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
