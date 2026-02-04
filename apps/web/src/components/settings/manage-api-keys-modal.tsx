"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { Icons } from "@/components/icons";
import { api, ApiKeyListItem } from "@/lib/api-client";
import { format } from "date-fns";

/**
 * ManageApiKeysModal Component
 *
 * A modal for managing API keys with glassmorphism styling.
 * Uses GlassModal wrapper, GlassInput for key name input,
 * and GlassButton components for actions.
 *
 * Features:
 * - Create new API keys with custom names
 * - View list of active API keys with metadata
 * - Copy newly created keys to clipboard
 * - Revoke existing API keys
 *
 * @requirements 18.5
 */

interface ManageApiKeysModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
}

export function ManageApiKeysModal({ isOpen, onClose }: ManageApiKeysModalProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const keys = await api.auth.listApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error("Failed to fetch API keys", err);
      setError("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      // Reset state when modal opens
      setCreatedKey(null);
      setError(null);
      setNewKeyName("");
      setCopiedKey(false);
    }
  }, [isOpen]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    setError(null);
    setCreatedKey(null);
    setCopiedKey(false);

    try {
      const response = await api.auth.createApiKey({ name: newKeyName.trim() });
      setCreatedKey(response.key);
      setNewKeyName("");
      fetchKeys(); // Refresh list to show the new key entry
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${name}"? This action cannot be undone.`)) return;
    
    try {
      await api.auth.revokeApiKey(id);
      setApiKeys(prev => prev.filter(key => key.id !== id));
    } catch {
      setError("Failed to revoke API key");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="API Keys"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Icon and Description */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Icons.Key className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage API keys for external access to your data
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
            <Icons.AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success Message - Newly Created Key */}
        {createdKey && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-medium text-emerald-700 dark:text-emerald-300">
                API Key Created Successfully
              </h4>
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
              Please copy this key now. You won&apos;t be able to see it again!
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white/10 dark:bg-black/20 p-3 rounded-xl border border-emerald-500/20 font-mono text-sm break-all text-foreground">
                {createdKey}
              </code>
              <GlassButton 
                size="icon" 
                variant={copiedKey ? "primary" : "default"}
                onClick={() => copyToClipboard(createdKey)}
                className="flex-shrink-0"
              >
                {copiedKey ? (
                  <Icons.Check className="w-4 h-4" />
                ) : (
                  <Icons.Copy className="w-4 h-4" />
                )}
              </GlassButton>
            </div>
            {copiedKey && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                Copied to clipboard!
              </p>
            )}
          </div>
        )}

        {/* Create New API Key Section */}
        <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
          <h3 className="font-medium text-foreground mb-3">Create New API Key</h3>
          <form onSubmit={handleCreateKey} className="flex gap-3">
            <GlassInput
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key Name (e.g. Home Assistant)"
              disabled={isCreating}
              className="flex-1"
            />
            <GlassButton 
              type="submit" 
              variant="primary"
              disabled={isCreating || !newKeyName.trim()}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                <>
                  <Icons.Plus className="w-4 h-4 mr-2" />
                  Create
                </>
              )}
            </GlassButton>
          </form>
        </div>

        {/* Active API Keys Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Active API Keys
          </h3>
          
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              Loading...
            </div>
          ) : apiKeys.length > 0 ? (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div 
                  key={key.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icons.Key className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-foreground truncate">{key.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Prefix: <code className="bg-white/10 dark:bg-black/20 px-1.5 py-0.5 rounded">{key.prefix}</code>
                      </span>
                      <span>Created: {format(new Date(key.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Last used: {key.lastUsedAt ? format(new Date(key.lastUsedAt), 'MMM d, yyyy HH:mm') : 'Never'}
                    </div>
                  </div>
                  <GlassButton 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleRevokeKey(key.id, key.name)}
                    className="ml-3 flex-shrink-0"
                  >
                    <Icons.Trash className="w-4 h-4 mr-1" />
                    Revoke
                  </GlassButton>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed border-[var(--glass-border)] rounded-xl">
              <Icons.Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active API keys found</p>
              <p className="text-xs mt-1">Create a key above to get started</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <GlassButton 
          variant="primary" 
          onClick={onClose} 
          className="w-full"
        >
          <Icons.Check className="w-4 h-4 mr-2" />
          Done
        </GlassButton>
      </div>
    </GlassModal>
  );
}
