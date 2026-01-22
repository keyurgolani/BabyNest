/**
 * AI Provider DTOs
 */

import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

import { AiProvider } from '../types';

/**
 * DTO for updating AI provider configuration
 */
export class UpdateAiConfigDto {
  @IsOptional()
  @IsEnum(AiProvider)
  textProvider?: AiProvider;

  @IsOptional()
  @IsString()
  textApiKey?: string;

  @IsOptional()
  @IsString()
  textModel?: string;

  @IsOptional()
  @IsString()
  textEndpoint?: string;

  @IsOptional()
  @IsEnum(AiProvider)
  visionProvider?: AiProvider;

  @IsOptional()
  @IsString()
  visionApiKey?: string;

  @IsOptional()
  @IsString()
  visionModel?: string;

  @IsOptional()
  @IsString()
  visionEndpoint?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

/**
 * Response DTO for AI provider configuration (without sensitive data)
 */
export class AiConfigResponseDto {
  textProvider?: string;
  textModel?: string;
  textEndpoint?: string;
  hasTextApiKey: boolean;

  visionProvider?: string;
  visionModel?: string;
  visionEndpoint?: string;
  hasVisionApiKey: boolean;

  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for available providers
 */
export class ProviderInfoDto {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
  defaultTextModel: string;
  defaultVisionModel: string;
  availableModels: string[];
  supportsVision: boolean;
  documentationUrl: string;
}

/**
 * Response DTO for provider test result
 */
export class TestProviderResultDto {
  success: boolean;
  provider: string;
  model: string;
  responseTime?: number;
  error?: string;
}
