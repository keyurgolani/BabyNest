"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface InviteCaregiverModalProps {
  babyId: string;
  babyName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteCaregiverModal({ babyId, babyName, open, onClose, onSuccess }: InviteCaregiverModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Icons.Mail className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>Invite Caregiver</DialogTitle>
              <DialogDescription>
                Invite someone to help care for {babyName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="caregiver@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              They will receive an email with an invitation link
            </p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-xs font-medium text-foreground">Default Role: Secondary Caregiver</p>
            <p className="text-xs text-muted-foreground">
              Secondary caregivers can log activities and view all data, but cannot manage caregivers or delete the baby profile.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !email}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Icons.Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
