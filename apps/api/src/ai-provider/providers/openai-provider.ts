/**
 * OpenAI AI Provider
 * 
 * Provider implementation for OpenAI API.
 * Supports GPT-4, GPT-4 Vision, and other OpenAI models.
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
const DEFAULT_ENDPOINT = 'https://api.openai.com/v1';

interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
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

interface OpenAIModelsResponse {
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

export class OpenAIProvider extends BaseAiProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.endpoint || DEFAULT_ENDPOINT;
    this.apiKey = config.apiKey || '';
  }

  getProvider(): AiProvider {
    return AiProvider.OPENAI;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsChat: true,
      supportsVision: true,
      supportsStreaming: true,
      maxContextTokens: 128000,
      defaultTextModel: 'gpt-4o',
      defaultVisionModel: 'gpt-4o',
      availableModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
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

      const data = (await response.json()) as OpenAIModelsResponse;
      
      // Filter to only chat models (gpt-*)
      const chatModels = data.data
        .filter(m => m.id.startsWith('gpt-') && !m.id.includes('instruct') && !m.id.includes('realtime'))
        .map(m => ({
          id: m.id,
          name: m.id,
          supportsVision: m.id.includes('gpt-4o') || m.id.includes('gpt-4-turbo') || m.id.includes('vision'),
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

      return chatModels;
    } catch (error) {
      this.logger.error(`Failed to list OpenAI models: ${error}`);
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
        error: 'OpenAI API key not configured',
        provider: AiProvider.OPENAI,
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
          error: `OpenAI error: ${errorMessage}`,
          provider: AiProvider.OPENAI,
          model: this.config.model,
        };
      }

      const data = (await response.json()) as OpenAIChatResponse;
      const content = data.choices[0]?.message?.content || '';

      return {
        success: true,
        response: content,
        duration: Date.now() - startTime,
        provider: AiProvider.OPENAI,
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
        error: 'OpenAI API key not configured',
        provider: AiProvider.OPENAI,
        model: this.config.model,
      };
    }

    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const startTime = Date.now();

    try {
      // Convert VisionMessage to OpenAI format
      const formattedMessages = messages.map((msg) => {
        if (typeof msg.content === 'string') {
          return { role: msg.role, content: msg.content };
        }

        // Convert content array to OpenAI format
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
          error: `OpenAI vision error: ${errorMessage}`,
          provider: AiProvider.OPENAI,
          model: this.config.model,
        };
      }

      const data = (await response.json()) as OpenAIChatResponse;
      const content = data.choices[0]?.message?.content || '';

      return {
        success: true,
        response: content,
        duration: Date.now() - startTime,
        provider: AiProvider.OPENAI,
        model: this.config.model,
      };
    } catch (error) {
      return this.handleError(error, timeout);
    }
  }
}
