"use client";

import { PageHeader } from "@/components/ui/page-header";
import { GlassButton } from "@/components/ui/glass-button";
import { MedicationDashboard } from "@/components/health/medication-dashboard";
import { Plus } from "lucide-react";
import Link from "next/link";

/**
 * Medications Page - Glassmorphism Redesign
 * 
 * Requirements:
 * - 24.2: Display medications tracker page
 * - Uses GlassCard, GlassButton components
 * - Uses PageHeader component with back navigation
 */
export default function MedicationsPage() {
  return (
    <main className="flex flex-col gap-6 p-4 pt-6 pb-32">
      {/* Page Header with glassmorphism styling and back navigation */}
      <PageHeader 
        title="Medications" 
        subtitle="Track and manage medication schedules"
        backHref="/health"
        action={
          <Link href="/health/medications/new">
            <GlassButton variant="primary" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </GlassButton>
          </Link>
        }
      />

      {/* Medication Dashboard with glassmorphism styling */}
      <MedicationDashboard />
    </main>
  );
}
