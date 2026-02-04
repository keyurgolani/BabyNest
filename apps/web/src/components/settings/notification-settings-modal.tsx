"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/ui/glass-select";
import { Icons } from "@/components/icons";
import { Switch } from "@/components/ui/switch";

/**
 * NotificationSettingsModal Component
 *
 * A modal for managing notification preferences with glassmorphism styling.
 * Uses GlassModal wrapper, Switch components for toggles, and GlassButton for actions.
 *
 * @requirements 18.5
 */

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
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
}

const NOTIFICATION_SOUNDS = [
  { id: 'default', name: 'Default' },
  { id: 'gentle', name: 'Gentle Chime' },
  { id: 'soft', name: 'Soft Bell' },
  { id: 'melody', name: 'Sweet Melody' },
  { id: 'none', name: 'Silent' },
];

export function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
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

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false);
    }
  }, [isOpen]);

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
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
      size="default"
    >
      <div className="space-y-6">
        {/* Header Icon */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Icons.Reminders className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your notification preferences
          </p>
        </div>

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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Sound Type
            </label>
            <GlassSelect
              value={settings.notificationSound}
              onValueChange={(value) => updateSetting('notificationSound', value)}
            >
              <GlassSelectTrigger>
                <GlassSelectValue placeholder="Select sound" />
              </GlassSelectTrigger>
              <GlassSelectContent>
                {NOTIFICATION_SOUNDS.map(sound => (
                  <GlassSelectItem key={sound.id} value={sound.id}>
                    {sound.name}
                  </GlassSelectItem>
                ))}
              </GlassSelectContent>
            </GlassSelect>
          </div>
        )}

        {/* Quiet Hours */}
        <div className="border-t border-white/10 pt-6">
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Start Time
                </label>
                <GlassInput
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  End Time
                </label>
                <GlassInput
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <GlassButton 
            type="button" 
            variant="default" 
            onClick={onClose} 
            className="flex-1" 
            disabled={isSaving}
          >
            Cancel
          </GlassButton>
          <GlassButton 
            type="button"
            variant="primary"
            onClick={handleSave}
            className="flex-1" 
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Icons.Check className="w-4 h-4" />
                <span>Save Settings</span>
              </div>
            )}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
