"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Activity, Image as ImageIcon, Grid } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./mobile-menu";

/**
 * MobileNav Component
 *
 * Fixed bottom navigation bar for mobile viewports with glassmorphism styling.
 *
 * Features:
 * - Responsive visibility: visible on viewports <lg (1024px), hidden on lg+
 * - Fixed bottom positioning with pb-safe padding for home indicator safe area
 * - Exactly 5 navigation items: Home, Log, Activity, Memories, More
 * - Top indicator bar with glow effect for active item
 * - Opens drawer when More is tapped
 * - 48px minimum touch targets for all interactive elements
 *
 * @requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

// Navigation item type definition
interface NavItem {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  isMenu?: boolean;
}

// Navigation items - exactly 5 as per Requirements 11.3
const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/log", label: "Log", icon: PlusCircle },
  { href: "/tracking", label: "Activity", icon: Activity },
  { href: "/memories", label: "Memories", icon: ImageIcon },
  { label: "More", icon: Grid, isMenu: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if a navigation item is active based on current pathname
  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  // Handle More button click - Requirements 11.5
  const handleMoreClick = () => {
    setIsMenuOpen(true);
  };

  // Close the menu drawer
  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Navigation Bar */}
      {/* Requirements 11.1: visible <lg, hidden lg+ */}
      <nav
        className={cn(
          // Requirements 11.1: Responsive visibility - visible below lg, hidden at lg+
          "lg:hidden",
          // Requirements 11.2: Fixed bottom positioning
          "fixed bottom-0 left-0 right-0 z-50",
          // Glassmorphism styling
          "glass border-t border-[var(--glass-border)]",
          // Requirements 11.2: pb-safe padding for home indicator safe area
          "pb-safe"
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isMenu ? false : isActive(item.href);

            // More button - Requirements 11.5
            if (item.isMenu) {
              return (
                <button
                  key={item.label}
                  onClick={handleMoreClick}
                  className={cn(
                    // Requirements 11.6: 48px minimum touch target
                    "touch-target",
                    // Layout
                    "relative flex flex-col items-center justify-center gap-1",
                    // Styling
                    "text-muted-foreground hover:text-foreground",
                    // Transitions
                    "transition-colors duration-200",
                    // Focus state for accessibility
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
                  )}
                  aria-label={`Open ${item.label} menu`}
                  aria-expanded={isMenuOpen}
                  aria-haspopup="dialog"
                >
                  <Icon className="w-6 h-6" strokeWidth={2} />
                  <span className="text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                </button>
              );
            }

            // Regular navigation link
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  // Requirements 11.6: 48px minimum touch target
                  "touch-target",
                  // Layout
                  "relative flex flex-col items-center justify-center gap-1",
                  // Transitions
                  "transition-colors duration-200",
                  // Focus state for accessibility
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl",
                  // Active/inactive states
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                {/* Requirements 11.4: Active indicator bar with glow effect */}
                {active && (
                  <div
                    className={cn(
                      // Positioning
                      "absolute -top-1 left-1/2 -translate-x-1/2",
                      // Size and shape
                      "w-8 h-1 rounded-full",
                      // Color and glow
                      "bg-primary glow-primary"
                    )}
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className="w-6 h-6"
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[10px] leading-none",
                    active ? "font-semibold" : "font-medium"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Menu Drawer - Requirements 11.5 */}
      <MobileMenu isOpen={isMenuOpen} onClose={handleCloseMenu} />
    </>
  );
}

export default MobileNav;
