import { useState } from "react";
import { Memory, MemoryEntryType } from "@babynest/types";
import { Icons } from "@/components/icons";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface MemoryCardProps {
  memory: Memory;
  onDelete: (id: string) => void;
  onView: (memory: Memory) => void;
  index: number;
}

export function MemoryCard({ memory, onDelete, onView, index }: MemoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get icon based on memory type
  const getTypeIcon = () => {
    switch (memory.entryType) {
      case MemoryEntryType.MILESTONE:
        return <Icons.Milestone className="w-3 h-3" />;
      case MemoryEntryType.FIRST:
        return <Icons.Sparkles className="w-3 h-3" />;
      case MemoryEntryType.NOTE:
        return <Icons.Log className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const typeIcon = getTypeIcon();

  return (
    <Card 
      className="overflow-hidden p-0 group cursor-pointer card-elevated transition-all duration-300 relative animate-in fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => onView(memory)}
    >
      <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted relative overflow-hidden rounded-xl">
        {/* Loading skeleton */}
        {!imageLoaded && memory.photoUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" />
        )}
        
        {memory.photoUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={memory.photoUrl}
              alt={memory.title || "Memory"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover group-hover:scale-110 transition-transform duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              unoptimized={memory.photoUrl.startsWith("http")}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
            <Icons.Image className="w-12 h-12 text-primary/40" />
          </div>
        )}

        {/* Warm gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Type badge */}
        {typeIcon && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs flex items-center gap-1 shadow-lg">
            {typeIcon}
            <span className="capitalize">{memory.entryType}</span>
          </div>
        )}

        {/* Menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <Icons.MoreVertical className="w-4 h-4 text-white" />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div 
            className="absolute top-12 right-2 bg-background rounded-lg shadow-xl border p-1 z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this memory?")) {
                  onDelete(memory.id);
                }
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md w-full transition-colors"
            >
              <Icons.Trash className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}

        {/* Title overlay on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h3 className="font-semibold text-white truncate text-sm drop-shadow-lg">
            {memory.title || "Untitled Memory"}
          </h3>
          <p className="text-xs text-white/90 drop-shadow-md">{formatDate(memory.takenAt)}</p>
        </div>
      </div>
    </Card>
  );
}
