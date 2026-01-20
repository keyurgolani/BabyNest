"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { api, BabyResponseDto } from "@/lib/api-client";

import { formatDateForInput } from "@/lib/date-utils";
import { ThemedDatePicker } from "@/components/ui/themed-date-picker";

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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600">
                <Icons.Diaper className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Edit Baby Profile</CardTitle>
                <CardDescription>Update your baby&apos;s information</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-9 h-9 rounded-xl"
            >
              <Icons.Close className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-400 text-sm">
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
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={clearPhoto}
                    className="absolute top-0 right-1/2 translate-x-14 -translate-y-1 w-6 h-6 rounded-full shadow-md h-6 w-6 p-0"
                    disabled={isSubmitting || isUploading}
                  >
                    <Icons.Close className="w-3 h-3 text-white" />
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center mb-3">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-muted shadow-lg">
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
                        : "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
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
                      <Icons.Memories className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Baby Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Baby's name"
                className="rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Gender
              </label>
              <Select
                value={gender}
                onValueChange={setGender}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 mt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 rounded-xl" 
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="glow"
                className="flex-1 rounded-xl" 
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
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
