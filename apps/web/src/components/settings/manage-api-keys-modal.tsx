"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { api, ApiKeyListItem } from "@/lib/api-client";
import { format } from "date-fns";

interface ManageApiKeysModalProps {
  onClose: () => void;
}

export function ManageApiKeysModal({ onClose }: ManageApiKeysModalProps) {
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
      fetchKeys(); // Refresh list to show the new key entry (though it won't show the full key again)
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
      alert("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-2xl animate-scale-in shadow-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-4 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Icons.Key className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">API Keys</CardTitle>
                <CardDescription>Manage API keys for external access</CardDescription>
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

        <CardContent className="pt-0 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {createdKey && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl animate-scale-in">
              <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">API Key Created Successfully</h4>
              <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                Please copy this key now. You won&apos;t be able to see it again!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white dark:bg-black/20 p-2 rounded border border-green-200 dark:border-green-800 font-mono text-sm break-all">
                  {createdKey}
                </code>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyToClipboard(createdKey)}
                  className="shrink-0"
                >
                  <Icons.Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
              <h3 className="text-sm font-medium text-foreground mb-3">Create New API Key</h3>
              <form onSubmit={handleCreateKey} className="flex gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key Name (e.g. Home Assistant)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                  disabled={isCreating}
                />
                <Button 
                  type="submit" 
                  variant="glow"
                  disabled={isCreating || !newKeyName.trim()}
                >
                  {isCreating ? "Creating..." : "Create Key"}
                </Button>
              </form>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Active API Keys</h3>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : apiKeys.length > 0 ? (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Icons.Key className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{key.name}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Prefix: <code className="bg-muted px-1 rounded">{key.prefix}</code></span>
                          <span>Created: {format(new Date(key.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Last used: {key.lastUsedAt ? format(new Date(key.lastUsedAt), 'MMM d, yyyy HH:mm') : 'Never'}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => handleRevokeKey(key.id, key.name)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                  No active API keys found
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
