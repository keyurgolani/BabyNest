import { Memory, MemoryEntryType } from "@babynest/types";
import { Icons } from "@/components/icons";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface TimelineMemoryCardProps {
  memory: Memory;
  isLast: boolean;
  onDelete: (id: string) => void;
  onView: (memory: Memory) => void;
}

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
        return "bg-amber-500 shadow-lg shadow-amber-500/30";
      case MemoryEntryType.FIRST:
        return "bg-pink-500 shadow-lg shadow-pink-500/30";
      case MemoryEntryType.NOTE:
        return "bg-blue-500 shadow-lg shadow-blue-500/30";
      default:
        return "bg-primary shadow-lg shadow-primary/30";
    }
  };

  return (
    <div className="flex gap-4 animate-in slide-in-from-left duration-300">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${getTypeColor()} ring-4 ring-background`} />
        {!isLast && <div className="w-0.5 flex-1 bg-gradient-to-b from-muted to-transparent mt-2" />}
      </div>

      {/* Content */}
      <Card 
        className="flex-1 flex gap-4 mb-4 group relative cursor-pointer card-hover aurora-card"
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
              />
            </div>
          </div>
        )}
        <div className="flex-1 py-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-muted-foreground">{formatDate(memory.takenAt)}</p>
            {memory.entryType !== MemoryEntryType.PHOTO && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                memory.entryType === MemoryEntryType.MILESTONE ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                memory.entryType === MemoryEntryType.FIRST ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" :
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
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
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
        >
          <Icons.Trash className="w-4 h-4 text-destructive" />
        </button>
      </Card>
    </div>
  );
}
