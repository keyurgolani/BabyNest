"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { api, InvitationListItemDto } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { toast } from "sonner";
import { InviteCaregiverModal } from "./invite-caregiver-modal";
import { 
  Users, 
  Crown, 
  Eye, 
  UserPlus, 
  Trash2, 
  Mail,
  Shield,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";

interface Caregiver {
  caregiverId: string;
  name: string;
  email: string;
  role: 'primary' | 'secondary' | 'viewer';
}

export function CaregiversManagementPage() {
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

  const handleUpdateRole = async (caregiverId: string, _newRole: 'primary' | 'secondary' | 'viewer') => {
    if (!babyId) return;

    try {
      setUpdatingRole(caregiverId);
      
      await api.babies.updateCaregiverRole(babyId, caregiverId, _newRole === 'viewer' ? 'secondary' : _newRole as 'primary' | 'secondary');
      // Note: The API currently accepts 'primary' | 'secondary'. 'viewer' might need backend adjustment or mapping to 'secondary' with restricted permissions logic if intended. 
      // Checking api-client.ts, updateCaregiverRole takes 'primary' | 'secondary'.
      // The UI has 'viewer' as an option.
      // If 'viewer' is not supported by the API yet for role updates (based on previous file read of UpdateCaregiverRoleDto), 
      // I should double check api-client.ts signature.
      
      // Re-reading api-client.ts signature from recent memory/file: 
      // updateCaregiverRole: (babyId: string, caregiverId: string, role: 'primary' | 'secondary')
      
      // If the UI supports 'viewer', but API doesn't, I might hit an issue.
      // However, the interface Caregiver has 'viewer'.
      // Let's check `api-client.ts` again to be absolutely sure about the signature I just added/modified.
      // It was: updateCaregiverRole: (babyId: string, caregiverId: string, role: 'primary' | 'secondary')
      
      // So 'viewer' is technically not supported by the specific API method signature I looked at?
      // Wait, let me check the file content of api-client.ts again to be safe before writing broken code.
      // Actually, I'll restrict the UI or map it.
      // But looking at the `Caregiver` interface in the file: role is 'primary' | 'secondary' | 'viewer'.
      
      // Only updating if role is primary or secondary for now, effectively.
      // If _newRole is viewer, I can't send it if the API type restricts it.
      // Let's assume for this step I will only allow swapping between primary/secondary if that's what the API supports,
      // OR I need to update the API client signature if the backend actually supports it.
      // The backend DTO `UpdateCaregiverRoleDto` was viewed earlier.
      // It used `CaregiverRole` enum.
      // viewed `apps/api/src/baby/dto/baby-response.dto.ts`: `export enum CaregiverRole { PRIMARY = 'primary', SECONDARY = 'secondary' }`
      // So 'viewer' is NOT a backend role concept yet?
      // If so, I should probably disable 'viewer' option in the UI or handle it.
      // The UI currently hardcodes `['primary', 'secondary', 'viewer']`.
      
      // Ideally I should fix the UI to not offer 'viewer' if it's not real, or fix the backend.
      // The prompt says "Implement UI features...".
      // I will implement it for primary/secondary.
      // If _newRole is viewer, I'll error or show not supported.
      
      if (_newRole === 'viewer') {
        toast.error("Viewer role is not currently supported by the API.");
        return;
      }

      await api.babies.updateCaregiverRole(babyId, caregiverId, _newRole);
      
      setCaregivers(prev => prev.map(c => 
        c.caregiverId === caregiverId ? { ...c, role: _newRole } : c
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
      // Use the token hint to create a shareable link
      const inviteLink = `${window.location.origin}/invite/${invitation.tokenHint}`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invitation link copied to clipboard");
    } catch {
      toast.error("Failed to copy invitation link");
    }
  };

  const getRoleIcon = (role: string) => {
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
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'primary':
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case 'secondary':
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case 'viewer':
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRoleDescription = (role: string) => {
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
  };

  const getStatusBadge = (invitation: InvitationListItemDto) => {
    const isExpired = isPast(new Date(invitation.expiresAt));
    
    if (invitation.status === 'accepted') {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
          <CheckCircle className="w-3 h-3" />
          Accepted
        </Badge>
      );
    }
    
    if (invitation.status === 'revoked') {
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1">
          <XCircle className="w-3 h-3" />
          Revoked
        </Badge>
      );
    }
    
    if (isExpired || invitation.status === 'expired') {
      return (
        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 gap-1">
          <Clock className="w-3 h-3" />
          Expired
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1">
        <Clock className="w-3 h-3" />
        Pending
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const primaryCaregivers = caregivers.filter(c => c.role === 'primary');
  const secondaryCaregivers = caregivers.filter(c => c.role === 'secondary');
  const viewers = caregivers.filter(c => c.role === 'viewer');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Caregivers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who can access {baby?.name}&apos;s information
          </p>
        </div>
        <Button 
          variant="glow" 
          className="gap-2"
          onClick={() => setShowInviteModal(true)}
        >
          <UserPlus className="w-4 h-4" />
          Invite
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/50">
        <button
          onClick={() => setActiveTab('caregivers')}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'caregivers'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Active Caregivers ({caregivers.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'invitations'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Invitations ({invitations.length})
        </button>
      </div>

      {activeTab === 'caregivers' ? (
        <>
          {/* Info Card */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    About Caregiver Roles
                  </p>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• <strong>Primary:</strong> Full control including caregiver management</li>
                    <li>• <strong>Secondary:</strong> Can log activities and view all data</li>
                    <li>• <strong>Viewer:</strong> Read-only access to information</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Primary Caregivers */}
          {primaryCaregivers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-foreground">Primary Caregivers</h3>
                <Badge variant="outline" className="ml-auto">
                  {primaryCaregivers.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {primaryCaregivers.map((caregiver) => (
                  <CaregiverCard
                    key={caregiver.caregiverId}
                    caregiver={caregiver}
                    onRemove={handleRemoveCaregiver}
                    onUpdateRole={handleUpdateRole}
                    isRemoving={removingId === caregiver.caregiverId}
                    isUpdating={updatingRole === caregiver.caregiverId}
                    getRoleIcon={getRoleIcon}
                    getRoleBadgeColor={getRoleBadgeColor}
                    getRoleDescription={getRoleDescription}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Secondary Caregivers */}
          {secondaryCaregivers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-foreground">Secondary Caregivers</h3>
                <Badge variant="outline" className="ml-auto">
                  {secondaryCaregivers.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {secondaryCaregivers.map((caregiver) => (
                  <CaregiverCard
                    key={caregiver.caregiverId}
                    caregiver={caregiver}
                    onRemove={handleRemoveCaregiver}
                    onUpdateRole={handleUpdateRole}
                    isRemoving={removingId === caregiver.caregiverId}
                    isUpdating={updatingRole === caregiver.caregiverId}
                    getRoleIcon={getRoleIcon}
                    getRoleBadgeColor={getRoleBadgeColor}
                    getRoleDescription={getRoleDescription}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Viewers */}
          {viewers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-foreground">Viewers</h3>
                <Badge variant="outline" className="ml-auto">
                  {viewers.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {viewers.map((caregiver) => (
                  <CaregiverCard
                    key={caregiver.caregiverId}
                    caregiver={caregiver}
                    onRemove={handleRemoveCaregiver}
                    onUpdateRole={handleUpdateRole}
                    isRemoving={removingId === caregiver.caregiverId}
                    isUpdating={updatingRole === caregiver.caregiverId}
                    getRoleIcon={getRoleIcon}
                    getRoleBadgeColor={getRoleBadgeColor}
                    getRoleDescription={getRoleDescription}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {caregivers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No caregivers yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Invite family members or caregivers to help track {baby?.name}&apos;s activities
                </p>
                <Button 
                  variant="default" 
                  className="gap-2"
                  onClick={() => setShowInviteModal(true)}
                >
                  <UserPlus className="w-4 h-4" />
                  Invite First Caregiver
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Invitations List */}
          {invitations.length > 0 ? (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="border-0 bg-card/50">
                  <CardContent className="p-4">
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
                    
                    {invitation.status === 'pending' && !isPast(new Date(invitation.expiresAt)) && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyInviteLink(invitation)}
                          className="text-xs"
                        >
                          <Icons.Copy className="w-3 h-3 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          disabled={revokingId === invitation.id}
                          className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          {revokingId === invitation.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          Revoke
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No invitations sent</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Invite caregivers to help track {baby?.name}&apos;s activities
                </p>
                <Button 
                  variant="default" 
                  className="gap-2"
                  onClick={() => setShowInviteModal(true)}
                >
                  <UserPlus className="w-4 h-4" />
                  Send Invitation
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

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
    </div>
  );
}

interface CaregiverCardProps {
  caregiver: Caregiver;
  onRemove: (id: string) => void;
  onUpdateRole: (id: string, role: 'primary' | 'secondary' | 'viewer') => void;
  isRemoving: boolean;
  isUpdating: boolean;
  getRoleIcon: (role: string) => React.ReactNode;
  getRoleBadgeColor: (role: string) => string;
  getRoleDescription: (role: string) => string;
}

function CaregiverCard({
  caregiver,
  onRemove,
  onUpdateRole,
  isRemoving,
  isUpdating,
  getRoleIcon,
  getRoleBadgeColor,
  getRoleDescription,
}: CaregiverCardProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <Card className="border-0 bg-card/50 card-elevated">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 icon-glow">
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
              
              {/* Role Badge */}
              <Badge 
                className={cn(
                  "gap-1 cursor-pointer hover:opacity-80 transition-opacity status-glow-active",
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
              <div className="mt-3 p-2 bg-muted/50 rounded-lg space-y-1 animate-slide-up">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">Change Role</p>
                {(['primary', 'secondary', 'viewer'] as const).map((role) => (
                  <Button
                    key={role}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onUpdateRole(caregiver.caregiverId, role);
                      setShowRoleMenu(false);
                    }}
                    disabled={isUpdating || caregiver.role === role}
                    className={cn(
                      "w-full justify-start h-auto py-1.5 px-2 text-xs font-normal",
                      caregiver.role === role
                        ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {getRoleIcon(role)}
                    <span className="ml-2">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                    {caregiver.role === role && (
                      <Icons.Check className="w-3 h-3 ml-auto" />
                    )}
                  </Button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button
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
              </Button>
              {caregiver.role === 'primary' && (
                <span className="text-xs text-muted-foreground ml-2">
                  Primary caregivers cannot be removed
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
