"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { Loader2, UserPlus, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";

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
      <MobileContainer>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Validating invitation...</p>
          </div>
        </div>
      </MobileContainer>
    );
  }

  // Show error state if invitation is invalid
  if (invitationInfo && !invitationInfo.valid) {
    return (
      <MobileContainer>
        <div className="p-6 space-y-6 animate-slide-up min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md">
            <Card className="border-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  {invitationInfo.status === 'expired' ? (
                    <Clock className="w-8 h-8 text-red-600 dark:text-red-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {invitationInfo.status === 'expired' ? 'Invitation Expired' : 
                   invitationInfo.status === 'accepted' ? 'Already Accepted' :
                   invitationInfo.status === 'revoked' ? 'Invitation Revoked' :
                   'Invalid Invitation'}
                </CardTitle>
                <CardDescription>
                  {invitationInfo.error || 'This invitation is no longer valid'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {invitationInfo.babyName && (
                  <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      This invitation was for <span className="font-medium text-foreground">{invitationInfo.babyName}</span>
                      {invitationInfo.inviterName && (
                        <> from <span className="font-medium text-foreground">{invitationInfo.inviterName}</span></>
                      )}
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full"
                  size="lg"
                >
                  Go to Home
                </Button>
                {invitationInfo.status === 'expired' && (
                  <p className="text-xs text-center text-muted-foreground">
                    Please ask the primary caregiver to send a new invitation
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MobileContainer>
    );
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <MobileContainer>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileContainer>
    );
  }

  // If not authenticated and invitation is valid, show nothing (will redirect to login)
  if (!user && invitationInfo?.valid) {
    return null;
  }

  return (
    <MobileContainer>
      <div className="p-6 space-y-6 animate-slide-up min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          {success ? (
            <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl">Invitation Accepted!</CardTitle>
                <CardDescription>
                  You&apos;ve successfully joined as a caregiver
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Redirecting you to the dashboard...
                </p>
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 bg-card/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl">Caregiver Invitation</CardTitle>
                <CardDescription>
                  {invitationInfo?.inviterName ? (
                    <>{invitationInfo.inviterName} has invited you to help care for <span className="font-medium">{invitationInfo.babyName}</span></>
                  ) : (
                    <>You&apos;ve been invited to become a caregiver</>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Info Card */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        What you&apos;ll be able to do:
                      </p>
                      <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Log baby activities (feeding, sleep, diapers, etc.)</li>
                        <li>• View all tracking data and insights</li>
                        <li>• Add memories and milestones</li>
                        <li>• Receive reminders and notifications</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Email mismatch warning */}
                {user && invitationInfo && user.email.toLowerCase() !== invitationInfo.inviteeEmail.toLowerCase() && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-xl">
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

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
                    <div className="flex gap-3">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                          Error
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    onClick={handleAccept}
                    disabled={isAccepting || isDeclining}
                    className="w-full"
                    size="lg"
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
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDecline}
                    disabled={isAccepting || isDeclining}
                    className="w-full"
                    size="lg"
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
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground pt-2">
                  By accepting, you agree to help care for this baby&apos;s profile
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MobileContainer>
  );
}
