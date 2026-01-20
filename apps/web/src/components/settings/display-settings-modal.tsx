"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  units: 'metric' | 'imperial';
}

interface DisplaySettingsModalProps {
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

export function DisplaySettingsModal({ onClose }: DisplaySettingsModalProps) {
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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-md animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Icons.Sun className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Display Settings</CardTitle>
                <CardDescription>Customize your app appearance</CardDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSetting('theme', theme)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    settings.theme === theme
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {theme === 'light' && <Icons.Sun className="w-4 h-4 mx-auto mb-1" />}
                  {theme === 'dark' && <Icons.Sleep className="w-4 h-4 mx-auto mb-1" />}
                  {theme === 'system' && <Icons.Settings className="w-4 h-4 mx-auto mb-1" />}
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date Format
            </label>
            <select
              value={settings.dateFormat}
              onChange={(e) => updateSetting('dateFormat', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
            >
              {DATE_FORMATS.map(format => (
                <option key={format.id} value={format.id}>{format.name}</option>
              ))}
            </select>
          </div>

          {/* Time Format */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Time Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['12h', '24h'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => updateSetting('timeFormat', format)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    settings.timeFormat === format
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {format === '12h' ? '12-hour (AM/PM)' : '24-hour'}
                </button>
              ))}
            </div>
          </div>

          {/* Units */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Unit System
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['metric', 'imperial'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => updateSetting('units', unit)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    settings.units === unit
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {unit === 'metric' ? 'kg, cm, °C' : 'lb, in, °F'}
                  </div>
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </button>
              ))}
            </div>
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
