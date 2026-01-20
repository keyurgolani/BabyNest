"use client";

import React from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { VaccinationScheduleCard } from "@/components/health/VaccinationScheduleCard";
import { Pill, Syringe, Stethoscope, Thermometer, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HealthPage() {
  const healthCategories = [
    {
      title: "Medications",
      description: "Track and manage medication schedules",
      icon: Pill,
      href: "/health/medications",
      color: "purple",
      gradient: "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Vaccinations",
      description: "View vaccination history",
      icon: Syringe,
      href: "/log/vaccination",
      color: "teal",
      gradient: "from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30",
      iconBg: "bg-teal-100 dark:bg-teal-900/50",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
    {
      title: "Doctor Visits",
      description: "Log and track appointments",
      icon: Stethoscope,
      href: "/log/doctor-visit",
      color: "blue",
      gradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Symptoms",
      description: "Track symptoms and temperature",
      icon: Thermometer,
      href: "/log/symptom",
      color: "amber",
      gradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  const handleLogVaccination = (vaccineName: string) => {
    // Navigate to vaccination log page with pre-filled vaccine name
    window.location.href = `/log/vaccination?vaccine=${encodeURIComponent(vaccineName)}`;
  };

  return (
    <MobileContainer>
      <div className="p-6 space-y-6 animate-slide-up pb-24">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
            <Icons.Health className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-bold text-foreground">Health</h1>
            <p className="text-muted-foreground text-sm">Track medications, vaccinations & more</p>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 gap-3">
          {healthCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.title} href={category.href}>
                <Card className={cn(
                  "p-4 border-0 h-full hover:shadow-md transition-all duration-300",
                  `bg-gradient-to-br ${category.gradient}`
                )}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", category.iconBg)}>
                    <Icon className={cn("w-5 h-5", category.iconColor)} />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{category.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Vaccination Schedule */}
        <VaccinationScheduleCard onLogVaccination={handleLogVaccination} />

        {/* Quick Links */}
        <Card className="p-4 border-0 bg-muted/30">
          <h3 className="font-semibold text-foreground mb-3 text-sm">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/log/temperature">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Thermometer className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Log Temperature</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/log/medication">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Add Medication</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/log/doctor-visit">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Log Doctor Visit</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </MobileContainer>
  );
}
