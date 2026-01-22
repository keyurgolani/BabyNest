/**
 * AI Provider Module Exports
 * 
 * Provides AI inference capabilities with support for multiple providers:
 * - Ollama (default/fallback)
 * - OpenAI
 * - Anthropic
 * - Google Gemini
 * - OpenRouter
 */

export { AiProviderModule } from './ai-provider.module';
export { AiProviderService } from './ai-provider.service';
export { AiConfigService } from './ai-config.service';
export { AiConfigController } from './ai-config.controller';

export { AiProvider } from './types';
export type {
  ChatMessage,
  VisionMessage,
  VisionContent,
  CompletionOptions,
  CompletionResult,
  ProviderConfig,
  UserAiConfig,
  ProviderCapabilities,
  ProviderMetadata,
} from './types';

export {
  createProvider,
  getAvailableProviders,
  getProviderMetadata,
  validateProviderConfig,
  PROVIDER_METADATA,
} from './provider-factory';

export {
  UpdateAiConfigDto,
  AiConfigResponseDto,
  ProviderInfoDto,
  TestProviderResultDto,
} from './dto';
