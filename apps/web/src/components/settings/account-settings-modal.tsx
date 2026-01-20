"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";

interface AccountSettingsModalProps {
  onClose: () => void;
  onChangePassword: () => void;
}

export function AccountSettingsModal({ onClose, onChangePassword }: AccountSettingsModalProps) {
  const { user, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

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

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-md animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Icons.User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Account Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {/* Current Email */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-foreground">Email Address</h3>
              {!showEmailForm && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowEmailForm(true)}
                >
                  Change
                </Button>
              )}
            </div>
            
            {!showEmailForm ? (
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="New email address"
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setShowEmailForm(false);
                      setNewEmail(user?.email || '');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="default"
                    size="sm"
                    className="flex-1"
                    disabled={!newEmail || newEmail === user?.email || isChangingEmail}
                    onClick={handleChangeEmail}
                  >
                    {isChangingEmail ? 'Saving...' : 'Update Email'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <h3 className="font-medium text-foreground mb-2">Password</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Keep your account secure with a strong password
            </p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => {
                onClose();
                onChangePassword();
              }}
            >
              <Icons.Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>

          {/* Logout */}
          <Button 
            variant="outline"
            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-950/20"
            onClick={handleLogout}
          >
            <Icons.Logout className="w-4 h-4 mr-2" />
            Sign Out
          </Button>

          {/* Delete Account */}
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
            <h3 className="font-medium text-red-700 dark:text-red-400 mb-2">Delete Account</h3>
            <p className="text-sm text-red-600 dark:text-red-400/80 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            {!showDeleteConfirm ? (
              <Button 
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Icons.Trash className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-red-600 dark:text-red-400">
                  Type <strong>DELETE MY ACCOUNT</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-red-950/30 border border-red-300 dark:border-red-800 text-foreground text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || isDeleting}
                    onClick={handleDeleteAccount}
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
