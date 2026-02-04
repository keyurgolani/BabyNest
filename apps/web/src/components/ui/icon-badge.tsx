import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * IconBadge Component
 *
 * A component displaying an icon within a colored, rounded container.
 * Used for activity type icons with consistent colored backgrounds.
 *
 * @requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

/**
 * Activity color types corresponding to different activity categories
 * @requirement 5.1
 */
export type ActivityColor =
  | "feed"
  | "sleep"
  | "diaper"
  | "nursing"
  | "activity"
  | "growth"
  | "health"
  | "memory";

/**
 * Background color class mapping for Tailwind
 * Uses explicit background colors for better contrast and reliability
 * Light mode: Deeper, saturated colors for WCAG AA compliance
 * Dark mode: Brighter colors for visibility against dark backgrounds
 * @requirement 5.1
 */
const bgColorMap: Record<ActivityColor, string> = {
  feed: "bg-[#D97706] dark:bg-[#FBBF24]",
  sleep: "bg-[#4F8B8D] dark:bg-[#67E8F9]",
  diaper: "bg-[#5D8A2F] dark:bg-[#A3E635]",
  nursing: "bg-[#C2185B] dark:bg-[#F472B6]",
  activity: "bg-[#0891B2] dark:bg-[#22D3EE]",
  growth: "bg-[#059669] dark:bg-[#34D399]",
  health: "bg-[#DC2626] dark:bg-[#F87171]",
  memory: "bg-[#D97706] dark:bg-[#FBBF24]",
};

/**
 * Size variants for the IconBadge
 * @requirement 5.2
 */
const iconBadgeSizeVariants = cva(
  // Base styles: rounded-xl, shadow (Requirements 5.4, 5.5)
  "inline-flex items-center justify-center rounded-xl shadow-md transition-all duration-200",
  {
    variants: {
      // Requirement 5.2: size props (sm, default, lg)
      size: {
        sm: "w-8 h-8 rounded-lg",
        default: "w-10 h-10 rounded-xl",
        lg: "w-12 h-12 rounded-xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

/**
 * Icon size mapping based on badge size
 */
const iconSizeMap = {
  sm: "w-4 h-4",
  default: "w-5 h-5",
  lg: "w-6 h-6",
};

export interface IconBadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof iconBadgeSizeVariants> {
  /**
   * The activity color type for the badge background
   * @requirement 5.1
   */
  color: ActivityColor;
  /**
   * The icon component to render inside the badge
   * @requirement 5.3
   */
  icon: React.ComponentType<{ className?: string }>;
  /**
   * Whether to apply a gradient background instead of solid color
   * @requirement 5.4
   * @deprecated Currently not implemented - kept for API compatibility
   */
  gradient?: boolean;
  /**
   * Whether the badge is interactive (clickable/focusable)
   * When true, adds focus ring styling for accessibility
   * @requirement 20.3
   */
  interactive?: boolean;
}

const IconBadge = React.forwardRef<HTMLDivElement, IconBadgeProps>(
  ({ className, color, size = "default", icon: Icon, gradient: _gradient = false, interactive = false, ...props }, ref) => {
    const iconSize = iconSizeMap[size || "default"];
    const bgColorClass = bgColorMap[color];

    return (
      <div
        ref={ref}
        className={cn(
          iconBadgeSizeVariants({ size }),
          bgColorClass,
          // Requirement 20.3: visible focus rings when interactive
          interactive && [
            "cursor-pointer",
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
        <Icon className={cn(iconSize, "text-white dark:text-gray-900")} />
      </div>
    );
  }
);

IconBadge.displayName = "IconBadge";

export { IconBadge, iconBadgeSizeVariants };
