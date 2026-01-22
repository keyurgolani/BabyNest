"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { api, AiProviderInfo, AiConfigResponse, AiProviderType, ModelInfo } from "@/lib/api-client";

export function AiProviderSettingsContent() {
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

  const getProviderInfo = useCallback((providerId: AiProviderType | '') => {
    return providers.find(p => p.id === providerId);
  }, [providers]);

  const loadTextModels = useCallback(async (provider: AiProviderType, apiKey?: string) => {
    setLoadingTextModels(true);
    try {
      const result = await api.aiConfig.listModels(provider, apiKey);
      setTextModels(result.models);
      if (!textModel && result.models.length > 0) {
        const providerInfo = getProviderInfo(provider);
        const defaultModel = providerInfo?.capabilities.defaultTextModel;
        const modelToSelect = result.models.find(m => m.id === defaultModel) || result.models[0];
        setTextModel(modelToSelect.id);
      }
    } catch (err) {
      console.error('Failed to load text models:', err);
      const providerInfo = getProviderInfo(provider);
      if (providerInfo) {
        setTextModels(providerInfo.capabilities.availableModels.map(id => ({ id, name: id })));
      }
    } finally {
      setLoadingTextModels(false);
    }
  }, [textModel, getProviderInfo]);

  const loadVisionModels = useCallback(async (provider: AiProviderType, apiKey?: string) => {
    setLoadingVisionModels(true);
    try {
      const result = await api.aiConfig.listModels(provider, apiKey);
      const visionCapable = result.models.filter(m => m.supportsVision !== false);
      setVisionModels(visionCapable.length > 0 ? visionCapable : result.models);
      if (!visionModel && result.models.length > 0) {
        const providerInfo = getProviderInfo(provider);
        const defaultModel = providerInfo?.capabilities.defaultVisionModel;
        const modelToSelect = visionCapable.find(m => m.id === defaultModel) || visionCapable[0] || result.models[0];
        setVisionModel(modelToSelect.id);
      }
    } catch (err) {
      console.error('Failed to load vision models:', err);
      const providerInfo = getProviderInfo(provider);
      if (providerInfo) {
        setVisionModels(providerInfo.capabilities.availableModels.map(id => ({ id, name: id })));
      }
    } finally {
      setLoadingVisionModels(false);
    }
  }, [visionModel, getProviderInfo]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset to default settings?')) return;

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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {error && (
        <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Enable Custom Providers */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div>
          <p className="font-medium text-foreground text-sm">Use Custom AI Providers</p>
          <p className="text-xs text-muted-foreground">Override default Ollama</p>
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
          <div className="space-y-3 border-t border-border/30 pt-4">
            <h3 className="font-medium text-foreground text-sm flex items-center gap-2">
              <Icons.Sparkles className="w-3 h-3" />
              Text Generation
            </h3>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Provider</label>
              <select
                value={textProvider}
                onChange={(e) => handleTextProviderChange(e.target.value as AiProviderType | '')}
                className="w-full px-3 py-2 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground text-sm"
              >
                <option value="">Use Default (Ollama)</option>
                {providers.filter(p => p.capabilities.supportsChat).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {textProvider && getProviderInfo(textProvider)?.requiresApiKey && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  API Key {config?.hasTextApiKey && <span className="text-muted-foreground">(saved)</span>}
                </label>
                <input
                  type="password"
                  value={textApiKey}
                  onChange={(e) => setTextApiKey(e.target.value)}
                  onBlur={handleTextApiKeyBlur}
                  placeholder={config?.hasTextApiKey ? '••••••••••••••••' : 'Enter API key'}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground text-sm"
                />
              </div>
            )}

            {textProvider && loadingTextModels && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Icons.Loader className="w-3 h-3 animate-spin" />
                Loading models...
              </div>
            )}

            {textProvider && textModels.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Model</label>
                <select
                  value={textModel}
                  onChange={(e) => setTextModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground text-sm"
                >
                  {textModels.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
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
                  className="rounded-lg text-xs h-7"
                >
                  {testing === 'text' ? (
                    <Icons.Loader className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Icons.Activity className="w-3 h-3 mr-1" />
                  )}
                  Test
                </Button>
                {testResult?.type === 'text' && (
                  <span className={`text-xs ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
                    {testResult.message}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Vision Provider Section */}
          <div className="space-y-3 border-t border-border/30 pt-4">
            <h3 className="font-medium text-foreground text-sm flex items-center gap-2">
              <Icons.PhotoImport className="w-3 h-3" />
              Vision (Image Analysis)
            </h3>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Provider</label>
              <select
                value={visionProvider}
                onChange={(e) => handleVisionProviderChange(e.target.value as AiProviderType | '')}
                className="w-full px-3 py-2 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground text-sm"
              >
                <option value="">Use Default (Ollama)</option>
                {providers.filter(p => p.capabilities.supportsVision).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {visionProvider && getProviderInfo(visionProvider)?.requiresApiKey && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  API Key {config?.hasVisionApiKey && <span className="text-muted-foreground">(saved)</span>}
                </label>
                <input
                  type="password"
                  value={visionApiKey}
                  onChange={(e) => setVisionApiKey(e.target.value)}
                  onBlur={handleVisionApiKeyBlur}
                  placeholder={config?.hasVisionApiKey ? '••••••••••••••••' : 'Enter API key'}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground text-sm"
                />
              </div>
            )}

            {visionProvider && loadingVisionModels && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Icons.Loader className="w-3 h-3 animate-spin" />
                Loading models...
              </div>
            )}

            {visionProvider && visionModels.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Model</label>
                <select
                  value={visionModel}
                  onChange={(e) => setVisionModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground text-sm"
                >
                  {visionModels.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
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
                  className="rounded-lg text-xs h-7"
                >
                  {testing === 'vision' ? (
                    <Icons.Loader className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Icons.Activity className="w-3 h-3 mr-1" />
                  )}
                  Test
                </Button>
                {testResult?.type === 'vision' && (
                  <span className={`text-xs ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
                    {testResult.message}
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {config?.isEnabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={saving}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
          >
            Reset
          </Button>
        )}
        <div className="flex-1" />
        <Button
          variant="glow"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg"
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
