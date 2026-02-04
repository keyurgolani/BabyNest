"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/ui/glass-select";
import { Icons } from "@/components/icons";

/**
 * DisplaySettingsModal Component
 *
 * A modal for customizing display settings with glassmorphism styling.
 * Uses GlassModal wrapper, GlassSelect for dropdowns, and GlassButton for actions.
 *
 * @requirements 18.5
 */

interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  units: 'metric' | 'imperial';
}

interface DisplaySettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
}

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
  { id: 'de', name: 'Deutsch' },
  { id: 'pt', name: 'Português' },
  { id: 'zh', name: '中文' },
  { id: 'ja', name: '日本語' },
];

const DATE_FORMATS = [
  { id: 'MM/DD/YYYY', name: 'MM/DD/YYYY (US)' },
  { id: 'DD/MM/YYYY', name: 'DD/MM/YYYY (EU)' },
  { id: 'YYYY-MM-DD', name: 'YYYY-MM-DD (ISO)' },
  { id: 'MMM D, YYYY', name: 'Jan 1, 2024' },
  { id: 'D MMM YYYY', name: '1 Jan 2024' },
];

export function DisplaySettingsModal({ isOpen, onClose }: DisplaySettingsModalProps) {
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('displaySettings');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      theme: 'system',
      language: 'en',
      dateFormat: 'MMM D, YYYY',
      timeFormat: '12h',
      units: 'imperial',
    };
  });
  const [isSaving, setIsSaving] = useState(false);

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Apply theme immediately when changed
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('displaySettings', JSON.stringify(settings));
      await new Promise(resolve => setTimeout(resolve, 500));
      onClose();
    } catch (error) {
      console.error('Failed to save display settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Display Settings"
      size="default"
    >
      <div className="space-y-6">
        {/* Header Icon */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Icons.Sun className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Customize your app appearance
          </p>
        </div>

        {/* Theme Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <GlassButton
                key={theme}
                type="button"
                variant={settings.theme === theme ? 'primary' : 'default'}
                onClick={() => updateSetting('theme', theme)}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                {theme === 'light' && <Icons.Sun className="w-4 h-4" />}
                {theme === 'dark' && <Icons.Sleep className="w-4 h-4" />}
                {theme === 'system' && <Icons.Settings className="w-4 h-4" />}
                <span className="text-xs">
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </span>
              </GlassButton>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Language
          </label>
          <GlassSelect
            value={settings.language}
            onValueChange={(value) => updateSetting('language', value)}
          >
            <GlassSelectTrigger>
              <GlassSelectValue placeholder="Select language" />
            </GlassSelectTrigger>
            <GlassSelectContent>
              {LANGUAGES.map(lang => (
                <GlassSelectItem key={lang.id} value={lang.id}>
                  {lang.name}
                </GlassSelectItem>
              ))}
            </GlassSelectContent>
          </GlassSelect>
        </div>

        {/* Date Format */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Date Format
          </label>
          <GlassSelect
            value={settings.dateFormat}
            onValueChange={(value) => updateSetting('dateFormat', value)}
          >
            <GlassSelectTrigger>
              <GlassSelectValue placeholder="Select date format" />
            </GlassSelectTrigger>
            <GlassSelectContent>
              {DATE_FORMATS.map(format => (
                <GlassSelectItem key={format.id} value={format.id}>
                  {format.name}
                </GlassSelectItem>
              ))}
            </GlassSelectContent>
          </GlassSelect>
        </div>

        {/* Time Format */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Time Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['12h', '24h'] as const).map((format) => (
              <GlassButton
                key={format}
                type="button"
                variant={settings.timeFormat === format ? 'primary' : 'default'}
                onClick={() => updateSetting('timeFormat', format)}
                className="h-auto py-3"
              >
                {format === '12h' ? '12-hour (AM/PM)' : '24-hour'}
              </GlassButton>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Unit System
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['metric', 'imperial'] as const).map((unit) => (
              <GlassButton
                key={unit}
                type="button"
                variant={settings.units === unit ? 'primary' : 'default'}
                onClick={() => updateSetting('units', unit)}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <span className="text-xs opacity-70">
                  {unit === 'metric' ? 'kg, cm, °C' : 'lb, in, °F'}
                </span>
                <span>
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </span>
              </GlassButton>
            ))}
          </div>
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
