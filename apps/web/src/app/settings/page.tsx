"use client";

import { useState, useEffect } from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { Icons } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";
import { useBaby } from "@/context/baby-context";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, LogOut, Shield, Database, Code, HelpCircle, Palette, BellRing, Bot, Brain } from "lucide-react";

// Content components
import { NotificationSettingsContent } from "@/components/settings/notification-settings-content";
import { DisplaySettingsContent } from "@/components/settings/display-settings-content";
import { AiProviderSettingsContent } from "@/components/settings/ai-provider-settings-content";
import { AiInsightsSettingsContent } from "@/components/settings/ai-insights-settings-content";
import { DataManagementContent } from "@/components/settings/data-management-content";
import { ManageApiKeysContent } from "@/components/settings/manage-api-keys-content";
import { AboutSupportContent } from "@/components/settings/about-support-content";
import { BabyProfileContent } from "@/components/settings/baby-profile-content";
import { UserAccountContent } from "@/components/settings/user-account-content";

/**
 * Settings Section Card Component
 * 
 * A clickable GlassCard section with icon, title, and description.
 * Opens corresponding modal when clicked.
 * 
 * @requirements 17.1, 17.2
 */
interface SettingsSectionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function SettingsSectionCard({ 
  title, 
  description, 
  icon: Icon, 
  iconColor, 
  children,
  defaultExpanded = false 
}: SettingsSectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <GlassCard 
      variant="default" 
      size="default"
      className="overflow-hidden"
    >
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-4 text-left",
          "transition-all duration-200",
          "hover:bg-[var(--glass-bg-hover)] -m-4 p-4 rounded-3xl",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "touch-target"
        )}
      >
        {/* Icon Badge */}
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
          "bg-gradient-to-br shadow-lg",
          iconColor
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-foreground truncate">
            {title}
          </h3>
          <p className="text-sm text-foreground/80 dark:text-muted-foreground truncate">
            {description}
          </p>
        </div>

        {/* Expand/Collapse Indicator */}
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
          "bg-[var(--glass-bg)] border border-[var(--glass-border)]",
          "transition-transform duration-200",
          isExpanded && "rotate-180"
        )}>
          <Icons.ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>

      {/* Expandable Content */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[2000px] opacity-100 mt-4 pt-4 border-t border-[var(--glass-border)]" : "max-h-0 opacity-0"
      )}>
        {children}
      </div>
    </GlassCard>
  );
}

/**
 * Settings Page
 * 
 * Displays 9 settings sections using GlassCard styling.
 * Responsive layout: 1 column on mobile, 2 columns on tablet/desktop.
 * 
 * @requirements 17.1, 17.2, 17.3
 */
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { loading } = useBaby();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="p-4 md:p-6 pb-32 space-y-6">
          {/* Page Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
          </div>

          {/* Settings Grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <GlassCard key={i} className="relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex-shrink-0 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-white/10 rounded animate-pulse" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex-shrink-0 animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
              </GlassCard>
            ))}
          </div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="p-4 md:p-6 pb-32 space-y-6">
        {/* Page Header - Requirement 17.1 */}
        <PageHeader
          title="Settings"
          subtitle="Manage your app preferences"
        />

        {/* Settings Grid - Requirement 17.3: 1 column mobile, 2 columns tablet/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 1: Baby Profile - Requirement 17.1 */}
          <SettingsSectionCard
            title="Baby Profile"
            description="Manage your baby's information"
            icon={Icons.Diaper}
            iconColor="from-pink-500 to-rose-500"
          >
            <BabyProfileContent />
          </SettingsSectionCard>

          {/* Section 2: Your Account - Requirement 17.1 */}
          <SettingsSectionCard
            title="Your Account"
            description="Update your profile and security"
            icon={User}
            iconColor="from-indigo-500 to-purple-500"
          >
            <UserAccountContent />
          </SettingsSectionCard>

          {/* Section 3: Display - Requirement 17.1 */}
          <SettingsSectionCard
            title="Display"
            description="Theme and appearance settings"
            icon={Palette}
            iconColor="from-rose-500 to-orange-500"
          >
            <DisplaySettingsContent />
          </SettingsSectionCard>

          {/* Section 4: Notifications - Requirement 17.1 */}
          <SettingsSectionCard
            title="Notifications"
            description="Configure alerts and reminders"
            icon={BellRing}
            iconColor="from-amber-500 to-yellow-500"
          >
            <NotificationSettingsContent />
          </SettingsSectionCard>

          {/* Section 5: AI Providers - Requirement 17.1 */}
          <SettingsSectionCard
            title="AI Providers"
            description="Configure AI service providers"
            icon={Bot}
            iconColor="from-purple-500 to-violet-500"
          >
            <AiProviderSettingsContent />
          </SettingsSectionCard>

          {/* Section 6: AI Insights - Requirement 17.1 */}
          <SettingsSectionCard
            title="AI Insights"
            description="Personalize AI recommendations"
            icon={Brain}
            iconColor="from-violet-500 to-fuchsia-500"
          >
            <AiInsightsSettingsContent />
          </SettingsSectionCard>

          {/* Section 7: Data & Privacy - Requirement 17.1 */}
          <SettingsSectionCard
            title="Data & Privacy"
            description="Manage your data and privacy"
            icon={Shield}
            iconColor="from-emerald-500 to-teal-500"
          >
            <DataManagementContent />
          </SettingsSectionCard>

          {/* Section 8: Developer - Requirement 17.1 */}
          <SettingsSectionCard
            title="Developer"
            description="API keys and developer tools"
            icon={Code}
            iconColor="from-slate-500 to-zinc-500"
          >
            <ManageApiKeysContent />
          </SettingsSectionCard>

          {/* Section 9: About & Support - Requirement 17.1 */}
          <SettingsSectionCard
            title="About & Support"
            description="Help, feedback, and app info"
            icon={HelpCircle}
            iconColor="from-sky-500 to-cyan-500"
          >
            <AboutSupportContent />
          </SettingsSectionCard>
        </div>

        {/* Footer Section - User Info and Sign Out */}
        <GlassCard variant="default" size="default" className="mt-6">
          {user && (
            <div className="flex items-center gap-4">
              {/* User Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-sm text-foreground/80 dark:text-muted-foreground truncate">{user.email}</p>
              </div>

              {/* Sign Out Button */}
              <GlassButton 
                variant="danger"
                size="sm"
                onClick={handleLogout}
                className="flex-shrink-0"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </GlassButton>
            </div>
          )}
        </GlassCard>

        {/* Version Info */}
        <div className="text-center text-xs text-foreground/70 dark:text-muted-foreground pt-2">
          <p>BabyNest v1.0.0 • © 2024 BabyNest</p>
        </div>
      </div>
    </MobileContainer>
  );
}
