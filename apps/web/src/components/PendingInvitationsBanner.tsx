"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { UserPlus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PendingInvitation {
  token: string;
  babyName: string;
  inviterName: string;
  expiresAt: string;
}

/**
 * Banner showing pending caregiver invitations for the current user
 * Displays at the top of the UI when user has pending invitations
 */
export function PendingInvitationsBanner() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPendingInvitations = async () => {
      if (!user) {
        setInvitations([]);
        setIsLoading(false);
        return;
      }

      try {
        const pending = await api.invitations.getPending();
        setInvitations(pending);
      } catch (err) {
        console.error("Failed to fetch pending invitations:", err);
        setInvitations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingInvitations();
  }, [user]);

  const handleDismiss = (token: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed((prev) => new Set([...prev, token]));
  };

  // Filter out dismissed invitations
  const visibleInvitations = invitations.filter((inv) => !dismissed.has(inv.token));

  if (isLoading || visibleInvitations.length === 0) {
    return null;
  }

  // Show the first pending invitation (most recent)
  const invitation = visibleInvitations[0];
  const remainingCount = visibleInvitations.length - 1;

  return (
    <div
      className={cn(
        "w-full flex-shrink-0",
        "bg-gradient-to-r from-blue-500 to-indigo-500",
        "px-4 py-3 md:py-2",
        "shadow-lg"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/invite/${invitation.token}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white/80 text-xs font-medium">
              Caregiver Invitation
            </span>
            <div className="flex items-center gap-1">
              <span className="text-white font-medium text-sm truncate">
                {invitation.inviterName} invited you to care for{" "}
                <span className="font-bold">{invitation.babyName}</span>
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          {remainingCount > 0 && (
            <span className="text-white/70 text-xs hidden sm:inline">
              +{remainingCount} more
            </span>
          )}
          <Link href={`/invite/${invitation.token}`}>
            <Button
              variant="ghost"
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 active:scale-95 rounded-full px-3 py-1.5 transition-all h-auto border-0 text-white hover:text-white"
            >
              <span className="text-white text-xs font-medium">View</span>
              <ChevronRight className="w-3 h-3 text-white" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={(e) => handleDismiss(invitation.token, e)}
            className="w-7 h-7 p-0 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all border-0 text-white hover:text-white"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
