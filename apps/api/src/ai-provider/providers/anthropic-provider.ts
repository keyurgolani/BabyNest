/**
 * Anthropic AI Provider
 * 
 * Provider implementation for Anthropic Claude API.
 * Supports Claude 3 models with vision capabilities.
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
const DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1';
const API_VERSION = '2023-06-01';

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicModelsResponse {
  data: Array<{
    id: string;
    display_name: string;
    type: string;
    created_at: string;
  }>;
  has_more: boolean;
}

export class AnthropicProvider extends BaseAiProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.endpoint || DEFAULT_ENDPOINT;
    this.apiKey = config.apiKey || '';
  }

  getProvider(): AiProvider {
    return AiProvider.ANTHROPIC;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsChat: true,
      supportsVision: true,
      supportsStreaming: true,
      maxContextTokens: 200000,
      defaultTextModel: 'claude-sonnet-4-20250514',
      defaultVisionModel: 'claude-sonnet-4-20250514',
      availableModels: [
        'claude-sonnet-4-20250514',
        'claude-opus-4-20250514',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
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
            'x-api-key': this.apiKey,
            'anthropic-version': API_VERSION,
          },
        },
        10000,
      );

      if (!response.ok) {
        // Anthropic may not support models endpoint, return null to use static list
        return null;
      }

      const data = (await response.json()) as AnthropicModelsResponse;
      
      return data.data.map(m => ({
        id: m.id,
        name: m.display_name || m.id,
        supportsVision: m.id.includes('claude-3') || m.id.includes('claude-sonnet-4') || m.id.includes('claude-opus-4'),
      }));
    } catch (error) {
      this.logger.error(`Failed to list Anthropic models: ${error}`);
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    // Anthropic doesn't have a simple health check endpoint
    // We just verify the API key is present
    return !!this.apiKey;
  }

  async chat(
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): Promise<CompletionResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Anthropic API key not configured',
        provider: AiProvider.ANTHROPIC,
        model: this.config.model,
      };
    }

    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const startTime = Date.now();

    try {
      // Extract system message and convert to Anthropic format
      let systemPrompt = '';
      const anthropicMessages: Array<{ role: string; content: string }> = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemPrompt += msg.content + '\n';
        } else {
          anthropicMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          });
        }
      }

      const body: Record<string, unknown> = {
        model: this.config.model,
        messages: anthropicMessages,
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.7,
      };

      if (systemPrompt.trim()) {
        body['system'] = systemPrompt.trim();
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': API_VERSION,
          },
          body: JSON.stringify(body),
        },
        timeout,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as { error?: { message?: string } })?.error?.message || `Status ${response.status}`;
        return {
          success: false,
          error: `Anthropic error: ${errorMessage}`,
          provider: AiProvider.ANTHROPIC,
          model: this.config.model,
        };
      }

      const data = (await response.json()) as AnthropicResponse;
      const content = data.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('');

      return {
        success: true,
        response: content,
        duration: Date.now() - startTime,
        provider: AiProvider.ANTHROPIC,
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
        error: 'Anthropic API key not configured',
        provider: AiProvider.ANTHROPIC,
        model: this.config.model,
      };
    }

    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const startTime = Date.now();

    try {
      // Extract system message and convert to Anthropic format
      let systemPrompt = '';
      const anthropicMessages: Array<{ role: string; content: unknown }> = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          if (typeof msg.content === 'string') {
            systemPrompt += msg.content + '\n';
          }
          continue;
        }

        if (typeof msg.content === 'string') {
          anthropicMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          });
        } else {
          // Convert content array to Anthropic format
          const content = msg.content.map((c) => {
            if (c.type === 'text') {
              return { type: 'text', text: c.text };
            }
            // Convert image URL to Anthropic format
            const url = c.image_url?.url || '';
            const base64Match = url.match(/^data:image\/(\w+);base64,(.+)$/);
            if (base64Match) {
              return {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: `image/${base64Match[1]}`,
                  data: base64Match[2],
                },
              };
            }
            // URL-based image
            return {
              type: 'image',
              source: {
                type: 'url',
                url: url,
              },
            };
          });

          anthropicMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content,
          });
        }
      }

      const body: Record<string, unknown> = {
        model: this.config.model,
        messages: anthropicMessages,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.1,
      };

      if (systemPrompt.trim()) {
        body['system'] = systemPrompt.trim();
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': API_VERSION,
          },
          body: JSON.stringify(body),
        },
        timeout,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as { error?: { message?: string } })?.error?.message || `Status ${response.status}`;
        return {
          success: false,
          error: `Anthropic vision error: ${errorMessage}`,
          provider: AiProvider.ANTHROPIC,
          model: this.config.model,
        };
      }

      const data = (await response.json()) as AnthropicResponse;
      const content = data.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('');

      return {
        success: true,
        response: content,
        duration: Date.now() - startTime,
        provider: AiProvider.ANTHROPIC,
        model: this.config.model,
      };
    } catch (error) {
      return this.handleError(error, timeout);
    }
  }
}
