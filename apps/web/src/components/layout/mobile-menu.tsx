"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { 
  Settings, 
  LogOut, 
  User, 
  X,
  ChevronRight
} from "lucide-react";

// Reusing the same navigation items from SideNav for consistency
// Ideally these should be in a shared config file
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

const TRACKING_ITEMS = [
  { href: "/tracking/growth", label: "Growth", icon: Icons.Growth },
  { href: "/tracking/activities", label: "Activities", icon: Icons.Activity },
  { href: "/tracking/health", label: "Health", icon: Icons.Symptom },
  { href: "/tracking/timeline", label: "Timeline", icon: Icons.Calendar },
  { href: "/tracking/activity-log", label: "Activity Log", icon: Icons.Log },
];

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Icons.Home },
  { href: "/log", label: "Quick Log", icon: Icons.Log, hasSubmenu: true },
  { href: "/tracking", label: "Tracking", icon: Icons.Stats, hasSubmenu: true },
  { href: "/milestones", label: "Milestones", icon: Icons.Milestone },
  { href: "/calendar", label: "Calendar", icon: Icons.Calendar },
  { href: "/insights", label: "Insights", icon: Icons.Insights },
  { href: "/reminders", label: "Reminders", icon: Icons.Reminders },
];

const ACCOUNT_ITEMS = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [logExpanded, setLogExpanded] = useState(pathname.startsWith("/log"));
  const [trackingExpanded, setTrackingExpanded] = useState(pathname.startsWith("/tracking"));

  // Close menu when route changes
  // We can add this logic if we want auto-close on navigation
  // useEffect(() => {
  //   onClose();
  // }, [pathname, onClose]);

  const handleNavClick = (href: string) => {
    if (href === "/log") {
      setLogExpanded(!logExpanded);
    } else if (href === "/tracking") {
      setTrackingExpanded(!trackingExpanded);
    } else {
      onClose();
    }
  };

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
        stiffness: 200 
      } 
    },
    exit: { 
      y: "100%", 
      opacity: 0,
      transition: { 
        duration: 0.2, 
        ease: "easeIn" as const 
      } 
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Menu Drawer */}
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-background border-t border-border rounded-t-3xl z-[70] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="flex items-center justify-center py-3 border-b border-border/50">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                  <Icons.Diaper className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                    <h2 className="font-heading font-bold text-lg leading-tight">Menu</h2>
                    <p className="text-xs text-muted-foreground">Navigate BabyNest</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
                <X className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              
              {/* User Greeting / Mini Profile */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg ring-2 ring-primary/30">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Hello,</p>
                        <p className="text-base font-bold text-foreground">{user?.name || 'Parent'}</p>
                    </div>
                 </div>
              </div>

              {/* Main Navigation */}
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isLog = item.href === "/log";
                  const isTracking = item.href === "/tracking";
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const expanded = isLog ? logExpanded : (isTracking ? trackingExpanded : false);
                  const hasSub = item.hasSubmenu;
                  
                  return (
                    <div key={item.href} className="overflow-hidden">
                       <div className="flex items-center">
                           {/* Main Item Link */}
                           <Button
                               variant={isActive && !hasSub ? "secondary" : "ghost"}
                               className={cn(
                                   "flex-1 justify-start h-12 text-base font-medium rounded-xl px-4",
                                   isActive && !hasSub ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                               )}
                               onClick={() => !hasSub && onClose()}
                               asChild={!hasSub}
                           >
                               {hasSub ? (
                                   <div onClick={() => handleNavClick(item.href)} className="w-full flex items-center gap-3 cursor-pointer">
                                       <item.icon className={cn("w-5 h-5", (expanded || isActive) && "text-primary")} />
                                       <span className={cn((expanded || isActive) && "font-semibold")}>{item.label}</span>
                                       <ChevronRight className={cn("ml-auto w-5 h-5 text-muted-foreground transition-transform duration-300", expanded && "rotate-90")} />
                                   </div>
                               ) : (
                                   <Link href={item.href} className="flex items-center gap-3 w-full">
                                       <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                                       <span>{item.label}</span>
                                   </Link>
                               )}
                           </Button>
                       </div>

                       {/* Submenu */}
                       {hasSub && (
                        <AnimatePresence>
                            {expanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pl-12 pr-2 pb-1 pt-1 flex flex-col gap-0.5">
                                        {(isLog ? LOG_ITEMS : TRACKING_ITEMS).map((subItem) => (
                                            <Link 
                                                key={subItem.href} 
                                                href={subItem.href}
                                                onClick={onClose}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors",
                                                    pathname === subItem.href 
                                                        ? "bg-primary/10 text-primary" 
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <subItem.icon className="w-4 h-4" />
                                                {subItem.label}
                                            </Link>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                       )}
                    </div>
                  );
                })}
              </nav>

              {/* Separator */}
              <Separator className="bg-border/50" />

              {/* Account Section */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">Account</p>
                {ACCOUNT_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-12 text-base font-medium rounded-xl px-4",
                        isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                      )}
                      onClick={onClose}
                      asChild
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  );
                })}
                
                {/* Sign Out Button */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-base font-medium rounded-xl px-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => { logout(); onClose(); }}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span>Sign Out</span>
                </Button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
