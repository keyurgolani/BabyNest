"use client";

/**
 * Lazy-Loaded Modal Components
 *
 * Heavy modal components that are lazy-loaded to improve initial page load.
 * Modals are only loaded when they're about to be opened.
 *
 * @requirements 21.2 - Lazy load heavy components to improve initial load time
 */

import dynamic from "next/dynamic";
import React from "react";
import { ModalContentSkeleton, GlassSkeleton } from "@/components/ui/lazy-loading";
import { GlassCard } from "@/components/ui/glass-card";

// ============================================================================
// Modal Loading Skeletons
// ============================================================================

/**
 * Settings modal content skeleton
 */
export function SettingsModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-2">
        <GlassSkeleton className="h-5 w-32" />
        <GlassSkeleton className="h-3 w-48" />
      </div>
      {/* Form fields */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <GlassSkeleton className="h-4 w-24" />
            <GlassSkeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      {/* Toggle switches */}
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <GlassSkeleton className="h-4 w-28" />
              <GlassSkeleton className="h-3 w-40" />
            </div>
            <GlassSkeleton className="h-6 w-10 rounded-full" />
          </div>
        ))}
      </div>
      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <GlassSkeleton className="h-12 flex-1 rounded-xl" />
        <GlassSkeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Profile edit modal skeleton
 */
export function ProfileEditModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <div className="flex flex-col items-center gap-4">
        <GlassSkeleton className="w-24 h-24 rounded-full" />
        <GlassSkeleton className="h-8 w-32 rounded-lg" />
      </div>
      {/* Form fields */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <GlassSkeleton className="h-4 w-20" />
            <GlassSkeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <GlassSkeleton className="h-12 flex-1 rounded-xl" />
        <GlassSkeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Caregiver invite modal skeleton
 */
export function CaregiverInviteModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <GlassSkeleton className="w-16 h-16 rounded-2xl mx-auto" />
        <GlassSkeleton className="h-5 w-40 mx-auto" />
        <GlassSkeleton className="h-3 w-56 mx-auto" />
      </div>
      {/* Form fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <GlassSkeleton className="h-4 w-24" />
          <GlassSkeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <GlassSkeleton className="h-4 w-16" />
          <GlassSkeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
      {/* Action button */}
      <GlassSkeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

/**
 * Data management modal skeleton
 */
export function DataManagementModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <GlassCard variant="danger" size="sm">
        <div className="flex items-start gap-3">
          <GlassSkeleton className="w-6 h-6 rounded flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <GlassSkeleton className="h-4 w-32" />
            <GlassSkeleton className="h-3 w-full" />
          </div>
        </div>
      </GlassCard>
      {/* Options */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <GlassCard key={i} interactive>
            <div className="flex items-center gap-3">
              <GlassSkeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-1">
                <GlassSkeleton className="h-4 w-28" />
                <GlassSkeleton className="h-3 w-40" />
              </div>
              <GlassSkeleton className="w-5 h-5 rounded" />
            </div>
          </GlassCard>
        ))}
      </div>
      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <GlassSkeleton className="h-12 flex-1 rounded-xl" />
        <GlassSkeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * AI provider settings modal skeleton
 */
export function AIProviderModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Provider cards */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <GlassCard key={i} interactive>
            <div className="flex items-center gap-3">
              <GlassSkeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-1">
                <GlassSkeleton className="h-4 w-24" />
                <GlassSkeleton className="h-3 w-32" />
              </div>
              <GlassSkeleton className="w-5 h-5 rounded-full" />
            </div>
          </GlassCard>
        ))}
      </div>
      {/* API key input */}
      <div className="space-y-2">
        <GlassSkeleton className="h-4 w-20" />
        <GlassSkeleton className="h-10 w-full rounded-xl" />
        <GlassSkeleton className="h-3 w-48" />
      </div>
      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <GlassSkeleton className="h-12 flex-1 rounded-xl" />
        <GlassSkeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

// ============================================================================
// Modal Loading Wrapper
// ============================================================================

/**
 * Modal content loading wrapper
 * Provides consistent loading state for modal content
 */
export function ModalLoadingWrapper({
  children,
  isLoading,
  skeleton = "default",
}: {
  children: React.ReactNode;
  isLoading: boolean;
  skeleton?: "default" | "settings" | "profile" | "caregiver" | "data" | "ai";
}) {
  if (isLoading) {
    switch (skeleton) {
      case "settings":
        return <SettingsModalSkeleton />;
      case "profile":
        return <ProfileEditModalSkeleton />;
      case "caregiver":
        return <CaregiverInviteModalSkeleton />;
      case "data":
        return <DataManagementModalSkeleton />;
      case "ai":
        return <AIProviderModalSkeleton />;
      case "default":
      default:
        return <ModalContentSkeleton />;
    }
  }

  return <>{children}</>;
}

// ============================================================================
// Lazy-Loaded Modal Components
// Note: These would be used if modal content is in separate files
// ============================================================================

// Example of how to lazy-load a modal component:
// export const LazyEditBabyProfileModal = dynamic(
//   () => import("@/components/settings/EditBabyProfileModal").then((mod) => mod.EditBabyProfileModal),
//   {
//     loading: () => <ProfileEditModalSkeleton />,
//     ssr: false,
//   }
// );

// For now, we export the skeletons and wrapper for use in existing modal implementations
