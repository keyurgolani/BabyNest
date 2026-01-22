"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const NOTIFICATION_SOUNDS = [
  { id: 'default', name: 'Default' },
  { id: 'gentle', name: 'Gentle Chime' },
  { id: 'soft', name: 'Soft Bell' },
  { id: 'melody', name: 'Sweet Melody' },
  { id: 'none', name: 'Silent' },
];

export function NotificationSettingsContent() {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
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

  // Auto-save on change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Push Notifications */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="font-medium text-sm">Push Notifications</p>
          <p className="text-xs text-muted-foreground">Instant alerts on your device</p>
        </div>
        <Switch
          checked={settings.pushEnabled}
          onCheckedChange={(checked) => updateSetting('pushEnabled', checked)}
        />
      </div>

      {/* Email Notifications */}
      <div className="flex items-center justify-between py-2 border-t border-border/30">
        <div>
          <p className="font-medium text-sm">Email Notifications</p>
          <p className="text-xs text-muted-foreground">Daily summaries via email</p>
        </div>
        <Switch
          checked={settings.emailEnabled}
          onCheckedChange={(checked) => updateSetting('emailEnabled', checked)}
        />
      </div>

      {/* Sound */}
      <div className="flex items-center justify-between py-2 border-t border-border/30">
        <div>
          <p className="font-medium text-sm">Sound Alerts</p>
          <p className="text-xs text-muted-foreground">Play sound for notifications</p>
        </div>
        <Switch
          checked={settings.soundEnabled}
          onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
        />
      </div>

      {/* Sound Selection */}
      {settings.soundEnabled && (
        <div className="pl-4 border-l-2 border-amber-200 dark:border-amber-800">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Sound Type
          </label>
          <Select
            value={settings.notificationSound}
            onValueChange={(value) => updateSetting('notificationSound', value)}
          >
            <SelectTrigger className="h-9 rounded-lg bg-muted/50 border-0">
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
      <div className="flex items-center justify-between py-2 border-t border-border/30">
        <div>
          <p className="font-medium text-sm">Quiet Hours</p>
          <p className="text-xs text-muted-foreground">Mute during specific hours</p>
        </div>
        <Switch
          checked={settings.quietHoursEnabled}
          onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
        />
      </div>

      {settings.quietHoursEnabled && (
        <div className="pl-4 border-l-2 border-amber-200 dark:border-amber-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">From</label>
              <Input
                type="time"
                value={settings.quietHoursStart}
                onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                className="h-9 rounded-lg bg-muted/50 border-0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">To</label>
              <Input
                type="time"
                value={settings.quietHoursEnd}
                onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                className="h-9 rounded-lg bg-muted/50 border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
