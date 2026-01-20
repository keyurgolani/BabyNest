/**
 * Ollama Module Exports
 * 
 * Provides integration with local Ollama LLM server for AI-powered insights.
 * Requirements: 10.4 - Local AI processing with Ollama
 */

export { OllamaModule } from './ollama.module';
export { OllamaService } from './ollama.service';
export type { CompletionOptions, CompletionResult } from './ollama.service';
export {
  BABY_TRACKING_SYSTEM_PROMPT,
  SLEEP_ANALYSIS_PROMPT,
  FEEDING_ANALYSIS_PROMPT,
  WEEKLY_SUMMARY_PROMPT,
  ANOMALY_DETECTION_PROMPT,
  GROWTH_ASSESSMENT_PROMPT,
  MILESTONE_GUIDANCE_PROMPT,
  fillPromptTemplate,
  getPromptTemplate,
} from './ollama.prompts';
export type { PromptType } from './ollama.prompts';
