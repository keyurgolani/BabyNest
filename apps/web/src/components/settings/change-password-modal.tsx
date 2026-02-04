"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { Icons } from "@/components/icons";
import { ChangePasswordDto } from "@/lib/api-client";

/**
 * ChangePasswordModal Component
 *
 * A modal for changing the user's password with glassmorphism styling.
 * Uses GlassModal wrapper, GlassInput for password fields, and GlassButton for actions.
 *
 * @requirements 18.5
 */

interface ChangePasswordModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Callback when the password change is submitted */
  onSave: (data: ChangePasswordDto) => Promise<void>;
}

export function ChangePasswordModal({ isOpen, onClose, onSave }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line
      if (currentPassword !== "") setCurrentPassword("");
      // eslint-disable-next-line
      if (newPassword !== "") setNewPassword("");
      // eslint-disable-next-line
      if (confirmPassword !== "") setConfirmPassword("");
      // eslint-disable-next-line
      if (error !== null) setError(null);
      // eslint-disable-next-line
      if (isSubmitting !== false) setIsSubmitting(false);
    }
  }, [isOpen, currentPassword, newPassword, confirmPassword, error, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    // Validate password match
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({ currentPassword, newPassword });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
      setIsSubmitting(false);
    }
  };

  const isFormValid = currentPassword && newPassword && confirmPassword && newPassword.length >= 6;

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Password"
      size="default"
    >
      <div className="space-y-6">
        {/* Header Icon */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Icons.Lock className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Secure your account with a new password
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center gap-2">
            <Icons.AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-2">
            <label 
              htmlFor="current-password"
              className="block text-sm font-medium text-foreground"
            >
              Current Password
            </label>
            <GlassInput
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              disabled={isSubmitting}
              autoFocus
              autoComplete="current-password"
            />
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label 
              htmlFor="new-password"
              className="block text-sm font-medium text-foreground"
            >
              New Password
            </label>
            <GlassInput
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              disabled={isSubmitting}
              autoComplete="new-password"
              error={newPassword.length > 0 && newPassword.length < 6}
            />
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-xs text-destructive">
                Password must be at least 6 characters
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <label 
              htmlFor="confirm-password"
              className="block text-sm font-medium text-foreground"
            >
              Confirm New Password
            </label>
            <GlassInput
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={isSubmitting}
              autoComplete="new-password"
              error={confirmPassword.length > 0 && confirmPassword !== newPassword}
            />
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <p className="text-xs text-destructive">
                Passwords do not match
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <GlassButton 
              type="button" 
              variant="default" 
              onClick={onClose} 
              className="flex-1" 
              disabled={isSubmitting}
            >
              Cancel
            </GlassButton>
            <GlassButton 
              type="submit" 
              variant="primary"
              className="flex-1" 
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  <span>Changing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Icons.Lock className="w-4 h-4" />
                  <span>Change Password</span>
                </div>
              )}
            </GlassButton>
          </div>
        </form>
      </div>
    </GlassModal>
  );
}
