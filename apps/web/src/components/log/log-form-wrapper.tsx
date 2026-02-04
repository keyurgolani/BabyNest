"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";

/**
 * LogFormWrapper Component
 *
 * A reusable wrapper component for all log input forms that provides
 * consistent layout with PageHeader and GlassCard container.
 *
 * @requirements 14.1 - EACH log input form SHALL use PageHeader with title and back navigation
 * @requirements 14.2 - EACH log input form SHALL use GlassCard as the form container
 */

export interface LogFormWrapperProps {
  /**
   * The title displayed in the PageHeader
   * @requirement 14.1
   */
  title: string;
  /**
   * Optional subtitle displayed below the title in the PageHeader
   */
  subtitle?: string;
  /**
   * The href for back navigation (defaults to "/log")
   * @requirement 14.1
   */
  backHref?: string;
  /**
   * Optional action element displayed in the PageHeader
   */
  action?: React.ReactNode;
  /**
   * The form content to be wrapped in GlassCard
   * @requirement 14.2
   */
  children: React.ReactNode;
  /**
   * Optional additional className for the outer container
   */
  className?: string;
  /**
   * Optional additional className for the GlassCard container
   */
  cardClassName?: string;
  /**
   * Whether to show the GlassCard wrapper (defaults to true)
   * Set to false for forms that need custom card layouts
   */
  showCard?: boolean;
}

const LogFormWrapper = React.forwardRef<HTMLDivElement, LogFormWrapperProps>(
  (
    {
      title,
      subtitle,
      backHref = "/log",
      action,
      children,
      className,
      cardClassName,
      showCard = true,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "space-y-6 animate-slide-up",
          className
        )}
      >
        {/* PageHeader with back navigation - Requirement 14.1 */}
        <PageHeader
          title={title}
          subtitle={subtitle}
          backHref={backHref}
          action={action}
        />

        {/* GlassCard form container - Requirement 14.2 */}
        {showCard ? (
          <GlassCard
            size="lg"
            className={cn(
              "space-y-6",
              cardClassName
            )}
          >
            {children}
          </GlassCard>
        ) : (
          children
        )}
      </div>
    );
  }
);

LogFormWrapper.displayName = "LogFormWrapper";

export { LogFormWrapper };
