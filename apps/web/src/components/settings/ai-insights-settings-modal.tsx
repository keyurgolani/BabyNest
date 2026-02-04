"use client";

import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { Icons } from "@/components/icons";
import { InsightConfigCard, InsightHistoryCard } from "@/components/insights";

/**
 * AiInsightsSettingsModal Component
 *
 * A modal for configuring AI insights generation settings with glassmorphism styling.
 * Uses GlassModal wrapper, switch components for toggles, and GlassButton for actions.
 * 
 * The modal contains:
 * - InsightConfigCard: Configure insight generation schedule and enable/disable auto-generation
 * - InsightHistoryCard: View and generate AI insights history
 *
 * @requirements 18.5
 */

interface AiInsightsSettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
}

export function AiInsightsSettingsModal({ isOpen, onClose }: AiInsightsSettingsModalProps) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Insights"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Icon and Description */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Icons.Insights className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Configure AI-powered insights and view generation history
          </p>
        </div>

        {/* Insight Configuration Card */}
        <InsightConfigCard />

        {/* Insight History Card */}
        <InsightHistoryCard />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <GlassButton
            type="button"
            variant="primary"
            onClick={onClose}
            className="flex-1"
          >
            <div className="flex items-center gap-2">
              <Icons.Check className="w-4 h-4" />
              <span>Done</span>
            </div>
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
