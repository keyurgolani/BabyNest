"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Icons } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";

/**
 * AccountSettingsModal Component
 *
 * A modal for managing account settings including email, password, logout, and account deletion.
 * Uses GlassModal wrapper, GlassInput for form fields, and GlassButton for actions.
 *
 * @requirements 18.5
 */

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: () => void;
}

export function AccountSettingsModal({ isOpen, onClose, onChangePassword }: AccountSettingsModalProps) {
  const { user, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      setShowEmailForm(false);
      setNewEmail(user?.email || '');
    }
  }, [isOpen, user?.email]);

  const handleChangeEmail = async () => {
    if (!newEmail || newEmail === user?.email) return;
    
    setIsChangingEmail(true);
    try {
      // In a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Email change feature coming soon! A verification email would be sent.');
      setShowEmailForm(false);
    } catch (error) {
      console.error('Failed to change email:', error);
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') return;
    
    setIsDeleting(true);
    try {
      // In a real app, this would call an API to delete the account
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Account deletion is not yet implemented for safety reasons.');
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    setShowEmailForm(false);
    setNewEmail(user?.email || '');
    onClose();
  };

  const handleChangePasswordClick = () => {
    handleClose();
    onChangePassword();
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Account Settings"
      size="default"
    >
      <div className="space-y-6">
        {/* Email Address Section */}
        <GlassCard size="sm" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icons.Mail className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-foreground">Email Address</h3>
            </div>
            {!showEmailForm && (
              <GlassButton 
                variant="ghost" 
                size="sm"
                onClick={() => setShowEmailForm(true)}
                className="h-8 px-3 min-h-0"
              >
                Change
              </GlassButton>
            )}
          </div>
          
          {!showEmailForm ? (
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          ) : (
            <div className="space-y-3 mt-3">
              <GlassInput
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email address"
                disabled={isChangingEmail}
              />
              <div className="flex gap-2">
                <GlassButton 
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setShowEmailForm(false);
                    setNewEmail(user?.email || '');
                  }}
                  disabled={isChangingEmail}
                >
                  Cancel
                </GlassButton>
                <GlassButton 
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  disabled={!newEmail || newEmail === user?.email || isChangingEmail}
                  onClick={handleChangeEmail}
                >
                  {isChangingEmail ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Saving...
                    </div>
                  ) : (
                    'Update Email'
                  )}
                </GlassButton>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Password Section */}
        <GlassCard size="sm" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icons.Lock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground">Password</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Keep your account secure with a strong password
          </p>
          <GlassButton 
            variant="default"
            className="w-full"
            onClick={handleChangePasswordClick}
          >
            <Icons.Lock className="w-4 h-4 mr-2" />
            Change Password
          </GlassButton>
        </GlassCard>

        {/* Sign Out Button */}
        <GlassButton 
          variant="default"
          className="w-full border-orange-500/30 text-orange-600 hover:bg-orange-500/10 dark:text-orange-400"
          onClick={handleLogout}
        >
          <Icons.Logout className="w-4 h-4 mr-2" />
          Sign Out
        </GlassButton>

        {/* Delete Account Section */}
        <GlassCard 
          variant="danger" 
          size="sm" 
          className="p-4 bg-destructive/5 border-destructive/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Icons.Trash className="w-4 h-4 text-destructive" />
            <h3 className="font-medium text-destructive">Delete Account</h3>
          </div>
          <p className="text-sm text-destructive/80 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          
          {!showDeleteConfirm ? (
            <GlassButton 
              variant="danger"
              className="w-full"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Icons.Trash className="w-4 h-4 mr-2" />
              Delete Account
            </GlassButton>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-destructive">
                Type <strong>DELETE MY ACCOUNT</strong> to confirm:
              </p>
              <GlassInput
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                error={deleteConfirmText.length > 0 && deleteConfirmText !== 'DELETE MY ACCOUNT'}
                disabled={isDeleting}
              />
              <div className="flex gap-2">
                <GlassButton 
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </GlassButton>
                <GlassButton 
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || isDeleting}
                  onClick={handleDeleteAccount}
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Deleting...
                    </div>
                  ) : (
                    'Confirm Delete'
                  )}
                </GlassButton>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </GlassModal>
  );
}
