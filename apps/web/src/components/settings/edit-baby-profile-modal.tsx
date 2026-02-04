"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/ui/glass-select";
import { Icons } from "@/components/icons";
import { api, BabyResponseDto } from "@/lib/api-client";
import { formatDateForInput } from "@/lib/date-utils";
import { ThemedDatePicker } from "@/components/ui/themed-date-picker";
import { Upload, X } from "lucide-react";

/**
 * EditBabyProfileModal Component
 *
 * A modal for editing baby profile information with glassmorphism styling.
 * Uses GlassModal wrapper, GlassInput, GlassSelect, and GlassButton components.
 *
 * @requirements 18.5
 */

interface EditBabyProfileModalProps {
  baby: BabyResponseDto;
  onClose: () => void;
  onSave: () => void;
}

export function EditBabyProfileModal({ baby, onClose, onSave }: EditBabyProfileModalProps) {
  const [name, setName] = useState(baby.name);
  const [dateOfBirth, setDateOfBirth] = useState(formatDateForInput(baby.dateOfBirth));
  const [gender, setGender] = useState(baby.gender);
  const [photoUrl, setPhotoUrl] = useState(baby.photoUrl || "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(baby.photoUrl || null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      setPhotoPreview(baby.photoUrl || null);
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

  const clearPhoto = () => {
    setPhotoUrl("");
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dateOfBirth) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.babies.update(baby.id, {
        name: name.trim(),
        dateOfBirth,
        gender,
        photoUrl: photoUrl.trim() || undefined,
      });
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update baby profile");
      setIsSubmitting(false);
    }
  };

  // Generate fallback avatar URL
  const fallbackAvatarUrl = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${baby.name}`;

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title="Edit Baby Profile"
      size="default"
      closeOnBackdropClick={!isSubmitting && !isUploading}
      closeOnEscape={!isSubmitting && !isUploading}
    >
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Photo Upload Section */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Profile Photo
          </label>
          
          {/* Photo Preview */}
          {photoPreview ? (
            <div className="relative mb-3">
              <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-primary/20 shadow-lg">
                <Image
                  src={photoPreview}
                  alt="Baby photo preview"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  </div>
                )}
              </div>
              <GlassButton
                type="button"
                variant="danger"
                size="icon"
                onClick={clearPhoto}
                className="absolute top-0 right-1/2 translate-x-14 -translate-y-1 w-7 h-7 min-w-0 min-h-0 rounded-full shadow-md"
                disabled={isSubmitting || isUploading}
              >
                <X className="w-3.5 h-3.5" />
              </GlassButton>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-[var(--glass-border)] shadow-lg">
                <Image
                  src={fallbackAvatarUrl}
                  alt="Default avatar"
                  fill
                  sizes="96px"
                  className="object-cover opacity-50"
                />
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!photoPreview && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isUploading
                  ? "border-primary bg-primary/5"
                  : isDragging
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-[var(--glass-border)] hover:border-primary hover:bg-[var(--glass-bg-hover)]"
              }`}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    Uploading...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Drop photo here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse
                  </p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isSubmitting || isUploading}
          />
        </div>

        {/* Baby Name Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Baby Name
          </label>
          <GlassInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Baby's name"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* Date of Birth */}
        <div>
          <ThemedDatePicker
            value={dateOfBirth}
            onChange={setDateOfBirth}
            label="Date of Birth"
            disabled={isSubmitting}
            maxDate={new Date()}
            minDate={new Date(1900, 0, 1)}
          />
        </div>

        {/* Gender Select */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Gender
          </label>
          <GlassSelect
            value={gender}
            onValueChange={setGender}
            disabled={isSubmitting}
          >
            <GlassSelectTrigger className="w-full">
              <GlassSelectValue placeholder="Select gender" />
            </GlassSelectTrigger>
            <GlassSelectContent>
              <GlassSelectItem value="male">Male</GlassSelectItem>
              <GlassSelectItem value="female">Female</GlassSelectItem>
              <GlassSelectItem value="other">Other</GlassSelectItem>
            </GlassSelectContent>
          </GlassSelect>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-2">
          <GlassButton 
            type="button" 
            variant="default" 
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
            disabled={isSubmitting || isUploading || !name.trim() || !dateOfBirth}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : isUploading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </div>
            ) : (
              "Save Changes"
            )}
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
}
