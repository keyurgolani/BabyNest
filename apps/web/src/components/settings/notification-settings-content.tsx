"use client";

import { useState, useEffect } from "react";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassSelect, GlassSelectContent, GlassSelectItem, GlassSelectTrigger, GlassSelectValue } from "@/components/ui/glass-select";

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
        <button
          onClick={() => updateSetting('pushEnabled', !settings.pushEnabled)}
          className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            settings.pushEnabled ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]' : 'bg-white/10'
          }`}
          role="switch"
          aria-checked={settings.pushEnabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              settings.pushEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Email Notifications */}
      <div className="flex items-center justify-between py-2 border-t border-white/10">
        <div>
          <p className="font-medium text-sm">Email Notifications</p>
          <p className="text-xs text-muted-foreground">Daily summaries via email</p>
        </div>
        <button
          onClick={() => updateSetting('emailEnabled', !settings.emailEnabled)}
          className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            settings.emailEnabled ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]' : 'bg-white/10'
          }`}
          role="switch"
          aria-checked={settings.emailEnabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              settings.emailEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Sound */}
      <div className="flex items-center justify-between py-2 border-t border-white/10">
        <div>
          <p className="font-medium text-sm">Sound Alerts</p>
          <p className="text-xs text-muted-foreground">Play sound for notifications</p>
        </div>
        <button
          onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
          className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            settings.soundEnabled ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]' : 'bg-white/10'
          }`}
          role="switch"
          aria-checked={settings.soundEnabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Sound Selection */}
      {settings.soundEnabled && (
        <div className="pl-4 border-l-2 border-primary/30">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Sound Type
          </label>
          <GlassSelect
            value={settings.notificationSound}
            onValueChange={(value) => updateSetting('notificationSound', value)}
          >
            <GlassSelectTrigger className="h-9">
              <GlassSelectValue placeholder="Select sound" />
            </GlassSelectTrigger>
            <GlassSelectContent>
              {NOTIFICATION_SOUNDS.map(sound => (
                <GlassSelectItem key={sound.id} value={sound.id}>{sound.name}</GlassSelectItem>
              ))}
            </GlassSelectContent>
          </GlassSelect>
        </div>
      )}

      {/* Quiet Hours */}
      <div className="flex items-center justify-between py-2 border-t border-white/10">
        <div>
          <p className="font-medium text-sm">Quiet Hours</p>
          <p className="text-xs text-muted-foreground">Mute during specific hours</p>
        </div>
        <button
          onClick={() => updateSetting('quietHoursEnabled', !settings.quietHoursEnabled)}
          className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            settings.quietHoursEnabled ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]' : 'bg-white/10'
          }`}
          role="switch"
          aria-checked={settings.quietHoursEnabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              settings.quietHoursEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {settings.quietHoursEnabled && (
        <div className="pl-4 border-l-2 border-primary/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">From</label>
              <GlassInput
                type="time"
                value={settings.quietHoursStart}
                onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">To</label>
              <GlassInput
                type="time"
                value={settings.quietHoursEnd}
                onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
