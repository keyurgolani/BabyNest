"use client";

import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Icons } from "@/components/icons";
import { ExternalLink, Mail, Star, FileText, Shield, Heart, HelpCircle } from "lucide-react";

/**
 * AboutSupportModal Component
 *
 * A modal displaying app information and support options with glassmorphism styling.
 * Uses GlassModal wrapper and GlassCard styling for all content sections.
 *
 * Features:
 * - App version and build information displayed in a GlassCard
 * - Quick links to Privacy Policy and Terms of Service with GlassCard styling
 * - Contact support and rate app actions using GlassButton components
 * - Credits section in a GlassCard
 *
 * @requirements 18.5
 */

interface AboutSupportModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
}

const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "2024.01.15";

export function AboutSupportModal({ isOpen, onClose }: AboutSupportModalProps) {
  const handleRateApp = () => {
    // In a real app, this would open the app store
    alert('Thank you for your interest! App store rating coming soon.');
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@babynest.app?subject=BabyNest Support Request';
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="About & Support"
      size="default"
    >
      <div className="space-y-6">
        {/* Header Icon and Description */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            App information and help resources
          </p>
        </div>

        {/* App Info Card - Using GlassCard for content styling */}
        <GlassCard variant="flat" size="default" className="text-center py-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
            <Icons.Diaper className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">BabyNest</h2>
          <p className="text-muted-foreground text-sm">Your complete baby tracking companion</p>
          <div className="mt-4 space-y-1">
            <p className="text-sm text-muted-foreground">Version {APP_VERSION}</p>
            <p className="text-xs text-muted-foreground/70">Build {BUILD_NUMBER}</p>
          </div>
        </GlassCard>

        {/* Quick Links Section - Using GlassCard for container */}
        <GlassCard variant="flat" size="default">
          <h3 className="font-medium text-foreground mb-3">Quick Links</h3>
          <div className="space-y-2">
            <a 
              href="/privacy-policy" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--glass-border)] transition-all touch-target"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Privacy Policy</span>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
            
            <a 
              href="/terms-of-service" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--glass-border)] transition-all touch-target"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Terms of Service</span>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </GlassCard>

        {/* Support Section - Using GlassCard for container */}
        <GlassCard variant="flat" size="default">
          <h3 className="font-medium text-foreground mb-3">Support</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Need help? We&apos;re here for you.
          </p>
          <div className="space-y-3">
            <GlassButton 
              variant="default"
              className="w-full"
              onClick={handleContactSupport}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </GlassButton>
            
            <GlassButton 
              variant="default"
              className="w-full"
              onClick={handleRateApp}
            >
              <Star className="w-4 h-4 mr-2 text-amber-500" />
              Rate BabyNest
            </GlassButton>
          </div>
        </GlassCard>

        {/* Credits Section - Using GlassCard for styling */}
        <GlassCard variant="flat" size="sm" className="text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> for parents everywhere
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © 2024 BabyNest. All rights reserved.
          </p>
        </GlassCard>

        {/* Close Button */}
        <GlassButton 
          variant="primary" 
          onClick={onClose} 
          className="w-full"
        >
          <Icons.Check className="w-4 h-4 mr-2" />
          Done
        </GlassButton>
      </div>
    </GlassModal>
  );
}
