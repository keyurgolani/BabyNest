/**
 * Google Gemini AI Provider
 * 
 * Provider implementation for Google Gemini API.
 * Supports Gemini Pro and Gemini Pro Vision models.
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
const DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiModelsResponse {
  models: Array<{
    name: string;
    displayName: string;
    description: string;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
    supportedGenerationMethods: string[];
  }>;
}

export class GeminiProvider extends BaseAiProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.endpoint || DEFAULT_ENDPOINT;
    this.apiKey = config.apiKey || '';
  }

  getProvider(): AiProvider {
    return AiProvider.GEMINI;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsChat: true,
      supportsVision: true,
      supportsStreaming: true,
      maxContextTokens: 1000000,
      defaultTextModel: 'gemini-1.5-pro',
      defaultVisionModel: 'gemini-1.5-pro',
      availableModels: [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-2.0-flash-exp',
      ],
    };
  }

  override async listModels(): Promise<ModelInfo[] | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/models?key=${this.apiKey}`,
        { method: 'GET' },
        10000,
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as GeminiModelsResponse;
      
      // Filter to only generative models that support generateContent
      const generativeModels = data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => {
          // Extract model ID from full name (e.g., "models/gemini-1.5-pro" -> "gemini-1.5-pro")
          const id = m.name.replace('models/', '');
          return {
            id,
            name: m.displayName || id,
            description: m.description,
            contextLength: m.inputTokenLimit,
            supportsVision: id.includes('gemini-1.5') || id.includes('gemini-2') || id.includes('vision'),
          };
        })
        .sort((a, b) => a.id.localeCompare(b.id));

      return generativeModels;
    } catch (error) {
      this.logger.error(`Failed to list Gemini models: ${error}`);
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/models?key=${this.apiKey}`,
        { method: 'GET' },
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
        error: 'Gemini API key not configured',
        provider: AiProvider.GEMINI,
        model: this.config.model,
      };
    }

    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const startTime = Date.now();

    try {
      // Convert messages to Gemini format
      let systemInstruction = '';
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemInstruction += msg.content + '\n';
        } else {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 1024,
        },
      };

      if (systemInstruction.trim()) {
        body['systemInstruction'] = {
          parts: [{ text: systemInstruction.trim() }],
        };
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        timeout,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as { error?: { message?: string } })?.error?.message || `Status ${response.status}`;
        return {
          success: false,
          error: `Gemini error: ${errorMessage}`,
          provider: AiProvider.GEMINI,
          model: this.config.model,
        };
      }

      const data = (await response.json()) as GeminiResponse;
      const content = data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join('') || '';

      return {
        success: true,
        response: content,
        duration: Date.now() - startTime,
        provider: AiProvider.GEMINI,
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
        error: 'Gemini API key not configured',
        provider: AiProvider.GEMINI,
        model: this.config.model,
      };
    }

    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const startTime = Date.now();

    try {
      // Convert messages to Gemini format with inline images
      let systemInstruction = '';
      const contents: Array<{ role: string; parts: Array<unknown> }> = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          if (typeof msg.content === 'string') {
            systemInstruction += msg.content + '\n';
          }
          continue;
        }

        const parts: Array<unknown> = [];

        if (typeof msg.content === 'string') {
          parts.push({ text: msg.content });
        } else {
          for (const c of msg.content) {
            if (c.type === 'text' && c.text) {
              parts.push({ text: c.text });
            } else if (c.type === 'image_url' && c.image_url?.url) {
              const url = c.image_url.url;
              const base64Match = url.match(/^data:image\/(\w+);base64,(.+)$/);
              if (base64Match) {
                parts.push({
                  inlineData: {
                    mimeType: `image/${base64Match[1]}`,
                    data: base64Match[2],
                  },
                });
              }
            }
          }
        }

        if (parts.length > 0) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts,
          });
        }
      }

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.1,
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      };

      if (systemInstruction.trim()) {
        body['systemInstruction'] = {
          parts: [{ text: systemInstruction.trim() }],
        };
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        timeout,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as { error?: { message?: string } })?.error?.message || `Status ${response.status}`;
        return {
          success: false,
          error: `Gemini vision error: ${errorMessage}`,
          provider: AiProvider.GEMINI,
          model: this.config.model,
        };
      }

      const data = (await response.json()) as GeminiResponse;
      const content = data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join('') || '';

      return {
        success: true,
        response: content,
        duration: Date.now() - startTime,
        provider: AiProvider.GEMINI,
        model: this.config.model,
      };
    } catch (error) {
      return this.handleError(error, timeout);
    }
  }
}
