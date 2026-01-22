/**
 * AI Configuration Controller
 * 
 * REST API endpoints for managing user AI provider configurations.
 */

import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { AiConfigService } from './ai-config.service';
import { UpdateAiConfigDto, TestProviderResultDto } from './dto';
import { AiProvider, ModelInfo } from './types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthUser {
  id: string;
  email: string;
}

@Controller('ai-config')
@UseGuards(JwtAuthGuard)
export class AiConfigController {
  constructor(private readonly aiConfigService: AiConfigService) {}

  /**
   * Get available AI providers
   */
  @Get('providers')
  getProviders() {
    return this.aiConfigService.getAvailableProviders();
  }

  /**
   * List available models for a provider (requires API key)
   */
  @Get('models')
  async listModels(
    @Query('provider') provider: AiProvider,
    @Query('apiKey') apiKey?: string,
  ): Promise<{ models: ModelInfo[]; fromApi: boolean }> {
    return this.aiConfigService.listModels(provider, apiKey);
  }

  /**
   * Get current user's AI configuration
   */
  @Get()
  async getConfig(@CurrentUser() user: AuthUser) {
    const config = await this.aiConfigService.getConfig(user.id);
    return config || { isEnabled: false, hasTextApiKey: false, hasVisionApiKey: false };
  }

  /**
   * Update user's AI configuration
   */
  @Put()
  async updateConfig(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateAiConfigDto,
  ) {
    return this.aiConfigService.upsertConfig(user.id, dto);
  }

  /**
   * Delete user's AI configuration (revert to defaults)
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConfig(@CurrentUser() user: AuthUser) {
    await this.aiConfigService.deleteConfig(user.id);
  }

  /**
   * Test a provider configuration
   */
  @Post('test')
  async testProvider(
    @Body() body: {
      provider: AiProvider;
      apiKey?: string;
      model: string;
      endpoint?: string;
      isVision?: boolean;
    },
  ): Promise<TestProviderResultDto> {
    return this.aiConfigService.testProvider(
      body.provider,
      body.apiKey,
      body.model,
      body.endpoint,
      body.isVision,
    );
  }
}
