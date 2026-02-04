import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * GlassButton Component
 *
 * A button component with glassmorphism styling featuring gradient backgrounds,
 * glow effects, and touch-friendly sizing.
 *
 * @requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

const glassButtonVariants = cva(
  // Base styles with active:scale-95 animation (Requirement 3.3)
  // Focus ring for accessibility, transition for smooth effects
  // GPU acceleration: will-change and specific transition properties for 60fps (Requirement 21.3)
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-[transform,box-shadow,background-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 will-change-[transform,opacity] [transform:translate3d(0,0,0)]",
  {
    variants: {
      // Requirement 3.1: variant props (default, primary, secondary, ghost, danger)
      // Requirement 3.4: hover glow effect
      // Requirement 3.5: gradient backgrounds for primary/secondary
      variant: {
        default:
          "bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] backdrop-blur-xl text-foreground hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
        primary:
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 hover:shadow-[0_0_20px_var(--primary)]",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground border-0 hover:shadow-[0_0_20px_var(--secondary)]",
        ghost:
          "bg-transparent hover:bg-[var(--glass-bg)] text-foreground border-0",
        danger:
          "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground border-0 hover:shadow-[0_0_20px_var(--destructive)]",
      },
      // Requirement 3.2: size props (sm, default, lg, icon)
      // Requirement 3.6: 48px minimum touch target
      size: {
        sm: "h-9 px-3 rounded-lg text-xs min-h-[48px] min-w-[48px]",
        default: "h-11 px-6 py-2.5 min-h-[48px]",
        lg: "h-14 px-10 rounded-2xl text-base min-h-[48px]",
        icon: "h-11 w-11 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  /**
   * When true, renders the component as a Slot (for composition with other components like Link)
   */
  asChild?: boolean;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(glassButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };
