"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { Icons } from "@/components/icons";
import { api, InvitationListItemDto } from "@/lib/api-client";
import { format, isPast } from "date-fns";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

/**
 * ManageCaregiversModal Component
 *
 * A modal for managing caregivers with glassmorphism styling.
 * Features:
 * - GlassModal wrapper for consistent modal styling
 * - GlassCard for caregiver list items
 * - Role badges with glassmorphism styling
 * - Invite and remove caregiver functionality
 *
 * @requirements 18.5
 */

interface Caregiver {
  caregiverId: string;
  name: string;
  email: string;
  role: 'primary' | 'secondary' | 'viewer';
}

interface ManageCaregiversModalProps {
  babyId: string;
  /** Whether the modal is open. If not provided, defaults to true for backward compatibility */
  isOpen?: boolean;
  onClose: () => void;
}

export function ManageCaregiversModal({ babyId, isOpen = true, onClose }: ManageCaregiversModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'caregivers' | 'invitations'>('caregivers');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [invitations, setInvitations] = useState<InvitationListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch baby details to get caregivers
        const baby = await api.babies.get(babyId);
        if (baby && baby.caregivers) {
          setCaregivers(baby.caregivers);
        }
        
        // Fetch invitations
        const invites = await api.invitations.list(babyId);
        setInvitations(invites);
      } catch (err) {
        console.error("Failed to fetch caregivers/invitations", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [babyId, isOpen]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    setError(null);

    try {
      await api.invitations.create({
        inviteeEmail: inviteEmail,
        babyId,
      });
      setInviteEmail("");
      // Refresh list
      const invites = await api.invitations.list(babyId);
      setInvitations(invites);
      setActiveTab('invitations');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyInviteCode = async (invite: InvitationListItemDto) => {
    try {
      // Create a shareable invitation link using the token hint
      const inviteLink = `${window.location.origin}/auth/accept-invite?token=${invite.tokenHint}`;
      await navigator.clipboard.writeText(inviteLink);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback: copy just the token hint
      try {
        await navigator.clipboard.writeText(invite.tokenHint);
        setCopiedId(invite.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        alert("Failed to copy to clipboard");
      }
    }
  };

  const handleRemoveCaregiver = async (caregiverId: string) => {
    if (!confirm("Are you sure you want to remove this caregiver?")) return;
    
    try {
      await api.babies.removeCaregiver(babyId, caregiverId);
      setCaregivers(prev => prev.filter(c => c.caregiverId !== caregiverId));
    } catch (err) {
      alert("Failed to remove caregiver: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    
    try {
      await api.invitations.revoke(invitationId);
      // Re-fetch invitations
      const invites = await api.invitations.list(babyId);
      setInvitations(invites);
    } catch {
      alert("Failed to revoke invitation");
    }
  };

  // Role badge styling with glassmorphism
  const getRoleBadgeClasses = (role: string) => {
    const baseClasses = "text-[10px] px-2.5 py-1 rounded-full font-medium backdrop-blur-sm";
    switch (role) {
      case 'primary':
        return cn(baseClasses, "bg-purple-500/20 text-purple-300 border border-purple-400/30");
      case 'secondary':
        return cn(baseClasses, "bg-blue-500/20 text-blue-300 border border-blue-400/30");
      case 'viewer':
        return cn(baseClasses, "bg-gray-500/20 text-gray-300 border border-gray-400/30");
      default:
        return cn(baseClasses, "bg-gray-500/20 text-gray-300 border border-gray-400/30");
    }
  };

  // Status badge styling with glassmorphism
  const getStatusBadgeClasses = (status: string, isExpired: boolean) => {
    const baseClasses = "text-[10px] px-2.5 py-1 rounded-full font-medium backdrop-blur-sm";
    if (isExpired && status === 'pending') {
      return cn(baseClasses, "bg-gray-500/20 text-gray-300 border border-gray-400/30");
    }
    switch (status) {
      case 'pending':
        return cn(baseClasses, "bg-yellow-500/20 text-yellow-300 border border-yellow-400/30");
      case 'accepted':
        return cn(baseClasses, "bg-green-500/20 text-green-300 border border-green-400/30");
      case 'revoked':
        return cn(baseClasses, "bg-red-500/20 text-red-300 border border-red-400/30");
      default:
        return cn(baseClasses, "bg-gray-500/20 text-gray-300 border border-gray-400/30");
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Caregivers"
      size="lg"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setActiveTab('caregivers')}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === 'caregivers'
                ? "bg-white/10 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Icons.Users className="w-4 h-4" />
              Caregivers
            </span>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === 'invitations'
                ? "bg-white/10 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Icons.Mail className="w-4 h-4" />
              Invitations
            </span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <GlassCard variant="danger" size="sm">
            <p className="text-sm text-red-400">{error}</p>
          </GlassCard>
        )}

        {/* Caregivers Tab */}
        {activeTab === 'caregivers' && (
          <div className="space-y-6">
            {/* Current Caregivers Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Current Caregivers
              </h3>
              
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Icons.Spinner className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Loading caregivers...</p>
                </div>
              ) : caregivers.length > 0 ? (
                <div className="space-y-2">
                  {caregivers.map((caregiver) => (
                    <GlassCard
                      key={caregiver.caregiverId}
                      size="sm"
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold backdrop-blur-sm">
                          {caregiver.name.charAt(0).toUpperCase()}
                        </div>
                        {/* Info */}
                        <div>
                          <p className="font-medium text-foreground">{caregiver.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{caregiver.email}</span>
                            <span className={getRoleBadgeClasses(caregiver.role)}>
                              {caregiver.role}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Remove Button (not for primary or self) */}
                      {caregiver.role !== 'primary' && user?.id !== caregiver.caregiverId && (
                        <GlassButton
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleRemoveCaregiver(caregiver.caregiverId)}
                        >
                          Remove
                        </GlassButton>
                      )}
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <GlassCard size="sm" className="py-8 text-center">
                  <Icons.Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-muted-foreground text-sm">No caregivers found</p>
                </GlassCard>
              )}
            </div>

            {/* Invite Section */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Invite New Caregiver
              </h3>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="flex gap-3">
                  <GlassInput
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email address"
                    disabled={isInviting}
                    className="flex-1"
                  />
                  <GlassButton
                    type="submit"
                    variant="primary"
                    disabled={isInviting || !inviteEmail}
                  >
                    {isInviting ? (
                      <>
                        <Icons.Spinner className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Invite"
                    )}
                  </GlassButton>
                </div>
                <p className="text-xs text-muted-foreground">
                  Caregivers will be invited as <strong className="text-foreground/80">Secondary</strong> caregivers by default.
                </p>
              </form>
            </div>
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                <Icons.Spinner className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                <p className="text-sm">Loading invitations...</p>
              </div>
            ) : invitations.length > 0 ? (
              <div className="space-y-2">
                {invitations.map((invite) => {
                  const isExpired = isPast(new Date(invite.expiresAt));
                  return (
                    <GlassCard key={invite.id} size="sm">
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground">{invite.inviteeEmail}</p>
                        <span className={getStatusBadgeClasses(invite.status, isExpired)}>
                          {isExpired && invite.status === 'pending' ? 'EXPIRED' : invite.status.toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Date Info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                        <span>Sent: {format(new Date(invite.createdAt), 'MMM d, yyyy')}</span>
                        <span className="opacity-50">•</span>
                        <span className={isExpired ? 'text-red-400' : ''}>
                          Expires: {format(new Date(invite.expiresAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      
                      {/* Actions for pending invitations */}
                      {invite.status === 'pending' && !isExpired && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                          {/* Token Display */}
                          <div className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-xs font-mono text-muted-foreground truncate border border-white/10">
                            {invite.tokenHint}
                          </div>
                          
                          {/* Copy Button */}
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyInviteCode(invite)}
                          >
                            {copiedId === invite.id ? (
                              <>
                                <Icons.Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Icons.Copy className="w-3.5 h-3.5 mr-1.5" />
                                Copy
                              </>
                            )}
                          </GlassButton>
                          
                          {/* Revoke Button */}
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleRevokeInvitation(invite.id)}
                          >
                            Revoke
                          </GlassButton>
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            ) : (
              <GlassCard size="sm" className="py-12 text-center">
                <Icons.Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-muted-foreground">No invitations sent yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Switch to the Caregivers tab to invite someone
                </p>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </GlassModal>
  );
}

export default ManageCaregiversModal;
