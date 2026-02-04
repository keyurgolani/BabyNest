import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PageHeader Component
 *
 * A standardized header component for pages with title, subtitle, and optional actions.
 * Uses Outfit font for title and Plus Jakarta Sans for subtitle.
 *
 * @requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

export interface PageHeaderProps {
  /**
   * The main title of the page
   * @requirement 6.1
   */
  title: string;
  /**
   * Optional subtitle displayed below the title
   * @requirement 6.1
   */
  subtitle?: string;
  /**
   * Optional action element (e.g., button) displayed on the right side
   * @requirement 6.2
   */
  action?: React.ReactNode;
  /**
   * Optional href for back navigation button
   * @requirement 6.3, 6.4
   */
  backHref?: string;
  /**
   * Optional additional className for the container
   */
  className?: string;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, subtitle, action, backHref, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between gap-4 mb-6",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Back Button - Requirement 6.3, 6.4 */}
          {backHref && (
            <Link
              href={backHref}
              className={cn(
                "flex items-center justify-center",
                "w-10 h-10 rounded-xl",
                "bg-[var(--glass-bg)] backdrop-blur-sm",
                "border border-[var(--glass-border)]",
                "text-foreground/70 hover:text-foreground",
                "hover:bg-[var(--glass-bg-hover)]",
                "transition-all duration-200",
                "touch-target",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              )}
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          )}

          {/* Title and Subtitle Container */}
          <div className="min-w-0 flex-1">
            {/* Title - Requirement 6.1, 6.5 (Outfit font) */}
            <h1
              className={cn(
                "font-heading text-2xl font-semibold text-foreground",
                "truncate"
              )}
              style={{ fontFamily: "var(--font-outfit), var(--font-heading), system-ui, sans-serif" }}
            >
              {title}
            </h1>

            {/* Subtitle - Requirement 6.1 (Plus Jakarta Sans font - default body font) */}
            {subtitle && (
              <p className="text-sm text-foreground/80 dark:text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action - Requirement 6.2 */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";

export { PageHeader };
