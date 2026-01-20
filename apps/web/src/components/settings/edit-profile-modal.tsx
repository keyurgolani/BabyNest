"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { UpdateProfileDto } from "@/lib/api-client";

interface EditProfileModalProps {
  initialName: string;
  onClose: () => void;
  onSave: (data: UpdateProfileDto) => Promise<void>;
}

export function EditProfileModal({ initialName, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({ name: name.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-md animate-scale-in shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Icons.Settings className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Edit Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground placeholder:text-muted-foreground"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="flex gap-3 mt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 rounded-xl" 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="glow"
                className="flex-1 rounded-xl" 
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
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
