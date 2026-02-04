"use client";

import { useState, useRef } from "react";
import { CreateMemoryDto, MemoryEntryType } from "@babynest/types";
import { Icons } from "@/components/icons";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassTextarea } from "@/components/ui/glass-textarea";
import { api } from "@/lib/api-client";
import Image from "next/image";

/**
 * AddMemoryModal Component
 * 
 * A glassmorphism-styled modal for adding new memories.
 * Uses GlassModal wrapper with GlassInput, GlassTextarea, and GlassButton components.
 * 
 * Features:
 * - Drag and drop photo upload
 * - Memory type selection (Photo, Milestone, First Moment, Journal Note)
 * - Title, date, and note fields
 * - Glassmorphism styling throughout
 * 
 * @requirements 18.5
 */

interface AddMemoryModalProps {
  onClose: () => void;
  onAdd: (data: CreateMemoryDto) => Promise<void>;
}

export function AddMemoryModal({ onClose, onAdd }: AddMemoryModalProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<MemoryEntryType>(MemoryEntryType.PHOTO);
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    setError(null);
    try {
      const result = await api.upload(file);
      setPhotoUrl(result.url);
      setThumbnailUrl(result.thumbnailUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      setPhotoPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use placeholder if no photo
    const finalPhotoUrl = photoUrl.trim() || `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`;

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        photoUrl: finalPhotoUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        entryType,
        takenAt: new Date(takenAt).toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create memory");
      setIsSubmitting(false);
    }
  };

  const clearPhoto = () => {
    setPhotoUrl("");
    setThumbnailUrl("");
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const memoryTypes = [
    { value: MemoryEntryType.PHOTO, label: "Photo", icon: Icons.Memories },
    { value: MemoryEntryType.MILESTONE, label: "Milestone", icon: Icons.Milestone },
    { value: MemoryEntryType.FIRST, label: "First Moment", icon: Icons.Sparkles },
    { value: MemoryEntryType.NOTE, label: "Journal Note", icon: Icons.Log },
  ];

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title="Add Memory"
      size="lg"
    >
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Photo Upload Area */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Photo
          </label>
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden aspect-video shadow-lg">
              <Image
                src={photoPreview}
                alt="Preview"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Icons.Loader className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              <GlassButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearPhoto}
                disabled={isUploading}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              >
                <Icons.Close className="w-4 h-4" />
              </GlassButton>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-white/20 hover:border-primary/50 hover:bg-white/5"
              }`}
            >
              <Icons.Memories className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                Drop your photo here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isSubmitting}
          />
        </div>

        {/* Memory Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Memory Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {memoryTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEntryType(type.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all touch-target ${
                    entryType === type.value
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-white/10 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-white/20 border border-white/10"
                  }`}
                  disabled={isSubmitting}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Title
          </label>
          <GlassInput
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="First smile, First steps..."
            disabled={isSubmitting}
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Date
          </label>
          <GlassInput
            type="date"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Note <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <GlassTextarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What made this moment special?"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <GlassButton
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <>
                <Icons.Loader className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isUploading ? (
              <>
                <Icons.Loader className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Icons.Check className="w-4 h-4 mr-2" />
                Save Memory
              </>
            )}
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
}
