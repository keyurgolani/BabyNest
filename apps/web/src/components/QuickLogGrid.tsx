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
      colorVar: "--color-feed",
    },
    {
      href: "/log/sleep",
      label: "Sleep",
      icon: Moon,
      colorVar: "--color-sleep",
    },
    {
      href: "/log/diaper",
      label: "Diaper",
      icon: Baby,
      colorVar: "--color-diaper",
    },
    {
      href: "/log/feed?type=pumping",
      label: "Pump",
      icon: Droplets,
      colorVar: "--color-tummy",
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mt-6">
      {actions.map((action) => (
        <Link key={action.label} href={action.href} className="group">
          <div 
            className={cn(
              "flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-300",
              "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 card-hover"
            )}
            style={{
              backgroundColor: `color-mix(in srgb, var(${action.colorVar}) 10%, transparent)`,
              borderColor: `color-mix(in srgb, var(${action.colorVar}) 25%, transparent)`,
            }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/60 dark:bg-black/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
              style={{ color: `var(${action.colorVar})` }}
            >
              <action.icon className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span 
              className="font-bold text-base"
              style={{ color: `var(${action.colorVar})` }}
            >
              {action.label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
