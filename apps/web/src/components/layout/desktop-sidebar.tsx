"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  Clock,
  Image as ImageIcon,
  FileText,
  Calendar,
  Users,
  Heart,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DesktopSidebar Component
 *
 * Desktop navigation sidebar with glassmorphism styling.
 *
 * Features:
 * - Fixed left positioning with full viewport height
 * - Collapsed (72px) and expanded (280px) width states
 * - Logo, nav groups (Overview, Tracking, Care, System), user profile
 * - All 10 navigation items with active state highlighting
 * - hidden lg:flex responsive visibility
 *
 * @requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

export interface DesktopSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Navigation item structure
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Navigation group structure
interface NavGroup {
  label: string;
  items: NavItem[];
}

// Navigation groups with all 10 required items
// Requirements 10.4, 10.5
const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/log", label: "Quick Log", icon: PlusCircle },
    ],
  },
  {
    label: "Tracking",
    items: [
      { href: "/tracking/timeline", label: "Timeline", icon: Clock },
      { href: "/memories", label: "Memories", icon: ImageIcon },
      { href: "/report", label: "Reports", icon: FileText },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "Care",
    items: [
      { href: "/family", label: "Family", icon: Users },
      { href: "/health", label: "Health", icon: Heart },
      { href: "/milestones", label: "Milestones", icon: Star },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export function DesktopSidebar({
  collapsed = false,
  onToggleCollapse,
}: DesktopSidebarProps) {
  const pathname = usePathname();

  // Check if a navigation item is active
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <aside
      className={cn(
        // Requirements 10.1: hidden lg:flex responsive visibility
        "hidden lg:flex",
        // Requirements 10.2: fixed left positioning with full height
        "fixed left-0 top-0 h-screen",
        // Requirements 10.3: collapsed (72px) and expanded (280px) width states
        collapsed ? "w-[72px]" : "w-[280px]",
        // Sidebar styling - using glass-sidebar to avoid backdrop-blur artifacts
        "flex-col glass-sidebar border-r border-[var(--glass-border)]",
        // Transition for smooth collapse/expand
        "transition-all duration-300 ease-in-out",
        // Z-index to stay above content
        "z-40"
      )}
      aria-label="Desktop navigation"
    >
      {/* Logo Section */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-6 border-b border-[var(--glass-border)]",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
          <span className="text-primary-foreground font-bold text-lg">B</span>
        </div>
        {!collapsed && (
          <span className="font-heading font-bold text-xl tracking-tight text-foreground">
            BabyNest
          </span>
        )}
      </div>

      {/* Navigation Groups - Requirements 10.4, 10.5 */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            {/* Group Label */}
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-foreground/70 dark:text-foreground/80 uppercase tracking-wider">
                {group.label}
              </h3>
            )}

            {/* Group Items */}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                        // Touch target minimum
                        "min-h-[44px]",
                        // Collapsed state centering
                        collapsed && "justify-center px-2",
                        // Requirements 10.6: active state highlighting
                        active
                          ? [
                              "bg-primary/15 text-primary",
                              "shadow-sm",
                              "border border-primary/20",
                            ]
                          : [
                              "text-muted-foreground",
                              "hover:bg-[var(--glass-bg-hover)]",
                              "hover:text-foreground",
                            ]
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          active && "text-primary"
                        )}
                      />
                      {!collapsed && (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            active && "font-semibold"
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                      {/* Active indicator dot for collapsed state */}
                      {collapsed && active && (
                        <span
                          className="absolute right-1 w-1.5 h-1.5 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile Section */}
      <div
        className={cn(
          "border-t border-[var(--glass-border)] p-4",
          collapsed && "px-2"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl",
            "hover:bg-[var(--glass-bg-hover)] transition-colors cursor-pointer",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-secondary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                User Profile
              </p>
              <p className="text-xs text-foreground/70 dark:text-foreground/80 truncate">
                View account
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className={cn(
            "absolute -right-3 top-1/2 -translate-y-1/2",
            "w-6 h-6 rounded-full",
            "bg-background border border-[var(--glass-border)]",
            "flex items-center justify-center",
            "hover:bg-[var(--glass-bg-hover)] transition-colors",
            "shadow-md"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      )}
    </aside>
  );
}

export default DesktopSidebar;
