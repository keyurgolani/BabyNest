import { useState, useRef } from "react";
import { CreateMemoryDto, MemoryEntryType } from "@babynest/types";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import Image from "next/image";

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

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 aurora-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-foreground text-shadow-soft">Add Memory</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              disabled={isSubmitting}
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-in slide-in-from-top-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  <button
                    type="button"
                    onClick={clearPhoto}
                    disabled={isUploading}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors disabled:opacity-50"
                  >
                    <Icons.Close className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-primary bg-primary/10 scale-105"
                      : "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
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
                {[
                  { value: MemoryEntryType.PHOTO, label: "Photo", icon: Icons.Memories },
                  { value: MemoryEntryType.MILESTONE, label: "Milestone", icon: Icons.Milestone },
                  { value: MemoryEntryType.FIRST, label: "First Moment", icon: Icons.Sparkles },
                  { value: MemoryEntryType.NOTE, label: "Journal Note", icon: Icons.Log },
                ].map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setEntryType(type.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        entryType === type.value
                          ? "bg-primary text-primary-foreground glow-soft"
                          : "bg-muted/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-muted"
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
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="First smile, First steps..."
                className="w-full px-4 py-3 rounded-xl bg-muted/50 backdrop-blur-sm border-none focus:ring-2 focus:ring-primary outline-none transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date
              </label>
              <input
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 backdrop-blur-sm border-none focus:ring-2 focus:ring-primary outline-none transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What made this moment special?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 backdrop-blur-sm border-none focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 glow-primary" disabled={isSubmitting || isUploading}>
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
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
