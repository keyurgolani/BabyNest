import * as React from "react";
import { cn } from "@/lib/utils";
import { ActivityColor } from "./icon-badge";
import { GlassCard } from "./glass-card";

/**
 * TimelineItem Component
 *
 * A component for displaying events in a vertical timeline with visual connections.
 * Renders a dot indicator, connecting line, and event details in a GlassCard.
 *
 * @requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

/**
 * Color mapping to CSS variables for dot and icon styling
 * @requirement 7.4
 */
const colorMap: Record<ActivityColor, string> = {
  feed: "var(--color-feed)",
  sleep: "var(--color-sleep)",
  diaper: "var(--color-diaper)",
  nursing: "var(--color-nursing)",
  activity: "var(--color-activity)",
  growth: "var(--color-growth)",
  health: "var(--color-health)",
  memory: "var(--color-feed)",
};

export interface TimelineItemProps {
  /**
   * The icon component to render
   * @requirement 7.1
   */
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  /**
   * The time of the event (string or Date)
   * @requirement 7.1, 7.5
   */
  time: string | Date;
  /**
   * The title of the event
   * @requirement 7.1
   */
  title: string;
  /**
   * Optional detail text for the event
   * @requirement 7.1
   */
  detail?: string;
  /**
   * The activity color type for the icon and dot
   * @requirement 7.1, 7.4
   */
  color: ActivityColor;
  /**
   * Whether this is the first item in the timeline (hides top connecting line)
   */
  isFirst?: boolean;
  /**
   * Whether this is the last item in the timeline (hides bottom connecting line)
   */
  isLast?: boolean;
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * Formats a Date object or string to a display time string
 * @requirement 7.5
 */
function formatTime(time: string | Date): string {
  if (typeof time === "string") {
    return time;
  }
  return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  (
    {
      icon: Icon,
      time,
      title,
      detail,
      color,
      isFirst = false,
      isLast = false,
      className,
    },
    ref
  ) => {
    const dotColor = colorMap[color];
    const formattedTime = formatTime(time);

    return (
      <div ref={ref} className={cn("relative flex gap-4", className)}>
        {/* Timeline indicator column - dot and connecting lines */}
        <div className="relative flex flex-col items-center">
          {/* Top connecting line - hidden for first item */}
          {/* @requirement 7.2 */}
          <div
            className={cn(
              "w-0.5 flex-1 min-h-3",
              isFirst ? "bg-transparent" : "bg-white/20"
            )}
            aria-hidden="true"
          />

          {/* Dot indicator */}
          {/* @requirement 7.3, 7.4 */}
          <div
            className="relative z-10 flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white/10"
            style={{ backgroundColor: dotColor }}
            aria-hidden="true"
          >
            {/* Inner glow effect */}
            <div
              className="absolute inset-0 rounded-full opacity-50 blur-sm"
              style={{ backgroundColor: dotColor }}
            />
          </div>

          {/* Bottom connecting line - hidden for last item */}
          {/* @requirement 7.2 */}
          <div
            className={cn(
              "w-0.5 flex-1 min-h-3",
              isLast ? "bg-transparent" : "bg-white/20"
            )}
            aria-hidden="true"
          />
        </div>

        {/* Content column - GlassCard with icon, time, title, detail */}
        <div className="flex-1 pb-4">
          <GlassCard size="sm" className="flex items-start gap-3">
            {/* Icon with color */}
            {/* @requirement 7.4 */}
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ backgroundColor: `${dotColor}20` }}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: dotColor }}
              />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              {/* Time display */}
              {/* @requirement 7.5 */}
              <p className="text-xs text-muted-foreground mb-0.5">
                {formattedTime}
              </p>

              {/* Title */}
              <h4 className="text-sm font-medium text-foreground truncate">
                {title}
              </h4>

              {/* Optional detail */}
              {detail && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {detail}
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }
);

TimelineItem.displayName = "TimelineItem";

export { TimelineItem };
