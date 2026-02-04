"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Switch Component
 * 
 * A toggle switch with glassmorphism styling and 48px minimum touch target.
 * The visual switch is 24px tall but the touch area is expanded to 48px.
 * 
 * @requirements 20.2 - 48px minimum touch target
 */
interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        className={cn(
          // Visual switch size
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
          // Glassmorphism styling
          "border-2 border-transparent transition-colors",
          // Focus states
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Checked/unchecked colors
          checked ? "bg-primary" : "bg-input",
          // Touch target: 48px minimum using relative positioning with pseudo-element
          "relative before:absolute before:inset-[-12px] before:content-['']",
          // Ensure minimum touch target dimensions
          "min-h-[48px] min-w-[48px]",
          className
        )}
        onClick={handleClick}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
