"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Calendar, ArrowLeft, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, CaregiverResponseDto } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const [user, setUser] = useState<CaregiverResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const userData = await api.auth.me();
      setUser(userData);
      setName(userData.name);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setSaving(true);
      await api.auth.updateProfile({ name: name.trim() });
      toast.success("Profile updated successfully");
      await fetchUser();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  if (loading) {
    return (
      <main className="flex flex-col gap-5 w-full max-w-4xl mx-auto px-4 pt-4 pb-24 md:pb-8">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  return (
    <motion.main
      className="flex flex-col gap-5 w-full max-w-4xl mx-auto px-4 pt-4 pb-24 md:pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 hover:bg-primary/10 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex flex-col flex-1">
          <h1 className="text-3xl font-heading font-bold text-foreground text-shadow-soft">
            Edit Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update your personal information
          </p>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 border-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          {/* Avatar Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <User className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="pl-10 bg-white dark:bg-black/40 border-indigo-200 dark:border-indigo-800"
                />
              </div>
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="pl-10 bg-muted/50 border-muted cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Member Since (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Member Since
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={
                    user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Unknown"
                  }
                  disabled
                  className="pl-10 bg-muted/50 border-muted cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || name === user?.name}
              className="flex-1 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 glow-soft"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Link href="/settings">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={saving}
              >
                Cancel
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Additional Info Card */}
      <motion.div variants={itemVariants}>
        <Card className="p-4 border-0 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground text-sm mb-1">
                Profile Information
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your profile information is used to personalize your experience and
                communicate with other caregivers. Your email address is used for
                account security and cannot be changed.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 gap-3">
          <Link href="/settings/password">
            <Card className="p-4 border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">
                      Change Password
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Update your account password
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
              </div>
            </Card>
          </Link>
        </div>
      </motion.div>
    </motion.main>
  );
}
