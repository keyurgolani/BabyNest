"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { Icons } from "@/components/icons";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Mail, UserPlus, Shield } from "lucide-react";

/**
 * InviteCaregiverModal Component
 *
 * A modal for inviting caregivers to help care for a baby with glassmorphism styling.
 * Uses GlassModal wrapper, GlassInput for email input, and GlassButton for actions.
 *
 * @requirements 18.5
 */

interface InviteCaregiverModalProps {
  /** The ID of the baby to invite a caregiver for */
  babyId: string;
  /** The name of the baby (displayed in the modal) */
  babyName: string;
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Callback when the invitation is successfully sent */
  onSuccess: () => void;
}

export function InviteCaregiverModal({ 
  babyId, 
  babyName, 
  open, 
  onClose, 
  onSuccess 
}: InviteCaregiverModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form state when modal closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.invitations.create({
        inviteeEmail: email,
        babyId,
      });
      
      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send invitation";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail("");
      setError(null);
      onClose();
    }
  };

  const isFormValid = email && email.includes("@");

  return (
    <GlassModal
      isOpen={open}
      onClose={handleClose}
      title="Invite Caregiver"
      size="default"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div className="space-y-6">
        {/* Header with Icon and Description */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <UserPlus className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Invite someone to help care for {babyName}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center gap-2">
            <Icons.AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invitation Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label 
              htmlFor="caregiver-email"
              className="block text-sm font-medium text-foreground"
            >
              Email Address
            </label>
            <GlassInput
              id="caregiver-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="caregiver@example.com"
              disabled={isSubmitting}
              autoFocus
              autoComplete="email"
              error={email.length > 0 && !email.includes("@")}
            />
            <p className="text-xs text-muted-foreground">
              They will receive an email with an invitation link
            </p>
          </div>

          {/* Role Information Card */}
          <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Default Role: Secondary Caregiver
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Secondary caregivers can log activities and view all data, but cannot manage caregivers or delete the baby profile.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <GlassButton 
              type="button" 
              variant="default" 
              onClick={handleClose} 
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
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Send Invitation</span>
                </div>
              )}
            </GlassButton>
          </div>
        </form>
      </div>
    </GlassModal>
  );
}
