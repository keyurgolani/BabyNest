/**
 * OpenRouter AI Provider
 * 
 * Provider implementation for OpenRouter API.
 * OpenRouter provides access to multiple AI models through a unified API.
 */

import {
  AiProvider,
  ChatMessage,
  VisionMessage,
  CompletionOptions,
  CompletionResult,
  ProviderConfig,
  ProviderCapabilities,
  ModelInfo,
} from '../types';
import { BaseAiProvider } from './base-provider';

const DEFAULT_TIMEOUT = 60000;
const DEFAULT_ENDPOINT = 'https://openrouter.ai/api/v1';

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenRouterModelsResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    context_length: number;
    architecture?: {
      modality?: string;
    };
    pricing?: {
      prompt: string;
      completion: string;
    };
  }>;
}

export class OpenRouterProvider extends BaseAiProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.endpoint || DEFAULT_ENDPOINT;
    this.apiKey = config.apiKey || '';
  }

  getProvider(): AiProvider {
    return AiProvider.OPENROUTER;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsChat: true,
      supportsVision: true,
      supportsStreaming: true,
      maxContextTokens: 128000,
      defaultTextModel: 'anthropic/claude-sonnet-4',
      defaultVisionModel: 'anthropic/claude-sonnet-4',
      availableModels: [
        'anthropic/claude-sonnet-4',
        'anthropic/claude-opus-4',
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'google/gemini-pro-1.5',
        'google/gemini-flash-1.5',
        'meta-llama/llama-3.1-405b-instruct',
        'meta-llama/llama-3.1-70b-instruct',
      ],
    };
  }

  override async listModels(): Promise<ModelInfo[] | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/models`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        },
        10000,
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as OpenRouterModelsResponse;
      
      // Return all models, sorted by name
      return data.data
        .map(m => ({
          id: m.id,
          name: m.name || m.id,
          description: m.description,
          contextLength: m.context_length,
          supportsVision: m.architecture?.modality === 'multimodal' || 
            m.id.includes('vision') || 
            m.id.includes('gpt-4o') ||
            m.id.includes('claude-3') ||
            m.id.includes('claude-sonnet-4') ||
            m.id.includes('claude-opus-4') ||
            m.id.includes('gemini'),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.logger.error(`Failed to list OpenRouter models: ${error}`);
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/models`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        },
        5000,
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): Promise<CompletionResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenRouter API key not configured',
        provider: AiProvider.OPENROUTER,
        model: this.config.model,
      };
    }

    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const startTime = Date.now();

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://baby-tracker.app',
            'X-Title': 'Baby Tracker',
          },
          body: JSON.stringify({
            model: this.config.model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1024,
          }),
        },
        timeout,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as { error?: { message?: string } })?.error?.message || `Status ${response.status}`;
        return {
          success: false,
          error: `OpenRouter error: ${errorMessage}`,
          provider: AiProvider.OPENROUTER,
          model: this.config.model,
        };
      }

      const data = (await response.json()) as OpenRouterResponse;
      const content = data.choices[0]?.message?.content || '';

      return {
        success: true,
        response: content,
        duration: Date.now() - startTime,
        provider: AiProvider.OPENROUTER,
        model: this.config.model,
      };
    } catch (error) {
      return this.handleError(error, timeout);
    }
  }

  async vision(
    messages: VisionMessage[],
    options: CompletionOptions = {},
  ): Promise<CompletionResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenRouter API key not configured',
        provider: AiProvider.OPENROUTER,
        model: this.config.model,
      };
    }

    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const startTime = Date.now();

    try {
      // Convert VisionMessage to OpenAI-compatible format (OpenRouter uses OpenAI format)
      const formattedMessages = messages.map((msg) => {
        if (typeof msg.content === 'string') {
          return { role: msg.role, content: msg.content };
        }

        const content = msg.content.map((c) => {
          if (c.type === 'text') {
            return { type: 'text', text: c.text };
          }
          return {
            type: 'image_url',
            image_url: { url: c.image_url?.url || '' },
          };
        });

        return { role: msg.role, content };
      });

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://baby-tracker.app',
            'X-Title': 'Baby Tracker',
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: formattedMessages,
            temperature: options.temperature ?? 0.1,
            max_tokens: options.maxTokens ?? 4096,
          }),
        },
        timeout,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as { error?: { message?: string } })?.error?.message || `Status ${response.status}`;
        return {
          success: false,
          error: `OpenRouter vision error: ${errorMessage}`,
          provider: AiProvider.OPENROUTER,
          model: this.config.model,
        };
      }

      const data = (await response.json()) as OpenRouterResponse;
      const content = data.choices[0]?.message?.content || '';

      return {
        success: true,
        response: content,
        duration: Date.now() - startTime,
        provider: AiProvider.OPENROUTER,
        model: this.config.model,
      };
    } catch (error) {
      return this.handleError(error, timeout);
    }
  }
}
