import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  BABY_TRACKING_SYSTEM_PROMPT,
  fillPromptTemplate,
  getPromptTemplate,
  PromptType,
} from './ollama.prompts';

// Default timeout for regular requests (30 seconds)
const DEFAULT_TIMEOUT = 30000;

// Extended timeout for warmup/initial model loading calls (500 seconds)
const WARMUP_TIMEOUT = 500000;

/**
 * Response from Ollama generate API
 */
interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Response from Ollama chat API
 */
interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Chat message format for Ollama
 */
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
}

/**
 * Ollama Service
 * 
 * Provides integration with local Ollama LLM server for AI-powered insights.
 * Implements Requirement 10.4: Local AI processing with Ollama
 * 
 * Features:
 * - Health check to verify Ollama availability
 * - Send prompts and receive completions
 * - Pre-configured prompts for baby tracking analysis
 * - Graceful degradation when Ollama is unavailable
 */
@Injectable()
export class OllamaService implements OnModuleInit {
  private readonly logger = new Logger(OllamaService.name);
  private baseUrl: string;
  private model: string;
  private isAvailable = false;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('ollama.baseUrl') || 'http://localhost:11434';
    this.model = this.configService.get<string>('ollama.model') || 'llama3';
  }

  async onModuleInit(): Promise<void> {
    // Check Ollama availability on startup
    await this.checkHealth();
  }

  /**
   * Warmup the model by sending a simple request with extended timeout.
   * This is useful for initial model loading which can take significant time.
   * Uses WARMUP_TIMEOUT (500 seconds) to allow for model download/loading.
   * 
   * @returns CompletionResult indicating success or failure
   */
  async warmup(): Promise<CompletionResult> {
    this.logger.log(`Warming up Ollama model ${this.model} (timeout: ${WARMUP_TIMEOUT}ms)...`);
    
    const result = await this.generate('Hello', { timeout: WARMUP_TIMEOUT });
    
    if (result.success) {
      this.logger.log(`Ollama model ${this.model} warmed up successfully in ${result.duration}ms`);
    } else {
      this.logger.warn(`Ollama warmup failed: ${result.error}`);
    }
    
    return result;
  }

  /**
   * Check if Ollama server is available and responding
   * @returns true if Ollama is available, false otherwise
   */
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.isAvailable = true;
        this.logger.log(`Ollama is available at ${this.baseUrl}`);
        
        // Log available models
        const data = await response.json() as { models?: Array<{ name: string }> };
        const models = data.models?.map((m) => m.name) || [];
        this.logger.log(`Available models: ${models.join(', ') || 'none'}`);
        
        return true;
      }

      this.isAvailable = false;
      this.logger.warn(`Ollama returned status ${response.status}`);
      return false;
    } catch (error) {
      this.isAvailable = false;
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Ollama is not available: ${message}`);
      return false;
    }
  }

  /**
   * Check if Ollama service is currently available
   */
  getIsAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Get the configured model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get the configured base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Send a simple prompt to Ollama and get a completion
   * Uses the generate API for simple prompts
   * 
   * @param prompt The prompt to send
   * @param options Optional configuration for the request
   * @returns CompletionResult with the response or error
   */
  async generate(prompt: string, options: CompletionOptions = {}): Promise<CompletionResult> {
    if (!this.isAvailable) {
      // Try to reconnect
      await this.checkHealth();
      if (!this.isAvailable) {
        return {
          success: false,
          error: 'Ollama service is not available',
        };
      }
    }

    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 1024,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Ollama generate failed: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `Ollama returned status ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json() as OllamaGenerateResponse;
      const duration = Date.now() - startTime;

      return {
        success: true,
        response: data.response,
        duration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      if (message.includes('abort')) {
        return {
          success: false,
          error: `Request timed out after ${timeout}ms`,
        };
      }

      this.logger.error(`Ollama generate error: ${message}`);
      this.isAvailable = false; // Mark as unavailable on error
      
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Send a chat-style conversation to Ollama
   * Uses the chat API for multi-turn conversations with system prompts
   * 
   * @param messages Array of chat messages
   * @param options Optional configuration for the request
   * @returns CompletionResult with the response or error
   */
  async chat(messages: ChatMessage[], options: CompletionOptions = {}): Promise<CompletionResult> {
    if (!this.isAvailable) {
      // Try to reconnect
      await this.checkHealth();
      if (!this.isAvailable) {
        return {
          success: false,
          error: 'Ollama service is not available',
        };
      }
    }

    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 1024,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Ollama chat failed: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `Ollama returned status ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json() as OllamaChatResponse;
      const duration = Date.now() - startTime;

      return {
        success: true,
        response: data.message.content,
        duration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      if (message.includes('abort')) {
        return {
          success: false,
          error: `Request timed out after ${timeout}ms`,
        };
      }

      this.logger.error(`Ollama chat error: ${message}`);
      this.isAvailable = false;
      
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Analyze baby tracking data using a pre-configured prompt template
   * 
   * @param promptType The type of analysis to perform
   * @param variables Variables to fill into the prompt template
   * @param options Optional configuration for the request
   * @returns CompletionResult with the analysis or error
   */
  async analyzeWithPrompt(
    promptType: PromptType,
    variables: Record<string, string | number>,
    options: CompletionOptions = {},
  ): Promise<CompletionResult> {
    const template = getPromptTemplate(promptType);
    const userPrompt = fillPromptTemplate(template, variables);

    // Use chat API with system prompt for better context
    const messages: ChatMessage[] = [
      { role: 'system', content: BABY_TRACKING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    return this.chat(messages, {
      ...options,
      // Analysis requests may need more time
      timeout: options.timeout || 60000,
    });
  }

  /**
   * Analyze sleep patterns and predict optimal nap times
   * 
   * @param babyAgeMonths Baby's age in months
   * @param sleepData Formatted sleep data string
   * @returns CompletionResult with sleep analysis
   */
  async analyzeSleepPatterns(
    babyAgeMonths: number,
    sleepData: string,
  ): Promise<CompletionResult> {
    return this.analyzeWithPrompt('sleep_analysis', {
      babyAgeMonths,
      sleepData,
    });
  }

  /**
   * Analyze feeding patterns and suggest schedules
   * 
   * @param babyAgeMonths Baby's age in months
   * @param feedingData Formatted feeding data string
   * @returns CompletionResult with feeding analysis
   */
  async analyzeFeedingPatterns(
    babyAgeMonths: number,
    feedingData: string,
  ): Promise<CompletionResult> {
    return this.analyzeWithPrompt('feeding_analysis', {
      babyAgeMonths,
      feedingData,
    });
  }

  /**
   * Generate a weekly summary of all tracking data
   * 
   * @param data Weekly summary data
   * @returns CompletionResult with weekly summary
   */
  async generateWeeklySummary(data: {
    babyName: string;
    babyAgeMonths: number;
    weekStart: string;
    weekEnd: string;
    sleepSummary: string;
    feedingSummary: string;
    diaperSummary: string;
    growthData: string;
    activitiesSummary: string;
  }): Promise<CompletionResult> {
    return this.analyzeWithPrompt('weekly_summary', data);
  }

  /**
   * Detect anomalies in recent tracking data
   * 
   * @param babyAgeMonths Baby's age in months
   * @param sleepData Recent sleep data
   * @param feedingData Recent feeding data
   * @param diaperData Recent diaper data
   * @returns CompletionResult with anomaly detection results
   */
  async detectAnomalies(
    babyAgeMonths: number,
    sleepData: string,
    feedingData: string,
    diaperData: string,
  ): Promise<CompletionResult> {
    return this.analyzeWithPrompt('anomaly_detection', {
      babyAgeMonths,
      sleepData,
      feedingData,
      diaperData,
    });
  }

  /**
   * Assess growth measurements against developmental expectations
   * 
   * @param data Growth assessment data
   * @returns CompletionResult with growth assessment
   */
  async assessGrowth(data: {
    babyAgeMonths: number;
    gender: string;
    growthData: string;
    weightPercentile: number;
    heightPercentile: number;
    headPercentile: number;
  }): Promise<CompletionResult> {
    return this.analyzeWithPrompt('growth_assessment', data);
  }

  /**
   * Provide milestone guidance based on achieved and upcoming milestones
   * 
   * @param babyAgeMonths Baby's age in months
   * @param achievedMilestones List of recently achieved milestones
   * @param upcomingMilestones List of upcoming expected milestones
   * @returns CompletionResult with milestone guidance
   */
  async provideMilestoneGuidance(
    babyAgeMonths: number,
    achievedMilestones: string,
    upcomingMilestones: string,
  ): Promise<CompletionResult> {
    return this.analyzeWithPrompt('milestone_guidance', {
      babyAgeMonths,
      achievedMilestones,
      upcomingMilestones,
    });
  }

  /**
   * Generate trend insights for a specific period
   * 
   * @param period The trend period (daily, weekly, monthly, yearly)
   * @param data Trend analysis data
   * @returns CompletionResult with trend insights
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
  ): Promise<CompletionResult> {
    const promptType = `${period}_trend` as PromptType;
    return this.analyzeWithPrompt(promptType, {
      ...data,
      startAgeMonths: data.startAgeMonths ?? data.babyAgeMonths,
    }, {
      // Longer timeout for comprehensive analysis
      timeout: period === 'yearly' ? 120000 : 90000,
      maxTokens: period === 'yearly' ? 2048 : 1536,
    });
  }
}
