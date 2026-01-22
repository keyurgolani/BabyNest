/**
 * AI Provider Factory
 * 
 * Creates provider instances based on configuration.
 * Supports dynamic provider selection and fallback to Ollama.
 */

import {
  BaseAiProvider,
  OllamaProvider,
  OpenAIProvider,
  AnthropicProvider,
  GeminiProvider,
  OpenRouterProvider,
} from './providers';
import { AiProvider, ProviderConfig, ProviderMetadata } from './types';

/**
 * Provider metadata for UI display and configuration
 */
export const PROVIDER_METADATA: Record<AiProvider, ProviderMetadata> = {
  [AiProvider.OLLAMA]: {
    id: AiProvider.OLLAMA,
    name: 'Ollama (Local)',
    description: 'Local AI inference using Ollama. No API key required.',
    requiresApiKey: false,
    capabilities: new OllamaProvider({ provider: AiProvider.OLLAMA, model: 'llama3' }).getCapabilities(),
    documentationUrl: 'https://ollama.ai/docs',
  },
  [AiProvider.OPENAI]: {
    id: AiProvider.OPENAI,
    name: 'OpenAI',
    description: 'OpenAI GPT models including GPT-4 and GPT-4 Vision.',
    requiresApiKey: true,
    capabilities: new OpenAIProvider({ provider: AiProvider.OPENAI, model: 'gpt-4o' }).getCapabilities(),
    documentationUrl: 'https://platform.openai.com/docs',
  },
  [AiProvider.ANTHROPIC]: {
    id: AiProvider.ANTHROPIC,
    name: 'Anthropic',
    description: 'Anthropic Claude models with advanced reasoning and vision.',
    requiresApiKey: true,
    capabilities: new AnthropicProvider({ provider: AiProvider.ANTHROPIC, model: 'claude-sonnet-4-20250514' }).getCapabilities(),
    documentationUrl: 'https://docs.anthropic.com',
  },
  [AiProvider.GEMINI]: {
    id: AiProvider.GEMINI,
    name: 'Google Gemini',
    description: 'Google Gemini models with multimodal capabilities.',
    requiresApiKey: true,
    capabilities: new GeminiProvider({ provider: AiProvider.GEMINI, model: 'gemini-1.5-pro' }).getCapabilities(),
    documentationUrl: 'https://ai.google.dev/docs',
  },
  [AiProvider.OPENROUTER]: {
    id: AiProvider.OPENROUTER,
    name: 'OpenRouter',
    description: 'Access multiple AI models through a unified API.',
    requiresApiKey: true,
    capabilities: new OpenRouterProvider({ provider: AiProvider.OPENROUTER, model: 'anthropic/claude-sonnet-4' }).getCapabilities(),
    documentationUrl: 'https://openrouter.ai/docs',
  },
};

/**
 * Create a provider instance based on configuration
 */
export function createProvider(config: ProviderConfig): BaseAiProvider {
  switch (config.provider) {
    case AiProvider.OLLAMA:
      return new OllamaProvider(config);
    case AiProvider.OPENAI:
      return new OpenAIProvider(config);
    case AiProvider.ANTHROPIC:
      return new AnthropicProvider(config);
    case AiProvider.GEMINI:
      return new GeminiProvider(config);
    case AiProvider.OPENROUTER:
      return new OpenRouterProvider(config);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): ProviderMetadata[] {
  return Object.values(PROVIDER_METADATA);
}

/**
 * Get provider metadata by ID
 */
export function getProviderMetadata(provider: AiProvider): ProviderMetadata {
  return PROVIDER_METADATA[provider];
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(config: ProviderConfig): { valid: boolean; error?: string } {
  const metadata = PROVIDER_METADATA[config.provider];
  
  if (!metadata) {
    return { valid: false, error: `Unknown provider: ${config.provider}` };
  }

  if (metadata.requiresApiKey && !config.apiKey) {
    return { valid: false, error: `API key required for ${metadata.name}` };
  }

  if (!config.model) {
    return { valid: false, error: 'Model is required' };
  }

  return { valid: true };
}
