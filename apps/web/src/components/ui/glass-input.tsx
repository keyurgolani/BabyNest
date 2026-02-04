import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GlassInput Component
 *
 * An input component with glassmorphism styling featuring transparent background,
 * white/10 border, and focus ring.
 *
 * @requirements 4.1, 4.2, 4.3
 */

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * When true, applies error styling to the input
   */
  error?: boolean;
}

// Base styles: transparent background, white/10 border, focus ring
// Requirements 4.1, 4.2, 20.2 (48px minimum touch target), 20.3 (visible focus rings)
const baseStyles = `
  w-full bg-transparent border border-[var(--glass-border)]
  rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
  transition-all duration-200
  disabled:cursor-not-allowed disabled:opacity-50
  min-h-[48px]
`;

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, error = false, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          baseStyles,
          // Error state styling
          error && "border-destructive/50 focus:ring-destructive/50 focus:border-destructive/50",
          className
        )}
        ref={ref}
        // Requirement 4.3: Support standard input props passthrough
        {...props}
      />
    );
  }
);

GlassInput.displayName = "GlassInput";

export { GlassInput };
