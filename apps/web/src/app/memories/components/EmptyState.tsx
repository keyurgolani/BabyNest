import { Icons } from "@/components/icons";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";

interface EmptyStateProps {
  hasMemories: boolean;
  onAddMemory: () => void;
  onClearFilters: () => void;
}

/**
 * EmptyState Component
 * 
 * Empty state display with glassmorphism styling for the memories page.
 */
export function EmptyState({ hasMemories, onAddMemory, onClearFilters }: EmptyStateProps) {
  if (hasMemories) {
    // No results from filters
    return (
      <GlassCard className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 shadow-lg">
          <Icons.Image className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No matching memories</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Try adjusting your filters or search query
        </p>
        <GlassButton onClick={onClearFilters} variant="default" className="gap-2">
          <Icons.Close className="w-4 h-4" />
          Clear Filters
        </GlassButton>
      </GlassCard>
    );
  }

  // No memories at all
  return (
    <GlassCard className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 rounded-full bg-[var(--color-memory)]/20 flex items-center justify-center mb-6 shadow-[0_0_30px_var(--color-memory)]">
        <Icons.Memories className="w-10 h-10 text-[var(--color-memory)]" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Start Your Memory Book</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Capture precious moments with your little one. Every smile, every milestone, every first - they grow up so fast! 💕
      </p>
      <GlassButton onClick={onAddMemory} variant="primary" className="gap-2">
        <Icons.Plus className="w-4 h-4" />
        Add Your First Memory
      </GlassButton>
    </GlassCard>
  );
}
