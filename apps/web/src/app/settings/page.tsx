"use client";

import { useState } from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";
import { useBaby } from "@/context/baby-context";
import { api } from "@/lib/api-client";
import { ChangePasswordModal } from "@/components/settings/change-password-modal";
import { ManageApiKeysModal } from "@/components/settings/manage-api-keys-modal";
import { NotificationSettingsModal } from "@/components/settings/notification-settings-modal";
import { DisplaySettingsModal } from "@/components/settings/display-settings-modal";
import { DataManagementModal } from "@/components/settings/data-management-modal";
import { AccountSettingsModal } from "@/components/settings/account-settings-modal";
import { AboutSupportModal } from "@/components/settings/about-support-modal";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { loading } = useBaby();
  const router = useRouter();
  
  // Modal states
  const [showManageApiKeys, setShowManageApiKeys] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showAboutSupport, setShowAboutSupport] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    await api.auth.changePassword(data);
  };

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
      <div className="p-6 space-y-6 animate-slide-up pb-32">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <Icons.Settings className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm">App preferences & configuration</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/profile">
            <Card className={cn(
              "p-4 border-0 h-full card-elevated",
              "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
              "hover:border-amber-200/50 dark:hover:border-amber-800/50"
            )}>
              <div className="mb-2 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center icon-glow">
                <Icons.User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Profile</h3>
              <p className="text-xs text-muted-foreground">Your info</p>
            </Card>
          </Link>
          <Link href="/report">
            <Card className={cn(
              "p-4 border-0 h-full card-elevated",
              "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30",
              "hover:border-rose-200/50 dark:hover:border-rose-800/50"
            )}>
              <div className="mb-2 w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center icon-glow">
                <Icons.Report className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Reports</h3>
              <p className="text-xs text-muted-foreground">Export data</p>
            </Card>
          </Link>
          <Link href="/scheduled-reports">
            <Card className={cn(
              "p-4 border-0 h-full card-elevated",
              "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
              "hover:border-orange-200/50 dark:hover:border-orange-800/50"
            )}>
              <div className="mb-2 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center icon-glow">
                <Icons.Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Schedule</h3>
              <p className="text-xs text-muted-foreground">Auto reports</p>
            </Card>
          </Link>
        </div>

        {/* User Info Card */}
        {user && (
          <Card className="border-0 bg-card/50 card-elevated shadow-warm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center icon-glow">
                  <Icons.User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/5 hover:text-primary">
                    View Profile
                    <Icons.ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings */}
        <Card className="border-0 bg-card/50 card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center icon-glow">
                <Icons.Reminders className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription className="text-xs">Manage alerts & reminders</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <button 
              className="w-full flex justify-between items-center py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors group"
              onClick={() => setShowNotificationSettings(true)}
            >
              <span className="text-sm text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Push, Email & Sound</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Configure</span>
                <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="border-0 bg-card/50 card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center icon-glow">
                <Icons.Sun className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-base">Display</CardTitle>
                <CardDescription className="text-xs">Theme, language & formats</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <button 
              className="w-full flex justify-between items-center py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors group"
              onClick={() => setShowDisplaySettings(true)}
            >
              <span className="text-sm text-muted-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Theme & Preferences</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Customize</span>
                <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-0 bg-card/50 card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center icon-glow">
                <Icons.Report className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">Data Management</CardTitle>
                <CardDescription className="text-xs">Export, import & backup</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <button 
              className="w-full flex justify-between items-center py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors group"
              onClick={() => setShowDataManagement(true)}
            >
              <span className="text-sm text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Manage Your Data</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Open</span>
                <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card className="border-0 bg-card/50 card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-950/50 flex items-center justify-center icon-glow">
                <Icons.Key className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-base">Developer</CardTitle>
                <CardDescription className="text-xs">API keys & integrations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <button 
              className="w-full flex justify-between items-center py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors group"
              onClick={() => setShowManageApiKeys(true)}
            >
              <span className="text-sm text-muted-foreground group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">API Keys</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Manage</span>
                <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </CardContent>
        </Card>

        {/* About & Support */}
        <Card className="border-0 bg-card/50 card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center icon-glow">
                <Icons.Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-base">About & Support</CardTitle>
                <CardDescription className="text-xs">Help, privacy & terms</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <button 
              className="w-full flex justify-between items-center py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors group"
              onClick={() => setShowAboutSupport(true)}
            >
              <span className="text-sm text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">App Info & Help</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">View</span>
                <Icons.ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={handleLogout}
        >
          <Icons.Logout className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        {/* About */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>BabyNest v1.0.0</p>
          <p className="mt-1">© 2024 BabyNest</p>
        </div>
      </div>

      {/* Modals */}
      {showChangePassword && (
        <ChangePasswordModal 
          onClose={() => setShowChangePassword(false)} 
          onSave={handleChangePassword} 
        />
      )}
      
      {showManageApiKeys && (
        <ManageApiKeysModal 
          onClose={() => setShowManageApiKeys(false)} 
        />
      )}

      {showNotificationSettings && (
        <NotificationSettingsModal
          onClose={() => setShowNotificationSettings(false)}
        />
      )}

      {showDisplaySettings && (
        <DisplaySettingsModal
          onClose={() => setShowDisplaySettings(false)}
        />
      )}

      {showDataManagement && (
        <DataManagementModal
          onClose={() => setShowDataManagement(false)}
        />
      )}

      {showAccountSettings && (
        <AccountSettingsModal
          onClose={() => setShowAccountSettings(false)}
          onChangePassword={() => setShowChangePassword(true)}
        />
      )}

      {showAboutSupport && (
        <AboutSupportModal
          onClose={() => setShowAboutSupport(false)}
        />
      )}
    </MobileContainer>
  );
}


