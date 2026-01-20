import { Module } from '@nestjs/common';

import { InsightConfigService } from './insight-config.service';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { BabyModule } from '../baby/baby.module';

/**
 * Insights Module
 * Provides AI-powered insights for baby tracking data
 * Validates: Requirements 10.5 - Weekly summary generation with AI insights
 * 
 * Features:
 * - Weekly summary aggregation from all tracking data
 * - AI-generated insights using Ollama
 * - Fallback summary when AI is unavailable
 * - Configurable insight generation cadence
 * - Adhoc insight generation
 * - Insight history storage and retrieval
 * 
 * Dependencies:
 * - BabyModule: For baby profile access and validation
 * - OllamaModule: For AI-powered insights (global module)
 * - PrismaModule: For database access (global module)
 */
@Module({
  imports: [BabyModule],
  controllers: [InsightsController],
  providers: [InsightsService, InsightConfigService],
  exports: [InsightsService, InsightConfigService],
})
export class InsightsModule {}
