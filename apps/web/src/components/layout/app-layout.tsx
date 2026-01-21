"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, Settings, LogOut, User, FileText } from "lucide-react";

import { LogProvider } from "@/context/log-context";
import { ActiveTimerBanner } from "@/components/ActiveTimerBanner";
import { NursingTimerBanner } from "@/components/NursingTimerBanner";
import { ActivityTimerBanner } from "@/components/ActivityTimerBanner";
import { PendingInvitationsBanner } from "@/components/PendingInvitationsBanner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useAuth } from "@/components/auth-provider";

// Animated collapsible component with bounce effect
function AnimatedCollapsible({ 
  expanded, 
  children 
}: { 
  expanded: boolean; 
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      style={{ 
        maxHeight: expanded ? `${height}px` : '0px',
        opacity: expanded ? 1 : 0,
      }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
}

// Log sub-navigation items
const LOG_ITEMS = [
  { href: "/log/feed", label: "Feeding", icon: Icons.Feed },
  { href: "/log/sleep", label: "Sleep", icon: Icons.Sleep },
  { href: "/log/diaper", label: "Diaper", icon: Icons.Diaper },
  { href: "/log/growth", label: "Growth", icon: Icons.Growth },
  { href: "/log/temperature", label: "Temperature", icon: Icons.Temperature },
  { href: "/log/activity", label: "Activity", icon: Icons.Activity },
  { href: "/log/medication", label: "Medicine", icon: Icons.Medication },
  { href: "/log/symptom", label: "Symptom", icon: Icons.Symptom },
  { href: "/log/vaccination", label: "Vaccine", icon: Icons.Vaccination },
  { href: "/log/doctor-visit", label: "Doctor Visit", icon: Icons.DoctorVisit },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, isAuthenticated } = useAuth();
  const isAuthPage = pathname?.startsWith('/auth');
  const isOnboarding = pathname?.startsWith('/onboarding');

  // Auth pages don't need the full layout with sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  // This prevents the flash of dummy content
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
            <Icons.Diaper className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated and not on a public page, don't render content
  // The AuthProvider will handle the redirect
  if (!isAuthenticated && !isOnboarding) {
    return null;
  }

  return (
    <LogProvider>
      <div className="h-screen w-screen overflow-hidden bg-background flex text-foreground font-sans selection:bg-primary/30">
        {/* Desktop Sidebar - Fixed */}
        <SideNav />

        {/* Main Content Area - Fixed height, internal scroll */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Pending Invitations Banner - Shows when user has pending invitations */}
          <PendingInvitationsBanner />
          
          {/* Active Sleep Timer Banner - Always visible when sleeping */}
          <ActiveTimerBanner />
          
          {/* Active Nursing Timer Banner - Always visible when nursing */}
          <NursingTimerBanner />
          
          {/* Active Activity Timer Banner - Always visible when activity timer is running */}
          <ActivityTimerBanner />
          
          {/* Main Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
          
          {/* Mobile/Tablet Bottom Nav - Fixed at bottom */}
          <div className="lg:hidden flex-shrink-0">
            <BottomNav />
          </div>
        </div>
      </div>
    </LogProvider>
  );
}

function SideNav() {
  const pathname = usePathname();
  const [logExpanded, setLogExpanded] = useState(pathname.startsWith("/log"));
  const [trackingExpanded, setTrackingExpanded] = useState(pathname.startsWith("/tracking"));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuth();
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle clicking on Quick Log or Tracking - expand that section, collapse the other
  const handleNavClick = (href: string) => {
    if (href === "/log") {
      setLogExpanded(true);
      setTrackingExpanded(false);
    } else if (href === "/tracking") {
      setTrackingExpanded(true);
      setLogExpanded(false);
    }
  };
  
  const navItems = [
    { href: "/", label: "Home", icon: Icons.Home },
    { href: "/log", label: "Quick Log", icon: Icons.Log, hasSubmenu: true },
    { href: "/tracking", label: "Tracking", icon: Icons.Stats, hasSubmenu: true },
    { href: "/calendar", label: "Calendar", icon: Icons.Calendar },
    { href: "/insights", label: "Insights", icon: Icons.Insights },
    { href: "/reminders", label: "Reminders", icon: Icons.Reminders },
  ];

  const trackingItems = [
    { href: "/tracking/growth", label: "Growth", icon: Icons.Growth },
    { href: "/tracking/activities", label: "Activities", icon: Icons.Activity },
    { href: "/tracking/health", label: "Health", icon: Icons.Symptom },
    { href: "/tracking/timeline", label: "Timeline", icon: Icons.Calendar },
    { href: "/tracking/activity-log", label: "Activity Log", icon: Icons.Log },
    { href: "/milestones", label: "Milestones", icon: Icons.Milestone },
    { href: "/memories", label: "Memories", icon: Icons.Memories },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-sidebar border-r border-sidebar-border p-6 gap-6 h-screen flex-shrink-0 shadow-xl shadow-sidebar-border/10">
       <div className="flex items-center gap-3 px-2 py-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Icons.Diaper className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-sidebar-foreground">BabyNest</span>
       </div>

       <div className="mx-2 flex-shrink-0">
         <Separator className="bg-sidebar-border" />
       </div>

       <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-2 scrollbar-thin">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && item.href !== "/log" && item.href !== "/tracking" && pathname.startsWith(item.href));
            const isLogActive = item.href === "/log" && pathname.startsWith("/log");
            const isTrackingActive = item.href === "/tracking" && pathname.startsWith("/tracking");
            const isSubmenuActive = isLogActive || isTrackingActive;
            
            if (item.hasSubmenu) {
              const isLog = item.href === "/log";
              const expanded = isLog ? logExpanded : trackingExpanded;
              const setExpanded = isLog ? setLogExpanded : setTrackingExpanded;
              const subItems = isLog ? LOG_ITEMS : trackingItems;
              
              return (
                <div key={item.href}>
                  <div className="flex items-center">
                    <Button
                      variant={isSubmenuActive ? "secondary" : "ghost"}
                      className={cn(
                        "flex-1 justify-start gap-4 px-4 h-12 text-base font-medium rounded-xl transition-all duration-300 flex-shrink-0",
                        isSubmenuActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                      asChild
                    >
                      <Link href={item.href} onClick={() => handleNavClick(item.href)}>
                        <item.icon className={cn("h-5 w-5", isSubmenuActive && "text-primary fill-none")} />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl text-muted-foreground hover:text-sidebar-foreground"
                      onClick={() => setExpanded(!expanded)}
                    >
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]", 
                        expanded && "rotate-180"
                      )} />
                    </Button>
                  </div>
                  
                  {/* Collapsible Sub-items with animation */}
                  <AnimatedCollapsible expanded={expanded}>
                    <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-sidebar-border pl-4">
                      {subItems.map((subItem, index) => {
                        const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + "?") || pathname.startsWith(subItem.href + "/");
                        return (
                          <Button
                            key={subItem.href}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "justify-start gap-3 h-9 text-sm font-medium rounded-lg transition-all duration-200",
                              isSubActive 
                                ? "bg-sidebar-accent/70 text-sidebar-accent-foreground" 
                                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/30",
                              expanded && "animate-in fade-in slide-in-from-left-2"
                            )}
                            style={{ 
                              animationDelay: expanded ? `${index * 30}ms` : '0ms',
                              animationFillMode: 'both'
                            }}
                            asChild
                          >
                            <Link href={subItem.href}>
                              <subItem.icon className={cn("h-4 w-4", isSubActive && "text-primary")} />
                              <span>{subItem.label}</span>
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                  </AnimatedCollapsible>
                </div>
              );
            }
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                    "w-full justify-start gap-4 px-4 h-12 text-base font-medium rounded-xl transition-all duration-300 flex-shrink-0",
                    isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
                asChild
              >
                <Link href={item.href}>
                    <item.icon className={cn("h-5 w-5", isActive && "text-primary fill-none")} />
                    <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
       </nav>
       
       <div className="mt-auto px-2 flex-shrink-0 relative" ref={userMenuRef}>
           {/* User Menu Popup */}
           {userMenuOpen && (
             <div className="absolute bottom-full left-2 right-2 mb-2 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="p-1">
                 <Link
                   href="/report"
                   onClick={() => setUserMenuOpen(false)}
                   className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                 >
                   <FileText className="w-4 h-4 text-muted-foreground" />
                   Report
                 </Link>
                 <Link
                   href="/settings"
                   onClick={() => setUserMenuOpen(false)}
                   className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                 >
                   <Settings className="w-4 h-4 text-muted-foreground" />
                   Settings
                 </Link>
                 <Link
                   href="/profile"
                   onClick={() => setUserMenuOpen(false)}
                   className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                 >
                   <User className="w-4 h-4 text-muted-foreground" />
                   Profile
                 </Link>
                 <Separator className="my-1" />
                 <Button
                    variant="ghost"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full justify-start h-auto px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </Button>
               </div>
             </div>
           )}
           
           {/* User Card - Clickable */}
           <Button
             variant="ghost"
             onClick={() => setUserMenuOpen(!userMenuOpen)}
             className={cn(
               "w-full h-auto p-4 rounded-2xl bg-sidebar-accent/50 border border-sidebar-border transition-all hover:bg-sidebar-accent justify-between",
               userMenuOpen && "bg-sidebar-accent ring-2 ring-primary/20"
             )}
           >
               <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                       <span className="text-primary font-bold text-sm">
                         {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                       </span>
                   </div>
                   <div className="flex flex-col text-left">
                       <span className="text-sm font-semibold text-sidebar-foreground">{user?.name || 'User'}</span>
                       <span className="text-xs text-muted-foreground">Parent</span>
                   </div>
               </div>
               <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")} />
           </Button>
       </div>
    </aside>
  );
}
