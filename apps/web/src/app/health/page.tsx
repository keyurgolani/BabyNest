"use client";

import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { IconBadge } from "@/components/ui/icon-badge";
import { VaccinationScheduleCard } from "@/components/health/VaccinationScheduleCard";
import { 
  Pill, 
  Syringe, 
  Stethoscope, 
  Thermometer, 
  ChevronRight,
  Heart,
  Plus,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * Health Page - Glassmorphism Redesign
 * 
 * Requirements:
 * - 24.2: Display summary cards for symptoms, medications, and vaccinations
 * - Uses GlassCard styling
 * - Uses PageHeader component
 */

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Health category configuration for summary cards - Requirement 24.2
// Using darker gradient backgrounds for better text contrast in dark mode
const healthCategories = [
  {
    title: "Symptoms",
    description: "Track symptoms and temperature",
    icon: Thermometer,
    href: "/log/symptom",
    color: "health" as const,
    bgGradient: "from-rose-100/80 to-pink-100/60 dark:from-rose-900/80 dark:to-pink-900/60",
  },
  {
    title: "Medications",
    description: "Track and manage medication schedules",
    icon: Pill,
    href: "/health/medications",
    color: "nursing" as const,
    bgGradient: "from-pink-100/80 to-purple-100/60 dark:from-pink-900/80 dark:to-purple-900/60",
  },
  {
    title: "Vaccinations",
    description: "View vaccination history",
    icon: Syringe,
    href: "/log/vaccination",
    color: "activity" as const,
    bgGradient: "from-cyan-100/80 to-teal-100/60 dark:from-cyan-900/80 dark:to-teal-900/60",
  },
  {
    title: "Doctor Visits",
    description: "Log and track appointments",
    icon: Stethoscope,
    href: "/log/doctor-visit",
    color: "sleep" as const,
    bgGradient: "from-indigo-100/80 to-blue-100/60 dark:from-indigo-900/80 dark:to-blue-900/60",
  },
];

// Quick action items
const quickActions = [
  {
    title: "Log Temperature",
    icon: Thermometer,
    href: "/log/temperature",
    iconColor: "text-amber-500",
  },
  {
    title: "Add Medication",
    icon: Pill,
    href: "/log/medication",
    iconColor: "text-pink-500",
  },
  {
    title: "Log Doctor Visit",
    icon: Stethoscope,
    href: "/log/doctor-visit",
    iconColor: "text-indigo-500",
  },
  {
    title: "Log Symptom",
    icon: AlertCircle,
    href: "/log/symptom",
    iconColor: "text-rose-500",
  },
];

export default function HealthPage() {
  const handleLogVaccination = (vaccineName: string) => {
    // Navigate to vaccination log page with pre-filled vaccine name
    window.location.href = `/log/vaccination?vaccine=${encodeURIComponent(vaccineName)}`;
  };

  return (
    <main className="flex flex-col gap-6 p-4 pt-6 pb-32">
      {/* Page Header with glassmorphism styling */}
      <PageHeader 
        title="Health" 
        subtitle="Track medications, vaccinations & more"
        action={
          <Link href="/log/symptom">
            <GlassButton variant="primary" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Log</span>
            </GlassButton>
          </Link>
        }
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >
        {/* Summary Cards Grid - Requirement 24.2: symptoms, medications, vaccinations */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {healthCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.title} href={category.href}>
                  <GlassCard 
                    interactive 
                    className={cn(
                      "h-full relative overflow-hidden",
                      "bg-gradient-to-br",
                      category.bgGradient
                    )}
                  >
                    {/* Background decoration */}
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <Icon className="w-24 h-24" />
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <IconBadge 
                        icon={Icon} 
                        color={category.color} 
                        size="default"
                        className="mb-3"
                      />
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">
                        {category.title}
                      </h3>
                      <p className="text-xs text-foreground/80 dark:text-muted-foreground mt-1 line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Vaccination Schedule Card - Part of Requirement 24.2 */}
        <motion.div variants={itemVariants}>
          <VaccinationScheduleCard onLogVaccination={handleLogVaccination} />
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Quick Actions</h3>
                <p className="text-xs text-foreground/80 dark:text-muted-foreground">Log health activities</p>
              </div>
            </div>
            
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href}>
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-xl",
                      "hover:bg-white/10 dark:hover:bg-white/5",
                      "transition-all duration-200",
                      "touch-target"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center",
                          "bg-white/10 dark:bg-white/5 backdrop-blur-sm"
                        )}>
                          <Icon className={cn("w-4 h-4", action.iconColor)} />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {action.title}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Health Tips Card */}
        <motion.div variants={itemVariants}>
          <GlassCard variant="featured" size="sm">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Health Tracking Tip</p>
                <p className="text-xs text-foreground/80 dark:text-muted-foreground">
                  Regular tracking of symptoms and medications helps identify patterns 
                  and provides valuable information for healthcare providers.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </main>
  );
}
