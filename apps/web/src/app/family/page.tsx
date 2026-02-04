"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { api, InvitationListItemDto } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { toast } from "sonner";
import { InviteCaregiverModal } from "@/components/settings/invite-caregiver-modal";
import { 
  Users, 
  Crown, 
  Eye, 
  UserPlus, 
  Trash2, 
  Mail,
  Shield,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { motion } from "framer-motion";

/**
 * Family Page - Glassmorphism Redesign
 * 
 * Requirements:
 * - 24.1: Display caregivers list with role badges and invite FAB
 * - Uses GlassCard for caregiver items
 * - Uses PageHeader component
 */

interface Caregiver {
  caregiverId: string;
  name: string;
  email: string;
  role: 'primary' | 'secondary' | 'viewer';
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function FamilyPage() {
  const { baby, babyId } = useBaby();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [invitations, setInvitations] = useState<InvitationListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'caregivers' | 'invitations'>('caregivers');

  const fetchData = useCallback(async () => {
    if (!babyId || !baby?.caregivers) return;
    
    setLoading(true);
    try {
      setCaregivers(baby.caregivers);
      
      // Fetch invitations for this baby
      const invites = await api.invitations.list(babyId);
      setInvitations(invites);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load caregiver data");
    } finally {
      setLoading(false);
    }
  }, [babyId, baby]);

  useEffect(() => {
    fetchData();
  }, [babyId, baby, fetchData]);

  const handleRemoveCaregiver = async (caregiverId: string) => {
    if (!babyId) return;
    
    const caregiver = caregivers.find(c => c.caregiverId === caregiverId);
    if (!caregiver) return;

    if (!confirm(`Remove ${caregiver.name} from ${baby?.name}'s caregivers?`)) {
      return;
    }

    try {
      setRemovingId(caregiverId);
      await api.babies.removeCaregiver(babyId, caregiverId);
      setCaregivers(prev => prev.filter(c => c.caregiverId !== caregiverId));
      toast.success(`${caregiver.name} removed successfully`);
    } catch (error) {
      console.error("Failed to remove caregiver:", error);
      toast.error("Failed to remove caregiver");
    } finally {
      setRemovingId(null);
    }
  };

  const handleUpdateRole = async (caregiverId: string, newRole: 'primary' | 'secondary' | 'viewer') => {
    if (!babyId) return;

    try {
      setUpdatingRole(caregiverId);
      
      // Note: The API currently only supports 'primary' | 'secondary'
      if (newRole === 'viewer') {
        toast.error("Viewer role is not currently supported by the API.");
        return;
      }

      await api.babies.updateCaregiverRole(babyId, caregiverId, newRole);
      
      setCaregivers(prev => prev.map(c => 
        c.caregiverId === caregiverId ? { ...c, role: newRole } : c
      ));
      toast.success("Role updated successfully");
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    
    try {
      setRevokingId(invitationId);
      await api.invitations.revoke(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      toast.success("Invitation revoked successfully");
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
      toast.error("Failed to revoke invitation");
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopyInviteLink = async (invitation: InvitationListItemDto) => {
    try {
      const inviteLink = `${window.location.origin}/invite/${invitation.tokenHint}`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invitation link copied to clipboard");
    } catch {
      toast.error("Failed to copy invitation link");
    }
  };

  // Loading state with glassmorphism styling
  if (loading) {
    return (
      <main className="flex flex-col gap-6 p-4 pt-6 pb-32">
        <PageHeader 
          title="Family" 
          subtitle="Manage caregivers"
        />
        <div className="space-y-4">
          {/* Caregiver list skeleton */}
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/10 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-white/10 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-white/10 rounded-full animate-pulse" />
                </div>
                <div className="h-8 w-8 rounded-lg bg-white/10 animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
            </GlassCard>
          ))}
        </div>
      </main>
    );
  }

  const primaryCaregivers = caregivers.filter(c => c.role === 'primary');
  const secondaryCaregivers = caregivers.filter(c => c.role === 'secondary');
  const viewers = caregivers.filter(c => c.role === 'viewer');
  const pendingInvitations = invitations.filter(inv => 
    inv.status === 'pending' && !isPast(new Date(inv.expiresAt))
  );

  return (
    <main className="flex flex-col gap-6 p-4 pt-6 pb-32">
      {/* Header with PageHeader component */}
      <PageHeader 
        title="Family" 
        subtitle={baby?.name ? `Caregivers for ${baby.name}` : "Manage caregivers"}
      />

      {/* Tabs with glassmorphism styling */}
      <GlassCard size="sm" className="p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('caregivers')}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 touch-target",
              activeTab === 'caregivers'
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground hover:bg-white/10"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>Caregivers</span>
              <Badge variant="secondary" className="text-xs bg-white/20 backdrop-blur-sm">
                {caregivers.length}
              </Badge>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 touch-target",
              activeTab === 'invitations'
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground hover:bg-white/10"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Invitations</span>
              {pendingInvitations.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {pendingInvitations.length}
                </Badge>
              )}
            </div>
          </button>
        </div>
      </GlassCard>

      {/* Content based on active tab */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >
        {activeTab === 'caregivers' ? (
          <CaregiversTab
            caregivers={caregivers}
            primaryCaregivers={primaryCaregivers}
            secondaryCaregivers={secondaryCaregivers}
            viewers={viewers}
            babyName={baby?.name}
            onRemove={handleRemoveCaregiver}
            onUpdateRole={handleUpdateRole}
            removingId={removingId}
            updatingRole={updatingRole}
            onInvite={() => setShowInviteModal(true)}
          />
        ) : (
          <InvitationsTab
            invitations={invitations}
            babyName={baby?.name}
            onRevoke={handleRevokeInvitation}
            onCopyLink={handleCopyInviteLink}
            revokingId={revokingId}
            onInvite={() => setShowInviteModal(true)}
          />
        )}
      </motion.div>

      {/* Invite FAB Button - Requirement 24.1 */}
      <div className="fixed bottom-24 left-0 right-0 px-4 pb-safe z-10 lg:bottom-8 lg:left-auto lg:right-8 lg:px-0">
        <div className="max-w-md mx-auto lg:max-w-none lg:w-auto">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={() => setShowInviteModal(true)}
            className="w-full lg:w-auto gap-2 shadow-2xl"
          >
            <UserPlus className="w-5 h-5" />
            Invite Caregiver
          </GlassButton>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && babyId && baby && (
        <InviteCaregiverModal
          babyId={babyId}
          babyName={baby.name}
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={fetchData}
        />
      )}
    </main>
  );
}

// Helper functions for role display
function getRoleIcon(role: string) {
  switch (role) {
    case 'primary':
      return <Crown className="w-4 h-4" />;
    case 'secondary':
      return <Shield className="w-4 h-4" />;
    case 'viewer':
      return <Eye className="w-4 h-4" />;
    default:
      return <Users className="w-4 h-4" />;
  }
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'primary':
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case 'secondary':
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case 'viewer':
      return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getRoleDescription(role: string) {
  switch (role) {
    case 'primary':
      return "Full access - can manage all settings and caregivers";
    case 'secondary':
      return "Can log activities and view all data";
    case 'viewer':
      return "Read-only access to baby's information";
    default:
      return "";
  }
}

function getStatusBadge(invitation: InvitationListItemDto) {
  const isExpired = isPast(new Date(invitation.expiresAt));
  
  if (invitation.status === 'accepted') {
    return (
      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 gap-1">
        <CheckCircle className="w-3 h-3" />
        Accepted
      </Badge>
    );
  }
  
  if (invitation.status === 'revoked') {
    return (
      <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 gap-1">
        <XCircle className="w-3 h-3" />
        Revoked
      </Badge>
    );
  }
  
  if (isExpired || invitation.status === 'expired') {
    return (
      <Badge className="bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30 gap-1">
        <Clock className="w-3 h-3" />
        Expired
      </Badge>
    );
  }
  
  return (
    <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
      <Clock className="w-3 h-3" />
      Pending
    </Badge>
  );
}

// Caregivers Tab Component
interface CaregiversTabProps {
  caregivers: Caregiver[];
  primaryCaregivers: Caregiver[];
  secondaryCaregivers: Caregiver[];
  viewers: Caregiver[];
  babyName?: string;
  onRemove: (id: string) => void;
  onUpdateRole: (id: string, role: 'primary' | 'secondary' | 'viewer') => void;
  removingId: string | null;
  updatingRole: string | null;
  onInvite: () => void;
}

function CaregiversTab({
  caregivers,
  primaryCaregivers,
  secondaryCaregivers,
  viewers,
  babyName,
  onRemove,
  onUpdateRole,
  removingId,
  updatingRole,
  onInvite,
}: CaregiversTabProps) {
  // Empty State
  if (caregivers.length === 0) {
    return (
      <motion.div variants={itemVariants}>
        <GlassCard className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No caregivers yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Invite family members or caregivers to help track {babyName || "your baby"}&apos;s activities
          </p>
          <GlassButton variant="primary" onClick={onInvite} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite First Caregiver
          </GlassButton>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <>
      {/* Role Info Card */}
      <motion.div variants={itemVariants}>
        <GlassCard size="sm" className="border-blue-500/20">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">About Caregiver Roles</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span><strong>Primary:</strong> Full control including caregiver management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-blue-500" />
                  <span><strong>Secondary:</strong> Can log activities and view all data</span>
                </li>
                <li className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-gray-500" />
                  <span><strong>Viewer:</strong> Read-only access to information</span>
                </li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Primary Caregivers Section */}
      {primaryCaregivers.length > 0 && (
        <CaregiverSection
          title="Primary Caregivers"
          icon={<Crown className="w-5 h-5 text-amber-500" />}
          caregivers={primaryCaregivers}
          onRemove={onRemove}
          onUpdateRole={onUpdateRole}
          removingId={removingId}
          updatingRole={updatingRole}
        />
      )}

      {/* Secondary Caregivers Section */}
      {secondaryCaregivers.length > 0 && (
        <CaregiverSection
          title="Secondary Caregivers"
          icon={<Shield className="w-5 h-5 text-blue-500" />}
          caregivers={secondaryCaregivers}
          onRemove={onRemove}
          onUpdateRole={onUpdateRole}
          removingId={removingId}
          updatingRole={updatingRole}
        />
      )}

      {/* Viewers Section */}
      {viewers.length > 0 && (
        <CaregiverSection
          title="Viewers"
          icon={<Eye className="w-5 h-5 text-gray-500" />}
          caregivers={viewers}
          onRemove={onRemove}
          onUpdateRole={onUpdateRole}
          removingId={removingId}
          updatingRole={updatingRole}
        />
      )}
    </>
  );
}

// Caregiver Section Component
interface CaregiverSectionProps {
  title: string;
  icon: React.ReactNode;
  caregivers: Caregiver[];
  onRemove: (id: string) => void;
  onUpdateRole: (id: string, role: 'primary' | 'secondary' | 'viewer') => void;
  removingId: string | null;
  updatingRole: string | null;
}

function CaregiverSection({
  title,
  icon,
  caregivers,
  onRemove,
  onUpdateRole,
  removingId,
  updatingRole,
}: CaregiverSectionProps) {
  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h2>
        <Badge variant="secondary" className="text-xs bg-white/10 backdrop-blur-sm ml-auto">
          {caregivers.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-3">
        {caregivers.map((caregiver) => (
          <CaregiverCard
            key={caregiver.caregiverId}
            caregiver={caregiver}
            onRemove={onRemove}
            onUpdateRole={onUpdateRole}
            isRemoving={removingId === caregiver.caregiverId}
            isUpdating={updatingRole === caregiver.caregiverId}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Caregiver Card Component with GlassCard and role badges - Requirement 24.1
interface CaregiverCardProps {
  caregiver: Caregiver;
  onRemove: (id: string) => void;
  onUpdateRole: (id: string, role: 'primary' | 'secondary' | 'viewer') => void;
  isRemoving: boolean;
  isUpdating: boolean;
}

function CaregiverCard({
  caregiver,
  onRemove,
  onUpdateRole,
  isRemoving,
  isUpdating,
}: CaregiverCardProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <GlassCard interactive className="p-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Users className="w-6 h-6 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{caregiver.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground truncate">{caregiver.email}</p>
              </div>
            </div>
            
            {/* Role Badge - Requirement 24.1 */}
            <Badge 
              className={cn(
                "gap-1 cursor-pointer hover:opacity-80 transition-opacity border",
                getRoleBadgeColor(caregiver.role)
              )}
              onClick={() => setShowRoleMenu(!showRoleMenu)}
            >
              {getRoleIcon(caregiver.role)}
              {caregiver.role.charAt(0).toUpperCase() + caregiver.role.slice(1)}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            {getRoleDescription(caregiver.role)}
          </p>

          {/* Role Menu */}
          {showRoleMenu && (
            <div className="mt-3 p-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Change Role</p>
              {(['primary', 'secondary'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onUpdateRole(caregiver.caregiverId, role);
                    setShowRoleMenu(false);
                  }}
                  disabled={isUpdating || caregiver.role === role}
                  className={cn(
                    "w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all touch-target",
                    caregiver.role === role
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-white/10 text-foreground disabled:opacity-50"
                  )}
                >
                  {getRoleIcon(role)}
                  <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                  {caregiver.role === role && (
                    <Icons.Check className="w-3 h-3 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => onRemove(caregiver.caregiverId)}
              disabled={isRemoving || caregiver.role === 'primary'}
              className="h-8 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isRemoving ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Trash2 className="w-3 h-3 mr-1" />
              )}
              Remove
            </GlassButton>
            {caregiver.role === 'primary' && (
              <span className="text-xs text-muted-foreground ml-2">
                Primary caregivers cannot be removed
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// Invitations Tab Component
interface InvitationsTabProps {
  invitations: InvitationListItemDto[];
  babyName?: string;
  onRevoke: (id: string) => void;
  onCopyLink: (invitation: InvitationListItemDto) => void;
  revokingId: string | null;
  onInvite: () => void;
}

function InvitationsTab({
  invitations,
  babyName,
  onRevoke,
  onCopyLink,
  revokingId,
  onInvite,
}: InvitationsTabProps) {
  // Empty State
  if (invitations.length === 0) {
    return (
      <motion.div variants={itemVariants}>
        <GlassCard className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center mb-4">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No invitations sent</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Invite caregivers to help track {babyName || "your baby"}&apos;s activities
          </p>
          <GlassButton variant="primary" onClick={onInvite} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Send Invitation
          </GlassButton>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-3">
      {invitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          onRevoke={onRevoke}
          onCopyLink={onCopyLink}
          isRevoking={revokingId === invitation.id}
        />
      ))}
    </motion.div>
  );
}

// Invitation Card Component with GlassCard
interface InvitationCardProps {
  invitation: InvitationListItemDto;
  onRevoke: (id: string) => void;
  onCopyLink: (invitation: InvitationListItemDto) => void;
  isRevoking: boolean;
}

function InvitationCard({
  invitation,
  onRevoke,
  onCopyLink,
  isRevoking,
}: InvitationCardProps) {
  const isPending = invitation.status === 'pending' && !isPast(new Date(invitation.expiresAt));

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="font-medium text-foreground truncate">
              {invitation.inviteeEmail}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Sent: {format(new Date(invitation.createdAt), 'MMM d, yyyy')}</span>
            <span>•</span>
            <span className={isPast(new Date(invitation.expiresAt)) ? 'text-red-500' : ''}>
              Expires: {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
            </span>
          </div>
          {invitation.acceptedAt && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Accepted: {format(new Date(invitation.acceptedAt), 'MMM d, yyyy')}
            </p>
          )}
        </div>
        {getStatusBadge(invitation)}
      </div>
      
      {isPending && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
          <GlassButton
            variant="default"
            size="sm"
            onClick={() => onCopyLink(invitation)}
            className="text-xs"
          >
            <Icons.Copy className="w-3 h-3 mr-1" />
            Copy Link
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onRevoke(invitation.id)}
            disabled={isRevoking}
            className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {isRevoking ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <XCircle className="w-3 h-3 mr-1" />
            )}
            Revoke
          </GlassButton>
        </div>
      )}
    </GlassCard>
  );
}
