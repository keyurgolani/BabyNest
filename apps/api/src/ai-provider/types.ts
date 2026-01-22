/**
 * AI Provider Types
 * 
 * Defines the interfaces and types for the AI provider abstraction layer.
 * Supports multiple providers: Ollama (default), OpenAI, Anthropic, Gemini, OpenRouter
 */

/**
 * Supported AI providers
 */
export enum AiProvider {
  OLLAMA = 'ollama',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  OPENROUTER = 'openrouter',
}

/**
 * Chat message format (compatible across providers)
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Vision message with image support
 */
export interface VisionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | VisionContent[];
}

export interface VisionContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string; // base64 data URL or HTTP URL
  };
}

/**
 * Options for completion requests
 */
export interface CompletionOptions {
  /** Temperature for response randomness (0-1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Use streaming response */
  stream?: boolean;
}

/**
 * Result from a completion request
 */
export interface CompletionResult {
  success: boolean;
  response?: string;
  error?: string;
  duration?: number;
  provider?: AiProvider;
  model?: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  provider: AiProvider;
  apiKey?: string;
  model: string;
  endpoint?: string;
}

/**
 * User's AI provider configuration from database
 */
export interface UserAiConfig {
  textProvider?: AiProvider;
  textApiKey?: string;
  textModel?: string;
  textEndpoint?: string;
  visionProvider?: AiProvider;
  visionApiKey?: string;
  visionModel?: string;
  visionEndpoint?: string;
  isEnabled: boolean;
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  supportsChat: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  maxContextTokens: number;
  defaultTextModel: string;
  defaultVisionModel: string;
  availableModels: string[];
}

/**
 * Provider metadata for UI display
 */
export interface ProviderMetadata {
  id: AiProvider;
  name: string;
  description: string;
  requiresApiKey: boolean;
  capabilities: ProviderCapabilities;
  documentationUrl: string;
}

/**
 * Model info returned from dynamic model listing
 */
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  supportsVision?: boolean;
}
