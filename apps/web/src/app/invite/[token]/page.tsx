"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { 
  Loader2, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Baby,
  Heart
} from "lucide-react";

/**
 * Accept Invitation Page with Glassmorphism Styling
 * 
 * @requirements 22.4 - Display welcome card with inviter name and accept button
 * Uses GlassCard, GlassButton components on mesh gradient background
 */

interface InvitationInfo {
  valid: boolean;
  babyName: string;
  inviterName: string;
  inviteeEmail: string;
  status: string;
  expiresAt: string;
  error?: string;
}

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = params.token as string;

  const [isValidating, setIsValidating] = useState(true);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate the invitation on mount (before auth check)
  useEffect(() => {
    const validateInvitation = async () => {
      try {
        const info = await api.invitations.validate(token);
        setInvitationInfo(info);
        if (!info.valid && info.error) {
          setError(info.error);
        }
      } catch {
        setError("Failed to validate invitation");
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      validateInvitation();
    } else {
      setIsValidating(false);
      setError("Invalid invitation link");
    }
  }, [token]);

  useEffect(() => {
    // If not authenticated and invitation is valid, redirect to login with return URL
    if (!authLoading && !user && invitationInfo?.valid) {
      const returnUrl = encodeURIComponent(`/invite/${token}`);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
    }
  }, [user, authLoading, token, router, invitationInfo]);

  const handleAccept = async () => {
    if (!token) {
      setError("Invalid invitation link");
      return;
    }

    setIsAccepting(true);
    setError(null);

    try {
      const result = await api.invitations.accept(token);
      setSuccess(true);
      toast.success(`You are now a caregiver for ${result.babyName}!`);
      
      // Redirect to the baby's dashboard after a short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to accept invitation";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    setIsDeclining(true);
    toast.info("Invitation declined");
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  // Show loading state while validating invitation
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
        <GlassCard className="w-full max-w-md text-center" size="lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
              <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Validating Invitation
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Please wait while we verify your invitation...
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Show error state if invitation is invalid
  if (invitationInfo && !invitationInfo.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
        <GlassCard className="w-full max-w-md" size="lg" variant="danger">
          {/* Header with Error Icon */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shadow-lg shadow-destructive/30">
                {invitationInfo.status === 'expired' ? (
                  <Clock className="w-8 h-8 text-destructive-foreground" />
                ) : (
                  <XCircle className="w-8 h-8 text-destructive-foreground" />
                )}
              </div>
            </div>
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              {invitationInfo.status === 'expired' ? 'Invitation Expired' : 
               invitationInfo.status === 'accepted' ? 'Already Accepted' :
               invitationInfo.status === 'revoked' ? 'Invitation Revoked' :
               'Invalid Invitation'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {invitationInfo.error || 'This invitation is no longer valid'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Info about the invitation */}
            {invitationInfo.babyName && (
              <div className="p-4 bg-white/5 dark:bg-black/10 rounded-xl border border-white/10">
                <p className="text-sm text-muted-foreground">
                  This invitation was for <span className="font-medium text-foreground">{invitationInfo.babyName}</span>
                  {invitationInfo.inviterName && (
                    <> from <span className="font-medium text-foreground">{invitationInfo.inviterName}</span></>
                  )}
                </p>
              </div>
            )}

            <GlassButton
              variant="default"
              onClick={() => router.push("/")}
              className="w-full"
            >
              Go to Home
            </GlassButton>

            {invitationInfo.status === 'expired' && (
              <p className="text-xs text-center text-muted-foreground">
                Please ask the primary caregiver to send a new invitation
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
        <GlassCard className="w-full max-w-md text-center" size="lg">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking authentication...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // If not authenticated and invitation is valid, show nothing (will redirect to login)
  if (!user && invitationInfo?.valid) {
    return null;
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
        <GlassCard className="w-full max-w-md" size="lg" variant="featured">
          {/* Header with Success Icon */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              Invitation Accepted!
            </h1>
            <p className="text-muted-foreground mt-1">
              You&apos;ve successfully joined as a caregiver
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="p-4 bg-white/5 dark:bg-black/10 rounded-xl border border-white/10">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4 text-pink-500" />
                <span>You can now help care for <span className="font-medium text-foreground">{invitationInfo?.babyName}</span></span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting you to the dashboard...</span>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Main invitation acceptance view
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      <GlassCard className="w-full max-w-md" size="lg">
        {/* Header with Welcome Message - Requirement 22.4 */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
              <UserPlus className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Caregiver Invitation
          </h1>
          {/* Welcome card with inviter name - Requirement 22.4 */}
          <p className="text-muted-foreground mt-1">
            {invitationInfo?.inviterName ? (
              <><span className="font-medium text-foreground">{invitationInfo.inviterName}</span> has invited you to help care for <span className="font-medium text-foreground">{invitationInfo.babyName}</span></>
            ) : (
              <>You&apos;ve been invited to become a caregiver</>
            )}
          </p>
        </div>

        <div className="space-y-4">
          {/* Baby Info Card */}
          {invitationInfo?.babyName && (
            <div className="p-4 bg-white/5 dark:bg-black/10 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center shadow-md">
                  <Baby className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{invitationInfo.babyName}</p>
                  <p className="text-xs text-muted-foreground">
                    {invitationInfo.inviterName && `Invited by ${invitationInfo.inviterName}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Card - What you'll be able to do */}
          <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  What you&apos;ll be able to do:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    Log baby activities (feeding, sleep, diapers, etc.)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    View all tracking data and insights
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    Add memories and milestones
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    Receive reminders and notifications
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Email mismatch warning */}
          {user && invitationInfo && user.email.toLowerCase() !== invitationInfo.inviteeEmail.toLowerCase() && (
            <div className="p-4 bg-yellow-500/10 dark:bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    Email mismatch
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    This invitation was sent to <span className="font-medium">{invitationInfo.inviteeEmail}</span>, 
                    but you&apos;re logged in as <span className="font-medium">{user.email}</span>. 
                    You may need to log in with the correct account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">
                    Error
                  </p>
                  <p className="text-xs text-destructive/80">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Requirement 22.4 */}
          <div className="flex flex-col gap-3 pt-2">
            <GlassButton
              variant="primary"
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
              className="w-full"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </GlassButton>
            
            <GlassButton
              variant="ghost"
              onClick={handleDecline}
              disabled={isAccepting || isDeclining}
              className="w-full"
            >
              {isDeclining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </>
              )}
            </GlassButton>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            By accepting, you agree to help care for this baby&apos;s profile
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
