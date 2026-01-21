"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Pill, Syringe, Apple, Stethoscope, Bed, Thermometer, Scale } from "lucide-react";

// Custom SVG icon for diaper
const DiaperIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12c0-3 2-5 4-5h8c2 0 4 2 4 5v3c0 2-2 4-4 4H8c-2 0-4-2-4-4v-3z" />
    <path d="M8 7v10M16 7v10" />
  </svg>
);

// Custom SVG icon for breastfeeding - exact from Breast Vector Icon (1).svg
const BreastfeedIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512.001 512.001" fill="currentColor">
    <g>
      <g>
        <path d="M492.989,356.001c0-8.051-6.527-14.577-14.578-14.577H355.557c0.968-2.257,1.266-4.77,0.779-7.23l-7.018-35.457c-20.14,8.873-18.9,8.37-20.95,9.1c8.731,8.876,14.123,21.048,14.123,34.482c0,5.49,0,42.299,0,55.608h75.456v109.155c0,2.716,2.202,4.919,4.919,4.919h30.739c2.717,0,4.919-2.202,4.919-4.919V397.928h19.888c8.051,0,14.578-6.527,14.578-14.577v-27.349H492.989z"/>
      </g>
    </g>
    <g>
      <g>
        <path d="M257.078,278.959c-18.835,6.481-21.333,7.814-28.035,7.814c-16.724,0-30.536-12.95-31.781-29.476l-19.576-4.732l-16.156,81.628c-0.487,2.46-0.187,4.974,0.785,7.23H33.59c-8.051,0-14.578,6.527-14.578,14.577v27.347c0,8.051,6.527,14.577,14.578,14.577h19.888v109.155c0,2.716,2.202,4.919,4.919,4.919h30.739c2.717,0,4.919-2.202,4.919-4.919V397.924h85.265c0-13.602,0-49.595,0-55.608c0-17.438,9.084-32.746,22.77-41.479c7.632-4.871,16.689-7.705,26.413-7.705c11.806,0,23.253,4.174,32.404,12.2c3.388-2.97,7.075-5.458,11.505-7.543L257.078,278.959z"/>
      </g>
    </g>
    <g>
      <g>
        <path d="M216.146,261.862c2.576,4.785,7.583,7.698,12.898,7.698c3.112,0,4.344-0.654,12.328-3.401L216.146,261.862z"/>
      </g>
    </g>
    <g>
      <g>
        <path d="M413.638,228.477c-0.491-1.229-9.109-21.92-18.792-43.487c-0.087,0.103-0.167,0.211-0.256,0.314c-8.8,10.292-21.619,16.195-35.167,16.195c-13.053,0-25.925-5.575-34.972-15.988l-23.388-15.348c-6.768-4.441-15.858-2.556-20.298,4.213c-4.442,6.769-2.555,15.856,4.212,20.298l29.239,19.187l-38.608,16.716c-0.355,10.53-5.207,20.68-13.835,27.568l14.374,16.155c-1.31-12.557,3.61-25.19,14.377-32.461c7.126-4.813,15.293-8.007,23.8-9.266l49.721-7.351l-57.714,25.423c-11.225,4.944-16.316,18.051-11.372,29.277c4.949,11.238,18.067,16.311,29.277,11.372l77.735-34.241C412.926,252.229,418.086,239.59,413.638,228.477z M364.047,225.222l0.001-0.003c0,0.001,0.001,0.002,0.001,0.002L364.047,225.222z"/>
      </g>
    </g>
    <g>
      <g>
        <path d="M359.451,126.209c-15.917,0-28.773,12.755-29.047,28.516c-0.285,16.34,12.889,29.561,29.021,29.561c15.906,0,28.773-12.75,29.047-28.516C388.756,139.473,375.628,126.209,359.451,126.209z"/>
      </g>
    </g>
    <g>
      <g>
        <path d="M228.501,315.667c-14.719,0-26.65,11.932-26.65,26.651v142.934c0,14.719,11.931,26.651,26.65,26.651c14.703,0,26.65-11.943,26.65-26.651V342.319C255.151,327.627,243.22,315.667,228.501,315.667z"/>
      </g>
    </g>
    <g>
      <g>
        <path d="M293.309,315.667c-14.719,0-26.651,11.932-26.651,26.651v142.934c0,14.719,11.932,26.651,26.651,26.651c14.719,0,26.651-11.932,26.651-26.651V342.319C319.959,327.599,308.028,315.667,293.309,315.667z"/>
      </g>
    </g>
    <g>
      <g>
        <path d="M359.117,109.003c-9.478-12.535-24.516-20.267-40.52-20.267h-9.212c-12.155,13.713-29.577,21.763-48.24,21.763c-19.18,0-36.419-8.428-48.24-21.764c-22.758,0-39.574,11.866-47.682,28.542c-8.176,16.812-14.691,30.621-35.26,82.625c-4.962,12.553,2.337,26.591,15.435,29.758l88.12,21.301c11.923,2.882,23.923-4.449,26.805-16.368c2.882-11.922-4.447-23.924-16.368-26.805l-63.196-15.276c4.675-11.546,11.455-28.036,16.605-39.355l-5.34,26.976c12.32,2.978,44.976,10.872,55.379,13.387c10.009,2.419,18.063,8.712,22.969,16.898l5.16-1.35c-14.692-9.642-18.8-29.44-9.162-44.129c9.718-14.816,29.506-18.763,44.136-9.165l2.75,1.804C311.907,131.179,332.875,109.192,359.117,109.003z"/>
      </g>
    </g>
    <g>
      <g>
        <circle cx="261.14" cy="46.026" r="46.026"/>
      </g>
    </g>
  </svg>
);

