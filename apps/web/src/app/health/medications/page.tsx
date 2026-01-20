"use client";

import { MobileContainer } from "@/components/layout/mobile-container";
import { MedicationDashboard } from "@/components/health/medication-dashboard";

export default function MedicationsPage() {
  return (
    <MobileContainer>
      <div className="p-6 pb-32">
        <MedicationDashboard />
      </div>
    </MobileContainer>
  );
}
