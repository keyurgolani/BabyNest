"use client";

import { useState } from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";
import { useBaby } from "@/context/baby-context";
import { api } from "@/lib/api-client";
import { EditProfileModal } from "@/components/settings/edit-profile-modal";
import { ChangePasswordModal } from "@/components/settings/change-password-modal";
import { EditBabyProfileModal } from "@/components/settings/edit-baby-profile-modal";
import { DeleteBabyModal } from "@/components/settings/delete-baby-modal";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/date-utils";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { baby, loading, refreshBaby } = useBaby();
  const router = useRouter();
  
  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditBabyProfile, setShowEditBabyProfile] = useState(false);
  const [showDeleteBaby, setShowDeleteBaby] = useState(false);

  const handleUpdateProfile = async (data: { name: string }) => {
    await api.auth.updateProfile(data);
    await refreshUser();
  };

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    await api.auth.changePassword(data);
  };

  const handleDeleteBaby = async () => {
    if (!baby) return;
    try {
      await api.babies.delete(baby.id);
      router.push("/onboarding");
    } catch (error) {
      console.error("Failed to delete baby:", error);
      alert(error instanceof Error ? error.message : "Failed to delete baby profile");
    }
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
            <Icons.User className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your personal information</p>
          </div>
        </div>

        {/* Baby Profile Section */}
        {baby ? (
          <Card className="border-0 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-950/20 dark:to-purple-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-950/50 flex items-center justify-center overflow-hidden ring-4 ring-pink-200/50 dark:ring-pink-800/30 relative">
                  {baby.photoUrl ? (
                    <Image 
                      src={baby.photoUrl} 
                      alt={baby.name} 
                      fill 
                      sizes="64px" 
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Baby";
                      }}
                    />
                  ) : (
                    <Icons.Diaper className="w-8 h-8 text-pink-500 dark:text-pink-400" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{baby.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {baby.age.years > 0 && `${baby.age.years}y `}
                    {baby.age.months}m {baby.age.days}d old
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 mb-4">
                <SettingsRow 
                  label="Birth Date" 
                  value={format(parseLocalDate(baby.dateOfBirth), 'MMMM d, yyyy')} 
                />
                <SettingsRow 
                  label="Gender" 
                  value={baby.gender.charAt(0).toUpperCase() + baby.gender.slice(1)} 
                />
                <SettingsRow 
                  label="Profile Created" 
                  value={format(new Date(baby.createdAt), 'MMM d, yyyy')} 
                  isLast 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setShowEditBabyProfile(true)}
                  className="text-sm"
                >
                  <Icons.Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Link href="/settings/caregivers">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-sm w-full"
                  >
                    <Icons.Users className="w-4 h-4 mr-2" />
                    Caregivers
                  </Button>
                </Link>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDeleteBaby(true)}
                className="w-full mt-3 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Icons.Trash className="w-4 h-4 mr-2" />
                Delete Baby Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-muted/30">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4 text-sm">No baby profile found.</p>
              <Button onClick={() => router.push("/onboarding")} size="sm">Create Profile</Button>
            </CardContent>
          </Card>
        )}

        {/* User Profile Section */}
        <Card className="border-0 bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                <Icons.User className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Your Account</CardTitle>
                <CardDescription className="text-sm">{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3 mb-4">
              <SettingsRow label="Name" value={user?.name || "Not set"} />
              <SettingsRow label="Email" value={user?.email || "-"} />
              <SettingsRow 
                label="Member Since" 
                value={user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : "-"} 
                isLast 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setShowEditProfile(true)} 
                className="text-sm"
              >
                <Icons.Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowChangePassword(true)} 
                className="text-sm"
              >
                <Icons.Key className="w-4 h-4 mr-2" />
                Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="border-0 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-1">
              <Link href="/settings">
                <button className="w-full flex justify-between items-center py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Icons.Settings className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">App Settings</span>
                  </div>
                  <Icons.ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </Link>
              <Link href="/report">
                <button className="w-full flex justify-between items-center py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Icons.Report className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">Reports</span>
                  </div>
                  <Icons.ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </Link>
              <Link href="/scheduled-reports">
                <button className="w-full flex justify-between items-center py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Icons.Calendar className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">Scheduled Reports</span>
                  </div>
                  <Icons.ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showEditProfile && user && (
        <EditProfileModal 
          initialName={user.name} 
          onClose={() => setShowEditProfile(false)} 
          onSave={handleUpdateProfile} 
        />
      )}
      
      {showChangePassword && (
        <ChangePasswordModal 
          onClose={() => setShowChangePassword(false)} 
          onSave={handleChangePassword} 
        />
      )}

      {showEditBabyProfile && baby && (
        <EditBabyProfileModal
          baby={baby}
          onClose={() => setShowEditBabyProfile(false)}
          onSave={() => refreshBaby()}
        />
      )}

      {showDeleteBaby && baby && (
        <DeleteBabyModal
          babyName={baby.name}
          onClose={() => setShowDeleteBaby(false)}
          onConfirm={handleDeleteBaby}
        />
      )}
    </MobileContainer>
  );
}

interface SettingsRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function SettingsRow({ label, value, isLast = false }: SettingsRowProps) {
  return (
    <div className={cn(
      "flex justify-between items-center py-2.5",
      !isLast && "border-b border-muted/50"
    )}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
