"use client";

import { MobileContainer } from "@/components/layout/mobile-container";
import { CaregiversManagementPage } from "@/components/settings/caregivers-management-page";

export default function CaregiversPage() {
  return (
    <MobileContainer>
      <div className="p-6 pb-32">
        <CaregiversManagementPage />
      </div>
    </MobileContainer>
  );
}
