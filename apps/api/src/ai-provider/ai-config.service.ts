/**
 * AI Configuration Service
 * 
 * Manages user AI provider configurations in the database.
 * Handles CRUD operations and validation for provider settings.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { AiProviderService } from './ai-provider.service';
import { UpdateAiConfigDto, AiConfigResponseDto, TestProviderResultDto } from './dto';
import { createProvider, PROVIDER_METADATA, validateProviderConfig } from './provider-factory';
import { AiProvider, ModelInfo } from './types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiConfigService {
  private readonly logger = new Logger(AiConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProviderService: AiProviderService,
  ) {}

  /**
   * Get user's AI configuration
   */
  async getConfig(caregiverId: string): Promise<AiConfigResponseDto | null> {
    const config = await this.prisma.aiProviderConfig.findUnique({
      where: { caregiverId },
    });

    if (!config) {
      return null;
    }

    return {
      textProvider: config.textProvider || undefined,
      textModel: config.textModel || undefined,
      textEndpoint: config.textEndpoint || undefined,
      hasTextApiKey: !!config.textApiKey,
      visionProvider: config.visionProvider || undefined,
      visionModel: config.visionModel || undefined,
      visionEndpoint: config.visionEndpoint || undefined,
      hasVisionApiKey: !!config.visionApiKey,
      isEnabled: config.isEnabled,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Create or update user's AI configuration
   */
  async upsertConfig(caregiverId: string, dto: UpdateAiConfigDto): Promise<AiConfigResponseDto> {
    // Get existing config to check for existing API keys
    const existingConfig = await this.prisma.aiProviderConfig.findUnique({
      where: { caregiverId },
    });

    // Validate provider configurations if provided
    if (dto.textProvider && dto.textProvider !== AiProvider.OLLAMA) {
      // Use provided API key, or fall back to existing one
      const apiKey = dto.textApiKey || existingConfig?.textApiKey || undefined;
      const validation = validateProviderConfig({
        provider: dto.textProvider,
        apiKey,
        model: dto.textModel || PROVIDER_METADATA[dto.textProvider].capabilities.defaultTextModel,
      });
      if (!validation.valid) {
        throw new Error(`Invalid text provider config: ${validation.error}`);
      }
    }

    if (dto.visionProvider && dto.visionProvider !== AiProvider.OLLAMA) {
      // Use provided API key, or fall back to existing one
      const apiKey = dto.visionApiKey || existingConfig?.visionApiKey || undefined;
      const validation = validateProviderConfig({
        provider: dto.visionProvider,
        apiKey,
        model: dto.visionModel || PROVIDER_METADATA[dto.visionProvider].capabilities.defaultVisionModel,
      });
      if (!validation.valid) {
        throw new Error(`Invalid vision provider config: ${validation.error}`);
      }
    }

    const config = await this.prisma.aiProviderConfig.upsert({
      where: { caregiverId },
      create: {
        caregiverId,
        textProvider: dto.textProvider,
        textApiKey: dto.textApiKey,
        textModel: dto.textModel,
        textEndpoint: dto.textEndpoint,
        visionProvider: dto.visionProvider,
        visionApiKey: dto.visionApiKey,
        visionModel: dto.visionModel,
        visionEndpoint: dto.visionEndpoint,
        isEnabled: dto.isEnabled ?? true,
      },
      update: {
        ...(dto.textProvider !== undefined && { textProvider: dto.textProvider }),
        ...(dto.textApiKey !== undefined && { textApiKey: dto.textApiKey }),
        ...(dto.textModel !== undefined && { textModel: dto.textModel }),
        ...(dto.textEndpoint !== undefined && { textEndpoint: dto.textEndpoint }),
        ...(dto.visionProvider !== undefined && { visionProvider: dto.visionProvider }),
        ...(dto.visionApiKey !== undefined && { visionApiKey: dto.visionApiKey }),
        ...(dto.visionModel !== undefined && { visionModel: dto.visionModel }),
        ...(dto.visionEndpoint !== undefined && { visionEndpoint: dto.visionEndpoint }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
      },
    });

    // Clear the provider cache for this user
    this.aiProviderService.clearUserCache(caregiverId);

    this.logger.log(`Updated AI config for caregiver ${caregiverId}`);

    return {
      textProvider: config.textProvider || undefined,
      textModel: config.textModel || undefined,
      textEndpoint: config.textEndpoint || undefined,
      hasTextApiKey: !!config.textApiKey,
      visionProvider: config.visionProvider || undefined,
      visionModel: config.visionModel || undefined,
      visionEndpoint: config.visionEndpoint || undefined,
      hasVisionApiKey: !!config.visionApiKey,
      isEnabled: config.isEnabled,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Delete user's AI configuration (revert to defaults)
   */
  async deleteConfig(caregiverId: string): Promise<void> {
    const config = await this.prisma.aiProviderConfig.findUnique({
      where: { caregiverId },
    });

    if (!config) {
      throw new NotFoundException('AI configuration not found');
    }

    await this.prisma.aiProviderConfig.delete({
      where: { caregiverId },
    });

    // Clear the provider cache for this user
    this.aiProviderService.clearUserCache(caregiverId);

    this.logger.log(`Deleted AI config for caregiver ${caregiverId}`);
  }

  /**
   * Test a provider configuration
   */
  async testProvider(
    provider: AiProvider,
    apiKey: string | undefined,
    model: string,
    endpoint?: string,
    isVision = false,
  ): Promise<TestProviderResultDto> {
    try {
      const providerInstance = createProvider({
        provider,
        apiKey,
        model,
        endpoint,
      });

      const startTime = Date.now();

      if (isVision) {
        // For vision test, we just check health since we can't easily test without an image
        const isHealthy = await providerInstance.checkHealth();
        return {
          success: isHealthy,
          provider,
          model,
          responseTime: Date.now() - startTime,
          error: isHealthy ? undefined : 'Provider health check failed',
        };
      }

      // Test with a simple prompt
      const result = await providerInstance.generate('Say "Hello" in one word.', {
        timeout: 30000,
        maxTokens: 10,
      });

      return {
        success: result.success,
        provider,
        model,
        responseTime: result.duration,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        provider,
        model,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get available providers with their metadata
   */
  getAvailableProviders() {
    return this.aiProviderService.getAvailableProviders();
  }

  /**
   * List available models for a provider
   * If API key is provided, fetches models dynamically from the provider API
   * Otherwise returns the static list from capabilities
   */
  async listModels(
    provider: AiProvider,
    apiKey?: string,
  ): Promise<{ models: ModelInfo[]; fromApi: boolean }> {
    const metadata = PROVIDER_METADATA[provider];
    if (!metadata) {
      return { models: [], fromApi: false };
    }

    // If API key is provided, try to fetch models dynamically
    if (apiKey) {
      try {
        const providerInstance = createProvider({
          provider,
          apiKey,
          model: metadata.capabilities.defaultTextModel,
        });

        const dynamicModels = await providerInstance.listModels();
        if (dynamicModels && dynamicModels.length > 0) {
          return { models: dynamicModels, fromApi: true };
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch dynamic models for ${provider}: ${error}`);
      }
    }

    // Fall back to static list from capabilities
    const staticModels: ModelInfo[] = metadata.capabilities.availableModels.map(id => ({
      id,
      name: id,
      supportsVision: metadata.capabilities.supportsVision,
    }));

    return { models: staticModels, fromApi: false };
  }
}
