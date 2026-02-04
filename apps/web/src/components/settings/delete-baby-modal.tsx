"use client";

import { useState } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { Icons } from "@/components/icons";

/**
 * DeleteBabyModal Component
 *
 * A confirmation modal for deleting a baby profile with glassmorphism styling.
 * Uses GlassModal wrapper, GlassButton danger variant for delete action,
 * and GlassInput for confirmation text.
 *
 * @requirements 18.5
 */

interface DeleteBabyModalProps {
  babyName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteBabyModal({ babyName, onClose, onConfirm }: DeleteBabyModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== babyName) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      setIsDeleting(false);
    }
  };

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      showCloseButton={false}
      closeOnBackdropClick={!isDeleting}
      closeOnEscape={!isDeleting}
      size="default"
    >
      {/* Header with icon and title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
          <Icons.AlertCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="font-heading font-bold text-xl text-destructive">
            Delete Baby Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone
          </p>
        </div>
        <GlassButton
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isDeleting}
          className="rounded-full"
          aria-label="Close modal"
        >
          <Icons.Close className="w-5 h-5" />
        </GlassButton>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Warning content */}
      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-6">
        <p className="text-sm text-destructive mb-4">
          You are about to permanently delete <strong>{babyName}&apos;s</strong> profile and all associated data including:
        </p>
        <ul className="text-sm text-destructive/80 space-y-1 ml-4 list-disc">
          <li>All feeding records</li>
          <li>All sleep records</li>
          <li>All diaper records</li>
          <li>All growth measurements</li>
          <li>All milestones</li>
          <li>All memories and photos</li>
        </ul>
      </div>

      {/* Confirmation input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Type <strong className="text-destructive">{babyName}</strong> to confirm:
          </label>
          <GlassInput
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={babyName}
            disabled={isDeleting}
            error={confirmText.length > 0 && confirmText !== babyName}
            className="bg-white/5"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <GlassButton 
            type="button" 
            variant="default" 
            onClick={onClose} 
            className="flex-1" 
            disabled={isDeleting}
          >
            Cancel
          </GlassButton>
          <GlassButton 
            type="button"
            variant="danger"
            className="flex-1" 
            disabled={confirmText !== babyName || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </div>
            ) : (
              <>
                <Icons.Trash className="w-4 h-4 mr-2" />
                Delete Forever
              </>
            )}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
