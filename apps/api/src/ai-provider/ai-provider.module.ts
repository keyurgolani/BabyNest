/**
 * AI Provider Module
 * 
 * Provides AI inference capabilities with support for multiple providers.
 * Users can configure their preferred providers (OpenAI, Anthropic, Gemini, OpenRouter)
 * with fallback to the default Ollama configuration.
 */

import { Module, Global } from '@nestjs/common';

import { AiConfigController } from './ai-config.controller';
import { AiConfigService } from './ai-config.service';
import { AiProviderService } from './ai-provider.service';

@Global()
@Module({
  controllers: [AiConfigController],
  providers: [AiProviderService, AiConfigService],
  exports: [AiProviderService, AiConfigService],
})
export class AiProviderModule {}
