import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GlassTextarea Component
 *
 * A textarea component with glassmorphism styling featuring transparent background,
 * white/10 border, and focus ring. Applies the same styling as GlassInput.
 *
 * @requirements 4.4
 */

export interface GlassTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * When true, applies error styling to the textarea
   */
  error?: boolean;
}

// Base styles: same glassmorphism styling as GlassInput
// Requirement 4.4: Same styling as GlassInput
// Requirement 20.3: Visible focus rings
const baseStyles = `
  w-full bg-transparent border border-[var(--glass-border)]
  rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
  transition-all duration-200
  disabled:cursor-not-allowed disabled:opacity-50
  min-h-[120px] resize-y
`;

const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ className, error = false, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          baseStyles,
          // Error state styling
          error && "border-destructive/50 focus:ring-destructive/50 focus:border-destructive/50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

GlassTextarea.displayName = "GlassTextarea";

export { GlassTextarea };
