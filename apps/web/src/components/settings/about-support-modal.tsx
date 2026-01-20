"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface AboutSupportModalProps {
  onClose: () => void;
}

const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "2024.01.15";

export function AboutSupportModal({ onClose }: AboutSupportModalProps) {
  const handleRateApp = () => {
    // In a real app, this would open the app store
    alert('Thank you for your interest! App store rating coming soon.');
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@babynest.app?subject=BabyNest Support Request';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-md animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Icons.Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">About & Support</CardTitle>
                <CardDescription>App information and help</CardDescription>
              </div>
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={onClose}
              className="w-9 h-9 rounded-xl"
            >
              <Icons.Close className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {/* App Info */}
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Icons.Diaper className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">BabyNest</h2>
            <p className="text-muted-foreground text-sm">Your complete baby tracking companion</p>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Version {APP_VERSION}</p>
              <p className="text-xs text-muted-foreground/70">Build {BUILD_NUMBER}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <a 
              href="/privacy-policy" 
              target="_blank"
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icons.Report className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Privacy Policy</span>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
            
            <a 
              href="/terms-of-service" 
              target="_blank"
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icons.Report className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Terms of Service</span>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <Button 
              variant="outline"
              className="w-full"
              onClick={handleContactSupport}
            >
              <Icons.Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            
            <Button 
              variant="soft"
              className="w-full"
              onClick={handleRateApp}
            >
              <Icons.Sparkles className="w-4 h-4 mr-2" />
              Rate BabyNest
            </Button>
          </div>

          {/* Credits */}
          <div className="text-center pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Made with ❤️ for parents everywhere
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              © 2024 BabyNest. All rights reserved.
            </p>
          </div>

          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
