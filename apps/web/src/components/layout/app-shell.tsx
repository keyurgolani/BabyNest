"use client";

import React from "react";
import { usePathname } from "next/navigation";

// Layout components
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNav } from "./mobile-nav";

// UI components
import { PageTransition } from "@/components/ui/page-transition";

// Context providers
import { LogProvider } from "@/context/log-context";

// Timer and notification banners
import { ActiveTimerBanner } from "@/components/ActiveTimerBanner";
import { NursingTimerBanner } from "@/components/NursingTimerBanner";
import { ActivityTimerBanner } from "@/components/ActivityTimerBanner";
import { PendingInvitationsBanner } from "@/components/PendingInvitationsBanner";

// Auth
import { useAuth } from "@/components/auth-provider";
import { Icons } from "@/components/icons";

/**
 * AppShell Component
 * 
 * Root layout component that orchestrates responsive navigation and content areas.
 * 
 * Features:
 * - Fixed mesh gradient background layer with proper dark mode support
 * - DesktopSidebar visible on lg+ viewports (1024px+)
 * - MobileNav visible on viewports below lg
 * - Safe area insets for mobile devices with notches/home indicators
 * - Page transition animations using PageTransition component (framer-motion AnimatePresence)
 * - LogProvider for log context
 * - Timer banners for active timers
 * - Authentication state handling
 * 
 * @requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */
export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * MeshBackground Component
 * 
 * Renders the mesh gradient background with proper dark mode support.
 * Uses CSS custom properties that are properly scoped to light/dark modes.
 */
function MeshBackground() {
  return (
    <div 
      className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,#e0f7fa_0%,#fce4ec_50%,#fff9c4_100%)] dark:bg-[linear-gradient(135deg,#1a1512_0%,#1e1815_25%,#221a16_50%,#1a1614_75%,#161412_100%)]"
      aria-hidden="true"
    />
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { loading, isAuthenticated } = useAuth();
  const isAuthPage = pathname?.startsWith('/auth');
  const isOnboarding = pathname?.startsWith('/onboarding');
  const isInvitePage = pathname?.startsWith('/invite');

  // Auth pages don't need the full layout with sidebar/navigation
  if (isAuthPage || isInvitePage) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Fixed Mesh Gradient Background Layer */}
        <MeshBackground />
        {children}
      </div>
    );
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[linear-gradient(135deg,#e0f7fa_0%,#fce4ec_50%,#fff9c4_100%)] dark:bg-[linear-gradient(135deg,#1a1512_0%,#1e1815_25%,#221a16_50%,#1a1614_75%,#161412_100%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
            <Icons.Diaper className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated and not on a public page, don't render content
  // The AuthProvider will handle the redirect
  if (!isAuthenticated && !isOnboarding) {
    return null;
  }

  return (
    <LogProvider>
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Fixed Mesh Gradient Background Layer - Requirements 9.3 */}
        <MeshBackground />
        
        {/* Main Layout Container */}
        <div className="flex min-h-screen">
          {/* Desktop Sidebar - Hidden on mobile, visible on lg+ (1024px+) - Requirements 9.1 */}
          <div className="hidden lg:flex">
            <DesktopSidebar />
          </div>
          
          {/* Main Content Area with Safe Area Insets - Requirements 9.4 */}
          {/* Add left margin on lg+ to account for fixed sidebar width (280px) */}
          <main 
            className="flex-1 flex flex-col min-h-screen pt-safe pl-safe pr-safe lg:ml-[280px] isolate"
          >
            {/* Notification Banners */}
            <PendingInvitationsBanner />
            <ActiveTimerBanner />
            <NursingTimerBanner />
            <ActivityTimerBanner />
            
            {/* Content wrapper with bottom padding for MobileNav on mobile */}
            <div className="flex-1 pb-24 lg:pb-0">
              {/* PageTransition for Page Transitions - Requirements 9.5 */}
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </main>
        </div>
        
        {/* Mobile Navigation - Visible on mobile, hidden on lg+ - Requirements 9.2 */}
        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>
    </LogProvider>
  );
}

export default AppShell;
