"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { Switch } from "@/components/ui/switch";

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  notificationSound: string;
}

interface NotificationSettingsModalProps {
  onClose: () => void;
}

const NOTIFICATION_SOUNDS = [
  { id: 'default', name: 'Default' },
  { id: 'gentle', name: 'Gentle Chime' },
  { id: 'soft', name: 'Soft Bell' },
  { id: 'melody', name: 'Sweet Melody' },
  { id: 'none', name: 'Silent' },
];

export function NotificationSettingsModal({ onClose }: NotificationSettingsModalProps) {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    // Load from localStorage or use defaults
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      pushEnabled: true,
      emailEnabled: true,
      soundEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      notificationSound: 'default',
    };
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onClose();
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Icons.Reminders className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-9 h-9 rounded-xl"
            >
              <Icons.Close className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
            </div>
            <Switch
              checked={settings.pushEnabled}
              onCheckedChange={(checked) => updateSetting('pushEnabled', checked)}
            />
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => updateSetting('emailEnabled', checked)}
            />
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Notification Sound</p>
              <p className="text-sm text-muted-foreground">Play sound for notifications</p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            />
          </div>

          {/* Sound Selection */}
          {settings.soundEnabled && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sound Type
              </label>
              <Select
                value={settings.notificationSound}
                onValueChange={(value) => updateSetting('notificationSound', value)}
              >
                <SelectTrigger className="w-full rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary">
                  <SelectValue placeholder="Select sound" />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_SOUNDS.map(sound => (
                    <SelectItem key={sound.id} value={sound.id}>{sound.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quiet Hours */}
          <div className="border-t border-border/50 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Quiet Hours</p>
                <p className="text-sm text-muted-foreground">Mute notifications during specific hours</p>
              </div>
              <Switch
                checked={settings.quietHoursEnabled}
                onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
              />
            </div>

            {settings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                    className="rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    End Time
                  </label>
                  <Input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                    className="rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 rounded-xl" 
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              variant="glow"
              className="flex-1 rounded-xl" 
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
