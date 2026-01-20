"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Clock, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

interface TimeAgoPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
  label?: string;
  id?: string;
}

export function TimeAgoPicker({ value, onChange, className, label, id }: TimeAgoPickerProps) {
  const [activePreset, setActivePreset] = useState<string | null>("now");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const [tempHour, setTempHour] = useState(value.getHours());
  const [tempMinute, setTempMinute] = useState(value.getMinutes());

  // Derive display time from value prop directly
  const displayTime = useMemo(() => value, [value]);

  // Memoized update function to avoid recreating on each render
  const updateTimeForPreset = useCallback((presetId: string) => {
    const presetOffsets: Record<string, number> = {
      "now": 0,
      "15m": 15,
      "30m": 30,
      "1h": 60,
    };
    const offsetMinutes = presetOffsets[presetId] ?? 0;
    const now = new Date();
    const newTime = new Date(now.getTime() - offsetMinutes * 60 * 1000);
    newTime.setSeconds(0, 0);
    return newTime;
  }, []);

  // Update time periodically when a relative preset is active
  useEffect(() => {
    if (activePreset === null || activePreset === "custom") {
      return;
    }

    // Update every minute for relative presets
    const interval = setInterval(() => {
      const newTime = updateTimeForPreset(activePreset);
      onChange(newTime);
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [activePreset, onChange, updateTimeForPreset]);

  const presets = [
    { label: "Now", minutes: 0, id: "now" },
    { label: "15m ago", minutes: 15, id: "15m" },
    { label: "30m ago", minutes: 30, id: "30m" },
    { label: "1h ago", minutes: 60, id: "1h" },
  ];

  const handlePresetClick = (minutes: number, id: string) => {
    const now = new Date();
    const newTime = new Date(now.getTime() - minutes * 60 * 1000);
    newTime.setSeconds(0, 0);
    onChange(newTime);
    setActivePreset(id);
  };

  const handleCustomClick = () => {
    setTempDate(displayTime);
    setTempHour(displayTime.getHours());
    setTempMinute(displayTime.getMinutes());
    setShowCustomPicker(true);
  };

  const handleConfirmCustom = () => {
    const newDate = new Date(tempDate);
    newDate.setHours(tempHour, tempMinute, 0, 0);
    onChange(newDate);
    setActivePreset("custom");
    setShowCustomPicker(false);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDisplayTime = (date: Date) => {
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn("space-y-2", className)} id={id}>
      <div className="flex items-center justify-between">
         {label && <label className="text-sm font-medium text-muted-foreground ml-1">{label}</label>}
         <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Clock className="w-3.5 h-3.5" />
            <span suppressHydrationWarning>{formatDisplayTime(displayTime)}</span>
         </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetClick(preset.minutes, preset.id)}
            className={cn(
              "flex items-center justify-center py-3 px-5 rounded-full text-xs font-medium transition-all duration-200 border",
              activePreset === preset.id
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-card text-muted-foreground border-border/50 hover:bg-muted hover:border-border"
            )}
          >
            {preset.label}
          </button>
        ))}
        
        {/* Custom time capsule */}
        <button
          type="button"
          onClick={handleCustomClick}
          className={cn(
            "flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-medium transition-all duration-200 border",
            activePreset === "custom"
              ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
              : "bg-card text-muted-foreground border-border/50 hover:bg-muted hover:border-border"
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          {activePreset === "custom" ? formatDateTime(displayTime) : "Custom"}
        </button>
      </div>

      {/* Custom DateTime Picker Modal */}
      {showCustomPicker && (
        <CustomDateTimePicker
          date={tempDate}
          hour={tempHour}
          minute={tempMinute}
          onDateChange={setTempDate}
          onHourChange={setTempHour}
          onMinuteChange={setTempMinute}
          onConfirm={handleConfirmCustom}
          onCancel={() => setShowCustomPicker(false)}
        />
      )}
    </div>
  );
}

interface CustomDateTimePickerProps {
  date: Date;
  hour: number;
  minute: number;
  onDateChange: (date: Date) => void;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function CustomDateTimePicker({
  date,
  hour,
  minute,
  onDateChange,
  onHourChange,
  onMinuteChange,
  onConfirm,
  onCancel,
}: CustomDateTimePickerProps) {
  const [viewMonth, setViewMonth] = useState(new Date(date.getFullYear(), date.getMonth(), 1));
  
  // Use a ref to track if we're in the browser
  const isBrowser = typeof window !== 'undefined';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const selectDay = (day: number) => {
    const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    onDateChange(newDate);
  };

  const isSelectedDay = (day: number) => {
    return date.getDate() === day && 
           date.getMonth() === viewMonth.getMonth() && 
           date.getFullYear() === viewMonth.getFullYear();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === viewMonth.getMonth() && 
           today.getFullYear() === viewMonth.getFullYear();
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      <div className="relative w-full max-w-sm bg-card rounded-3xl shadow-xl border border-border/50 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
          <h3 className="text-lg font-heading font-semibold text-foreground">Pick Date & Time</h3>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                type="button"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <span className="text-sm font-semibold text-foreground">
                {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                type="button"
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={cn(
                      "aspect-square flex items-center justify-center text-sm font-medium rounded-xl transition-all",
                      isSelectedDay(day)
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : isToday(day)
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <select
                  value={hour}
                  onChange={(e) => onHourChange(parseInt(e.target.value))}
                  className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 text-center text-lg font-semibold appearance-none cursor-pointer focus:border-primary/50 focus:bg-background transition-all"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <div className="text-center text-xs text-muted-foreground mt-1">Hour</div>
              </div>
              
              <span className="text-2xl font-bold text-muted-foreground">:</span>
              
              <div className="flex-1">
                <select
                  value={minute}
                  onChange={(e) => onMinuteChange(parseInt(e.target.value))}
                  className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 text-center text-lg font-semibold appearance-none cursor-pointer focus:border-primary/50 focus:bg-background transition-all"
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <div className="text-center text-xs text-muted-foreground mt-1">Minute</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-border/50 bg-muted/20">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-muted-foreground bg-muted/50 hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  if (!isBrowser) return null;
  return createPortal(modalContent, document.body);
}
