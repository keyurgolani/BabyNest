"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import {
  X,
  FileText,
  Calendar,
  Users,
  Heart,
  Star,
  Settings,
  LogOut,
  User,
} from "lucide-react";

/**
 * MobileMenu Component
 *
 * A drawer component that opens from the bottom when the "More" button is tapped
 * in the MobileNav. Displays secondary navigation items not shown in the main
 * bottom navigation bar.
 *
 * Features:
 * - Glassmorphism styling (backdrop-blur-xl, bg-white/10, border-white/20)
 * - Secondary navigation items: Reports, Calendar, Family, Health, Milestones, Settings
 * - Slide-up animation with spring physics
 * - Backdrop blur overlay
 * - User profile section
 * - Sign out functionality
 *
 * @requirements 11.5
 */

// Secondary navigation items not in MobileNav
// MobileNav has: Home, Log, Activity, Memories, More
// This menu shows: Reports, Calendar, Family, Health, Milestones, Settings
const SECONDARY_NAV_ITEMS = [
  { href: "/report", label: "Reports", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/family", label: "Family", icon: Users },
  { href: "/health", label: "Health", icon: Heart },
  { href: "/milestones", label: "Milestones", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const menuVariants = {
    hidden: { y: "100%", opacity: 0.5 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 200,
      },
    },
    exit: {
      y: "100%",
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn" as const,
      },
    },
  };

  const handleSignOut = () => {
    logout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            aria-hidden="true"
          />

          {/* Menu Drawer with Glassmorphism Styling */}
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className={cn(
              "fixed inset-x-0 bottom-0 z-[70]",
              "max-h-[85vh] flex flex-col overflow-hidden",
              // Glassmorphism styling: backdrop-blur-xl, bg-white/10, border-white/20
              "backdrop-blur-xl bg-white/10 dark:bg-black/20",
              "border-t border-white/20",
              "rounded-t-3xl shadow-2xl"
            )}
          >
            {/* Drag Handle */}
            <div className="flex items-center justify-center py-3">
              <div className="w-12 h-1.5 rounded-full bg-white/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg text-foreground">
                    More
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Additional options
                  </p>
                </div>
              </div>
              <GlassButton
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </GlassButton>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* User Profile Card */}
              <GlassCard variant="featured" size="sm" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center text-primary font-bold text-lg ring-2 ring-primary/30">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                      Signed in as
                    </p>
                    <p className="text-base font-bold text-foreground truncate">
                      {user?.name || "Parent"}
                    </p>
                  </div>
                  <Link href="/profile" onClick={onClose}>
                    <GlassButton variant="ghost" size="icon" aria-label="View profile">
                      <User className="w-5 h-5" />
                    </GlassButton>
                  </Link>
                </div>
              </GlassCard>

              {/* Secondary Navigation Items */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                  Navigate
                </p>
                <nav className="grid grid-cols-2 gap-2" aria-label="Secondary navigation">
                  {SECONDARY_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className="block"
                      >
                        <GlassCard
                          interactive
                          size="sm"
                          variant={isActive ? "featured" : "default"}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 py-4",
                            "touch-target",
                            isActive && "ring-1 ring-primary/30"
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              isActive
                                ? "bg-primary/20 text-primary"
                                : "bg-white/10 text-muted-foreground"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isActive ? "text-primary" : "text-foreground"
                            )}
                          >
                            {item.label}
                          </span>
                        </GlassCard>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Sign Out Section */}
              <div className="pt-2">
                <GlassButton
                  variant="danger"
                  className="w-full justify-center gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </GlassButton>
              </div>
            </div>

            {/* Safe area padding for home indicator */}
            <div className="pb-safe" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MobileMenu;
