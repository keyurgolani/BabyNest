"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { api, AiProviderInfo, AiConfigResponse, AiProviderType, ModelInfo } from "@/lib/api-client";

interface AiProviderSettingsModalProps {
  onClose: () => void;
}

export function AiProviderSettingsModal({ onClose }: AiProviderSettingsModalProps) {
  const [providers, setProviders] = useState<AiProviderInfo[]>([]);
  const [config, setConfig] = useState<AiConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<'text' | 'vision' | null>(null);
  const [testResult, setTestResult] = useState<{ type: 'text' | 'vision'; success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isEnabled, setIsEnabled] = useState(false);
  const [textProvider, setTextProvider] = useState<AiProviderType | ''>('');
  const [textApiKey, setTextApiKey] = useState('');
  const [textModel, setTextModel] = useState('');
  const [visionProvider, setVisionProvider] = useState<AiProviderType | ''>('');
  const [visionApiKey, setVisionApiKey] = useState('');
  const [visionModel, setVisionModel] = useState('');

  // Dynamic models state
  const [textModels, setTextModels] = useState<ModelInfo[]>([]);
  const [visionModels, setVisionModels] = useState<ModelInfo[]>([]);
  const [loadingTextModels, setLoadingTextModels] = useState(false);
  const [loadingVisionModels, setLoadingVisionModels] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [providersData, configData] = await Promise.all([
        api.aiConfig.getProviders(),
        api.aiConfig.getConfig(),
      ]);
      setProviders(providersData);
      setConfig(configData);

      // Initialize form state from config
      if (configData) {
        setIsEnabled(configData.isEnabled);
        setTextProvider(configData.textProvider || '');
        setTextModel(configData.textModel || '');
        setVisionProvider(configData.visionProvider || '');
        setVisionModel(configData.visionModel || '');
      }
    } catch (err) {
      setError('Failed to load AI configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get provider info by ID
  const getProviderInfo = useCallback((providerId: AiProviderType | '') => {
    return providers.find(p => p.id === providerId);
  }, [providers]);

  // Load models for text provider
  const loadTextModels = useCallback(async (provider: AiProviderType, apiKey?: string) => {
    setLoadingTextModels(true);
    try {
      const result = await api.aiConfig.listModels(provider, apiKey);
      setTextModels(result.models);
      // Set default model if none selected
      if (!textModel && result.models.length > 0) {
        const providerInfo = getProviderInfo(provider);
        const defaultModel = providerInfo?.capabilities.defaultTextModel;
        const modelToSelect = result.models.find(m => m.id === defaultModel) || result.models[0];
        setTextModel(modelToSelect.id);
      }
    } catch (err) {
      console.error('Failed to load text models:', err);
      // Fall back to static list
      const providerInfo = getProviderInfo(provider);
      if (providerInfo) {
        setTextModels(providerInfo.capabilities.availableModels.map(id => ({ id, name: id })));
      }
    } finally {
      setLoadingTextModels(false);
    }
  }, [textModel, getProviderInfo]);

  // Load models for vision provider
  const loadVisionModels = useCallback(async (provider: AiProviderType, apiKey?: string) => {
    setLoadingVisionModels(true);
    try {
      const result = await api.aiConfig.listModels(provider, apiKey);
      // Filter to vision-capable models
      const visionCapable = result.models.filter(m => m.supportsVision !== false);
      setVisionModels(visionCapable.length > 0 ? visionCapable : result.models);
      // Set default model if none selected
      if (!visionModel && result.models.length > 0) {
        const providerInfo = getProviderInfo(provider);
        const defaultModel = providerInfo?.capabilities.defaultVisionModel;
        const modelToSelect = visionCapable.find(m => m.id === defaultModel) || visionCapable[0] || result.models[0];
        setVisionModel(modelToSelect.id);
      }
    } catch (err) {
      console.error('Failed to load vision models:', err);
      // Fall back to static list
      const providerInfo = getProviderInfo(provider);
      if (providerInfo) {
        setVisionModels(providerInfo.capabilities.availableModels.map(id => ({ id, name: id })));
      }
    } finally {
      setLoadingVisionModels(false);
    }
  }, [visionModel, getProviderInfo]);

  // Handle provider change - don't load models until API key is provided
  const handleTextProviderChange = async (providerId: AiProviderType | '') => {
    setTextProvider(providerId);
    setTextApiKey('');
    setTextModel('');
    setTextModels([]);
  };

  const handleVisionProviderChange = async (providerId: AiProviderType | '') => {
    setVisionProvider(providerId);
    setVisionApiKey('');
    setVisionModel('');
    setVisionModels([]);
  };

  // Fetch models when API key is entered
  const handleTextApiKeyBlur = () => {
    if (textProvider && textApiKey) {
      loadTextModels(textProvider, textApiKey);
    }
  };

  const handleVisionApiKeyBlur = () => {
    if (visionProvider && visionApiKey) {
      loadVisionModels(visionProvider, visionApiKey);
    }
  };

  // Test provider connection
  const handleTest = async (type: 'text' | 'vision') => {
    const provider = type === 'text' ? textProvider : visionProvider;
    const apiKey = type === 'text' ? textApiKey : visionApiKey;
    const model = type === 'text' ? textModel : visionModel;

    if (!provider || !model) {
      setTestResult({ type, success: false, message: 'Please select a provider and model' });
      return;
    }

    const providerInfo = getProviderInfo(provider);
    if (providerInfo?.requiresApiKey && !apiKey && !(type === 'text' ? config?.hasTextApiKey : config?.hasVisionApiKey)) {
      setTestResult({ type, success: false, message: 'API key is required for this provider' });
      return;
    }

    setTesting(type);
    setTestResult(null);

    try {
      const result = await api.aiConfig.testProvider({
        provider,
        apiKey: apiKey || undefined,
        model,
        isVision: type === 'vision',
      });

      setTestResult({
        type,
        success: result.success,
        message: result.success
          ? `Connected successfully (${result.responseTime}ms)`
          : result.error || 'Connection failed',
      });
    } catch (err) {
      setTestResult({
        type,
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setTesting(null);
    }
  };

  // Save configuration
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await api.aiConfig.updateConfig({
        isEnabled,
        textProvider: textProvider || undefined,
        textApiKey: textApiKey || undefined,
        textModel: textModel || undefined,
        visionProvider: visionProvider || undefined,
        visionApiKey: visionApiKey || undefined,
        visionModel: visionModel || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset to default settings? This will remove your custom AI provider configuration.')) {
      return;
    }

    setSaving(true);
    try {
      await api.aiConfig.deleteConfig();
      setIsEnabled(false);
      setTextProvider('');
      setTextApiKey('');
      setTextModel('');
      setTextModels([]);
      setVisionProvider('');
      setVisionApiKey('');
      setVisionModel('');
      setVisionModels([]);
      setConfig(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-lg animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Icons.Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Provider Settings</CardTitle>
                <CardDescription>Configure your AI inference providers</CardDescription>
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

        <CardContent className="pt-0 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Enable Custom Providers */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Use Custom AI Providers</p>
              <p className="text-sm text-muted-foreground">Override default Ollama with your preferred providers</p>
            </div>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              role="switch"
              aria-checked={isEnabled}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isEnabled && (
            <>
              {/* Text Provider Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Icons.Sparkles className="w-4 h-4" />
                  Text Generation
                </h3>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Provider</label>
                  <select
                    value={textProvider}
                    onChange={(e) => handleTextProviderChange(e.target.value as AiProviderType | '')}
                    className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
                  >
                    <option value="">Use Default (Ollama)</option>
                    {providers.filter(p => p.capabilities.supportsChat).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {textProvider && getProviderInfo(textProvider)?.requiresApiKey && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      API Key {config?.hasTextApiKey && <span className="text-muted-foreground">(saved)</span>}
                    </label>
                    <input
                      type="password"
                      value={textApiKey}
                      onChange={(e) => setTextApiKey(e.target.value)}
                      onBlur={handleTextApiKeyBlur}
                      placeholder={config?.hasTextApiKey ? '••••••••••••••••' : 'Enter API key to load available models'}
                      className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
                    />
                    {!textModels.length && !loadingTextModels && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter your API key and click outside to load available models
                      </p>
                    )}
                  </div>
                )}

                {textProvider && loadingTextModels && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Icons.Loader className="w-4 h-4 animate-spin" />
                    Loading available models...
                  </div>
                )}

                {textProvider && textModels.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Model</label>
                    <select
                      value={textModel}
                      onChange={(e) => setTextModel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
                    >
                      {textModels.length === 0 && <option value="">Select a model</option>}
                      {textModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}{model.supportsVision ? ' (vision)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {textProvider && textModels.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest('text')}
                      disabled={testing === 'text' || !textModel}
                      className="rounded-lg"
                    >
                      {testing === 'text' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      ) : (
                        <Icons.Activity className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                    {testResult?.type === 'text' && (
                      <span className={`text-sm ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
                        {testResult.message}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Vision Provider Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Icons.PhotoImport className="w-4 h-4" />
                  Vision (Image Analysis)
                </h3>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Provider</label>
                  <select
                    value={visionProvider}
                    onChange={(e) => handleVisionProviderChange(e.target.value as AiProviderType | '')}
                    className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
                  >
                    <option value="">Use Default (Ollama)</option>
                    {providers.filter(p => p.capabilities.supportsVision).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {visionProvider && getProviderInfo(visionProvider)?.requiresApiKey && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      API Key {config?.hasVisionApiKey && <span className="text-muted-foreground">(saved)</span>}
                    </label>
                    <input
                      type="password"
                      value={visionApiKey}
                      onChange={(e) => setVisionApiKey(e.target.value)}
                      onBlur={handleVisionApiKeyBlur}
                      placeholder={config?.hasVisionApiKey ? '••••••••••••••••' : 'Enter API key to load available models'}
                      className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
                    />
                    {!visionModels.length && !loadingVisionModels && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter your API key and click outside to load available models
                      </p>
                    )}
                  </div>
                )}

                {visionProvider && loadingVisionModels && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Icons.Loader className="w-4 h-4 animate-spin" />
                    Loading available models...
                  </div>
                )}

                {visionProvider && visionModels.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Model</label>
                    <select
                      value={visionModel}
                      onChange={(e) => setVisionModel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
                    >
                      {visionModels.length === 0 && <option value="">Select a model</option>}
                      {visionModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {visionProvider && visionModels.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest('vision')}
                      disabled={testing === 'vision' || !visionModel}
                      className="rounded-lg"
                    >
                      {testing === 'vision' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      ) : (
                        <Icons.Activity className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                    {testResult?.type === 'vision' && (
                      <span className={`text-sm ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
                        {testResult.message}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">How it works</p>
                <p>When enabled, your custom providers will be used for AI features like insights and photo import. If your provider fails, the app will automatically fall back to the default Ollama instance.</p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {config?.isEnabled && (
              <Button
                variant="ghost"
                onClick={handleReset}
                disabled={saving}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Reset
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="glow"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </div>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
