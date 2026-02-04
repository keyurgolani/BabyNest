import { Memory, MemoryEntryType } from "@babynest/types";
import { Icons } from "@/components/icons";
import { GlassCard } from "@/components/ui/glass-card";
import Image from "next/image";

interface TimelineMemoryCardProps {
  memory: Memory;
  isLast: boolean;
  onDelete: (id: string) => void;
  onView: (memory: Memory) => void;
}

/**
 * TimelineMemoryCard Component
 * 
 * Timeline view memory card with glassmorphism styling.
 */
export function TimelineMemoryCard({ memory, isLast, onDelete, onView }: TimelineMemoryCardProps) {
  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTypeColor = () => {
    switch (memory.entryType) {
      case MemoryEntryType.MILESTONE:
        return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
      case MemoryEntryType.FIRST:
        return "bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]";
      case MemoryEntryType.NOTE:
        return "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]";
      default:
        return "bg-[var(--color-memory)] shadow-[0_0_10px_var(--color-memory)]";
    }
  };

  return (
    <div className="flex gap-4 animate-in slide-in-from-left duration-300">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${getTypeColor()} ring-4 ring-background`} />
        {!isLast && <div className="w-0.5 flex-1 bg-gradient-to-b from-[var(--glass-border)] to-transparent mt-2" />}
      </div>

      {/* Content */}
      <GlassCard 
        interactive
        size="sm"
        className="flex-1 flex gap-4 mb-4 group relative cursor-pointer"
        onClick={() => onView(memory)}
      >
        {memory.photoUrl && (
          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
            <div className="relative w-full h-full">
              <Image
                src={memory.photoUrl}
                alt={memory.title || "Memory"}
                fill
                sizes="96px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized={memory.photoUrl.startsWith("http")}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://api.dicebear.com/7.x/shapes/svg?seed=Memory&backgroundColor=f3f4f6";
                }}
              />
            </div>
          </div>
        )}
        <div className="flex-1 py-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-muted-foreground">{formatDate(memory.takenAt)}</p>
            {memory.entryType !== MemoryEntryType.PHOTO && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                memory.entryType === MemoryEntryType.MILESTONE ? "bg-amber-500/20 text-amber-300" :
                memory.entryType === MemoryEntryType.FIRST ? "bg-pink-500/20 text-pink-300" :
                "bg-blue-500/20 text-blue-300"
              }`}>
                {memory.entryType}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground">
            {memory.title || "Untitled Memory"}
          </h3>
          {memory.note && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{memory.note}</p>
          )}
        </div>
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this memory?")) {
              onDelete(memory.id);
            }
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
        >
          <Icons.Trash className="w-4 h-4 text-destructive" />
        </button>
      </GlassCard>
    </div>
  );
}
