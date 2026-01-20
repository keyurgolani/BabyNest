"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface DeleteBabyModalProps {
  babyName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteBabyModal({ babyName, onClose, onConfirm }: DeleteBabyModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== babyName) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      setIsDeleting(false);
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
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
                <Icons.AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl text-red-600">Delete Baby Profile</CardTitle>
                <CardDescription>This action cannot be undone</CardDescription>
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

          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 mb-6">
            <p className="text-sm text-red-700 dark:text-red-400 mb-4">
              You are about to permanently delete <strong>{babyName}&apos;s</strong> profile and all associated data including:
            </p>
            <ul className="text-sm text-red-600 dark:text-red-400/80 space-y-1 ml-4 list-disc">
              <li>All feeding records</li>
              <li>All sleep records</li>
              <li>All diaper records</li>
              <li>All growth measurements</li>
              <li>All milestones</li>
              <li>All memories and photos</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type <strong>{babyName}</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={babyName}
                className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-red-500 outline-none transition-shadow text-foreground placeholder:text-muted-foreground"
                disabled={isDeleting}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 rounded-xl" 
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                variant="destructive"
                className="flex-1 rounded-xl" 
                disabled={confirmText !== babyName || isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </div>
                ) : (
                  <>
                    <Icons.Trash className="w-4 h-4 mr-2" />
                    Delete Forever
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
