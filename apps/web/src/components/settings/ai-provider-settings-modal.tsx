"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/ui/glass-select";
import { Switch } from "@/components/ui/switch";
import { Icons } from "@/components/icons";
import { api, AiProviderInfo, AiConfigResponse, AiProviderType, ModelInfo } from "@/lib/api-client";

/**
 * AiProviderSettingsModal Component
 *
 * A modal for configuring AI inference providers with glassmorphism styling.
 * Uses GlassModal wrapper, GlassInput, GlassSelect, and GlassButton components.
 *
 * @requirements 18.5
 */

interface AiProviderSettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
}

export function AiProviderSettingsModal({ isOpen, onClose }: AiProviderSettingsModalProps) {
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
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setTestResult(null);
      setSaving(false);
    }
  }, [isOpen]);

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
  const handleTextProviderChange = async (providerId: string) => {
    setTextProvider(providerId as AiProviderType | '');
    setTextApiKey('');
    setTextModel('');
    setTextModels([]);
  };

  const handleVisionProviderChange = async (providerId: string) => {
    setVisionProvider(providerId as AiProviderType | '');
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

  // Loading state
  if (loading && isOpen) {
    return (
      <GlassModal
        isOpen={isOpen}
        onClose={onClose}
        title="AI Provider Settings"
        size="lg"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </GlassModal>
    );
  }

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Provider Settings"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Icon */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Icons.Sparkles className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Configure your AI inference providers
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}

        {/* Enable Custom Providers Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="font-medium text-foreground">Use Custom AI Providers</p>
            <p className="text-sm text-muted-foreground">Override default Ollama with your preferred providers</p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        {isEnabled && (
          <>
            {/* Text Provider Section */}
            <div className="space-y-4 pt-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Icons.Sparkles className="w-4 h-4" />
                Text Generation
              </h3>

              {/* Provider Select */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Provider</label>
                <GlassSelect
                  value={textProvider || 'default'}
                  onValueChange={(value) => handleTextProviderChange(value === 'default' ? '' : value)}
                >
                  <GlassSelectTrigger>
                    <GlassSelectValue placeholder="Select provider" />
                  </GlassSelectTrigger>
                  <GlassSelectContent>
                    <GlassSelectItem value="default">Use Default (Ollama)</GlassSelectItem>
                    {providers.filter(p => p.capabilities.supportsChat).map(p => (
                      <GlassSelectItem key={p.id} value={p.id}>{p.name}</GlassSelectItem>
                    ))}
                  </GlassSelectContent>
                </GlassSelect>
              </div>

              {/* API Key Input */}
              {textProvider && getProviderInfo(textProvider)?.requiresApiKey && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    API Key {config?.hasTextApiKey && <span className="text-muted-foreground">(saved)</span>}
                  </label>
                  <GlassInput
                    type="password"
                    value={textApiKey}
                    onChange={(e) => setTextApiKey(e.target.value)}
                    onBlur={handleTextApiKeyBlur}
                    placeholder={config?.hasTextApiKey ? '••••••••••••••••' : 'Enter API key to load available models'}
                  />
                  {!textModels.length && !loadingTextModels && (
                    <p className="text-xs text-muted-foreground">
                      Enter your API key and click outside to load available models
                    </p>
                  )}
                </div>
              )}

              {/* Loading Models */}
              {textProvider && loadingTextModels && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                  Loading available models...
                </div>
              )}

              {/* Model Select */}
              {textProvider && textModels.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Model</label>
                  <GlassSelect
                    value={textModel || 'select'}
                    onValueChange={(value) => setTextModel(value === 'select' ? '' : value)}
                  >
                    <GlassSelectTrigger>
                      <GlassSelectValue placeholder="Select a model" />
                    </GlassSelectTrigger>
                    <GlassSelectContent>
                      {textModels.length === 0 && (
                        <GlassSelectItem value="select">Select a model</GlassSelectItem>
                      )}
                      {textModels.map(model => (
                        <GlassSelectItem key={model.id} value={model.id}>
                          {model.name}{model.supportsVision ? ' (vision)' : ''}
                        </GlassSelectItem>
                      ))}
                    </GlassSelectContent>
                  </GlassSelect>
                </div>
              )}

              {/* Test Connection Button */}
              {textProvider && textModels.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <GlassButton
                    variant="default"
                    size="sm"
                    onClick={() => handleTest('text')}
                    disabled={testing === 'text' || !textModel}
                  >
                    {testing === 'text' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Icons.Activity className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </GlassButton>
                  {testResult?.type === 'text' && (
                    <span className={`text-sm ${testResult.success ? 'text-green-500' : 'text-destructive'}`}>
                      {testResult.message}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Vision Provider Section */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Icons.PhotoImport className="w-4 h-4" />
                Vision (Image Analysis)
              </h3>

              {/* Provider Select */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Provider</label>
                <GlassSelect
                  value={visionProvider || 'default'}
                  onValueChange={(value) => handleVisionProviderChange(value === 'default' ? '' : value)}
                >
                  <GlassSelectTrigger>
                    <GlassSelectValue placeholder="Select provider" />
                  </GlassSelectTrigger>
                  <GlassSelectContent>
                    <GlassSelectItem value="default">Use Default (Ollama)</GlassSelectItem>
                    {providers.filter(p => p.capabilities.supportsVision).map(p => (
                      <GlassSelectItem key={p.id} value={p.id}>{p.name}</GlassSelectItem>
                    ))}
                  </GlassSelectContent>
                </GlassSelect>
              </div>

              {/* API Key Input */}
              {visionProvider && getProviderInfo(visionProvider)?.requiresApiKey && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    API Key {config?.hasVisionApiKey && <span className="text-muted-foreground">(saved)</span>}
                  </label>
                  <GlassInput
                    type="password"
                    value={visionApiKey}
                    onChange={(e) => setVisionApiKey(e.target.value)}
                    onBlur={handleVisionApiKeyBlur}
                    placeholder={config?.hasVisionApiKey ? '••••••••••••••••' : 'Enter API key to load available models'}
                  />
                  {!visionModels.length && !loadingVisionModels && (
                    <p className="text-xs text-muted-foreground">
                      Enter your API key and click outside to load available models
                    </p>
                  )}
                </div>
              )}

              {/* Loading Models */}
              {visionProvider && loadingVisionModels && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                  Loading available models...
                </div>
              )}

              {/* Model Select */}
              {visionProvider && visionModels.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Model</label>
                  <GlassSelect
                    value={visionModel || 'select'}
                    onValueChange={(value) => setVisionModel(value === 'select' ? '' : value)}
                  >
                    <GlassSelectTrigger>
                      <GlassSelectValue placeholder="Select a model" />
                    </GlassSelectTrigger>
                    <GlassSelectContent>
                      {visionModels.length === 0 && (
                        <GlassSelectItem value="select">Select a model</GlassSelectItem>
                      )}
                      {visionModels.map(model => (
                        <GlassSelectItem key={model.id} value={model.id}>
                          {model.name}
                        </GlassSelectItem>
                      ))}
                    </GlassSelectContent>
                  </GlassSelect>
                </div>
              )}

              {/* Test Connection Button */}
              {visionProvider && visionModels.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <GlassButton
                    variant="default"
                    size="sm"
                    onClick={() => handleTest('vision')}
                    disabled={testing === 'vision' || !visionModel}
                  >
                    {testing === 'vision' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Icons.Activity className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </GlassButton>
                  {testResult?.type === 'vision' && (
                    <span className={`text-sm ${testResult.success ? 'text-green-500' : 'text-destructive'}`}>
                      {testResult.message}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">How it works</p>
              <p>When enabled, your custom providers will be used for AI features like insights and photo import. If your provider fails, the app will automatically fall back to the default Ollama instance.</p>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {config?.isEnabled && (
            <GlassButton
              variant="ghost"
              onClick={handleReset}
              disabled={saving}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Reset
            </GlassButton>
          )}
          <div className="flex-1" />
          <GlassButton
            variant="default"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Icons.Check className="w-4 h-4" />
                <span>Save Settings</span>
              </div>
            )}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
