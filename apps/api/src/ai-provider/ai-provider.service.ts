/**
 * AI Provider Service
 * 
 * Manages AI provider configurations and provides a unified interface
 * for text and vision inference. Supports user-specific provider overrides
 * with fallback to the default Ollama configuration.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createProvider, getAvailableProviders, PROVIDER_METADATA } from './provider-factory';
import { BaseAiProvider } from './providers';
import {
  AiProvider,
  ChatMessage,
  VisionMessage,
  CompletionOptions,
  CompletionResult,
  ProviderConfig,
  UserAiConfig,
} from './types';
import {
  BABY_TRACKING_SYSTEM_PROMPT,
  fillPromptTemplate,
  getPromptTemplate,
  PromptType,
} from '../ollama/ollama.prompts';
import { PrismaService } from '../prisma/prisma.service';

// Extended timeout for warmup/initial model loading calls (500 seconds)
const WARMUP_TIMEOUT = 500000;

@Injectable()
export class AiProviderService implements OnModuleInit {
  private readonly logger = new Logger(AiProviderService.name);
  
  // Default Ollama providers (fallback)
  private defaultTextProvider: BaseAiProvider;
  private defaultVisionProvider: BaseAiProvider;
  
  // Cache for user providers
  private userProviderCache: Map<string, { text: BaseAiProvider; vision: BaseAiProvider; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Initialize default Ollama providers from environment config
    const ollamaBaseUrl = this.configService.get<string>('ollama.baseUrl') || 'http://localhost:11434';
    const ollamaTextModel = this.configService.get<string>('ollama.model') || 'llama3';
    const ollamaVisionModel = this.configService.get<string>('ollama.visionModel') || 'llava';

    this.defaultTextProvider = createProvider({
      provider: AiProvider.OLLAMA,
      model: ollamaTextModel,
      endpoint: ollamaBaseUrl,
    });

    this.defaultVisionProvider = createProvider({
      provider: AiProvider.OLLAMA,
      model: ollamaVisionModel,
      endpoint: ollamaBaseUrl,
    });
  }

  async onModuleInit(): Promise<void> {
    // Check default Ollama availability on startup
    const isAvailable = await this.defaultTextProvider.checkHealth();
    if (isAvailable) {
      this.logger.log('Default Ollama provider is available');
    } else {
      this.logger.warn('Default Ollama provider is not available');
    }
  }

  /**
   * Get the text provider for a user (or default if no override)
   */
  async getTextProvider(caregiverId?: string): Promise<BaseAiProvider> {
    if (!caregiverId) {
      return this.defaultTextProvider;
    }

    const cached = this.getCachedProvider(caregiverId);
    if (cached) {
      return cached.text;
    }

    const userConfig = await this.getUserConfig(caregiverId);
    if (!userConfig || !userConfig.isEnabled || !userConfig.textProvider) {
      return this.defaultTextProvider;
    }

    const provider = this.createUserTextProvider(userConfig);
    this.cacheUserProviders(caregiverId, provider, await this.getVisionProvider(caregiverId));
    return provider;
  }

  /**
   * Get the vision provider for a user (or default if no override)
   */
  async getVisionProvider(caregiverId?: string): Promise<BaseAiProvider> {
    if (!caregiverId) {
      return this.defaultVisionProvider;
    }

    const cached = this.getCachedProvider(caregiverId);
    if (cached) {
      return cached.vision;
    }

    const userConfig = await this.getUserConfig(caregiverId);
    if (!userConfig || !userConfig.isEnabled || !userConfig.visionProvider) {
      return this.defaultVisionProvider;
    }

    const provider = this.createUserVisionProvider(userConfig);
    this.cacheUserProviders(caregiverId, await this.getTextProvider(caregiverId), provider);
    return provider;
  }

  /**
   * Send a chat completion request using the appropriate provider
   */
  async chat(
    messages: ChatMessage[],
    options: CompletionOptions = {},
    caregiverId?: string,
  ): Promise<CompletionResult> {
    const provider = await this.getTextProvider(caregiverId);
    const result = await provider.chat(messages, options);

    // If user provider fails, try fallback to default Ollama
    if (!result.success && caregiverId && provider !== this.defaultTextProvider) {
      this.logger.warn(`User provider failed, falling back to Ollama: ${result.error}`);
      const fallbackResult = await this.defaultTextProvider.chat(messages, options);
      if (fallbackResult.success) {
        return { ...fallbackResult, error: `Fallback used: ${result.error}` };
      }
    }

    return result;
  }

  /**
   * Send a vision completion request using the appropriate provider
   */
  async vision(
    messages: VisionMessage[],
    options: CompletionOptions = {},
    caregiverId?: string,
  ): Promise<CompletionResult> {
    const provider = await this.getVisionProvider(caregiverId);
    const result = await provider.vision(messages, options);

    // If user provider fails, try fallback to default Ollama
    if (!result.success && caregiverId && provider !== this.defaultVisionProvider) {
      this.logger.warn(`User vision provider failed, falling back to Ollama: ${result.error}`);
      const fallbackResult = await this.defaultVisionProvider.vision(messages, options);
      if (fallbackResult.success) {
        return { ...fallbackResult, error: `Fallback used: ${result.error}` };
      }
    }

    return result;
  }

  /**
   * Simple text generation
   */
  async generate(
    prompt: string,
    options: CompletionOptions = {},
    caregiverId?: string,
  ): Promise<CompletionResult> {
    return this.chat([{ role: 'user', content: prompt }], options, caregiverId);
  }

  /**
   * Warmup the default text model
   */
  async warmup(): Promise<CompletionResult> {
    this.logger.log('Warming up default text model...');
    return this.defaultTextProvider.generate('Hello', { timeout: WARMUP_TIMEOUT });
  }

  /**
   * Check health of the default provider
   */
  async checkHealth(): Promise<boolean> {
    return this.defaultTextProvider.checkHealth();
  }

  /**
   * Get availability status
   */
  async getIsAvailable(): Promise<boolean> {
    return this.checkHealth();
  }

  /**
   * Get the default text model name
   */
  getModel(): string {
    return this.defaultTextProvider.getModel();
  }

  /**
   * Get the default vision model name
   */
  getVisionModel(): string {
    return this.defaultVisionProvider.getModel();
  }

  /**
   * Get the default base URL
   */
  getBaseUrl(): string {
    return this.defaultTextProvider.getEndpoint() || 'http://localhost:11434';
  }

  /**
   * Get all available providers for configuration UI
   */
  getAvailableProviders() {
    return getAvailableProviders();
  }

  /**
   * Get provider metadata
   */
  getProviderMetadata(provider: AiProvider) {
    return PROVIDER_METADATA[provider];
  }

  /**
   * Get user's AI configuration
   */
  private async getUserConfig(caregiverId: string): Promise<UserAiConfig | null> {
    try {
      const config = await this.prisma.aiProviderConfig.findUnique({
        where: { caregiverId },
      });

      if (!config) {
        return null;
      }

      return {
        textProvider: config.textProvider as AiProvider | undefined,
        textApiKey: config.textApiKey || undefined,
        textModel: config.textModel || undefined,
        textEndpoint: config.textEndpoint || undefined,
        visionProvider: config.visionProvider as AiProvider | undefined,
        visionApiKey: config.visionApiKey || undefined,
        visionModel: config.visionModel || undefined,
        visionEndpoint: config.visionEndpoint || undefined,
        isEnabled: config.isEnabled,
      };
    } catch (error) {
      this.logger.error(`Failed to get user AI config: ${error}`);
      return null;
    }
  }

  /**
   * Create a text provider from user config
   */
  private createUserTextProvider(config: UserAiConfig): BaseAiProvider {
    if (!config.textProvider) {
      return this.defaultTextProvider;
    }

    const providerConfig: ProviderConfig = {
      provider: config.textProvider,
      apiKey: config.textApiKey,
      model: config.textModel || PROVIDER_METADATA[config.textProvider].capabilities.defaultTextModel,
      endpoint: config.textEndpoint,
    };

    return createProvider(providerConfig);
  }

  /**
   * Create a vision provider from user config
   */
  private createUserVisionProvider(config: UserAiConfig): BaseAiProvider {
    if (!config.visionProvider) {
      return this.defaultVisionProvider;
    }

    const providerConfig: ProviderConfig = {
      provider: config.visionProvider,
      apiKey: config.visionApiKey,
      model: config.visionModel || PROVIDER_METADATA[config.visionProvider].capabilities.defaultVisionModel,
      endpoint: config.visionEndpoint,
    };

    return createProvider(providerConfig);
  }

  /**
   * Get cached provider for user
   */
  private getCachedProvider(caregiverId: string) {
    const cached = this.userProviderCache.get(caregiverId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }
    return null;
  }

  /**
   * Cache user providers
   */
  private cacheUserProviders(caregiverId: string, text: BaseAiProvider, vision: BaseAiProvider) {
    this.userProviderCache.set(caregiverId, {
      text,
      vision,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cached provider for user (call when config changes)
   */
  clearUserCache(caregiverId: string) {
    this.userProviderCache.delete(caregiverId);
  }

  // ============================================================================
  // Analysis Methods (compatible with OllamaService interface)
  // ============================================================================

  /**
   * Analyze baby tracking data using a pre-configured prompt template
   */
  async analyzeWithPrompt(
    promptType: PromptType,
    variables: Record<string, string | number>,
    options: CompletionOptions = {},
    caregiverId?: string,
  ): Promise<CompletionResult> {
    const template = getPromptTemplate(promptType);
    const userPrompt = fillPromptTemplate(template, variables);

    const messages: ChatMessage[] = [
      { role: 'system', content: BABY_TRACKING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    return this.chat(messages, {
      ...options,
      timeout: options.timeout || 60000,
    }, caregiverId);
  }

  /**
   * Analyze sleep patterns and predict optimal nap times
   */
  async analyzeSleepPatterns(
    babyAgeMonths: number,
    sleepData: string,
    caregiverId?: string,
  ): Promise<CompletionResult> {
    return this.analyzeWithPrompt('sleep_analysis', {
      babyAgeMonths,
      sleepData,
    }, {}, caregiverId);
  }

  /**
   * Analyze feeding patterns and suggest schedules
   */
  async analyzeFeedingPatterns(
    babyAgeMonths: number,
    feedingData: string,
    caregiverId?: string,
  ): Promise<CompletionResult> {
    return this.analyzeWithPrompt('feeding_analysis', {
      babyAgeMonths,
      feedingData,
    }, {}, caregiverId);
  }

  /**
   * Generate a weekly summary of all tracking data
   */
  async generateWeeklySummary(
    data: {
      babyName: string;
      babyAgeMonths: number;
      weekStart: string;
      weekEnd: string;
      sleepSummary: string;
      feedingSummary: string;
      diaperSummary: string;
      growthData: string;
      activitiesSummary: string;
    },
    caregiverId?: string,
  ): Promise<CompletionResult> {
    return this.analyzeWithPrompt('weekly_summary', data, {}, caregiverId);
  }

  /**
   * Detect anomalies in recent tracking data
   */
  async detectAnomalies(
    babyAgeMonths: number,
    sleepData: string,
    feedingData: string,
    diaperData: string,
    caregiverId?: string,
  ): Promise<CompletionResult> {
    return this.analyzeWithPrompt('anomaly_detection', {
      babyAgeMonths,
      sleepData,
      feedingData,
      diaperData,
    }, {}, caregiverId);
  }

  /**
   * Assess growth measurements against developmental expectations
   */
  async assessGrowth(
    data: {
      babyAgeMonths: number;
      gender: string;
      growthData: string;
      weightPercentile: number;
      heightPercentile: number;
      headPercentile: number;
    },
    caregiverId?: string,
  ): Promise<CompletionResult> {
    return this.analyzeWithPrompt('growth_assessment', data, {}, caregiverId);
  }

  /**
   * Provide milestone guidance based on achieved and upcoming milestones
   */
  async provideMilestoneGuidance(
    babyAgeMonths: number,
    achievedMilestones: string,
    upcomingMilestones: string,
    caregiverId?: string,
  ): Promise<CompletionResult> {
    return this.analyzeWithPrompt('milestone_guidance', {
      babyAgeMonths,
      achievedMilestones,
      upcomingMilestones,
    }, {}, caregiverId);
  }

  /**
   * Generate trend insights for a specific period
   */
  async generateTrendInsights(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    data: {
      babyName: string;
      babyAgeMonths: number;
      periodStart: string;
      periodEnd: string;
      periodDays: number;
      sleepSummary: string;
      feedingSummary: string;
      diaperSummary: string;
      growthSummary: string;
      activitySummary: string;
      previousPeriodComparison: string;
      startAgeMonths?: number;
    },
    caregiverId?: string,
  ): Promise<CompletionResult> {
    const promptType = `${period}_trend` as PromptType;
    return this.analyzeWithPrompt(promptType, {
      ...data,
      startAgeMonths: data.startAgeMonths ?? data.babyAgeMonths,
    }, {
      timeout: period === 'yearly' ? 120000 : 90000,
      maxTokens: period === 'yearly' ? 2048 : 1536,
    }, caregiverId);
  }
}
