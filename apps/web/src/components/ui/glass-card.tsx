import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * GlassCard Component
 * 
 * A card component with glassmorphism styling featuring frosted glass effects,
 * semi-transparent backgrounds, and subtle borders.
 * 
 * @requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

const glassCardVariants = cva(
  // Base styles: backdrop-blur-xl, bg-white/10, border-white/20, rounded-3xl, shadow-xl
  // Requirements 2.1, 2.5, 2.6
  // GPU acceleration: will-change and transform for 60fps animations (Requirement 21.3)
  // Added isolate and contain to prevent backdrop-filter bleeding artifacts
  "backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl shadow-xl transition-[transform,box-shadow,background-color] duration-200 will-change-[transform,opacity] isolate [contain:layout_paint]",
  {
    variants: {
      // Requirement 2.2: variant props (default, flat, featured, danger)
      variant: {
        default: "bg-[var(--glass-bg)] border-[var(--glass-border)]",
        flat: "bg-[var(--glass-bg)] border-transparent",
        featured: "bg-[var(--glass-bg)] border-primary/30 ring-1 ring-primary/20",
        danger: "bg-[var(--glass-bg)] border-destructive/30",
      },
      // Requirement 2.3: size props (sm, default, lg)
      size: {
        sm: "p-3 rounded-2xl",
        default: "p-4 rounded-3xl",
        lg: "p-6 rounded-3xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  /**
   * When true, applies hover and active state animations
   * @requirement 2.4
   */
  interactive?: boolean;
  children?: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, size, interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, size }),
          // Requirement 2.4: interactive prop with hover/active states
          // Requirement 20.3: visible focus rings when interactive
          // Requirement 21.3: GPU-accelerated transforms for 60fps
          interactive && [
            "cursor-pointer",
            "hover:bg-[var(--glass-bg-hover)]",
            "hover:shadow-2xl",
            "hover:-translate-y-0.5",
            "active:bg-[var(--glass-bg-active)]",
            "active:scale-[0.98]",
            "active:shadow-lg",
            // GPU acceleration for smooth animations
            "[transform:translate3d(0,0,0)]",
            // Focus ring for keyboard navigation
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-primary",
            "focus-visible:ring-offset-2",
          ],
          className
        )}
        // Add tabIndex for keyboard accessibility when interactive
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard, glassCardVariants };
