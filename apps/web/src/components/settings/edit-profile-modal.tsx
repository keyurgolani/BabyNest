"use client";

import { useState } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { UpdateProfileDto } from "@/lib/api-client";

/**
 * EditProfileModal Component
 *
 * A modal for editing user profile information with glassmorphism styling.
 * Uses GlassModal wrapper, GlassInput for form fields, and GlassButton for actions.
 *
 * @requirements 18.5
 */

interface EditProfileModalProps {
  isOpen: boolean;
  initialName: string;
  onClose: () => void;
  onSave: (data: UpdateProfileDto) => Promise<void>;
}

export function EditProfileModal({ isOpen, initialName, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({ name: name.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      setIsSubmitting(false);
    }
  };

  // Reset state when modal opens with new initial values
  const handleClose = () => {
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Profile"
      size="default"
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label 
              htmlFor="profile-name" 
              className="block text-sm font-medium text-foreground"
            >
              Full Name
            </label>
            <GlassInput
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={isSubmitting}
              autoFocus
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <GlassButton
              type="button"
              variant="default"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              disabled={isSubmitting || !name.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </GlassButton>
          </div>
        </form>
      </div>
    </GlassModal>
  );
}
