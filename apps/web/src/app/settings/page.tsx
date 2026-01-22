"use client";

import { useState, useEffect } from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";
import { useBaby } from "@/context/baby-context";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, LogOut } from "lucide-react";

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

// Section wrapper component
interface SettingsSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  children: React.ReactNode;
  className?: string;
}

function SettingsSection({ title, icon: Icon, iconColor, iconBg, children, className }: SettingsSectionProps) {
  return (
    <Card className={cn("border border-border/40 bg-card/60 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", iconBg)}>
            <Icon className={cn("w-[18px] h-[18px]", iconColor)} />
          </div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

// Hook to detect desktop view
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  
  return isDesktop;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { loading } = useBaby();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="flex h-full items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="p-6 pb-32 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Icons.Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground text-sm">Manage your app preferences</p>
            </div>
          </div>
        </div>

        {/* Main Content - Responsive Grid */}
        <div className={cn(
          "grid gap-6",
          isDesktop ? "grid-cols-2" : "grid-cols-1"
        )}>
          {/* Column 1 */}
          <div className="space-y-6">
            {/* Baby Profile */}
            <SettingsSection
              title="Baby Profile"
              icon={Icons.Diaper}
              iconColor="text-pink-600 dark:text-pink-400"
              iconBg="bg-pink-100 dark:bg-pink-950/50"
            >
              <BabyProfileContent />
            </SettingsSection>

            {/* Display Settings */}
            <SettingsSection
              title="Display"
              icon={Icons.Sun}
              iconColor="text-rose-600 dark:text-rose-400"
              iconBg="bg-rose-100 dark:bg-rose-950/50"
            >
              <DisplaySettingsContent />
            </SettingsSection>

            {/* AI Providers */}
            <SettingsSection
              title="AI Providers"
              icon={Icons.Sparkles}
              iconColor="text-purple-600 dark:text-purple-400"
              iconBg="bg-purple-100 dark:bg-purple-950/50"
            >
              <AiProviderSettingsContent />
            </SettingsSection>

            {/* Developer / API Keys */}
            <SettingsSection
              title="Developer"
              icon={Icons.Key}
              iconColor="text-slate-600 dark:text-slate-400"
              iconBg="bg-slate-100 dark:bg-slate-950/50"
            >
              <ManageApiKeysContent />
            </SettingsSection>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            {/* User Account */}
            <SettingsSection
              title="Your Account"
              icon={Icons.User}
              iconColor="text-indigo-600 dark:text-indigo-400"
              iconBg="bg-indigo-100 dark:bg-indigo-950/50"
            >
              <UserAccountContent />
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection
              title="Notifications"
              icon={Icons.Reminders}
              iconColor="text-amber-600 dark:text-amber-400"
              iconBg="bg-amber-100 dark:bg-amber-950/50"
            >
              <NotificationSettingsContent />
            </SettingsSection>

            {/* AI Insights */}
            <SettingsSection
              title="AI Insights"
              icon={Icons.Insights}
              iconColor="text-violet-600 dark:text-violet-400"
              iconBg="bg-violet-100 dark:bg-violet-950/50"
            >
              <AiInsightsSettingsContent />
            </SettingsSection>

            {/* Data Management */}
            <SettingsSection
              title="Data & Privacy"
              icon={Icons.Report}
              iconColor="text-emerald-600 dark:text-emerald-400"
              iconBg="bg-emerald-100 dark:bg-emerald-950/50"
            >
              <DataManagementContent />
            </SettingsSection>
          </div>
        </div>

        {/* About & Support - Full Width */}
        <SettingsSection
          title="About & Support"
          icon={Icons.Sparkles}
          iconColor="text-sky-600 dark:text-sky-400"
          iconBg="bg-sky-100 dark:bg-sky-950/50"
        >
          <AboutSupportContent />
        </SettingsSection>

        {/* Footer Section */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          {/* User Info */}
          {user && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}

          {/* Version */}
          <div className="text-center text-xs text-muted-foreground">
            <p>BabyNest v1.0.0 • © 2024 BabyNest</p>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
}
