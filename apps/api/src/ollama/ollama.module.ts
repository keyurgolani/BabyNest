import { Module, Global } from '@nestjs/common';

import { OllamaService } from './ollama.service';

/**
 * Ollama Module
 * 
 * Provides integration with local Ollama LLM server for AI-powered insights.
 * This module is global so it can be used across the application.
 * 
 * Requirements: 10.4 - Local AI processing with Ollama
 * 
 * Features:
 * - OllamaService for sending prompts and receiving completions
 * - Pre-configured prompts for baby tracking analysis
 * - Health check to verify Ollama availability
 * - Graceful degradation when Ollama is unavailable
 * 
 * Configuration (via environment variables):
 * - OLLAMA_BASE_URL: Base URL for Ollama server (default: http://localhost:11434)
 * - OLLAMA_MODEL: Model to use for completions (default: llama3)
 */
@Global()
@Module({
  providers: [OllamaService],
  exports: [OllamaService],
})
export class OllamaModule {}
