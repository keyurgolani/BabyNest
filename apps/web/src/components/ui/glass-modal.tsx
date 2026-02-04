"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { X } from "lucide-react";

/**
 * GlassModal Component
 *
 * A reusable modal wrapper with glassmorphism styling that adapts to viewport size.
 * - On mobile viewports (<768px): displays as full-screen sheet with slide-up animation
 * - On tablet/desktop viewports (>=768px): displays as centered dialog with fade-in animation
 *
 * Features:
 * - Uses GlassCard as the dialog panel
 * - Applies backdrop-blur-sm to overlay
 * - Handles escape key to close
 * - Handles click outside to close
 * - Supports multiple sizes (sm, default, lg)
 * - Framer-motion animations for smooth transitions
 *
 * @requirements 18.1, 18.2, 18.3, 18.4
 */

const modalSizeVariants = cva("", {
  variants: {
    size: {
      sm: "md:max-w-sm",
      default: "md:max-w-md",
      lg: "md:max-w-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface GlassModalProps extends VariantProps<typeof modalSizeVariants> {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title displayed in the header */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Additional class names for the modal container */
  className?: string;
  /** Whether to show the close button in the header */
  showCloseButton?: boolean;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing escape closes the modal */
  closeOnEscape?: boolean;
}

// Animation variants for the backdrop
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Animation variants for mobile (full-screen sheet with slide-up)
const mobileSheetVariants = {
  hidden: { y: "100%", opacity: 0.5 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 200,
    },
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn" as const,
    },
  },
};

// Animation variants for desktop (centered dialog with fade-in)
const desktopDialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
      ease: "easeIn" as const,
    },
  },
};

export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  size = "default",
  className,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: GlassModalProps) {
  // Handle escape key press
  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur - Requirement 18.2 */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "glass-modal-title" : undefined}
          >
            {/* Mobile: Full-screen sheet - Requirement 18.3 */}
            <motion.div
              variants={mobileSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                // Mobile: full-screen sheet
                "w-full h-[90vh] md:hidden",
                "flex flex-col overflow-hidden",
                // Glassmorphism styling via GlassCard-like classes
                "backdrop-blur-xl bg-[var(--glass-bg)] dark:bg-black/20",
                "border-t border-[var(--glass-border)]",
                "rounded-t-3xl shadow-2xl",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div className="flex items-center justify-center py-3 flex-shrink-0">
                <div className="w-12 h-1.5 rounded-full bg-white/30" />
              </div>

              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                  {title && (
                    <h2
                      id="glass-modal-title"
                      className="font-heading font-bold text-lg text-foreground"
                    >
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <GlassButton
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="rounded-full ml-auto"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </GlassButton>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {children}
              </div>

              {/* Safe area padding for home indicator */}
              <div className="pb-safe flex-shrink-0" />
            </motion.div>

            {/* Desktop: Centered dialog - Requirement 18.4 */}
            <motion.div
              variants={desktopDialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                // Desktop: centered dialog
                "hidden md:block w-full",
                modalSizeVariants({ size }),
                "mx-4"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Using GlassCard as the dialog panel - Requirement 18.1 */}
              <GlassCard
                size="lg"
                className={cn(
                  "max-h-[85vh] flex flex-col overflow-hidden",
                  className
                )}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
                    {title && (
                      <h2
                        id="glass-modal-title"
                        className="font-heading font-bold text-xl text-foreground"
                      >
                        {title}
                      </h2>
                    )}
                    {showCloseButton && (
                      <GlassButton
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full ml-auto"
                        aria-label="Close modal"
                      >
                        <X className="w-5 h-5" />
                      </GlassButton>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto pt-4">
                  {children}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default GlassModal;
