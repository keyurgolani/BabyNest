"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GlassSelect, GlassSelectContent, GlassSelectItem, GlassSelectTrigger, GlassSelectValue } from "@/components/ui/glass-select";
import { Sun, Moon, Monitor } from "lucide-react";

interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  units: 'metric' | 'imperial';
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
  { id: 'MM/DD/YYYY', name: 'MM/DD/YYYY' },
  { id: 'DD/MM/YYYY', name: 'DD/MM/YYYY' },
  { id: 'YYYY-MM-DD', name: 'YYYY-MM-DD' },
  { id: 'MMM D, YYYY', name: 'Jan 1, 2024' },
];

export function DisplaySettingsContent() {
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

  // Auto-save on change
  useEffect(() => {
    localStorage.setItem('displaySettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const updateSetting = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      {/* Theme */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Theme</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', icon: Sun, label: 'Light' },
            { id: 'dark', icon: Moon, label: 'Dark' },
            { id: 'system', icon: Monitor, label: 'System' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => updateSetting('theme', id as DisplaySettings['theme'])}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all backdrop-blur-sm",
                settings.theme === id
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              )}
            >
              <Icon className={cn("w-5 h-5", settings.theme === id ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-xs font-medium", settings.theme === id ? "text-primary" : "text-foreground")}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Language & Date Format Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Language</label>
          <GlassSelect value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
            <GlassSelectTrigger className="h-9">
              <GlassSelectValue placeholder="Select language" />
            </GlassSelectTrigger>
            <GlassSelectContent>
              {LANGUAGES.map(lang => (
                <GlassSelectItem key={lang.id} value={lang.id}>{lang.name}</GlassSelectItem>
              ))}
            </GlassSelectContent>
          </GlassSelect>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Date Format</label>
          <GlassSelect value={settings.dateFormat} onValueChange={(value) => updateSetting('dateFormat', value)}>
            <GlassSelectTrigger className="h-9">
              <GlassSelectValue placeholder="Select format" />
            </GlassSelectTrigger>
            <GlassSelectContent>
              {DATE_FORMATS.map(format => (
                <GlassSelectItem key={format.id} value={format.id}>{format.name}</GlassSelectItem>
              ))}
            </GlassSelectContent>
          </GlassSelect>
        </div>
      </div>

      {/* Time Format & Units Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Time Format</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['12h', '24h'] as const).map((format) => (
              <button
                key={format}
                onClick={() => updateSetting('timeFormat', format)}
                className={cn(
                  "h-9 rounded-xl text-xs font-medium transition-all backdrop-blur-sm border",
                  settings.timeFormat === format
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                    : "bg-white/5 hover:bg-white/10 text-foreground border-white/10"
                )}
              >
                {format === '12h' ? '12h' : '24h'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Units</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['metric', 'imperial'] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => updateSetting('units', unit)}
                className={cn(
                  "h-9 rounded-xl text-xs font-medium transition-all backdrop-blur-sm border",
                  settings.units === unit
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                    : "bg-white/5 hover:bg-white/10 text-foreground border-white/10"
                )}
              >
                {unit === 'metric' ? 'Metric' : 'Imperial'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
