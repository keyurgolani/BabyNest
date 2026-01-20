"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
  label?: string;
}

export function NumberStepper({
  value,
  min = 0,
  max = 1000,
  step = 10,
  onChange,
  unit = "",
  className,
  label
}: NumberStepperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive display value - when not editing, always show the prop value
  const displayValue = useMemo(() => {
    return isEditing ? editingValue : value.toString();
  }, [isEditing, editingValue, value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDecrease = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleIncrease = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  const handleStartEditing = () => {
    setEditingValue(value.toString());
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsed = parseFloat(editingValue);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-sm font-medium text-muted-foreground ml-1">{label}</span>}
      <div className="flex items-center gap-4 bg-muted/40 p-2 rounded-3xl border border-border/50">
        <Button
          type="button"
          onClick={handleDecrease}
          disabled={value <= min}
          variant="outline"
          size="icon"
          aria-label="Decrease value"
          className="h-14 w-14 rounded-2xl shrink-0 border-0 bg-background shadow-sm hover:bg-background/80 active:scale-95 transition-all"
        >
          <Minus className="w-6 h-6" />
        </Button>

        <div 
          className="flex-1 flex flex-col items-center justify-center cursor-text" 
          aria-live="polite" 
          aria-atomic="true"
          onClick={handleStartEditing}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              value={displayValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              min={min}
              max={max}
              step={step}
              className="w-24 text-center text-3xl font-bold tabular-nums tracking-tight bg-transparent border-b-2 border-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label={`Enter ${unit || 'value'}`}
            />
          ) : (
            <span className="text-3xl font-bold tabular-nums tracking-tight hover:text-primary transition-colors">
              {value}
            </span>
          )}
          {unit && <span className="text-xs font-medium text-muted-foreground uppercase">{unit}</span>}
        </div>

        <Button
          type="button"
          onClick={handleIncrease}
          disabled={value >= max}
          variant="outline"
          size="icon"
          aria-label="Increase value"
          className="h-14 w-14 rounded-2xl shrink-0 border-0 bg-background shadow-sm hover:bg-background/80 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
