import { useState } from "react";
import { Memory, MemoryEntryType } from "@babynest/types";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface MemoryDetailModalProps {
  memory: Memory;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function MemoryDetailModal({ memory, onClose, onDelete }: MemoryDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Check if Web Share API is available
  useState(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  });

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = () => {
    onDelete(memory.id);
    onClose();
  };

  const handleShare = async () => {
    if (canShare && navigator.share) {
      try {
        await navigator.share({
          title: memory.title || "Memory",
          text: memory.note || "",
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  };

  const handleDownload = () => {
    if (memory.photoUrl) {
      const link = document.createElement("a");
      link.href = memory.photoUrl;
      link.download = `${memory.title || "memory"}-${new Date(memory.takenAt).toISOString().split("T")[0]}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getTypeLabel = () => {
    switch (memory.entryType) {
      case MemoryEntryType.MILESTONE:
        return { label: "Milestone", icon: Icons.Milestone, color: "text-amber-500" };
      case MemoryEntryType.FIRST:
        return { label: "First Moment", icon: Icons.Sparkles, color: "text-pink-500" };
      case MemoryEntryType.NOTE:
        return { label: "Journal Note", icon: Icons.Log, color: "text-blue-500" };
      default:
        return { label: "Photo", icon: Icons.Memories, color: "text-primary" };
    }
  };

  const typeInfo = getTypeLabel();
  const TypeIcon = typeInfo.icon;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 aurora-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        {memory.photoUrl && (
          <div 
            className={`relative bg-muted cursor-pointer transition-all ${
              imageZoomed ? "aspect-auto" : "aspect-video"
            }`}
            onClick={() => setImageZoomed(!imageZoomed)}
          >
            <Image
              src={memory.photoUrl}
              alt={memory.title || "Memory"}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className={`object-contain transition-transform duration-300 ${
                imageZoomed ? "scale-150" : "scale-100"
              }`}
              unoptimized={memory.photoUrl.startsWith("http")}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://api.dicebear.com/7.x/shapes/svg?seed=Memory&backgroundColor=f3f4f6";
              }}
            />
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors shadow-lg"
            >
              <Icons.Close className="w-5 h-5 text-white" />
            </button>
            {/* Zoom indicator */}
            <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs flex items-center gap-1">
              <Icons.Image className="w-3 h-3" />
              {imageZoomed ? "Click to zoom out" : "Click to zoom in"}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Type badge */}
          <div className={`flex items-center gap-2 mb-3 ${typeInfo.color}`}>
            <TypeIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{typeInfo.label}</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-2 text-shadow-soft">
            {memory.title || "Untitled Memory"}
          </h2>

          {/* Date */}
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Icons.Calendar className="w-4 h-4" />
            <span>{formatDate(memory.takenAt)}</span>
          </div>

          {/* Note */}
          {memory.note && (
            <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-4 mb-6">
              <p className="text-foreground whitespace-pre-wrap">{memory.note}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {canShare && (
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <Icons.Image className="w-4 h-4" />
                Share
              </Button>
            )}
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Icons.Image className="w-4 h-4" />
              Download
            </Button>
            {!showDeleteConfirm ? (
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Icons.Trash className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="gap-2"
              >
                <Icons.Trash className="w-4 h-4" />
                Confirm Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
