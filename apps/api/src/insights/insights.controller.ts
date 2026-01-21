import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';

import {
  WeeklySummaryQueryDto,
  WeeklySummaryResponseDto,
  SleepPredictionQueryDto,
  SleepPredictionResponseDto,
  AnomalyDetectionQueryDto,
  AnomalyDetectionResponseDto,
  DailySummaryQueryDto,
  DailySummaryResponseDto,
  TrendInsightsQueryDto,
  TrendInsightsResponseDto,
  ConfigureInsightCadenceDto,
  InsightConfigResponseDto,
  GenerateAdhocInsightDto,
  GeneratedInsightResponseDto,
  InsightHistoryQueryDto,
  InsightHistoryListResponseDto,
} from './dto';
import { InsightConfigService } from './insight-config.service';
import { InsightsService } from './insights.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Insights Controller
 * Provides AI-powered insights endpoints for baby tracking data
 * Validates: Requirements 10.5 - Weekly summary generation with AI insights
 */
@ApiTags('insights')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('babies/:babyId/insights')
export class InsightsController {
  private readonly logger = new Logger(InsightsController.name);

  constructor(
    private readonly insightsService: InsightsService,
    private readonly insightConfigService: InsightConfigService,
  ) {}

  /**
   * Get weekly summary with AI-generated insights
   * Validates: Requirements 10.5
   */
  @Get('weekly-summary')
  @ApiOperation({
    summary: 'Get weekly summary with AI insights',
    description:
      'Aggregates tracking data for a week and generates AI-powered insights and recommendations. ' +
      'If AI is unavailable, returns a fallback data summary.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly summary with AI insights',
    type: WeeklySummaryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to this baby',
  })
  @ApiResponse({
    status: 404,
    description: 'Baby not found',
  })
  async getWeeklySummary(
    @Param('babyId') babyId: string,
    @Query() query: WeeklySummaryQueryDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<WeeklySummaryResponseDto> {
    return this.insightsService.getWeeklySummary(
      babyId,
      user.id,
      query,
    );
  }

  /**
   * Get sleep prediction with AI-powered analysis
   * Validates: Requirements 10.1 - Sleep prediction based on pattern analysis
   */
  @Get('sleep-prediction')
  @ApiOperation({
    summary: 'Get sleep prediction based on pattern analysis',
    description:
      'Analyzes sleep patterns from recent data and predicts optimal nap times using wake window analysis. ' +
      'Uses AI-powered insights when available, with fallback to pattern-based prediction.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Sleep prediction with pattern analysis',
    type: SleepPredictionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to this baby',
  })
  @ApiResponse({
    status: 404,
    description: 'Baby not found',
  })
  async getSleepPrediction(
    @Param('babyId') babyId: string,
    @Query() query: SleepPredictionQueryDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<SleepPredictionResponseDto> {
    return this.insightsService.getSleepPrediction(
      babyId,
      user.id,
      query,
    );
  }

  /**
   * Get anomaly detection for unusual patterns in tracking data
   * Validates: Requirements 10.3 - Anomaly detection for unusual patterns
   */
  @Get('anomalies')
  @ApiOperation({
    summary: 'Detect anomalies in tracking data',
    description:
      'Analyzes recent tracking data (default: last 48 hours) to detect unusual patterns in sleep, feeding, and diaper data. ' +
      'Uses AI-powered analysis when available, with fallback to pattern-based detection.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Anomaly detection results with AI analysis',
    type: AnomalyDetectionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to this baby',
  })
  @ApiResponse({
    status: 404,
    description: 'Baby not found',
  })
  async detectAnomalies(
    @Param('babyId') babyId: string,
    @Query() query: AnomalyDetectionQueryDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<AnomalyDetectionResponseDto> {
    return this.insightsService.detectAnomalies(
      babyId,
      user.id,
      query,
    );
  }

  /**
   * Get daily summary with activity breakdown
   * Provides a quick overview of the baby's day
   */
  @Get('daily-summary')
  @ApiOperation({
    summary: 'Get daily summary with activity breakdown',
    description:
      'Aggregates tracking data for a single day including feeding, sleep, diaper, and activity counts. ' +
      'Also provides an hourly breakdown for timeline visualization.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily summary with hourly breakdown',
    type: DailySummaryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to this baby',
  })
  @ApiResponse({
    status: 404,
    description: 'Baby not found',
  })
  async getDailySummary(
    @Param('babyId') babyId: string,
    @Query() query: DailySummaryQueryDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<DailySummaryResponseDto> {
    return this.insightsService.getDailySummary(
      babyId,
      user.id,
      query,
    );
  }

  /**
   * Get daily trend insights with AI-powered analysis
   */
  @Get('trends/daily')
  @ApiOperation({
    summary: 'Get daily trend insights',
    description:
      'Analyzes tracking data for a single day and provides AI-powered insights about patterns, ' +
      'achievements, and areas needing attention. Compares to the previous day when data is available.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily trend insights with AI analysis',
    type: TrendInsightsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async getDailyTrendInsights(
    @Param('babyId') babyId: string,
    @Query() query: TrendInsightsQueryDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<TrendInsightsResponseDto> {
    try {
      return await this.insightsService.getTrendInsights(babyId, user.id, 'daily', query);
    } catch (error) {
      // If there's insufficient data or any error, return an empty insights response
      // This is expected for new users who haven't logged enough data yet
      this.logger.debug(`Unable to generate daily insights for baby ${babyId}: ${(error as Error).message || 'Unknown error'}`);
      
      // Return a minimal valid response instead of throwing an error
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      return {
        babyId,
        babyName: '',
        babyAgeMonths: 0,
        period: 'daily',
        periodStart: startOfDay,
        periodEnd: now,
        periodDays: 1,
        aggregatedData: {
          sleep: { totalSleepMinutes: 0, averageDailySleepMinutes: 0, napCount: 0, averageNapDuration: null, averageNightSleepDuration: null, averageWakeWindow: null, consistencyScore: 0 },
          feeding: { totalFeedings: 0, averageFeedingsPerDay: 0, breastfeedingCount: 0, bottleCount: 0, solidCount: 0, averageBottleAmount: null, totalBottleVolume: 0, consistencyScore: 0 },
          diaper: { totalChanges: 0, averageChangesPerDay: 0, wetCount: 0, dirtyCount: 0, mixedCount: 0, wetToDirtyRatio: null },
          growth: { hasMeasurements: false },
          activity: { totalActivities: 0, tummyTimeMinutes: 0, averageDailyTummyTime: 0, bathCount: 0, outdoorMinutes: 0, playMinutes: 0 },
        },
        insights: [],
        aiSummary: 'Start logging activities to unlock AI-powered insights about your baby\'s patterns and trends.',
        aiSummaryGenerated: false,
        aiError: null,
        aiDurationMs: null,
        highlights: [],
        areasOfConcern: [],
        generatedAt: now,
      };
    }
  }

  /**
   * Get weekly trend insights with AI-powered analysis
   */
  @Get('trends/weekly')
  @ApiOperation({
    summary: 'Get weekly trend insights',
    description:
      'Analyzes tracking data for a week and provides AI-powered insights about sleep patterns, ' +
      'feeding consistency, growth trends, and developmental progress. Compares to the previous week.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly trend insights with AI analysis',
    type: TrendInsightsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async getWeeklyTrendInsights(
    @Param('babyId') babyId: string,
    @Query() query: TrendInsightsQueryDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<TrendInsightsResponseDto> {
    return this.insightsService.getTrendInsights(babyId, user.id, 'weekly', query);
  }

  /**
   * Get monthly trend insights with AI-powered analysis
   */
  @Get('trends/monthly')
  @ApiOperation({
    summary: 'Get monthly trend insights',
    description:
      'Analyzes tracking data for a month and provides comprehensive AI-powered insights about ' +
      'developmental progress, pattern evolution, and growth trajectory. Suitable for pediatrician visits.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly trend insights with AI analysis',
    type: TrendInsightsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async getMonthlyTrendInsights(
    @Param('babyId') babyId: string,
    @Query() query: TrendInsightsQueryDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<TrendInsightsResponseDto> {
    return this.insightsService.getTrendInsights(babyId, user.id, 'monthly', query);
  }

  /**
   * Get yearly trend insights with AI-powered analysis
   */
  @Get('trends/yearly')
  @ApiOperation({
    summary: 'Get yearly trend insights',
    description:
      'Analyzes tracking data for a full year and provides comprehensive AI-powered insights about ' +
      'the baby\'s developmental journey, growth milestones, and long-term patterns. ' +
      'Ideal for annual reviews and celebrating progress.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Yearly trend insights with AI analysis',
    type: TrendInsightsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async getYearlyTrendInsights(
    @Param('babyId') babyId: string,
    @Query() query: TrendInsightsQueryDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<TrendInsightsResponseDto> {
    return this.insightsService.getTrendInsights(babyId, user.id, 'yearly', query);
  }

  /**
   * Configure insight generation cadence
   */
  @Post('config')
  @ApiOperation({
    summary: 'Configure insight generation cadence',
    description:
      'Configure how often AI insights should be automatically generated for this baby. ' +
      'Options include everytime (on-demand only), daily, weekly, or monthly.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Insight configuration updated',
    type: InsightConfigResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async configureInsightCadence(
    @Param('babyId') babyId: string,
    @Body() dto: ConfigureInsightCadenceDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<InsightConfigResponseDto> {
    return this.insightConfigService.configureInsightCadence(babyId, user.id, dto);
  }

  /**
   * Get current insight configuration
   */
  @Get('config')
  @ApiOperation({
    summary: 'Get insight configuration',
    description: 'Get the current insight generation configuration for this baby.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Current insight configuration',
    type: InsightConfigResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getInsightConfig(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<InsightConfigResponseDto> {
    return this.insightConfigService.getInsightConfig(babyId, user.id);
  }

  /**
   * Trigger adhoc insight generation
   */
  @Post('generate')
  @ApiOperation({
    summary: 'Generate adhoc insight',
    description:
      'Manually trigger insight generation for a specific period and type. ' +
      'The generated insight will be stored in history.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Insight generated successfully',
    type: GeneratedInsightResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async generateAdhocInsight(
    @Param('babyId') babyId: string,
    @Body() dto: GenerateAdhocInsightDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<GeneratedInsightResponseDto> {
    return this.insightConfigService.generateAdhocInsight(babyId, user.id, dto);
  }

  /**
   * Get insight generation history
   */
  @Get('history')
  @ApiOperation({
    summary: 'Get insight history',
    description:
      'Get the history of generated insights for this baby. ' +
      'Includes both automatically generated and adhoc insights.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of generated insights',
    type: InsightHistoryListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getInsightHistory(
    @Param('babyId') babyId: string,
    @Query() query: InsightHistoryQueryDto,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<InsightHistoryListResponseDto> {
    return this.insightConfigService.getInsightHistory(babyId, user.id, query);
  }
}
