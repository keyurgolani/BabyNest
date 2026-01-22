/**
 * Base AI Provider Interface
 * 
 * Abstract base class that all AI providers must implement.
 * Provides a consistent interface for text and vision inference.
 */

import { Logger } from '@nestjs/common';

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

export abstract class BaseAiProvider {
  protected readonly logger: Logger;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Get the provider identifier
   */
  abstract getProvider(): AiProvider;

  /**
   * Get provider capabilities
   */
  abstract getCapabilities(): ProviderCapabilities;

  /**
   * Check if the provider is available and configured correctly
   */
  abstract checkHealth(): Promise<boolean>;

  /**
   * Send a chat completion request
   */
  abstract chat(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): Promise<CompletionResult>;

  /**
   * Send a vision completion request (for providers that support it)
   */
  abstract vision(
    messages: VisionMessage[],
    options?: CompletionOptions,
  ): Promise<CompletionResult>;

  /**
   * List available models from the provider API
   * Returns null if the provider doesn't support dynamic model listing
   */
  async listModels(): Promise<ModelInfo[] | null> {
    // Default implementation returns null (use static list)
    return null;
  }

  /**
   * Simple text generation (convenience method)
   */
  async generate(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  /**
   * Get the configured model
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Get the configured endpoint
   */
  getEndpoint(): string | undefined {
    return this.config.endpoint;
  }

  /**
   * Create a fetch request with timeout
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle common error scenarios
   */
  protected handleError(error: unknown, timeout: number): CompletionResult {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('abort')) {
      return {
        success: false,
        error: `Request timed out after ${timeout}ms`,
        provider: this.getProvider(),
        model: this.config.model,
      };
    }

    this.logger.error(`Provider error: ${message}`);
    return {
      success: false,
      error: message,
      provider: this.getProvider(),
      model: this.config.model,
    };
  }
}
