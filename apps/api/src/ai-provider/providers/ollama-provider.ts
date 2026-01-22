/**
 * Ollama AI Provider
 * 
 * Provider implementation for local Ollama server.
 * This is the default/fallback provider.
 */

import {
  AiProvider,
  ChatMessage,
  VisionMessage,
  CompletionOptions,
  CompletionResult,
  ProviderConfig,
  ProviderCapabilities,
} from '../types';
import { BaseAiProvider } from './base-provider';

const DEFAULT_TIMEOUT = 30000;
const VISION_TIMEOUT = 300000; // 5 minutes for vision tasks

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
  total_duration?: number;
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export class OllamaProvider extends BaseAiProvider {
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.endpoint || 'http://localhost:11434';
  }

  getProvider(): AiProvider {
    return AiProvider.OLLAMA;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsChat: true,
      supportsVision: true,
      supportsStreaming: true,
      maxContextTokens: 8192,
      defaultTextModel: 'llama3',
      defaultVisionModel: 'llava',
      availableModels: ['llama3', 'llama3.1', 'mistral', 'gemma', 'llava', 'gemma3'],
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/tags`,
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
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const startTime = Date.now();

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.config.model,
            messages,
            stream: false,
            options: {
              temperature: options.temperature ?? 0.7,
              num_predict: options.maxTokens ?? 1024,
            },
          }),
        },
        timeout,
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Ollama returned status ${response.status}: ${errorText}`,
          provider: AiProvider.OLLAMA,
          model: this.config.model,
        };
      }

      const data = (await response.json()) as OllamaChatResponse;
      return {
        success: true,
        response: data.message.content,
        duration: Date.now() - startTime,
        provider: AiProvider.OLLAMA,
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
    const timeout = options.timeout || VISION_TIMEOUT;
    const startTime = Date.now();

    try {
      // Extract images and text from messages
      const images: string[] = [];
      let prompt = '';

      for (const msg of messages) {
        if (typeof msg.content === 'string') {
          prompt += msg.content + '\n';
        } else {
          for (const content of msg.content) {
            if (content.type === 'text' && content.text) {
              prompt += content.text + '\n';
            } else if (content.type === 'image_url' && content.image_url?.url) {
              // Extract base64 data from data URL
              const base64Match = content.image_url.url.match(/^data:image\/\w+;base64,(.+)$/);
              if (base64Match?.[1]) {
                images.push(base64Match[1]);
              }
            }
          }
        }
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.config.model,
            prompt: prompt.trim(),
            images,
            stream: false,
            options: {
              temperature: options.temperature ?? 0.1,
              num_predict: options.maxTokens ?? 4096,
            },
          }),
        },
        timeout,
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Ollama vision returned status ${response.status}: ${errorText}`,
          provider: AiProvider.OLLAMA,
          model: this.config.model,
        };
      }

      const data = (await response.json()) as OllamaGenerateResponse;
      return {
        success: true,
        response: data.response,
        duration: Date.now() - startTime,
        provider: AiProvider.OLLAMA,
        model: this.config.model,
      };
    } catch (error) {
      return this.handleError(error, timeout);
    }
  }
}
