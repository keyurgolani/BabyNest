"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface ThemedDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
}

export function ThemedDatePicker({
  value,
  onChange,
  label = "Date",
  disabled = false,
  maxDate,
  minDate,
}: ThemedDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return value ? new Date(value + 'T00:00:00') : new Date();
  });
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const date = value ? new Date(value + 'T00:00:00') : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select date";
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0
  ).getDate();
  
  const firstDayOfMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    1
  ).getDay();

  const prevMonth = () => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    );
  };

  const selectDay = (day: number) => {
    const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    
    // Check if date is within allowed range
    if (maxDate && newDate > maxDate) return;
    if (minDate && newDate < minDate) return;
    
    setSelectedDate(newDate);
    
    // Format as YYYY-MM-DD
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(newDate.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    setShowPicker(false);
  };

  const isSelectedDay = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth.getMonth() &&
      selectedDate.getFullYear() === viewMonth.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth.getMonth() &&
      today.getFullYear() === viewMonth.getFullYear()
    );
  };

  const isDayDisabled = (day: number) => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    if (maxDate && date > maxDate) return true;
    if (minDate && date < minDate) return true;
    return false;
  };

  const goToToday = () => {
    const today = new Date();
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    selectDay(today.getDate());
  };

  useEffect(() => {
    if (showPicker) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPicker]);

  const pickerModal = showPicker && typeof window !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setShowPicker(false)}
      />

      <div className="relative w-full max-w-sm bg-card rounded-3xl shadow-xl border border-border/50 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
          <h3 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {label}
          </h3>
          <button
            onClick={() => setShowPicker(false)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Calendar */}
        <div className="p-4 space-y-4">
          {/* Month Navigation */}
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

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const disabled = isDayDisabled(day);
              
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !disabled && selectDay(day)}
                  disabled={disabled}
                  className={cn(
                    "aspect-square flex items-center justify-center text-sm font-medium rounded-xl transition-all",
                    disabled
                      ? "text-muted-foreground/30 cursor-not-allowed"
                      : isSelectedDay(day)
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

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
        <button
          type="button"
          onClick={() => !disabled && setShowPicker(true)}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 rounded-xl bg-muted border-0 text-left flex items-center justify-between transition-all",
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-muted/80 focus:ring-2 focus:ring-primary outline-none"
          )}
        >
          <span className="text-foreground">
            {formatDisplayDate(value)}
          </span>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {pickerModal}
    </>
  );
}
