"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { api, InvitationListItemDto } from "@/lib/api-client";
import { format, isPast } from "date-fns";
import { useAuth } from "@/components/auth-provider";

interface Caregiver {
  caregiverId: string;
  name: string;
  email: string;
  role: 'primary' | 'secondary' | 'viewer';
}

interface ManageCaregiversModalProps {
  babyId: string;
  onClose: () => void;
}

export function ManageCaregiversModal({ babyId, onClose }: ManageCaregiversModalProps) {
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
  }, [babyId]);

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
      // Optimistically update or re-fetch. Since revoke is void, we remove it or mark as revoked.
      // Backend status update might not be instant in list call if strictly consistent?
      // But typically we can just re-fetch or filter.
      // Re-fetch is safer.
      const invites = await api.invitations.list(babyId);
      setInvitations(invites);
    } catch {
      alert("Failed to revoke invitation");
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-2xl animate-scale-in shadow-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-4 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                <Icons.Users className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Manage Caregivers</CardTitle>
                <CardDescription>Invite and manage access to your baby&apos;s profile</CardDescription>
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

        <div className="px-6 border-b border-border/50 shrink-0">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('caregivers')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'caregivers' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Active Caregivers
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invitations' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Invitations
            </button>
          </div>
        </div>

        <CardContent className="pt-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {activeTab === 'caregivers' ? (
            <div className="space-y-6">
              <div className="space-y-3">
                 <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Caregivers</h3>
                 {isLoading ? (
                   <div className="py-8 text-center text-muted-foreground">Loading...</div>
                 ) : caregivers.length > 0 ? (
                   <div className="space-y-2">
                     {caregivers.map((caregiver) => (
                       <div key={caregiver.caregiverId} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                             {caregiver.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <p className="font-medium text-foreground">{caregiver.name}</p>
                             <div className="flex items-center gap-2">
                               <span className="text-xs text-muted-foreground">{caregiver.email}</span>
                               <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                 caregiver.role === 'primary' 
                                   ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                                   : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                               }`}>
                                 {caregiver.role}
                               </span>
                             </div>
                           </div>
                         </div>
                         {caregiver.role !== 'primary' && user?.id !== caregiver.caregiverId && (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                             onClick={() => handleRemoveCaregiver(caregiver.caregiverId)}
                           >
                              Remove
                           </Button>
                         )}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="py-8 text-center text-muted-foreground">No caregivers found</div>
                 )}
              </div>

              <div className="pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Invite New Caregiver</h3>
                <form onSubmit={handleInvite} className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Email address"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-sm"
                      disabled={isInviting}
                    />
                    <Button 
                      type="submit" 
                      variant="glow"
                      className="rounded-xl px-6"
                      disabled={isInviting || !inviteEmail}
                    >
                      {isInviting ? "Sending..." : "Invite"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground pl-1">
                    Caregivers will be invited as <strong>Secondary</strong> caregivers by default.
                  </p>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                 <div className="py-8 text-center text-muted-foreground">Loading...</div>
               ) : invitations.length > 0 ? (
                 <div className="space-y-2">
                   {invitations.map((invite) => {
                     const isExpired = isPast(new Date(invite.expiresAt));
                     return (
                       <div key={invite.id} className="p-3 rounded-xl bg-muted/50 border border-border/50">
                         <div className="flex items-center justify-between mb-2">
                           <p className="font-medium text-foreground">{invite.inviteeEmail}</p>
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                             invite.status === 'pending' && !isExpired ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                             invite.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                             invite.status === 'revoked' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                             'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                           }`}>
                             {isExpired && invite.status === 'pending' ? 'EXPIRED' : invite.status.toUpperCase()}
                           </span>
                         </div>
                         <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                           <span>Sent: {format(new Date(invite.createdAt), 'MMM d, yyyy')}</span>
                           <span>•</span>
                           <span className={isExpired ? 'text-red-500' : ''}>
                             Expires: {format(new Date(invite.expiresAt), 'MMM d, yyyy')}
                           </span>
                         </div>
                         {invite.status === 'pending' && !isExpired && (
                           <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                             <div className="flex-1 px-2 py-1.5 bg-muted rounded-lg text-xs font-mono text-muted-foreground truncate">
                               {invite.tokenHint}
                             </div>
                             <Button 
                               variant="ghost" 
                               size="sm"
                               className="text-xs shrink-0"
                               onClick={() => handleCopyInviteCode(invite)}
                             >
                               {copiedId === invite.id ? (
                                 <>
                                   <Icons.Check className="w-3 h-3 mr-1" />
                                   Copied
                                 </>
                               ) : (
                                 <>
                                   <Icons.Copy className="w-3 h-3 mr-1" />
                                   Copy Link
                                 </>
                               )}
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="sm"
                               className="text-red-500 hover:text-red-600 text-xs shrink-0"
                               onClick={() => handleRevokeInvitation(invite.id)}
                             >
                               Revoke
                             </Button>
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                   <Icons.Mail className="w-12 h-12 mb-3 opacity-20" />
                   <p>No invitations sent yet</p>
                 </div>
               )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
