import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * FilterPills Component
 *
 * A component for filtering content using pill-shaped toggle buttons.
 * Supports horizontal scrolling when options exceed container width.
 *
 * @requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */

/**
 * Filter option interface
 * @requirement 8.1
 */
export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * FilterPills props interface
 * @requirement 8.1
 */
export interface FilterPillsProps {
  /**
   * Array of filter options to display
   * @requirement 8.1
   */
  options: FilterOption[];
  /**
   * Currently selected option value
   * @requirement 8.1
   */
  selected: string;
  /**
   * Callback when selection changes
   * @requirement 8.1, 8.4
   */
  onChange: (value: string) => void;
  /**
   * Optional className for the container
   */
  className?: string;
}

/**
 * FilterPills Component
 *
 * Renders pill-shaped buttons for filtering content with active/inactive states.
 * Container supports horizontal scrolling for overflow.
 *
 * @requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */
const FilterPills = React.forwardRef<HTMLDivElement, FilterPillsProps>(
  ({ options, selected, onChange, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Requirement 8.5: horizontal scrolling for overflow
          "flex gap-2 overflow-x-auto scrollbar-hide pb-1",
          // Hide scrollbar but keep functionality
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          className
        )}
        role="tablist"
        aria-label="Filter options"
      >
        {/* Requirement 8.2: render pill-shaped buttons for each option */}
        {options.map((option) => {
          const isSelected = selected === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onChange(option.value)}
              className={cn(
                // Base pill styles
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                // Focus ring for accessibility
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                // Requirement 20.2: 48px minimum touch target
                "min-h-[48px]",
                // Requirement 8.3: active state - filled background with primary color
                isSelected && [
                  "bg-primary text-primary-foreground",
                  "shadow-md",
                  "hover:bg-primary/90",
                ],
                // Requirement 8.3: inactive state - transparent with border
                !isSelected && [
                  "bg-[var(--glass-bg)] border border-[var(--glass-border)]",
                  "text-foreground/80",
                  "hover:bg-[var(--glass-bg-hover)]",
                  "hover:text-foreground",
                  "backdrop-blur-sm",
                ]
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isSelected ? "text-primary-foreground" : "text-foreground/70"
                  )}
                />
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }
);

FilterPills.displayName = "FilterPills";

export { FilterPills };
