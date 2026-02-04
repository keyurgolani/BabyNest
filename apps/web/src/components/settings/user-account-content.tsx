"use client";

import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { Icons } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api-client";
import { format } from "date-fns";

export function UserAccountContent() {
  const { user, refreshUser } = useAuth();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form state
  const [name, setName] = useState(user?.name || "");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await api.auth.updateProfile({ name: name.trim() });
      await refreshUser();
      setIsEditingName(false);
      setSuccess("Name updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || newEmail === user?.email) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Email change would typically send a verification email
      await new Promise(resolve => setTimeout(resolve, 500));
      setError("Email change feature coming soon. A verification email would be sent.");
      setIsEditingEmail(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") return;
    
    setIsSubmitting(true);
    try {
      // Account deletion would be implemented here
      await new Promise(resolve => setTimeout(resolve, 500));
      setError("Account deletion is not yet implemented for safety reasons.");
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground text-sm">Not logged in</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg text-green-700 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">Name</label>
          {!isEditingName && (
            <GlassButton variant="ghost" size="sm" onClick={() => setIsEditingName(true)}>
              Edit
            </GlassButton>
          )}
        </div>
        {isEditingName ? (
          <div className="space-y-2">
            <GlassInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <div className="flex gap-2">
              <GlassButton variant="default" size="sm" onClick={() => { setIsEditingName(false); setName(user.name); }}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" size="sm" onClick={handleUpdateName} disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? "Saving..." : "Save"}
              </GlassButton>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{user.name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">Email</label>
          {!isEditingEmail && (
            <GlassButton variant="ghost" size="sm" onClick={() => setIsEditingEmail(true)}>
              Change
            </GlassButton>
          )}
        </div>
        {isEditingEmail ? (
          <div className="space-y-2">
            <GlassInput type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email" />
            <div className="flex gap-2">
              <GlassButton variant="default" size="sm" onClick={() => { setIsEditingEmail(false); setNewEmail(user.email); }}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" size="sm" onClick={handleChangeEmail} disabled={isSubmitting || !newEmail || newEmail === user.email}>
                {isSubmitting ? "Saving..." : "Update Email"}
              </GlassButton>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{user.email}</p>
        )}
      </div>

      {/* Member Since */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Member Since</label>
        <p className="text-sm text-muted-foreground">
          {user.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : "-"}
        </p>
      </div>

      {/* Password */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">Password</label>
          {!isChangingPassword && (
            <GlassButton variant="ghost" size="sm" onClick={() => setIsChangingPassword(true)}>
              Change
            </GlassButton>
          )}
        </div>
        {isChangingPassword ? (
          <div className="space-y-3">
            <GlassInput
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />
            <GlassInput
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <GlassInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
            <div className="flex gap-2">
              <GlassButton
                variant="default"
                size="sm"
                onClick={() => {
                  setIsChangingPassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                size="sm"
                onClick={handleChangePassword}
                disabled={isSubmitting || !currentPassword || !newPassword || newPassword !== confirmPassword}
              >
                {isSubmitting ? "Changing..." : "Change Password"}
              </GlassButton>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">••••••••</p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="pt-4 border-t border-white/10">
        {!showDeleteConfirm ? (
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Icons.Trash className="w-4 h-4 mr-1" />
            Delete Account
          </GlassButton>
        ) : (
          <div className="p-3 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl space-y-3">
            <p className="text-sm text-red-700 dark:text-red-400">
              This will permanently delete your account and all data.
            </p>
            <div>
              <label className="block text-xs text-red-600 dark:text-red-400 mb-1">
                Type <strong>DELETE MY ACCOUNT</strong> to confirm:
              </label>
              <GlassInput
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="default"
                size="sm"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="danger"
                size="sm"
                disabled={deleteConfirmText !== "DELETE MY ACCOUNT" || isSubmitting}
                onClick={handleDeleteAccount}
              >
                {isSubmitting ? "Deleting..." : "Delete Account"}
              </GlassButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