const topActions = [
  {
    href: "/log/sleep",
    label: "Sleep",
    icon: Bed,
    color: "text-[#5A9AB8] dark:text-[#7EB8DA]",
    bg: "bg-gradient-to-br from-[#EDF7FA] to-[#D6EEFA] dark:from-[#263540] dark:to-[#162530]",
    borderColor: "border-[#C4E0ED]/50 dark:border-[#3A5060]",
    glow: "shadow-[0_4px_16px_rgba(90,154,184,0.2),0_0_25px_rgba(90,154,184,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(90,154,184,0.3),0_0_40px_rgba(90,154,184,0.25)]",
  },
  {
    href: "/log/diaper",
    label: "Diaper",
    icon: DiaperIcon,
    color: "text-[#6BA87A] dark:text-[#A8D5BA]",
    bg: "bg-gradient-to-br from-[#F0FAF3] to-[#DCEEE3] dark:from-[#263D2E] dark:to-[#162D1E]",
    borderColor: "border-[#C4E4CE]/50 dark:border-[#3A5A45]",
    glow: "shadow-[0_4px_16px_rgba(107,168,122,0.2),0_0_25px_rgba(107,168,122,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(107,168,122,0.3),0_0_40px_rgba(107,168,122,0.25)]",
  },
  {
    href: "/log/feed",
    label: "Feed",
    icon: BreastfeedIcon,
    color: "text-[#C97B8B] dark:text-[#E8959A]",
    bg: "bg-gradient-to-br from-[#FFF5F7] to-[#FFE8EC] dark:from-[#3D2A2E] dark:to-[#2D1A1E]",
    borderColor: "border-[#F4D4D8]/50 dark:border-[#5A3540]",
    glow: "shadow-[0_4px_16px_rgba(201,123,139,0.2),0_0_25px_rgba(201,123,139,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(201,123,139,0.3),0_0_40px_rgba(201,123,139,0.25)]",
  },
];

const mobileOnlyActions = [
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
  {
    href: "/log/growth",
    label: "Growth",
    icon: Scale,
    color: "text-[#E8A87C] dark:text-[#F4C2A0]",
    bg: "bg-gradient-to-br from-[#FFF8F3] to-[#FFEEE0] dark:from-[#3D2E28] dark:to-[#2D1E18]",
    borderColor: "border-[#F4D8C8]/50 dark:border-[#5A4538]",
    glow: "shadow-[0_4px_16px_rgba(232,168,124,0.2),0_0_25px_rgba(232,168,124,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(232,168,124,0.3),0_0_40px_rgba(232,168,124,0.25)]",
  },
  {
    href: "/log/temperature",
    label: "Temp",
    icon: Thermometer,
    color: "text-[#D97B8B] dark:text-[#F89AAA]",
    bg: "bg-gradient-to-br from-[#FFF5F7] to-[#FFE8EC] dark:from-[#3D2A2E] dark:to-[#2D1A1E]",
    borderColor: "border-[#F4D4D8]/50 dark:border-[#5A3540]",
    glow: "shadow-[0_4px_16px_rgba(217,123,139,0.2),0_0_25px_rgba(217,123,139,0.15)]",
    hoverGlow: "hover:shadow-[0_8px_24px_rgba(217,123,139,0.3),0_0_40px_rgba(217,123,139,0.25)]",
  },
];

export function TopQuickActions() {
  const allActions = [...topActions, ...mobileOnlyActions];
  
  return (
    <div className="flex flex-wrap items-start gap-2 mr-2 md:mr-4 max-w-[200px] md:max-w-none">
      {/* Mobile: Show all actions in a grid */}
      <div className="md:hidden grid grid-cols-3 gap-2">
        {allActions.map((action) => (
          <Link key={action.label} href={action.href} className="group">
            <div
              className={cn(
                "flex items-center justify-center rounded-full transition-all duration-300 border-2",
                "w-9 h-9",
                action.bg,
                action.borderColor,
                action.glow,
                action.hoverGlow,
                "hover:scale-110 active:scale-95"
              )}
              title={action.label}
            >
              <action.icon 
                className={cn(
                  "transition-transform duration-300", 
                  action.color,
                  "w-4 h-4 group-hover:scale-110"
                )} 
                strokeWidth={2.5} 
              />
            </div>
          </Link>
        ))}
      </div>
      
      {/* Desktop: Show only top 3 actions */}
      <div className="hidden md:flex items-center gap-3">
        {topActions.map((action) => (
          <Link key={action.label} href={action.href} className="group">
            <div
              className={cn(
                "flex items-center justify-center rounded-full transition-all duration-300 border-2",
                "w-14 h-14",
                action.bg,
                action.borderColor,
                action.glow,
                action.hoverGlow,
                "hover:scale-110 active:scale-95"
              )}
              title={action.label}
            >
              <action.icon 
                className={cn(
                  "transition-transform duration-300", 
                  action.color,
                  "w-6 h-6 group-hover:scale-110"
                )} 
                strokeWidth={2.5} 
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
