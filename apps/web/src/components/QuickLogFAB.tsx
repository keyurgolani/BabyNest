"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useLogs } from "@/context/log-context";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

import { Button } from "@/components/ui/button";

interface QuickLogFABProps {
  className?: string;
}

/**
 * Floating Action Button for quick one-tap logging
 * Designed for tired parents who need to log with one hand while holding baby
 * 
 * Features:
 * - Expandable menu with most common actions
 * - One-tap quick log for diaper (most common)
 * - Shows active timer status
 * - Positioned in thumb-friendly zone (bottom right)
 */
export function QuickLogFAB({ className }: QuickLogFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const { babyStatus, refreshLogs } = useLogs();
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-fab-menu]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Quick log wet diaper (most common action)
  const quickLogWetDiaper = async () => {
    setIsLogging(true);
    try {
      await api.diapers.create({
        type: 'wet',
      });
      await refreshLogs();
      // Haptic feedback simulation via brief visual feedback
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to log diaper:', error);
    } finally {
      setIsLogging(false);
    }
  };

  // Quick log dirty diaper
  const quickLogDirtyDiaper = async () => {
    setIsLogging(true);
    try {
      await api.diapers.create({
        type: 'dirty',
      });
      await refreshLogs();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to log diaper:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const quickActions = [
    {
      id: 'wet-diaper',
      label: 'Wet',
      icon: Icons.Diaper,
      color: 'bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600',
      action: quickLogWetDiaper,
    },
    {
      id: 'dirty-diaper',
      label: 'Dirty',
      icon: Icons.Diaper,
      color: 'bg-amber-500 hover:bg-amber-600 border-amber-500 hover:border-amber-600',
      action: quickLogDirtyDiaper,
    },
    {
      id: 'feed',
      label: 'Feed',
      icon: Icons.Feed,
      color: 'bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600',
      action: () => { setIsOpen(false); router.push('/log/feed'); },
    },
    {
      id: 'sleep',
      label: babyStatus === 'Sleeping' ? 'Wake' : 'Sleep',
      icon: babyStatus === 'Sleeping' ? Icons.Sun : Icons.Sleep,
      color: babyStatus === 'Sleeping' ? 'bg-amber-400 hover:bg-amber-500 border-amber-400' : 'bg-indigo-500 hover:bg-indigo-600 border-indigo-500',
      action: () => { setIsOpen(false); router.push('/log/sleep'); },
    },
  ];

  return (
    <div 
      data-fab-menu
      className={cn(
        "fixed z-50 flex flex-col-reverse items-end gap-3",
        // Position in thumb-friendly zone - bottom right, above bottom nav on mobile
        "bottom-24 right-4 md:bottom-8 md:right-8",
        className
      )}
    >
      {/* Quick action buttons - appear when FAB is open */}
      <div className={cn(
        "flex flex-col-reverse gap-2 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              onClick={action.action}
              disabled={isLogging}
              variant="default"
              className={cn(
                "flex items-center gap-3 pl-4 pr-3 py-6 rounded-full shadow-lg transition-all duration-200 w-auto h-auto",
                "text-white font-medium text-sm border-0",
                action.color,
                "active:scale-95 disabled:opacity-50",
                // Stagger animation
                isOpen && `animate-slide-up`
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span>{action.label}</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ml-2">
                <Icon className="w-4 h-4" />
              </div>
            </Button>
          );
        })}
      </div>

      {/* Main FAB button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="default"
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 p-0",
          "bg-primary text-primary-foreground",
          "hover:shadow-primary/40 hover:scale-105",
          "active:scale-95",
          isOpen && "rotate-45 bg-muted text-muted-foreground hover:bg-muted/90"
        )}
        aria-label={isOpen ? "Close quick log menu" : "Open quick log menu"}
      >
        <Icons.Plus className="w-7 h-7" />
      </Button>

      {/* Backdrop when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
