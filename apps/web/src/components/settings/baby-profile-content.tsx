"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { useBaby } from "@/context/baby-context";
import { api } from "@/lib/api-client";
import { format } from "date-fns";
import { parseLocalDate, formatDateForInput } from "@/lib/date-utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemedDatePicker } from "@/components/ui/themed-date-picker";

export function BabyProfileContent() {
  const { baby, refreshBaby } = useBaby();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit form state
  const [name, setName] = useState(baby?.name || "");
  const [dateOfBirth, setDateOfBirth] = useState(baby ? formatDateForInput(baby.dateOfBirth) : "");
  const [gender, setGender] = useState(baby?.gender || "");
  const [photoUrl, setPhotoUrl] = useState(baby?.photoUrl || "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(baby?.photoUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    if (baby) {
      setName(baby.name);
      setDateOfBirth(formatDateForInput(baby.dateOfBirth));
      setGender(baby.gender);
      setPhotoUrl(baby.photoUrl || "");
      setPhotoPreview(baby.photoUrl || null);
    }
    setError(null);
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    setError(null);
    try {
      const result = await api.upload(file);
      setPhotoUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      setPhotoPreview(baby?.photoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!baby || !name.trim() || !dateOfBirth) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.babies.update(baby.id, {
        name: name.trim(),
        dateOfBirth,
        gender,
        photoUrl: photoUrl.trim() || undefined,
      });
      await refreshBaby();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update baby profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!baby || deleteConfirmText !== baby.name) return;
    
    setIsDeleting(true);
    try {
      await api.babies.delete(baby.id);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete baby profile");
      setIsDeleting(false);
    }
  };

  if (!baby) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground mb-4 text-sm">No baby profile found.</p>
        <Button onClick={() => router.push("/onboarding")} size="sm">Create Profile</Button>
      </div>
    );
  }

  const fallbackAvatarUrl = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${baby.name}`;

  if (isEditing) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Photo */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-pink-200/50 dark:ring-pink-800/30">
            {photoPreview ? (
              <Image src={photoPreview} alt="Baby photo" fill sizes="64px" className="object-cover" />
            ) : (
              <Image src={fallbackAvatarUrl} alt="Default avatar" fill sizes="64px" className="object-cover opacity-50" />
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Icons.Memories className="w-4 h-4 mr-1" />
              {photoPreview ? "Change" : "Upload"}
            </Button>
            {photoPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setPhotoUrl(""); setPhotoPreview(null); }}
                disabled={isUploading}
              >
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Baby's name" />
        </div>

        {/* Date of Birth */}
        <ThemedDatePicker
          value={dateOfBirth}
          onChange={setDateOfBirth}
          label="Date of Birth"
          maxDate={new Date()}
          minDate={new Date(1900, 0, 1)}
        />

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Gender</label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); resetForm(); }} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSubmitting || isUploading || !name.trim()}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400 mb-2">
            Delete <strong>{baby.name}&apos;s</strong> profile and all data?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400/80">
            This includes all feeding, sleep, diaper records, growth, milestones, and memories.
          </p>
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Type <strong>{baby.name}</strong> to confirm:
          </label>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={baby.name}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteConfirmText !== baby.name || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting..." : "Delete Forever"}
          </Button>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-4">
      {/* Baby Info */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-pink-100 dark:bg-pink-950/50 flex items-center justify-center overflow-hidden ring-2 ring-pink-200/50 dark:ring-pink-800/30 relative">
          {baby.photoUrl ? (
            <Image src={baby.photoUrl} alt={baby.name} fill sizes="56px" className="object-cover" />
          ) : (
            <Icons.Diaper className="w-7 h-7 text-pink-500 dark:text-pink-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{baby.name}</p>
          <p className="text-sm text-muted-foreground">
            {baby.age.years > 0 && `${baby.age.years}y `}{baby.age.months}m {baby.age.days}d old
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-1.5 border-b border-muted/50">
          <span className="text-muted-foreground">Birth Date</span>
          <span className="font-medium">{format(parseLocalDate(baby.dateOfBirth), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-muted/50">
          <span className="text-muted-foreground">Gender</span>
          <span className="font-medium">{baby.gender.charAt(0).toUpperCase() + baby.gender.slice(1)}</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-muted-foreground">Created</span>
          <span className="font-medium">{format(new Date(baby.createdAt), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button size="sm" onClick={() => setIsEditing(true)}>
          <Icons.Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Link href="/settings/caregivers">
          <Button variant="outline" size="sm">
            <Icons.Users className="w-4 h-4 mr-1" />
            Caregivers
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Icons.Trash className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}
