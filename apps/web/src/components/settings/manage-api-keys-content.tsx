"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { api, ApiKeyListItem } from "@/lib/api-client";
import { format } from "date-fns";

export function ManageApiKeysContent() {
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    setError(null);
    setCreatedKey(null);

    try {
      const response = await api.auth.createApiKey({ name: newKeyName.trim() });
      setCreatedKey(response.key);
      setNewKeyName("");
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Revoke API key "${name}"?`)) return;
    
    try {
      await api.auth.revokeApiKey(id);
      setApiKeys(prev => prev.filter(key => key.id !== id));
    } catch {
      alert("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-4 pt-2">
      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {createdKey && (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
          <h4 className="font-medium text-green-800 dark:text-green-300 text-sm mb-1">API Key Created</h4>
          <p className="text-xs text-green-700 dark:text-green-400 mb-2">
            Copy this key now. You won&apos;t see it again!
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white dark:bg-black/20 p-1.5 rounded border border-green-200 dark:border-green-800 font-mono text-xs break-all">
              {createdKey}
            </code>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => copyToClipboard(createdKey)}
              className="shrink-0 h-7"
            >
              <Icons.Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Create New Key */}
      <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
        <h3 className="text-xs font-medium text-foreground mb-2">Create New API Key</h3>
        <form onSubmit={handleCreateKey} className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key Name (e.g. Home Assistant)"
            className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-xs"
            disabled={isCreating}
          />
          <Button 
            type="submit" 
            variant="glow"
            size="sm"
            disabled={isCreating || !newKeyName.trim()}
            className="text-xs h-7"
          >
            {isCreating ? "..." : "Create"}
          </Button>
        </form>
      </div>

      {/* Active Keys */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Active API Keys</h3>
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground text-xs">Loading...</div>
        ) : apiKeys.length > 0 ? (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icons.Key className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium text-foreground text-sm">{key.name}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <span>Prefix: <code className="bg-muted px-1 rounded">{key.prefix}</code></span>
                    <span className="mx-1">•</span>
                    <span>Created: {format(new Date(key.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs h-6 px-2"
                  onClick={() => handleRevokeKey(key.id, key.name)}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-lg text-xs">
            No active API keys
          </div>
        )}
      </div>
    </div>
  );
}
