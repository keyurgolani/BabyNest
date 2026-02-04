"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Memory, MemoryEntryType } from "@babynest/types";
import { Icons } from "@/components/icons";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

/**
 * MemoryDetailModal - Lightbox Modal Component
 * 
 * A glassmorphism-styled lightbox modal for viewing memories with:
 * - Zoom functionality (pinch-to-zoom on mobile, scroll wheel on desktop)
 * - Pan functionality when zoomed in
 * - Swipe navigation to move between memories
 * - Glassmorphism styling with backdrop-blur
 * - Close button, navigation arrows, and memory details
 * - Framer-motion for smooth animations
 * 
 * @requirements 16.6
 */

interface MemoryDetailModalProps {
  memory: Memory;
  memories?: Memory[];
  currentIndex?: number;
  onClose: () => void;
  onDelete: (id: string) => void;
  onNavigate?: (memory: Memory) => void;
}

// Zoom constraints
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

// Swipe threshold for navigation
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 500;

export function MemoryDetailModal({ 
  memory, 
  memories = [],
  currentIndex: initialIndex,
  onClose, 
  onDelete,
  onNavigate,
}: MemoryDetailModalProps) {
  // State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [canShare] = useState(() => typeof navigator !== "undefined" && "share" in navigator);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  
  // Calculate current index
  const currentIndex = initialIndex ?? memories.findIndex(m => m.id === memory.id);
  const hasPrevious = memories.length > 1 && currentIndex > 0;
  const hasNext = memories.length > 1 && currentIndex < memories.length - 1;

  // Format date helper
  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get type label and icon
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

  // Navigation handlers - declared before useEffect that uses them
  const navigatePrevious = useCallback(() => {
    if (hasPrevious && onNavigate) {
      const prevMemory = memories[currentIndex - 1];
      if (prevMemory) {
        // Reset zoom/pan state before navigating
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setImageLoaded(false);
        setShowDeleteConfirm(false);
        onNavigate(prevMemory);
      }
    }
  }, [hasPrevious, onNavigate, memories, currentIndex]);

  const navigateNext = useCallback(() => {
    if (hasNext && onNavigate) {
      const nextMemory = memories[currentIndex + 1];
      if (nextMemory) {
        // Reset zoom/pan state before navigating
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setImageLoaded(false);
        setShowDeleteConfirm(false);
        onNavigate(nextMemory);
      }
    }
  }, [hasNext, onNavigate, memories, currentIndex]);

  // Zoom handlers - declared before useEffect that uses them
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      if (newZoom === MIN_ZOOM) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoom > 1) {
          resetZoom();
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft" && hasPrevious && zoom === 1) {
        navigatePrevious();
      } else if (e.key === "ArrowRight" && hasNext && zoom === 1) {
        navigateNext();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoom, hasPrevious, hasNext, onClose, resetZoom, navigatePrevious, navigateNext, handleZoomIn, handleZoomOut]);

  // Handle wheel zoom (desktop)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom(prev => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(prev + delta, MAX_ZOOM));
      if (newZoom === MIN_ZOOM) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  // Handle touch events for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      if (touch1 && touch2) {
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        lastTouchDistance.current = distance;
        lastTouchCenter.current = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      if (touch1 && touch2) {
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = distance / lastTouchDistance.current;
        setZoom(prev => {
          const newZoom = Math.max(MIN_ZOOM, Math.min(prev * scale, MAX_ZOOM));
          if (newZoom === MIN_ZOOM) {
            setPan({ x: 0, y: 0 });
          }
          return newZoom;
        });
        lastTouchDistance.current = distance;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
  }, []);

  // Handle pan/drag when zoomed
  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (zoom > 1) {
      setPan(prev => ({
        x: prev.x + info.delta.x,
        y: prev.y + info.delta.y,
      }));
    }
  }, [zoom]);

  // Handle swipe navigation
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (zoom > 1) {
      // Constrain pan within bounds when zoomed
      const container = imageContainerRef.current;
      if (container) {
        const bounds = container.getBoundingClientRect();
        const maxPanX = (bounds.width * (zoom - 1)) / 2;
        const maxPanY = (bounds.height * (zoom - 1)) / 2;
        setPan(prev => ({
          x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
          y: Math.max(-maxPanY, Math.min(maxPanY, prev.y)),
        }));
      }
      return;
    }

    // Handle swipe navigation when not zoomed
    const swipeDistance = info.offset.x;
    const swipeVelocity = info.velocity.x;

    if (Math.abs(swipeDistance) > SWIPE_THRESHOLD || Math.abs(swipeVelocity) > SWIPE_VELOCITY_THRESHOLD) {
      if (swipeDistance > 0 && hasPrevious) {
        navigatePrevious();
      } else if (swipeDistance < 0 && hasNext) {
        navigateNext();
      }
    }
  }, [zoom, hasPrevious, hasNext, navigatePrevious, navigateNext]);

  // Action handlers
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
        // User cancelled or share failed
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

  // Double tap to zoom
  const handleDoubleClick = useCallback(() => {
    if (zoom > 1) {
      resetZoom();
    } else {
      setZoom(2);
    }
  }, [zoom, resetZoom]);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && zoom === 1) {
            onClose();
          }
        }}
      >
        {/* Close Button - Top Right */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute top-4 right-4 z-50"
        >
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="bg-black/40 hover:bg-black/60 text-white border-white/10"
            aria-label="Close lightbox"
          >
            <Icons.Close className="w-5 h-5" />
          </GlassButton>
        </motion.div>

        {/* Navigation Counter - Top Center */}
        {memories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-white/90 text-sm font-medium border border-white/10">
              {currentIndex + 1} / {memories.length}
            </div>
          </motion.div>
        )}

        {/* Zoom Controls - Top Left */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute top-4 left-4 z-50 flex gap-2"
        >
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="bg-black/40 hover:bg-black/60 text-white border-white/10 disabled:opacity-30"
            aria-label="Zoom out"
          >
            <Icons.Minus className="w-4 h-4" />
          </GlassButton>
          <div className="flex items-center px-3 py-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/90 text-sm font-medium border border-white/10 min-w-[60px] justify-center">
            {Math.round(zoom * 100)}%
          </div>
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="bg-black/40 hover:bg-black/60 text-white border-white/10 disabled:opacity-30"
            aria-label="Zoom in"
          >
            <Icons.Plus className="w-4 h-4" />
          </GlassButton>
          {zoom > 1 && (
            <GlassButton
              variant="ghost"
              size="icon"
              onClick={resetZoom}
              className="bg-black/40 hover:bg-black/60 text-white border-white/10"
              aria-label="Reset zoom"
            >
              <Icons.Maximize className="w-4 h-4" />
            </GlassButton>
          )}
        </motion.div>

        {/* Previous Navigation Arrow */}
        {hasPrevious && zoom === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 hidden md:block"
          >
            <GlassButton
              variant="ghost"
              size="icon"
              onClick={navigatePrevious}
              className="bg-black/40 hover:bg-black/60 text-white border-white/10 w-12 h-12"
              aria-label="Previous memory"
            >
              <Icons.ChevronLeft className="w-6 h-6" />
            </GlassButton>
          </motion.div>
        )}

        {/* Next Navigation Arrow */}
        {hasNext && zoom === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 hidden md:block"
          >
            <GlassButton
              variant="ghost"
              size="icon"
              onClick={navigateNext}
              className="bg-black/40 hover:bg-black/60 text-white border-white/10 w-12 h-12"
              aria-label="Next memory"
            >
              <Icons.ChevronRight className="w-6 h-6" />
            </GlassButton>
          </motion.div>
        )}

        {/* Main Image Container */}
        <motion.div
          ref={imageContainerRef}
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          drag={zoom > 1 || (zoom === 1 && memories.length > 1)}
          dragConstraints={zoom > 1 ? undefined : { left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={zoom > 1 ? 0.1 : 0.5}
          onDrag={zoom > 1 ? handleDrag : undefined}
          onDragEnd={handleDragEnd}
          style={{ touchAction: "none" }}
        >
          {memory.photoUrl && (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: imageLoaded ? 1 : 0, 
                scale: zoom,
                x: pan.x,
                y: pan.y,
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                opacity: { duration: 0.2 },
                scale: { type: "spring", stiffness: 300, damping: 30 },
                x: { type: "spring", stiffness: 300, damping: 30 },
                y: { type: "spring", stiffness: 300, damping: 30 },
              }}
              onDoubleClick={handleDoubleClick}
              className="relative max-w-[90vw] max-h-[80vh] cursor-grab active:cursor-grabbing"
              style={{ 
                transformOrigin: "center center",
              }}
            >
              <Image
                src={memory.photoUrl}
                alt={memory.title || "Memory"}
                width={1200}
                height={800}
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg select-none"
                style={{ pointerEvents: "none" }}
                priority
                unoptimized={memory.photoUrl.startsWith("http")}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://api.dicebear.com/7.x/shapes/svg?seed=Memory&backgroundColor=f3f4f6";
                  setImageLoaded(true);
                }}
              />
            </motion.div>
          )}

          {/* Loading indicator */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icons.Loader className="w-8 h-8 animate-spin text-white/50" />
            </div>
          )}
        </motion.div>

        {/* Swipe Hint for Mobile */}
        {memories.length > 1 && zoom === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 md:hidden"
          >
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-white/70 text-xs flex items-center gap-2 border border-white/10">
              <Icons.ChevronLeft className="w-3 h-3" />
              <span>Swipe to navigate</span>
              <Icons.ChevronRight className="w-3 h-3" />
            </div>
          </motion.div>
        )}

        {/* Bottom Details Panel */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: showDetails ? 1 : 0, y: showDetails ? 0 : 50 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 z-40"
        >
          <GlassCard 
            className="mx-4 mb-4 md:mx-auto md:max-w-2xl bg-black/60 border-white/10"
            size="default"
          >
            {/* Toggle Details Button */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 rounded-t-xl bg-black/60 backdrop-blur-sm text-white/70 text-xs flex items-center gap-2 border border-white/10 border-b-0 hover:text-white transition-colors"
              aria-label={showDetails ? "Hide details" : "Show details"}
            >
              <motion.span
                animate={{ rotate: showDetails ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Icons.ChevronDown className="w-4 h-4" />
              </motion.span>
              {showDetails ? "Hide details" : "Show details"}
            </button>

            {/* Type Badge */}
            <div className={`flex items-center gap-2 mb-2 ${typeInfo.color}`}>
              <TypeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{typeInfo.label}</span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white mb-1">
              {memory.title || "Untitled Memory"}
            </h2>

            {/* Date */}
            <div className="flex items-center gap-2 text-white/60 mb-3 text-sm">
              <Icons.Calendar className="w-4 h-4" />
              <span>{formatDate(memory.takenAt)}</span>
            </div>

            {/* Note */}
            {memory.note && (
              <div className="bg-white/5 rounded-xl p-3 mb-4 max-h-24 overflow-y-auto">
                <p className="text-white/80 text-sm whitespace-pre-wrap">{memory.note}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {canShare && (
                <GlassButton 
                  variant="ghost" 
                  size="sm"
                  onClick={handleShare} 
                  className="gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border-white/10"
                >
                  <Icons.Share className="w-4 h-4" />
                  Share
                </GlassButton>
              )}
              <GlassButton 
                variant="ghost" 
                size="sm"
                onClick={handleDownload} 
                className="gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border-white/10"
              >
                <Icons.Download className="w-4 h-4" />
                Download
              </GlassButton>
              {!showDeleteConfirm ? (
                <GlassButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-2 text-red-400 hover:text-red-300 bg-white/10 hover:bg-red-500/20 border-white/10 ml-auto"
                >
                  <Icons.Trash className="w-4 h-4" />
                  Delete
                </GlassButton>
              ) : (
                <div className="flex gap-2 ml-auto">
                  <GlassButton 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border-white/10"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton 
                    variant="danger" 
                    size="sm"
                    onClick={handleDelete}
                    className="gap-2"
                  >
                    <Icons.Trash className="w-4 h-4" />
                    Confirm
                  </GlassButton>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
