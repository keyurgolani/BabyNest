"use client";

import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Icons } from "@/components/icons";
import { ExternalLink, Mail, Star, FileText, Shield, Heart } from "lucide-react";

const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "2026.01.21";

export function AboutSupportContent() {
  const handleRateApp = () => {
    alert('Thank you for your interest! App store rating coming soon.');
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@babynest.app?subject=BabyNest Support Request';
  };

  return (
    <div className="space-y-4">
      {/* App Info */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Icons.Diaper className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">BabyNest</h3>
          <p className="text-sm text-muted-foreground">Version {APP_VERSION} • Build {BUILD_NUMBER}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <GlassButton variant="default" size="sm" className="h-auto py-3" onClick={handleRateApp}>
          <Star className="w-4 h-4 mr-2 text-amber-500" />
          Rate App
        </GlassButton>
        <GlassButton variant="default" size="sm" className="h-auto py-3" onClick={handleContactSupport}>
          <Mail className="w-4 h-4 mr-2 text-violet-500" />
          Contact Us
        </GlassButton>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <a 
          href="/privacy-policy" 
          target="_blank"
          className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Privacy Policy</span>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>
        <a 
          href="/terms-of-service" 
          target="_blank"
          className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Terms of Service</span>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1 pt-2">
        Made with <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> for parents everywhere
      </p>
    </div>
  );
}
