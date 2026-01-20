import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  hasMemories: boolean;
  onAddMemory: () => void;
  onClearFilters: () => void;
}

export function EmptyState({ hasMemories, onAddMemory, onClearFilters }: EmptyStateProps) {
  if (hasMemories) {
    // No results from filters
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center aurora-card animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4 shadow-lg">
          <Icons.Image className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No matching memories</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Try adjusting your filters or search query
        </p>
        <Button onClick={onClearFilters} variant="outline" className="gap-2">
          <Icons.Close className="w-4 h-4" />
          Clear Filters
        </Button>
      </Card>
    );
  }

  // No memories at all
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center aurora-card animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center mb-6 animate-bounce-subtle glow-primary">
        <Icons.Memories className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2 text-shadow-soft">Start Your Memory Book</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Capture precious moments with your little one. Every smile, every milestone, every first - they grow up so fast! 💕
      </p>
      <Button onClick={onAddMemory} className="gap-2 glow-primary">
        <Icons.Plus className="w-4 h-4" />
        Add Your First Memory
      </Button>
    </Card>
  );
}
