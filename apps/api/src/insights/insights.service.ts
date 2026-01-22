import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

import {
  WeeklySummaryQueryDto,
  WeeklySummaryResponseDto,
  WeeklyAggregatedDataDto,
  SleepSummaryDto,
  FeedingSummaryDto,
  DiaperSummaryDto,
  GrowthDataDto,
  ActivitiesSummaryDto,
  SleepPredictionQueryDto,
  SleepPredictionResponseDto,
  SleepPatternDataDto,
  SleepSessionDto,
  WakeWindowStatsDto,
  AnomalyDetectionQueryDto,
  AnomalyDetectionResponseDto,
  AnomalyAnalysisDataDto,
  SleepAnomalyDataDto,
  FeedingAnomalyDataDto,
  DiaperAnomalyDataDto,
  DetectedAnomalyDto,
  AnomalySeverity,
  AnomalyCategory,
  DailySummaryQueryDto,
  DailySummaryResponseDto,
  DailyFeedingSummaryDto,
  DailySleepSummaryDto,
  DailyDiaperSummaryDto,
  DailyActivitiesSummaryDto,
  HourlyBreakdownEntryDto,
  TrendPeriod,
  TrendInsightsQueryDto,
  TrendInsightsResponseDto,
} from './dto';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

/**
 * Insights Service
 * Aggregates tracking data and generates AI-powered insights
 * Validates: Requirements 10.5 - Weekly summary generation with AI insights
 * 
 * Now supports multiple AI providers through AiProviderService:
 * - Default: Ollama (local)
 * - User configurable: OpenAI, Anthropic, Gemini, OpenRouter
 */
@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  
  // Cache TTL in seconds for different insight types
  private readonly CACHE_TTL = {
    daily: 15 * 60,    // 15 minutes for daily insights
    weekly: 60 * 60,   // 1 hour for weekly insights
    monthly: 2 * 60 * 60,  // 2 hours for monthly insights
    yearly: 4 * 60 * 60,   // 4 hours for yearly insights
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
    private readonly aiProviderService: AiProviderService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Calculate baby's age in months from date of birth
   */
  private calculateAgeInMonths(dateOfBirth: Date): number {
    const now = new Date();
    const years = now.getFullYear() - dateOfBirth.getFullYear();
    const months = now.getMonth() - dateOfBirth.getMonth();
    const totalMonths = years * 12 + months;
    
    // Adjust if the day of month hasn't been reached yet
    if (now.getDate() < dateOfBirth.getDate()) {
      return Math.max(0, totalMonths - 1);
    }
    return Math.max(0, totalMonths);
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0] ?? '';
  }

  /**
   * Aggregate sleep data for the week
   */
  private async aggregateSleepData(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SleepSummaryDto> {
    const entries = await this.prisma.sleepEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalSleepMinutes = 0;
    let napCount = 0;
    let napMinutes = 0;
    let nightSleepCount = 0;
    let nightSleepMinutes = 0;

    for (const entry of entries) {
      if (entry.duration === null) continue;

      totalSleepMinutes += entry.duration;

      if (entry.sleepType === 'nap') {
        napCount++;
        napMinutes += entry.duration;
      } else if (entry.sleepType === 'night') {
        nightSleepCount++;
        nightSleepMinutes += entry.duration;
      }
    }

    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

    return {
      totalSleepMinutes,
      averageSleepMinutesPerDay: Math.round(totalSleepMinutes / periodDays),
      napCount,
      napMinutes,
      nightSleepMinutes,
      averageNapDuration: napCount > 0 ? Math.round(napMinutes / napCount) : null,
      averageNightSleepDuration: nightSleepCount > 0 ? Math.round(nightSleepMinutes / nightSleepCount) : null,
    };
  }

  /**
   * Aggregate feeding data for the week
   */
  private async aggregateFeedingData(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<FeedingSummaryDto> {
    const entries = await this.prisma.feedingEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let breastfeedingCount = 0;
    let bottleCount = 0;
    let pumpingCount = 0;
    let solidCount = 0;
    let totalBreastfeedingDuration = 0;
    let breastfeedingWithDuration = 0;
    let totalBottleAmount = 0;
    let bottleWithAmount = 0;

    for (const entry of entries) {
      switch (entry.type) {
        case 'breastfeeding': {
          breastfeedingCount++;
          const duration = (entry.leftDuration ?? 0) + (entry.rightDuration ?? 0);
          if (duration > 0) {
            totalBreastfeedingDuration += duration;
            breastfeedingWithDuration++;
          }
          break;
        }
        case 'bottle':
          bottleCount++;
          if (entry.amount !== null && entry.amount > 0) {
            totalBottleAmount += entry.amount;
            bottleWithAmount++;
          }
          break;
        case 'pumping':
          pumpingCount++;
          break;
        case 'solid':
          solidCount++;
          break;
      }
    }

    return {
      totalFeedings: entries.length,
      breastfeedingCount,
      bottleCount,
      pumpingCount,
      solidCount,
      averageBreastfeedingDuration: breastfeedingWithDuration > 0
        ? Math.round(totalBreastfeedingDuration / breastfeedingWithDuration)
        : null,
      averageBottleAmount: bottleWithAmount > 0
        ? Math.round(totalBottleAmount / bottleWithAmount)
        : null,
    };
  }

  /**
   * Aggregate diaper data for the week
   */
  private async aggregateDiaperData(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DiaperSummaryDto> {
    const entries = await this.prisma.diaperEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let wetCount = 0;
    let dirtyCount = 0;
    let mixedCount = 0;

    for (const entry of entries) {
      switch (entry.type) {
        case 'wet':
          wetCount++;
          break;
        case 'dirty':
          dirtyCount++;
          break;
        case 'mixed':
          mixedCount++;
          break;
      }
    }

    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

    return {
      totalChanges: entries.length,
      wetCount,
      dirtyCount,
      mixedCount,
      averageChangesPerDay: Math.round(entries.length / periodDays),
    };
  }

  /**
   * Get growth data for the week
   */
  private async getGrowthData(
    babyId: string,
    _startDate: Date,
    endDate: Date,
  ): Promise<GrowthDataDto> {
    // Get the latest growth entry within the period or before it
    const latestEntry = await this.prisma.growthEntry.findFirst({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestEntry) {
      return {
        hasMeasurements: false,
        latestWeight: null,
        latestHeight: null,
        latestHeadCircumference: null,
        weightPercentile: null,
        heightPercentile: null,
        headPercentile: null,
      };
    }

    return {
      hasMeasurements: true,
      latestWeight: latestEntry.weight,
      latestHeight: latestEntry.height,
      latestHeadCircumference: latestEntry.headCircumference,
      weightPercentile: latestEntry.weightPercentile,
      heightPercentile: latestEntry.heightPercentile,
      headPercentile: latestEntry.headPercentile,
    };
  }

  /**
   * Aggregate activities data for the week
   */
  private async aggregateActivitiesData(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ActivitiesSummaryDto> {
    const entries = await this.prisma.activityEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let tummyTimeMinutes = 0;
    let bathCount = 0;
    let outdoorMinutes = 0;
    let playMinutes = 0;

    for (const entry of entries) {
      const duration = entry.duration ?? 0;
      
      // Handle both snake_case and camelCase activity types
      const activityType = entry.activityType.toLowerCase().replace('_', '');
      
      switch (activityType) {
        case 'tummytime':
          tummyTimeMinutes += duration;
          break;
        case 'bath':
          bathCount++;
          break;
        case 'outdoor':
          outdoorMinutes += duration;
          break;
        case 'play':
          playMinutes += duration;
          break;
      }
    }

    return {
      totalActivities: entries.length,
      tummyTimeMinutes,
      bathCount,
      outdoorMinutes,
      playMinutes,
    };
  }

  /**
   * Format sleep summary for AI prompt
   */
  private formatSleepSummaryForPrompt(summary: SleepSummaryDto): string {
    const lines = [
      `- Total sleep: ${Math.round(summary.totalSleepMinutes / 60)} hours ${summary.totalSleepMinutes % 60} minutes`,
      `- Average per day: ${Math.round(summary.averageSleepMinutesPerDay / 60)} hours ${summary.averageSleepMinutesPerDay % 60} minutes`,
      `- Naps: ${summary.napCount} naps, total ${Math.round(summary.napMinutes / 60)} hours ${summary.napMinutes % 60} minutes`,
      `- Night sleep: ${Math.round(summary.nightSleepMinutes / 60)} hours ${summary.nightSleepMinutes % 60} minutes`,
    ];

    if (summary.averageNapDuration !== null) {
      lines.push(`- Average nap duration: ${summary.averageNapDuration} minutes`);
    }
    if (summary.averageNightSleepDuration !== null) {
      lines.push(`- Average night sleep: ${Math.round(summary.averageNightSleepDuration / 60)} hours ${summary.averageNightSleepDuration % 60} minutes`);
    }

    return lines.join('\n');
  }

  /**
   * Format feeding summary for AI prompt
   */
  private formatFeedingSummaryForPrompt(summary: FeedingSummaryDto): string {
    const lines = [
      `- Total feedings: ${summary.totalFeedings}`,
      `- Breastfeeding: ${summary.breastfeedingCount} sessions`,
      `- Bottle: ${summary.bottleCount} feedings`,
      `- Pumping: ${summary.pumpingCount} sessions`,
      `- Solid food: ${summary.solidCount} meals`,
    ];

    if (summary.averageBreastfeedingDuration !== null) {
      lines.push(`- Average breastfeeding duration: ${Math.round(summary.averageBreastfeedingDuration / 60)} minutes`);
    }
    if (summary.averageBottleAmount !== null) {
      lines.push(`- Average bottle amount: ${summary.averageBottleAmount} ml`);
    }

    return lines.join('\n');
  }

  /**
   * Format diaper summary for AI prompt
   */
  private formatDiaperSummaryForPrompt(summary: DiaperSummaryDto): string {
    return [
      `- Total changes: ${summary.totalChanges}`,
      `- Wet: ${summary.wetCount}`,
      `- Dirty: ${summary.dirtyCount}`,
      `- Mixed: ${summary.mixedCount}`,
      `- Average per day: ${summary.averageChangesPerDay}`,
    ].join('\n');
  }

  /**
   * Format growth data for AI prompt
   */
  private formatGrowthDataForPrompt(data: GrowthDataDto): string {
    if (!data.hasMeasurements) {
      return 'No growth measurements recorded';
    }

    const lines: string[] = [];

    if (data.latestWeight !== null) {
      const weightKg = (data.latestWeight / 1000).toFixed(2);
      lines.push(`- Weight: ${weightKg} kg (${data.weightPercentile ?? 'N/A'}th percentile)`);
    }
    if (data.latestHeight !== null) {
      const heightCm = (data.latestHeight / 10).toFixed(1);
      lines.push(`- Height: ${heightCm} cm (${data.heightPercentile ?? 'N/A'}th percentile)`);
    }
    if (data.latestHeadCircumference !== null) {
      const headCm = (data.latestHeadCircumference / 10).toFixed(1);
      lines.push(`- Head circumference: ${headCm} cm (${data.headPercentile ?? 'N/A'}th percentile)`);
    }

    return lines.length > 0 ? lines.join('\n') : 'No measurements available';
  }

  /**
   * Format activities summary for AI prompt
   */
  private formatActivitiesSummaryForPrompt(summary: ActivitiesSummaryDto): string {
    return [
      `- Total activities: ${summary.totalActivities}`,
      `- Tummy time: ${summary.tummyTimeMinutes} minutes`,
      `- Baths: ${summary.bathCount}`,
      `- Outdoor time: ${summary.outdoorMinutes} minutes`,
      `- Play time: ${summary.playMinutes} minutes`,
    ].join('\n');
  }

  /**
   * Aggregate all weekly data for a baby
   * Property 28: Weekly Summary Aggregation
   */
  async aggregateWeeklyData(
    babyId: string,
    caregiverId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyAggregatedDataDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby details
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { id: true, name: true, dateOfBirth: true, gender: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    // Aggregate all data in parallel
    const [sleepSummary, feedingSummary, diaperSummary, growthData, activitiesSummary] =
      await Promise.all([
        this.aggregateSleepData(babyId, startDate, endDate),
        this.aggregateFeedingData(babyId, startDate, endDate),
        this.aggregateDiaperData(babyId, startDate, endDate),
        this.getGrowthData(babyId, startDate, endDate),
        this.aggregateActivitiesData(babyId, startDate, endDate),
      ]);

    return {
      babyId: baby.id,
      babyName: baby.name,
      babyAgeMonths: this.calculateAgeInMonths(baby.dateOfBirth),
      weekStart: startDate,
      weekEnd: endDate,
      sleepSummary,
      feedingSummary,
      diaperSummary,
      growthData,
      activitiesSummary,
    };
  }

  /**
   * Generate weekly summary with AI insights
   * Validates: Requirements 10.5 - Weekly summary generation with AI insights
   */
  async getWeeklySummary(
    babyId: string,
    caregiverId: string,
    query: WeeklySummaryQueryDto,
  ): Promise<WeeklySummaryResponseDto> {
    // Determine date range (default to last 7 days)
    const now = new Date();
    const endDate = query.endDate ? new Date(query.endDate) : now;
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Set time to start/end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Aggregate weekly data
    const aggregatedData = await this.aggregateWeeklyData(
      babyId,
      caregiverId,
      startDate,
      endDate,
    );

    // Generate AI summary using configured provider (with Ollama fallback)
    let aiSummary = '';
    let aiSummaryGenerated = false;
    let aiError: string | null = null;
    let aiDurationMs: number | null = null;

    try {
      const result = await this.aiProviderService.generateWeeklySummary({
        babyName: aggregatedData.babyName,
        babyAgeMonths: aggregatedData.babyAgeMonths,
        weekStart: this.formatDate(startDate),
        weekEnd: this.formatDate(endDate),
        sleepSummary: this.formatSleepSummaryForPrompt(aggregatedData.sleepSummary),
        feedingSummary: this.formatFeedingSummaryForPrompt(aggregatedData.feedingSummary),
        diaperSummary: this.formatDiaperSummaryForPrompt(aggregatedData.diaperSummary),
        growthData: this.formatGrowthDataForPrompt(aggregatedData.growthData),
        activitiesSummary: this.formatActivitiesSummaryForPrompt(aggregatedData.activitiesSummary),
      }, caregiverId);

      if (result.success && result.response) {
        aiSummary = result.response;
        aiSummaryGenerated = true;
        aiDurationMs = result.duration ?? null;
      } else {
        aiError = result.error ?? 'Unknown error generating AI summary';
        aiSummary = this.generateFallbackSummary(aggregatedData);
      }
    } catch (error) {
      aiError = error instanceof Error ? error.message : 'Unknown error';
      aiSummary = this.generateFallbackSummary(aggregatedData);
    }

    return {
      babyId,
      babyName: aggregatedData.babyName,
      weekStart: startDate,
      weekEnd: endDate,
      aggregatedData,
      aiSummary,
      aiSummaryGenerated,
      aiError,
      aiDurationMs,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate a fallback summary when AI is unavailable
   */
  private generateFallbackSummary(data: WeeklyAggregatedDataDto): string {
    const lines: string[] = [
      `Weekly Summary for ${data.babyName}`,
      `Week: ${this.formatDate(data.weekStart)} to ${this.formatDate(data.weekEnd)}`,
      '',
      '📊 Sleep:',
      `- Total: ${Math.round(data.sleepSummary.totalSleepMinutes / 60)} hours`,
      `- ${data.sleepSummary.napCount} naps`,
      '',
      '🍼 Feeding:',
      `- ${data.feedingSummary.totalFeedings} total feedings`,
      `- ${data.feedingSummary.breastfeedingCount} breastfeeding, ${data.feedingSummary.bottleCount} bottle`,
      '',
      '👶 Diapers:',
      `- ${data.diaperSummary.totalChanges} changes`,
      `- ${data.diaperSummary.wetCount} wet, ${data.diaperSummary.dirtyCount} dirty`,
      '',
      '🎯 Activities:',
      `- ${data.activitiesSummary.totalActivities} activities`,
      `- ${data.activitiesSummary.tummyTimeMinutes} min tummy time`,
    ];

    if (data.growthData.hasMeasurements) {
      lines.push('', '📈 Growth:');
      if (data.growthData.latestWeight !== null) {
        lines.push(`- Weight: ${(data.growthData.latestWeight / 1000).toFixed(2)} kg`);
      }
    }

    lines.push('', '(AI insights unavailable - showing data summary)');

    return lines.join('\n');
  }

  /**
   * Format wake window duration as hours and minutes
   */
  private formatWakeWindow(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) {
      return `${mins}m`;
    }
    return `${hours}h ${mins}m`;
  }

  /**
   * Get recommended wake window based on baby's age in months
   * Based on typical developmental guidelines
   */
  private getRecommendedWakeWindow(ageMonths: number): number {
    // Wake window recommendations by age (in minutes)
    if (ageMonths < 1) {
      return 45; // Newborn: 45 min - 1 hour
    } else if (ageMonths < 2) {
      return 60; // 1 month: 1 hour
    } else if (ageMonths < 3) {
      return 75; // 2 months: 1-1.5 hours
    } else if (ageMonths < 4) {
      return 90; // 3 months: 1.5 hours
    } else if (ageMonths < 5) {
      return 105; // 4 months: 1.5-2 hours
    } else if (ageMonths < 6) {
      return 120; // 5 months: 2 hours
    } else if (ageMonths < 7) {
      return 135; // 6 months: 2-2.5 hours
    } else if (ageMonths < 8) {
      return 150; // 7 months: 2.5 hours
    } else if (ageMonths < 9) {
      return 165; // 8 months: 2.5-3 hours
    } else if (ageMonths < 10) {
      return 180; // 9 months: 3 hours
    } else if (ageMonths < 12) {
      return 195; // 10-11 months: 3-3.5 hours
    } else if (ageMonths < 15) {
      return 210; // 12-14 months: 3.5 hours
    } else if (ageMonths < 18) {
      return 240; // 15-17 months: 4 hours
    } else if (ageMonths < 24) {
      return 300; // 18-23 months: 5 hours
    } else {
      return 360; // 24+ months: 5-6 hours
    }
  }

  /**
   * Aggregate sleep data for pattern analysis
   */
  private async aggregateSleepPatternData(
    babyId: string,
    caregiverId: string,
    analysisDays: number,
  ): Promise<SleepPatternDataDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby details
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { id: true, name: true, dateOfBirth: true, gender: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    const now = new Date();
    const analysisEndDate = now;
    const analysisStartDate = new Date(now.getTime() - analysisDays * 24 * 60 * 60 * 1000);

    // Get all completed sleep entries in the analysis period
    const entries = await this.prisma.sleepEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        startTime: {
          gte: analysisStartDate,
          lte: analysisEndDate,
        },
        endTime: { not: null },
        duration: { not: null },
      },
      orderBy: { startTime: 'asc' },
    });

    // Calculate wake windows between sleep sessions
    const sessionsWithWakeWindows: SleepSessionDto[] = [];
    const wakeWindows: number[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;
      
      let wakeWindowBefore: number | null = null;

      if (i > 0) {
        const prevEntry = entries[i - 1];
        if (prevEntry?.endTime && entry.startTime) {
          // Wake window = time between previous sleep end and current sleep start
          const wakeWindowMs = entry.startTime.getTime() - prevEntry.endTime.getTime();
          wakeWindowBefore = Math.round(wakeWindowMs / (1000 * 60));
          
          // Only count reasonable wake windows (between 15 min and 12 hours)
          if (wakeWindowBefore >= 15 && wakeWindowBefore <= 720) {
            wakeWindows.push(wakeWindowBefore);
          }
        }
      }

      sessionsWithWakeWindows.push({
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration,
        sleepType: entry.sleepType,
        wakeWindowBefore,
      });
    }

    // Calculate statistics
    let napCount = 0;
    let nightSleepCount = 0;
    let totalNapDuration = 0;
    let totalNightDuration = 0;

    for (const entry of entries) {
      if (entry.sleepType === 'nap') {
        napCount++;
        totalNapDuration += entry.duration ?? 0;
      } else if (entry.sleepType === 'night') {
        nightSleepCount++;
        totalNightDuration += entry.duration ?? 0;
      }
    }

    // Calculate wake window statistics
    let wakeWindowStats: WakeWindowStatsDto;
    if (wakeWindows.length > 0) {
      const avgWakeWindow = Math.round(wakeWindows.reduce((a, b) => a + b, 0) / wakeWindows.length);
      wakeWindowStats = {
        averageMinutes: avgWakeWindow,
        minMinutes: Math.min(...wakeWindows),
        maxMinutes: Math.max(...wakeWindows),
        count: wakeWindows.length,
        averageFormatted: this.formatWakeWindow(avgWakeWindow),
      };
    } else {
      // No wake window data - use age-based recommendation
      const recommendedWakeWindow = this.getRecommendedWakeWindow(this.calculateAgeInMonths(baby.dateOfBirth));
      wakeWindowStats = {
        averageMinutes: recommendedWakeWindow,
        minMinutes: recommendedWakeWindow,
        maxMinutes: recommendedWakeWindow,
        count: 0,
        averageFormatted: this.formatWakeWindow(recommendedWakeWindow),
      };
    }

    // Get current wake window
    const lastCompletedSleep = await this.prisma.sleepEntry.findFirst({
      where: {
        babyId,
        isDeleted: false,
        endTime: { not: null },
      },
      orderBy: { endTime: 'desc' },
    });

    let currentWakeWindowMinutes = 0;
    let lastWakeTime: Date | null = null;

    if (lastCompletedSleep?.endTime) {
      lastWakeTime = lastCompletedSleep.endTime;
      const wakeWindowMs = now.getTime() - lastCompletedSleep.endTime.getTime();
      currentWakeWindowMinutes = Math.max(0, Math.round(wakeWindowMs / (1000 * 60)));
    }

    return {
      babyId: baby.id,
      babyName: baby.name,
      babyAgeMonths: this.calculateAgeInMonths(baby.dateOfBirth),
      analysisStartDate,
      analysisEndDate,
      analysisDays,
      totalSessions: entries.length,
      napCount,
      nightSleepCount,
      averageNapDuration: napCount > 0 ? Math.round(totalNapDuration / napCount) : null,
      averageNightSleepDuration: nightSleepCount > 0 ? Math.round(totalNightDuration / nightSleepCount) : null,
      wakeWindowStats,
      recentSessions: sessionsWithWakeWindows.slice(-10), // Last 10 sessions
      currentWakeWindowMinutes,
      currentWakeWindowFormatted: this.formatWakeWindow(currentWakeWindowMinutes),
      lastWakeTime,
    };
  }

  /**
   * Format sleep pattern data for AI prompt
   */
  private formatSleepPatternDataForPrompt(data: SleepPatternDataDto): string {
    const lines: string[] = [
      `Analysis Period: ${this.formatDate(data.analysisStartDate)} to ${this.formatDate(data.analysisEndDate)} (${data.analysisDays} days)`,
      '',
      'Sleep Statistics:',
      `- Total sessions: ${data.totalSessions}`,
      `- Naps: ${data.napCount}`,
      `- Night sleep sessions: ${data.nightSleepCount}`,
    ];

    if (data.averageNapDuration !== null) {
      lines.push(`- Average nap duration: ${data.averageNapDuration} minutes`);
    }
    if (data.averageNightSleepDuration !== null) {
      const hours = Math.floor(data.averageNightSleepDuration / 60);
      const mins = data.averageNightSleepDuration % 60;
      lines.push(`- Average night sleep: ${hours}h ${mins}m`);
    }

    lines.push('');
    lines.push('Wake Window Analysis:');
    lines.push(`- Average wake window: ${data.wakeWindowStats.averageFormatted}`);
    lines.push(`- Range: ${this.formatWakeWindow(data.wakeWindowStats.minMinutes)} to ${this.formatWakeWindow(data.wakeWindowStats.maxMinutes)}`);
    lines.push(`- Data points: ${data.wakeWindowStats.count}`);

    lines.push('');
    lines.push('Current Status:');
    lines.push(`- Current wake window: ${data.currentWakeWindowFormatted}`);
    if (data.lastWakeTime) {
      lines.push(`- Last woke up: ${data.lastWakeTime.toISOString()}`);
    }

    if (data.recentSessions.length > 0) {
      lines.push('');
      lines.push('Recent Sleep Sessions:');
      for (const session of data.recentSessions.slice(-5)) {
        const startStr = session.startTime.toISOString().split('T')[1]?.substring(0, 5) ?? '';
        const endStr = session.endTime?.toISOString().split('T')[1]?.substring(0, 5) ?? 'ongoing';
        const wakeStr = session.wakeWindowBefore !== null ? ` (wake window: ${session.wakeWindowBefore}m)` : '';
        lines.push(`- ${session.sleepType}: ${startStr}-${endStr}, ${session.duration ?? 0}min${wakeStr}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate fallback sleep prediction when AI is unavailable
   */
  private generateFallbackSleepPrediction(data: SleepPatternDataDto): {
    predictedNapTime: Date;
    confidence: number;
    reasoning: string;
    recommendedWakeWindowMinutes: number;
  } {
    const now = new Date();
    
    // Use observed average wake window if available, otherwise use age-based recommendation
    const recommendedWakeWindowMinutes = data.wakeWindowStats.count > 0
      ? data.wakeWindowStats.averageMinutes
      : this.getRecommendedWakeWindow(data.babyAgeMonths);

    // Calculate predicted nap time based on last wake time
    let predictedNapTime: Date;
    if (data.lastWakeTime) {
      predictedNapTime = new Date(data.lastWakeTime.getTime() + recommendedWakeWindowMinutes * 60 * 1000);
    } else {
      // No sleep history - suggest nap in recommended wake window from now
      predictedNapTime = new Date(now.getTime() + recommendedWakeWindowMinutes * 60 * 1000);
    }

    // Calculate confidence based on data availability
    let confidence = 0.5; // Base confidence
    if (data.wakeWindowStats.count >= 5) {
      confidence += 0.2; // More data = higher confidence
    }
    if (data.wakeWindowStats.count >= 10) {
      confidence += 0.1;
    }
    // Lower confidence if wake window range is very wide (inconsistent patterns)
    const wakeWindowRange = data.wakeWindowStats.maxMinutes - data.wakeWindowStats.minMinutes;
    if (wakeWindowRange > 60) {
      confidence -= 0.1;
    }
    confidence = Math.max(0.3, Math.min(0.9, confidence));

    // Generate reasoning
    const reasoning = this.generateFallbackReasoning(data, recommendedWakeWindowMinutes);

    return {
      predictedNapTime,
      confidence,
      reasoning,
      recommendedWakeWindowMinutes,
    };
  }

  /**
   * Generate fallback reasoning text
   */
  private generateFallbackReasoning(data: SleepPatternDataDto, recommendedWakeWindow: number): string {
    const lines: string[] = [];

    if (data.wakeWindowStats.count > 0) {
      lines.push(`Based on ${data.wakeWindowStats.count} observed wake windows over the past ${data.analysisDays} days, ${data.babyName}'s average wake window is ${data.wakeWindowStats.averageFormatted}.`);
    } else {
      lines.push(`Based on typical wake windows for a ${data.babyAgeMonths}-month-old baby, the recommended wake window is ${this.formatWakeWindow(recommendedWakeWindow)}.`);
    }

    lines.push('');
    lines.push(`Current wake window: ${data.currentWakeWindowFormatted}`);

    if (data.currentWakeWindowMinutes >= recommendedWakeWindow) {
      lines.push('');
      lines.push('⚠️ Baby may be ready for a nap now or showing signs of tiredness.');
    } else {
      const minutesUntilNap = recommendedWakeWindow - data.currentWakeWindowMinutes;
      lines.push('');
      lines.push(`Estimated time until next nap: ${this.formatWakeWindow(minutesUntilNap)}`);
    }

    lines.push('');
    lines.push('(AI analysis unavailable - using pattern-based prediction)');

    return lines.join('\n');
  }

  /**
   * Get sleep prediction with AI-powered analysis
   * Validates: Requirements 10.1 - Sleep prediction based on pattern analysis
   */
  async getSleepPrediction(
    babyId: string,
    caregiverId: string,
    query: SleepPredictionQueryDto,
  ): Promise<SleepPredictionResponseDto> {
    const analysisDays = query.analysisDays ?? 7;

    // Aggregate sleep pattern data
    const patternData = await this.aggregateSleepPatternData(
      babyId,
      caregiverId,
      analysisDays,
    );

    const now = new Date();

    // Try to get AI-powered analysis using configured provider
    let aiAnalysisGenerated = false;
    let aiError: string | null = null;
    let aiDurationMs: number | null = null;
    let predictedNapTime: Date;
    let confidence: number;
    let reasoning: string;
    let recommendedWakeWindowMinutes: number;

    try {
      const sleepDataForPrompt = this.formatSleepPatternDataForPrompt(patternData);
      
      const result = await this.aiProviderService.analyzeSleepPatterns(
        patternData.babyAgeMonths,
        sleepDataForPrompt,
        caregiverId,
      );

      if (result.success && result.response) {
        aiAnalysisGenerated = true;
        aiDurationMs = result.duration ?? null;
        reasoning = result.response;

        // Parse AI response to extract prediction details
        // For now, use pattern-based calculation for the actual prediction
        // and use AI response for reasoning/insights
        const fallback = this.generateFallbackSleepPrediction(patternData);
        predictedNapTime = fallback.predictedNapTime;
        confidence = fallback.confidence + 0.1; // Slightly higher confidence with AI
        recommendedWakeWindowMinutes = fallback.recommendedWakeWindowMinutes;
      } else {
        aiError = result.error ?? 'Unknown error generating AI analysis';
        const fallback = this.generateFallbackSleepPrediction(patternData);
        predictedNapTime = fallback.predictedNapTime;
        confidence = fallback.confidence;
        reasoning = fallback.reasoning;
        recommendedWakeWindowMinutes = fallback.recommendedWakeWindowMinutes;
      }
    } catch (error) {
      aiError = error instanceof Error ? error.message : 'Unknown error';
      const fallback = this.generateFallbackSleepPrediction(patternData);
      predictedNapTime = fallback.predictedNapTime;
      confidence = fallback.confidence;
      reasoning = fallback.reasoning;
      recommendedWakeWindowMinutes = fallback.recommendedWakeWindowMinutes;
    }

    // Calculate minutes until predicted nap
    const minutesUntilNap = Math.round((predictedNapTime.getTime() - now.getTime()) / (1000 * 60));

    return {
      babyId,
      babyName: patternData.babyName,
      predictedNapTime,
      confidence: Math.min(1, Math.max(0, confidence)),
      recommendedWakeWindowMinutes,
      recommendedWakeWindowFormatted: this.formatWakeWindow(recommendedWakeWindowMinutes),
      currentWakeWindowMinutes: patternData.currentWakeWindowMinutes,
      currentWakeWindowFormatted: patternData.currentWakeWindowFormatted,
      minutesUntilNap,
      reasoning,
      patternData,
      aiAnalysisGenerated,
      aiError,
      aiDurationMs,
      generatedAt: now,
    };
  }

  /**
   * Get expected daily sleep minutes based on baby's age
   * Based on typical developmental guidelines
   */
  private getExpectedDailySleepMinutes(ageMonths: number): number {
    if (ageMonths < 1) {
      return 16 * 60; // Newborn: 14-17 hours
    } else if (ageMonths < 4) {
      return 15 * 60; // 1-3 months: 14-16 hours
    } else if (ageMonths < 12) {
      return 14 * 60; // 4-11 months: 12-15 hours
    } else if (ageMonths < 24) {
      return 13 * 60; // 1-2 years: 11-14 hours
    } else {
      return 12 * 60; // 2+ years: 10-13 hours
    }
  }

  /**
   * Get expected feedings per day based on baby's age
   */
  private getExpectedFeedingsPerDay(ageMonths: number): number {
    if (ageMonths < 1) {
      return 10; // Newborn: 8-12 feedings
    } else if (ageMonths < 3) {
      return 8; // 1-2 months: 7-9 feedings
    } else if (ageMonths < 6) {
      return 6; // 3-5 months: 5-7 feedings
    } else if (ageMonths < 9) {
      return 5; // 6-8 months: 4-6 feedings + solids
    } else if (ageMonths < 12) {
      return 4; // 9-11 months: 3-5 feedings + solids
    } else {
      return 3; // 12+ months: 3-4 feedings + meals
    }
  }

  /**
   * Get expected wet diapers per day based on baby's age
   */
  private getExpectedWetDiapersPerDay(ageMonths: number): number {
    if (ageMonths < 1) {
      return 6; // Newborn: 6+ wet diapers
    } else if (ageMonths < 6) {
      return 6; // 1-5 months: 6+ wet diapers
    } else {
      return 5; // 6+ months: 4-6 wet diapers
    }
  }

  /**
   * Aggregate sleep data for anomaly analysis
   */
  private async aggregateSleepAnomalyData(
    babyId: string,
    startDate: Date,
    endDate: Date,
    ageMonths: number,
  ): Promise<SleepAnomalyDataDto> {
    const entries = await this.prisma.sleepEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    let totalSleepMinutes = 0;
    let longestWakeWindow = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry?.duration) {
        totalSleepMinutes += entry.duration;
      }

      // Calculate wake window between sessions
      if (i > 0) {
        const prevEntry = entries[i - 1];
        if (prevEntry?.endTime && entry?.startTime) {
          const wakeWindowMs = entry.startTime.getTime() - prevEntry.endTime.getTime();
          const wakeWindowMinutes = Math.round(wakeWindowMs / (1000 * 60));
          if (wakeWindowMinutes > longestWakeWindow && wakeWindowMinutes < 24 * 60) {
            longestWakeWindow = wakeWindowMinutes;
          }
        }
      }
    }

    const periodHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const periodDays = periodHours / 24;
    const expectedDailySleepMinutes = this.getExpectedDailySleepMinutes(ageMonths);

    return {
      totalSleepMinutes,
      sessionCount: entries.length,
      averageSessionDuration: entries.length > 0 ? Math.round(totalSleepMinutes / entries.length) : 0,
      longestWakeWindow,
      expectedDailySleepMinutes,
      actualDailySleepMinutes: Math.round(totalSleepMinutes / periodDays),
    };
  }

  /**
   * Aggregate feeding data for anomaly analysis
   */
  private async aggregateFeedingAnomalyData(
    babyId: string,
    startDate: Date,
    endDate: Date,
    ageMonths: number,
  ): Promise<FeedingAnomalyDataDto> {
    const entries = await this.prisma.feedingEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    let longestFeedingGap = 0;

    for (let i = 1; i < entries.length; i++) {
      const prevEntry = entries[i - 1];
      const entry = entries[i];
      if (prevEntry?.timestamp && entry?.timestamp) {
        const gapMs = entry.timestamp.getTime() - prevEntry.timestamp.getTime();
        const gapMinutes = Math.round(gapMs / (1000 * 60));
        if (gapMinutes > longestFeedingGap && gapMinutes < 24 * 60) {
          longestFeedingGap = gapMinutes;
        }
      }
    }

    const periodHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const periodDays = periodHours / 24;

    return {
      totalFeedings: entries.length,
      averageFeedingsPerDay: Math.round((entries.length / periodDays) * 10) / 10,
      longestFeedingGap,
      expectedFeedingsPerDay: this.getExpectedFeedingsPerDay(ageMonths),
    };
  }

  /**
   * Aggregate diaper data for anomaly analysis
   */
  private async aggregateDiaperAnomalyData(
    babyId: string,
    startDate: Date,
    endDate: Date,
    ageMonths: number,
  ): Promise<DiaperAnomalyDataDto> {
    const entries = await this.prisma.diaperEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let wetCount = 0;
    let dirtyCount = 0;

    for (const entry of entries) {
      if (entry.type === 'wet') {
        wetCount++;
      } else if (entry.type === 'dirty') {
        dirtyCount++;
      } else if (entry.type === 'mixed') {
        wetCount++;
        dirtyCount++;
      }
    }

    const periodHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const periodDays = periodHours / 24;

    return {
      totalChanges: entries.length,
      wetCount,
      dirtyCount,
      averageChangesPerDay: Math.round((entries.length / periodDays) * 10) / 10,
      expectedWetPerDay: this.getExpectedWetDiapersPerDay(ageMonths),
    };
  }

  /**
   * Detect anomalies based on aggregated data
   */
  private detectAnomaliesFromData(
    analysisData: AnomalyAnalysisDataDto,
  ): DetectedAnomalyDto[] {
    const anomalies: DetectedAnomalyDto[] = [];
    const { sleepData, feedingData, diaperData, babyAgeMonths } = analysisData;
    const periodDays = analysisData.analysisHours / 24;

    // Sleep anomalies
    const sleepDeficitPercent = ((sleepData.expectedDailySleepMinutes - sleepData.actualDailySleepMinutes) / sleepData.expectedDailySleepMinutes) * 100;
    
    if (sleepDeficitPercent > 30) {
      anomalies.push({
        category: 'sleep' as AnomalyCategory,
        severity: 'high' as AnomalySeverity,
        title: 'Significant sleep deficit',
        description: `Baby is sleeping significantly less than expected for their age.`,
        observedValue: `${Math.round(sleepData.actualDailySleepMinutes / 60)} hours/day`,
        expectedValue: `${Math.round(sleepData.expectedDailySleepMinutes / 60)} hours/day`,
        recommendation: 'Consider reviewing sleep environment and routine. If this persists, consult with your pediatrician.',
      });
    } else if (sleepDeficitPercent > 15) {
      anomalies.push({
        category: 'sleep' as AnomalyCategory,
        severity: 'medium' as AnomalySeverity,
        title: 'Below average sleep',
        description: `Baby is sleeping less than typical for their age.`,
        observedValue: `${Math.round(sleepData.actualDailySleepMinutes / 60)} hours/day`,
        expectedValue: `${Math.round(sleepData.expectedDailySleepMinutes / 60)} hours/day`,
        recommendation: 'Monitor sleep patterns and ensure consistent bedtime routine.',
      });
    }

    // Check for very long wake windows
    const maxRecommendedWakeWindow = this.getRecommendedWakeWindow(babyAgeMonths) * 1.5;
    if (sleepData.longestWakeWindow > maxRecommendedWakeWindow) {
      anomalies.push({
        category: 'sleep' as AnomalyCategory,
        severity: sleepData.longestWakeWindow > maxRecommendedWakeWindow * 1.5 ? 'high' as AnomalySeverity : 'medium' as AnomalySeverity,
        title: 'Extended wake window detected',
        description: `Baby had an unusually long period of wakefulness.`,
        observedValue: `${this.formatWakeWindow(sleepData.longestWakeWindow)}`,
        expectedValue: `Max ${this.formatWakeWindow(Math.round(maxRecommendedWakeWindow))}`,
        recommendation: 'Watch for overtiredness signs. Extended wake windows can lead to difficulty falling asleep.',
      });
    }

    // Feeding anomalies
    const feedingDeficitPercent = ((feedingData.expectedFeedingsPerDay - feedingData.averageFeedingsPerDay) / feedingData.expectedFeedingsPerDay) * 100;
    
    if (feedingDeficitPercent > 40) {
      anomalies.push({
        category: 'feeding' as AnomalyCategory,
        severity: 'high' as AnomalySeverity,
        title: 'Significantly fewer feedings',
        description: `Baby is feeding much less frequently than expected for their age.`,
        observedValue: `${feedingData.averageFeedingsPerDay} feedings/day`,
        expectedValue: `${feedingData.expectedFeedingsPerDay} feedings/day`,
        recommendation: 'Monitor for signs of adequate nutrition. Consult pediatrician if baby seems lethargic or is not gaining weight.',
      });
    } else if (feedingDeficitPercent > 25) {
      anomalies.push({
        category: 'feeding' as AnomalyCategory,
        severity: 'medium' as AnomalySeverity,
        title: 'Fewer feedings than typical',
        description: `Baby is feeding less frequently than typical for their age.`,
        observedValue: `${feedingData.averageFeedingsPerDay} feedings/day`,
        expectedValue: `${feedingData.expectedFeedingsPerDay} feedings/day`,
        recommendation: 'Ensure baby is showing hunger cues and feeding well during each session.',
      });
    }

    // Check for long feeding gaps (more than 6 hours for babies under 6 months)
    const maxFeedingGap = babyAgeMonths < 6 ? 6 * 60 : 8 * 60; // 6 hours for young babies, 8 for older
    if (feedingData.longestFeedingGap > maxFeedingGap) {
      anomalies.push({
        category: 'feeding' as AnomalyCategory,
        severity: babyAgeMonths < 3 ? 'high' as AnomalySeverity : 'medium' as AnomalySeverity,
        title: 'Long gap between feedings',
        description: `There was an unusually long period between feedings.`,
        observedValue: `${Math.round(feedingData.longestFeedingGap / 60)} hours`,
        expectedValue: `Max ${Math.round(maxFeedingGap / 60)} hours`,
        recommendation: babyAgeMonths < 3 
          ? 'Young babies typically need to feed every 2-3 hours. Consult pediatrician if baby is difficult to wake for feedings.'
          : 'Monitor to ensure baby is getting adequate nutrition throughout the day.',
      });
    }

    // Diaper anomalies
    const wetPerDay = diaperData.wetCount / periodDays;
    if (wetPerDay < diaperData.expectedWetPerDay * 0.5) {
      anomalies.push({
        category: 'diaper' as AnomalyCategory,
        severity: 'high' as AnomalySeverity,
        title: 'Low wet diaper count',
        description: `Baby has significantly fewer wet diapers than expected, which may indicate dehydration.`,
        observedValue: `${Math.round(wetPerDay * 10) / 10} wet diapers/day`,
        expectedValue: `${diaperData.expectedWetPerDay}+ wet diapers/day`,
        recommendation: 'This may indicate dehydration. Ensure adequate feeding and consult pediatrician promptly.',
      });
    } else if (wetPerDay < diaperData.expectedWetPerDay * 0.7) {
      anomalies.push({
        category: 'diaper' as AnomalyCategory,
        severity: 'medium' as AnomalySeverity,
        title: 'Below average wet diapers',
        description: `Baby has fewer wet diapers than typical.`,
        observedValue: `${Math.round(wetPerDay * 10) / 10} wet diapers/day`,
        expectedValue: `${diaperData.expectedWetPerDay}+ wet diapers/day`,
        recommendation: 'Monitor hydration and ensure baby is feeding adequately.',
      });
    }

    // Check for no dirty diapers in extended period (concerning for young babies)
    if (babyAgeMonths < 2 && diaperData.dirtyCount === 0 && periodDays >= 1) {
      anomalies.push({
        category: 'diaper' as AnomalyCategory,
        severity: 'low' as AnomalySeverity,
        title: 'No dirty diapers recorded',
        description: `No dirty diapers recorded in the analysis period.`,
        observedValue: '0 dirty diapers',
        expectedValue: 'At least 1-2 per day for newborns',
        recommendation: 'While some variation is normal, monitor for signs of constipation or discomfort.',
      });
    }

    return anomalies;
  }

  /**
   * Format sleep data for AI prompt
   */
  private formatSleepAnomalyDataForPrompt(data: SleepAnomalyDataDto): string {
    return [
      `- Total sleep: ${Math.round(data.totalSleepMinutes / 60)} hours`,
      `- Sessions: ${data.sessionCount}`,
      `- Average session: ${data.averageSessionDuration} minutes`,
      `- Longest wake window: ${this.formatWakeWindow(data.longestWakeWindow)}`,
      `- Daily average: ${Math.round(data.actualDailySleepMinutes / 60)} hours (expected: ${Math.round(data.expectedDailySleepMinutes / 60)} hours)`,
    ].join('\n');
  }

  /**
   * Format feeding data for AI prompt
   */
  private formatFeedingAnomalyDataForPrompt(data: FeedingAnomalyDataDto): string {
    return [
      `- Total feedings: ${data.totalFeedings}`,
      `- Average per day: ${data.averageFeedingsPerDay} (expected: ${data.expectedFeedingsPerDay})`,
      `- Longest gap: ${Math.round(data.longestFeedingGap / 60)} hours`,
    ].join('\n');
  }

  /**
   * Format diaper data for AI prompt
   */
  private formatDiaperAnomalyDataForPrompt(data: DiaperAnomalyDataDto): string {
    return [
      `- Total changes: ${data.totalChanges}`,
      `- Wet: ${data.wetCount}`,
      `- Dirty: ${data.dirtyCount}`,
      `- Average per day: ${data.averageChangesPerDay}`,
      `- Expected wet per day: ${data.expectedWetPerDay}+`,
    ].join('\n');
  }

  /**
   * Generate fallback anomaly analysis when AI is unavailable
   */
  private generateFallbackAnomalyAnalysis(
    anomalies: DetectedAnomalyDto[],
    analysisData: AnomalyAnalysisDataDto,
  ): string {
    const lines: string[] = [
      `Anomaly Analysis for ${analysisData.babyName}`,
      `Analysis Period: ${analysisData.analysisHours} hours`,
      '',
    ];

    if (anomalies.length === 0) {
      lines.push('✅ No significant anomalies detected.');
      lines.push('');
      lines.push('All tracking data appears to be within normal ranges for your baby\'s age.');
    } else {
      lines.push(`⚠️ ${anomalies.length} potential concern(s) detected:`);
      lines.push('');

      for (const anomaly of anomalies) {
        const severityIcon = anomaly.severity === 'high' ? '🔴' : anomaly.severity === 'medium' ? '🟡' : '🟢';
        lines.push(`${severityIcon} ${anomaly.title}`);
        lines.push(`   ${anomaly.description}`);
        lines.push(`   Observed: ${anomaly.observedValue} | Expected: ${anomaly.expectedValue}`);
        lines.push(`   💡 ${anomaly.recommendation}`);
        lines.push('');
      }
    }

    lines.push('(AI analysis unavailable - showing pattern-based detection)');

    return lines.join('\n');
  }

  /**
   * Detect anomalies in recent tracking data
   * Validates: Requirements 10.3 - Anomaly detection for unusual patterns
   */
  async detectAnomalies(
    babyId: string,
    caregiverId: string,
    query: AnomalyDetectionQueryDto,
  ): Promise<AnomalyDetectionResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby details
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { id: true, name: true, dateOfBirth: true, gender: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    const analysisHours = query.analysisHours ?? 48;
    const now = new Date();
    const analysisEnd = now;
    const analysisStart = new Date(now.getTime() - analysisHours * 60 * 60 * 1000);
    const babyAgeMonths = this.calculateAgeInMonths(baby.dateOfBirth);

    // Aggregate data for analysis
    const [sleepData, feedingData, diaperData] = await Promise.all([
      this.aggregateSleepAnomalyData(babyId, analysisStart, analysisEnd, babyAgeMonths),
      this.aggregateFeedingAnomalyData(babyId, analysisStart, analysisEnd, babyAgeMonths),
      this.aggregateDiaperAnomalyData(babyId, analysisStart, analysisEnd, babyAgeMonths),
    ]);

    const analysisData: AnomalyAnalysisDataDto = {
      babyId: baby.id,
      babyName: baby.name,
      babyAgeMonths,
      analysisStart,
      analysisEnd,
      analysisHours,
      sleepData,
      feedingData,
      diaperData,
    };

    // Detect anomalies from aggregated data
    const anomalies = this.detectAnomaliesFromData(analysisData);

    // Try to get AI-powered analysis using configured provider
    let aiAnalysisGenerated = false;
    let aiError: string | null = null;
    let aiDurationMs: number | null = null;
    let aiAnalysis: string;

    try {
      const result = await this.aiProviderService.detectAnomalies(
        babyAgeMonths,
        this.formatSleepAnomalyDataForPrompt(sleepData),
        this.formatFeedingAnomalyDataForPrompt(feedingData),
        this.formatDiaperAnomalyDataForPrompt(diaperData),
        caregiverId,
      );

      if (result.success && result.response) {
        aiAnalysis = result.response;
        aiAnalysisGenerated = true;
        aiDurationMs = result.duration ?? null;
      } else {
        aiError = result.error ?? 'Unknown error generating AI analysis';
        aiAnalysis = this.generateFallbackAnomalyAnalysis(anomalies, analysisData);
      }
    } catch (error) {
      aiError = error instanceof Error ? error.message : 'Unknown error';
      aiAnalysis = this.generateFallbackAnomalyAnalysis(anomalies, analysisData);
    }

    return {
      babyId,
      babyName: baby.name,
      anomalies,
      anomalyCount: anomalies.length,
      hasHighSeverity: anomalies.some(a => a.severity === 'high'),
      analysisData,
      aiAnalysis,
      aiAnalysisGenerated,
      aiError,
      aiDurationMs,
      generatedAt: now,
    };
  }

  /**
   * Get daily summary for a baby
   * Aggregates feeding, sleep, diaper, and activity data for a single day
   */
  async getDailySummary(
    babyId: string,
    caregiverId: string,
    query: DailySummaryQueryDto,
  ): Promise<DailySummaryResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby details
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { id: true, name: true, dateOfBirth: true, gender: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    // Determine the date for the summary
    const targetDate = query.date ? new Date(query.date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Aggregate all data in parallel
    const [feedingSummary, sleepSummary, diaperSummary, activitiesSummary, hourlyBreakdown] =
      await Promise.all([
        this.aggregateDailyFeedingData(babyId, startOfDay, endOfDay),
        this.aggregateDailySleepData(babyId, startOfDay, endOfDay),
        this.aggregateDailyDiaperData(babyId, startOfDay, endOfDay),
        this.aggregateDailyActivitiesData(babyId, startOfDay, endOfDay),
        this.aggregateHourlyBreakdown(babyId, startOfDay, endOfDay),
      ]);

    return {
      babyId: baby.id,
      babyName: baby.name,
      date: this.formatDate(targetDate),
      feeding: feedingSummary,
      sleep: sleepSummary,
      diaper: diaperSummary,
      activities: activitiesSummary,
      hourlyBreakdown,
      generatedAt: new Date(),
    };
  }

  /**
   * Aggregate feeding data for a single day
   */
  private async aggregateDailyFeedingData(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyFeedingSummaryDto> {
    const entries = await this.prisma.feedingEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let breastfeedingCount = 0;
    let bottleCount = 0;
    let pumpingCount = 0;
    let solidCount = 0;
    let totalBreastfeedingMinutes = 0;
    let totalBottleMl = 0;

    for (const entry of entries) {
      switch (entry.type) {
        case 'breastfeeding': {
          breastfeedingCount++;
          // Duration is stored in seconds, convert to minutes
          const leftMin = entry.leftDuration ? entry.leftDuration / 60 : 0;
          const rightMin = entry.rightDuration ? entry.rightDuration / 60 : 0;
          totalBreastfeedingMinutes += leftMin + rightMin;
          break;
        }
        case 'bottle':
          bottleCount++;
          if (entry.amount) {
            totalBottleMl += entry.amount;
          }
          break;
        case 'pumping':
          pumpingCount++;
          break;
        case 'solid':
          solidCount++;
          break;
      }
    }

    return {
      count: entries.length,
      totalMinutes: Math.round(totalBreastfeedingMinutes),
      totalMl: totalBottleMl,
      byType: {
        breastfeeding: breastfeedingCount,
        bottle: bottleCount,
        pumping: pumpingCount,
        solid: solidCount,
      },
    };
  }

  /**
   * Aggregate sleep data for a single day
   */
  private async aggregateDailySleepData(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailySleepSummaryDto> {
    const entries = await this.prisma.sleepEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalMinutes = 0;
    let napCount = 0;
    let napMinutes = 0;
    let nightSleepMinutes = 0;

    for (const entry of entries) {
      if (entry.duration === null) continue;

      totalMinutes += entry.duration;

      if (entry.sleepType === 'nap') {
        napCount++;
        napMinutes += entry.duration;
      } else if (entry.sleepType === 'night') {
        nightSleepMinutes += entry.duration;
      }
    }

    return {
      totalMinutes,
      napCount,
      napMinutes,
      nightSleepMinutes,
      averageNapDuration: napCount > 0 ? Math.round(napMinutes / napCount) : null,
    };
  }

  /**
   * Aggregate diaper data for a single day
   */
  private async aggregateDailyDiaperData(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyDiaperSummaryDto> {
    const entries = await this.prisma.diaperEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let wetCount = 0;
    let dirtyCount = 0;
    let mixedCount = 0;

    for (const entry of entries) {
      switch (entry.type) {
        case 'wet':
          wetCount++;
          break;
        case 'dirty':
          dirtyCount++;
          break;
        case 'mixed':
          mixedCount++;
          break;
      }
    }

    return {
      total: entries.length,
      wet: wetCount,
      dirty: dirtyCount,
      mixed: mixedCount,
    };
  }

  /**
   * Aggregate activities data for a single day
   */
  private async aggregateDailyActivitiesData(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyActivitiesSummaryDto> {
    const entries = await this.prisma.activityEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let tummyTimeMinutes = 0;
    let bathCount = 0;
    let outdoorMinutes = 0;

    for (const entry of entries) {
      const duration = entry.duration ?? 0;
      
      // Handle both snake_case and camelCase activity types
      const activityType = entry.activityType.toLowerCase().replace('_', '');
      
      switch (activityType) {
        case 'tummytime':
          tummyTimeMinutes += duration;
          break;
        case 'bath':
          bathCount++;
          break;
        case 'outdoor':
          outdoorMinutes += duration;
          break;
      }
    }

    return {
      tummyTimeMinutes,
      bathCount,
      outdoorMinutes,
    };
  }

  /**
   * Aggregate hourly breakdown of activities for a single day
   */
  private async aggregateHourlyBreakdown(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<HourlyBreakdownEntryDto[]> {
    // Initialize 24 hours
    const hourlyData: HourlyBreakdownEntryDto[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      feeding: 0,
      sleep: 0,
      diaper: 0,
      activity: 0,
      total: 0,
    }));

    // Get all entries for the day
    const [feedingEntries, sleepEntries, diaperEntries, activityEntries] = await Promise.all([
      this.prisma.feedingEntry.findMany({
        where: {
          babyId,
          isDeleted: false,
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { timestamp: true },
      }),
      this.prisma.sleepEntry.findMany({
        where: {
          babyId,
          isDeleted: false,
          startTime: { gte: startDate, lte: endDate },
        },
        select: { startTime: true },
      }),
      this.prisma.diaperEntry.findMany({
        where: {
          babyId,
          isDeleted: false,
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { timestamp: true },
      }),
      this.prisma.activityEntry.findMany({
        where: {
          babyId,
          isDeleted: false,
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { timestamp: true },
      }),
    ]);

    // Count feeding entries by hour
    for (const entry of feedingEntries) {
      const hour = entry.timestamp.getHours();
      const hourData = hourlyData[hour];
      if (hourData) {
        hourData.feeding++;
        hourData.total++;
      }
    }

    // Count sleep entries by hour (using start time)
    for (const entry of sleepEntries) {
      const hour = entry.startTime.getHours();
      const hourData = hourlyData[hour];
      if (hourData) {
        hourData.sleep++;
        hourData.total++;
      }
    }

    // Count diaper entries by hour
    for (const entry of diaperEntries) {
      const hour = entry.timestamp.getHours();
      const hourData = hourlyData[hour];
      if (hourData) {
        hourData.diaper++;
        hourData.total++;
      }
    }

    // Count activity entries by hour
    for (const entry of activityEntries) {
      const hour = entry.timestamp.getHours();
      const hourData = hourlyData[hour];
      if (hourData) {
        hourData.activity++;
        hourData.total++;
      }
    }

    return hourlyData;
  }

  // ==================== Trend Insights Methods ====================

  /**
   * Calculate sleep consistency score (0-100)
   * Based on variance in sleep times and durations
   */
  private calculateSleepConsistencyScore(
    entries: Array<{ startTime: Date; duration: number | null }>,
  ): number {
    if (entries.length < 3) return 50; // Not enough data

    // Calculate variance in start times (hour of day)
    const startHours = entries.map(e => e.startTime.getHours() + e.startTime.getMinutes() / 60);
    const avgStartHour = startHours.reduce((a, b) => a + b, 0) / startHours.length;
    const startVariance = startHours.reduce((sum, h) => sum + Math.pow(h - avgStartHour, 2), 0) / startHours.length;

    // Calculate variance in durations
    const durations = entries.filter(e => e.duration !== null).map(e => e.duration as number);
    if (durations.length < 2) return 50;
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const durationVariance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;

    // Lower variance = higher consistency
    // Normalize: start variance of 4 hours² = 50% penalty, duration variance of 900 min² (30 min std) = 50% penalty
    const startPenalty = Math.min(50, (startVariance / 16) * 50);
    const durationPenalty = Math.min(50, (durationVariance / 900) * 50);

    return Math.max(0, Math.round(100 - startPenalty - durationPenalty));
  }

  /**
   * Calculate feeding consistency score (0-100)
   * Based on regularity of feeding intervals
   */
  private calculateFeedingConsistencyScore(
    entries: Array<{ timestamp: Date }>,
  ): number {
    if (entries.length < 3) return 50;

    // Calculate intervals between feedings
    const intervals: number[] = [];
    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i - 1];
      const curr = entries[i];
      if (prev && curr) {
        const intervalMinutes = (curr.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60);
        if (intervalMinutes > 0 && intervalMinutes < 24 * 60) {
          intervals.push(intervalMinutes);
        }
      }
    }

    if (intervals.length < 2) return 50;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;

    // Lower variance = higher consistency
    // Normalize: variance of 3600 min² (1 hour std) = 50% penalty
    const penalty = Math.min(100, (variance / 3600) * 100);

    return Math.max(0, Math.round(100 - penalty));
  }

  /**
   * Aggregate trend data for sleep
   */
  private async aggregateSleepTrendData(
    babyId: string,
    startDate: Date,
    endDate: Date,
    previousStartDate?: Date,
    previousEndDate?: Date,
  ): Promise<import('./dto').SleepTrendDataDto> {
    const entries = await this.prisma.sleepEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        startTime: { gte: startDate, lte: endDate },
      },
      orderBy: { startTime: 'asc' },
    });

    let totalSleepMinutes = 0;
    let napCount = 0;
    let napMinutes = 0;
    let nightSleepMinutes = 0;
    let nightSleepCount = 0;
    const wakeWindows: number[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry || entry.duration === null) continue;

      totalSleepMinutes += entry.duration;

      if (entry.sleepType === 'nap') {
        napCount++;
        napMinutes += entry.duration;
      } else if (entry.sleepType === 'night') {
        nightSleepCount++;
        nightSleepMinutes += entry.duration;
      }

      // Calculate wake window
      if (i > 0) {
        const prevEntry = entries[i - 1];
        if (prevEntry?.endTime && entry.startTime) {
          const wakeWindowMs = entry.startTime.getTime() - prevEntry.endTime.getTime();
          const wakeWindowMinutes = Math.round(wakeWindowMs / (1000 * 60));
          if (wakeWindowMinutes >= 15 && wakeWindowMinutes <= 720) {
            wakeWindows.push(wakeWindowMinutes);
          }
        }
      }
    }

    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    const consistencyScore = this.calculateSleepConsistencyScore(entries);

    const result: import('./dto').SleepTrendDataDto = {
      totalSleepMinutes,
      averageDailySleepMinutes: Math.round(totalSleepMinutes / periodDays),
      napCount,
      averageNapDuration: napCount > 0 ? Math.round(napMinutes / napCount) : null,
      averageNightSleepDuration: nightSleepCount > 0 ? Math.round(nightSleepMinutes / nightSleepCount) : null,
      averageWakeWindow: wakeWindows.length > 0 ? Math.round(wakeWindows.reduce((a, b) => a + b, 0) / wakeWindows.length) : null,
      consistencyScore,
    };

    // Compare to previous period if available
    if (previousStartDate && previousEndDate) {
      const prevEntries = await this.prisma.sleepEntry.findMany({
        where: {
          babyId,
          isDeleted: false,
          startTime: { gte: previousStartDate, lte: previousEndDate },
        },
      });

      let prevTotalSleep = 0;
      let prevNapCount = 0;
      for (const entry of prevEntries) {
        if (entry.duration) {
          prevTotalSleep += entry.duration;
          if (entry.sleepType === 'nap') prevNapCount++;
        }
      }

      const prevPeriodDays = Math.max(1, Math.ceil((previousEndDate.getTime() - previousStartDate.getTime()) / (24 * 60 * 60 * 1000)));
      const prevAvgDaily = Math.round(prevTotalSleep / prevPeriodDays);
      const prevConsistency = this.calculateSleepConsistencyScore(prevEntries);

      result.comparisonToPrevious = {
        sleepChange: result.averageDailySleepMinutes - prevAvgDaily,
        napCountChange: napCount - prevNapCount,
        consistencyChange: consistencyScore - prevConsistency,
      };
    }

    return result;
  }

  /**
   * Aggregate trend data for feeding
   */
  private async aggregateFeedingTrendData(
    babyId: string,
    startDate: Date,
    endDate: Date,
    previousStartDate?: Date,
    previousEndDate?: Date,
  ): Promise<import('./dto').FeedingTrendDataDto> {
    const entries = await this.prisma.feedingEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    let breastfeedingCount = 0;
    let bottleCount = 0;
    let solidCount = 0;
    let totalBottleVolume = 0;
    let bottleWithAmount = 0;

    for (const entry of entries) {
      switch (entry.type) {
        case 'breastfeeding':
          breastfeedingCount++;
          break;
        case 'bottle':
          bottleCount++;
          if (entry.amount !== null && entry.amount > 0) {
            totalBottleVolume += entry.amount;
            bottleWithAmount++;
          }
          break;
        case 'solid':
          solidCount++;
          break;
      }
    }

    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    const consistencyScore = this.calculateFeedingConsistencyScore(entries);

    const result: import('./dto').FeedingTrendDataDto = {
      totalFeedings: entries.length,
      averageFeedingsPerDay: Math.round((entries.length / periodDays) * 10) / 10,
      breastfeedingCount,
      bottleCount,
      solidCount,
      averageBottleAmount: bottleWithAmount > 0 ? Math.round(totalBottleVolume / bottleWithAmount) : null,
      totalBottleVolume,
      consistencyScore,
    };

    // Compare to previous period
    if (previousStartDate && previousEndDate) {
      const prevEntries = await this.prisma.feedingEntry.findMany({
        where: {
          babyId,
          isDeleted: false,
          timestamp: { gte: previousStartDate, lte: previousEndDate },
        },
      });

      let prevBottleVolume = 0;
      for (const entry of prevEntries) {
        if (entry.type === 'bottle' && entry.amount) {
          prevBottleVolume += entry.amount;
        }
      }

      result.comparisonToPrevious = {
        feedingCountChange: entries.length - prevEntries.length,
        bottleVolumeChange: totalBottleVolume - prevBottleVolume,
      };
    }

    return result;
  }

  /**
   * Aggregate trend data for diapers
   */
  private async aggregateDiaperTrendData(
    babyId: string,
    startDate: Date,
    endDate: Date,
    previousStartDate?: Date,
    previousEndDate?: Date,
  ): Promise<import('./dto').DiaperTrendDataDto> {
    const entries = await this.prisma.diaperEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    let wetCount = 0;
    let dirtyCount = 0;
    let mixedCount = 0;

    for (const entry of entries) {
      switch (entry.type) {
        case 'wet': wetCount++; break;
        case 'dirty': dirtyCount++; break;
        case 'mixed': mixedCount++; break;
      }
    }

    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

    const result: import('./dto').DiaperTrendDataDto = {
      totalChanges: entries.length,
      averageChangesPerDay: Math.round((entries.length / periodDays) * 10) / 10,
      wetCount,
      dirtyCount,
      mixedCount,
      wetToDirtyRatio: dirtyCount > 0 ? Math.round((wetCount / dirtyCount) * 10) / 10 : null,
    };

    // Compare to previous period
    if (previousStartDate && previousEndDate) {
      const prevEntries = await this.prisma.diaperEntry.findMany({
        where: {
          babyId,
          isDeleted: false,
          timestamp: { gte: previousStartDate, lte: previousEndDate },
        },
      });

      let prevWet = 0, prevDirty = 0;
      for (const entry of prevEntries) {
        if (entry.type === 'wet') prevWet++;
        else if (entry.type === 'dirty') prevDirty++;
        else if (entry.type === 'mixed') { prevWet++; prevDirty++; }
      }

      result.comparisonToPrevious = {
        totalChange: entries.length - prevEntries.length,
        wetChange: wetCount - prevWet,
        dirtyChange: dirtyCount - prevDirty,
      };
    }

    return result;
  }

  /**
   * Aggregate trend data for growth
   */
  private async aggregateGrowthTrendData(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<import('./dto').GrowthTrendDataDto> {
    const entries = await this.prisma.growthEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (entries.length === 0) {
      return { hasMeasurements: false };
    }

    const firstEntry = entries[0];
    const lastEntry = entries[entries.length - 1];

    return {
      hasMeasurements: true,
      startWeight: firstEntry?.weight ?? null,
      endWeight: lastEntry?.weight ?? null,
      weightGain: firstEntry?.weight && lastEntry?.weight ? lastEntry.weight - firstEntry.weight : null,
      startHeight: firstEntry?.height ?? null,
      endHeight: lastEntry?.height ?? null,
      heightGain: firstEntry?.height && lastEntry?.height ? lastEntry.height - firstEntry.height : null,
      weightPercentile: lastEntry?.weightPercentile ?? null,
      heightPercentile: lastEntry?.heightPercentile ?? null,
      headPercentile: lastEntry?.headPercentile ?? null,
    };
  }

  /**
   * Aggregate trend data for activities
   */
  private async aggregateActivityTrendData(
    babyId: string,
    startDate: Date,
    endDate: Date,
    previousStartDate?: Date,
    previousEndDate?: Date,
  ): Promise<import('./dto').ActivityTrendDataDto> {
    const entries = await this.prisma.activityEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    let tummyTimeMinutes = 0;
    let bathCount = 0;
    let outdoorMinutes = 0;
    let playMinutes = 0;

    for (const entry of entries) {
      const duration = entry.duration ?? 0;
      const activityType = entry.activityType.toLowerCase().replace('_', '');

      switch (activityType) {
        case 'tummytime': tummyTimeMinutes += duration; break;
        case 'bath': bathCount++; break;
        case 'outdoor': outdoorMinutes += duration; break;
        case 'play': playMinutes += duration; break;
      }
    }

    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

    const result: import('./dto').ActivityTrendDataDto = {
      totalActivities: entries.length,
      tummyTimeMinutes,
      averageDailyTummyTime: Math.round(tummyTimeMinutes / periodDays),
      bathCount,
      outdoorMinutes,
      playMinutes,
    };

    // Compare to previous period
    if (previousStartDate && previousEndDate) {
      const prevEntries = await this.prisma.activityEntry.findMany({
        where: {
          babyId,
          isDeleted: false,
          timestamp: { gte: previousStartDate, lte: previousEndDate },
        },
      });

      let prevTummyTime = 0, prevOutdoor = 0;
      for (const entry of prevEntries) {
        const duration = entry.duration ?? 0;
        const activityType = entry.activityType.toLowerCase().replace('_', '');
        if (activityType === 'tummytime') prevTummyTime += duration;
        else if (activityType === 'outdoor') prevOutdoor += duration;
      }

      result.comparisonToPrevious = {
        tummyTimeChange: tummyTimeMinutes - prevTummyTime,
        outdoorTimeChange: outdoorMinutes - prevOutdoor,
      };
    }

    return result;
  }

  /**
   * Format sleep trend data for AI prompt
   */
  private formatSleepTrendForPrompt(data: import('./dto').SleepTrendDataDto, periodDays: number): string {
    const lines = [
      `- Total sleep: ${Math.round(data.totalSleepMinutes / 60)} hours over ${periodDays} days`,
      `- Average daily sleep: ${Math.round(data.averageDailySleepMinutes / 60)}h ${data.averageDailySleepMinutes % 60}m`,
      `- Naps: ${data.napCount} total`,
    ];

    if (data.averageNapDuration !== null) {
      lines.push(`- Average nap duration: ${data.averageNapDuration} minutes`);
    }
    if (data.averageNightSleepDuration !== null) {
      lines.push(`- Average night sleep: ${Math.round(data.averageNightSleepDuration / 60)}h ${data.averageNightSleepDuration % 60}m`);
    }
    if (data.averageWakeWindow !== null) {
      lines.push(`- Average wake window: ${this.formatWakeWindow(data.averageWakeWindow)}`);
    }
    lines.push(`- Sleep consistency score: ${data.consistencyScore}/100`);

    return lines.join('\n');
  }

  /**
   * Format feeding trend data for AI prompt
   */
  private formatFeedingTrendForPrompt(data: import('./dto').FeedingTrendDataDto): string {
    const lines = [
      `- Total feedings: ${data.totalFeedings}`,
      `- Average per day: ${data.averageFeedingsPerDay}`,
      `- Breastfeeding: ${data.breastfeedingCount}`,
      `- Bottle: ${data.bottleCount}`,
      `- Solid food: ${data.solidCount}`,
    ];

    if (data.averageBottleAmount !== null) {
      lines.push(`- Average bottle amount: ${data.averageBottleAmount} ml`);
    }
    if (data.totalBottleVolume > 0) {
      lines.push(`- Total bottle volume: ${data.totalBottleVolume} ml`);
    }
    lines.push(`- Feeding consistency score: ${data.consistencyScore}/100`);

    return lines.join('\n');
  }

  /**
   * Format diaper trend data for AI prompt
   */
  private formatDiaperTrendForPrompt(data: import('./dto').DiaperTrendDataDto): string {
    const lines = [
      `- Total changes: ${data.totalChanges}`,
      `- Average per day: ${data.averageChangesPerDay}`,
      `- Wet: ${data.wetCount}`,
      `- Dirty: ${data.dirtyCount}`,
      `- Mixed: ${data.mixedCount}`,
    ];

    if (data.wetToDirtyRatio !== null) {
      lines.push(`- Wet to dirty ratio: ${data.wetToDirtyRatio}:1`);
    }

    return lines.join('\n');
  }

  /**
   * Format growth trend data for AI prompt
   */
  private formatGrowthTrendForPrompt(data: import('./dto').GrowthTrendDataDto): string {
    if (!data.hasMeasurements) {
      return 'No growth measurements recorded in this period';
    }

    const lines: string[] = [];

    if (data.endWeight !== null && data.endWeight !== undefined) {
      const weightKg = (data.endWeight / 1000).toFixed(2);
      lines.push(`- Current weight: ${weightKg} kg`);
      if (data.weightGain !== null && data.weightGain !== undefined) {
        const gainKg = (data.weightGain / 1000).toFixed(2);
        lines.push(`- Weight gain: ${gainKg} kg`);
      }
      if (data.weightPercentile !== null) {
        lines.push(`- Weight percentile: ${data.weightPercentile}th`);
      }
    }

    if (data.endHeight !== null && data.endHeight !== undefined) {
      const heightCm = (data.endHeight / 10).toFixed(1);
      lines.push(`- Current height: ${heightCm} cm`);
      if (data.heightGain !== null && data.heightGain !== undefined) {
        const gainCm = (data.heightGain / 10).toFixed(1);
        lines.push(`- Height gain: ${gainCm} cm`);
      }
      if (data.heightPercentile !== null) {
        lines.push(`- Height percentile: ${data.heightPercentile}th`);
      }
    }

    if (data.headPercentile !== null) {
      lines.push(`- Head circumference percentile: ${data.headPercentile}th`);
    }

    return lines.length > 0 ? lines.join('\n') : 'No measurements available';
  }

  /**
   * Format activity trend data for AI prompt
   */
  private formatActivityTrendForPrompt(data: import('./dto').ActivityTrendDataDto): string {
    return [
      `- Total activities: ${data.totalActivities}`,
      `- Tummy time: ${data.tummyTimeMinutes} minutes total (${data.averageDailyTummyTime} min/day avg)`,
      `- Baths: ${data.bathCount}`,
      `- Outdoor time: ${data.outdoorMinutes} minutes`,
      `- Play time: ${data.playMinutes} minutes`,
    ].join('\n');
  }

  /**
   * Format comparison to previous period for AI prompt
   */
  private formatPreviousPeriodComparison(
    sleep: import('./dto').SleepTrendDataDto,
    feeding: import('./dto').FeedingTrendDataDto,
    diaper: import('./dto').DiaperTrendDataDto,
    activity: import('./dto').ActivityTrendDataDto,
  ): string {
    const lines: string[] = [];

    if (sleep.comparisonToPrevious) {
      const sleepChange = sleep.comparisonToPrevious.sleepChange;
      const direction = sleepChange > 0 ? 'more' : 'less';
      lines.push(`Sleep: ${Math.abs(sleepChange)} minutes ${direction} per day`);
      lines.push(`  - Nap count change: ${sleep.comparisonToPrevious.napCountChange > 0 ? '+' : ''}${sleep.comparisonToPrevious.napCountChange}`);
      lines.push(`  - Consistency change: ${sleep.comparisonToPrevious.consistencyChange > 0 ? '+' : ''}${sleep.comparisonToPrevious.consistencyChange} points`);
    }

    if (feeding.comparisonToPrevious) {
      lines.push(`Feeding: ${feeding.comparisonToPrevious.feedingCountChange > 0 ? '+' : ''}${feeding.comparisonToPrevious.feedingCountChange} feedings`);
      if (feeding.comparisonToPrevious.bottleVolumeChange !== 0) {
        lines.push(`  - Bottle volume change: ${feeding.comparisonToPrevious.bottleVolumeChange > 0 ? '+' : ''}${feeding.comparisonToPrevious.bottleVolumeChange} ml`);
      }
    }

    if (diaper.comparisonToPrevious) {
      lines.push(`Diapers: ${diaper.comparisonToPrevious.totalChange > 0 ? '+' : ''}${diaper.comparisonToPrevious.totalChange} changes`);
    }

    if (activity.comparisonToPrevious) {
      lines.push(`Activities:`);
      lines.push(`  - Tummy time change: ${activity.comparisonToPrevious.tummyTimeChange > 0 ? '+' : ''}${activity.comparisonToPrevious.tummyTimeChange} minutes`);
      lines.push(`  - Outdoor time change: ${activity.comparisonToPrevious.outdoorTimeChange > 0 ? '+' : ''}${activity.comparisonToPrevious.outdoorTimeChange} minutes`);
    }

    return lines.length > 0 ? lines.join('\n') : 'No previous period data available for comparison';
  }

  /**
   * Generate insights from aggregated data (fallback when AI unavailable)
   */
  private generateInsightsFromData(
    aggregatedData: import('./dto').TrendAggregatedDataDto,
    babyAgeMonths: number,
    periodDays: number,
  ): import('./dto').TrendInsightItemDto[] {
    const insights: import('./dto').TrendInsightItemDto[] = [];
    const { sleep, feeding, diaper, growth, activity } = aggregatedData;

    // Sleep insights
    const expectedDailySleep = this.getExpectedDailySleepMinutes(babyAgeMonths);
    const sleepDiff = sleep.averageDailySleepMinutes - expectedDailySleep;
    const sleepDiffPercent = Math.round((sleepDiff / expectedDailySleep) * 100);

    if (Math.abs(sleepDiffPercent) > 15) {
      insights.push({
        category: 'sleep',
        title: sleepDiff > 0 ? 'Above average sleep' : 'Below average sleep',
        description: `Baby is sleeping ${Math.abs(sleepDiffPercent)}% ${sleepDiff > 0 ? 'more' : 'less'} than typical for their age.`,
        trend: sleepDiff > 0 ? 'stable' : 'declining',
        changePercent: sleepDiffPercent,
        icon: sleepDiff > 0 ? '😴' : '⚠️',
        recommendation: sleepDiff < 0 ? 'Consider reviewing sleep environment and bedtime routine.' : undefined,
      });
    }

    if (sleep.consistencyScore >= 80) {
      insights.push({
        category: 'sleep',
        title: 'Excellent sleep consistency',
        description: `Sleep patterns are very consistent with a score of ${sleep.consistencyScore}/100.`,
        trend: 'stable',
        icon: '⭐',
      });
    } else if (sleep.consistencyScore < 50) {
      insights.push({
        category: 'sleep',
        title: 'Inconsistent sleep patterns',
        description: `Sleep times and durations vary significantly (consistency score: ${sleep.consistencyScore}/100).`,
        trend: 'declining',
        icon: '📊',
        recommendation: 'Try to establish more consistent sleep and wake times.',
      });
    }

    // Feeding insights
    const expectedFeedings = this.getExpectedFeedingsPerDay(babyAgeMonths);
    const feedingDiff = feeding.averageFeedingsPerDay - expectedFeedings;

    if (Math.abs(feedingDiff) > 2) {
      insights.push({
        category: 'feeding',
        title: feedingDiff > 0 ? 'Frequent feedings' : 'Fewer feedings than typical',
        description: `Baby is having ${Math.abs(Math.round(feedingDiff))} ${feedingDiff > 0 ? 'more' : 'fewer'} feedings per day than typical.`,
        trend: feedingDiff < -2 ? 'declining' : 'stable',
        icon: feedingDiff > 0 ? '🍼' : '⚠️',
        recommendation: feedingDiff < -2 ? 'Ensure baby is showing hunger cues and feeding adequately.' : undefined,
      });
    }

    // Diaper insights
    const expectedWet = this.getExpectedWetDiapersPerDay(babyAgeMonths);
    const wetPerDay = diaper.wetCount / periodDays;

    if (wetPerDay < expectedWet * 0.7) {
      insights.push({
        category: 'diaper',
        title: 'Low wet diaper count',
        description: `Wet diapers are below expected levels (${Math.round(wetPerDay * 10) / 10}/day vs ${expectedWet}+ expected).`,
        trend: 'declining',
        icon: '💧',
        recommendation: 'Monitor hydration and ensure adequate feeding.',
      });
    }

    // Growth insights
    if (growth.hasMeasurements && growth.weightGain !== null && growth.weightGain !== undefined && growth.weightGain > 0) {
      const dailyGainGrams = growth.weightGain / periodDays;
      insights.push({
        category: 'growth',
        title: 'Healthy weight gain',
        description: `Baby gained ${(growth.weightGain / 1000).toFixed(2)} kg (${Math.round(dailyGainGrams)} g/day).`,
        trend: 'improving',
        icon: '📈',
      });
    }

    // Activity insights
    const recommendedTummyTime = babyAgeMonths < 4 ? 15 : babyAgeMonths < 6 ? 30 : 60; // minutes per day
    if (activity.averageDailyTummyTime >= recommendedTummyTime) {
      insights.push({
        category: 'activity',
        title: 'Great tummy time!',
        description: `Baby is getting ${activity.averageDailyTummyTime} minutes of tummy time per day.`,
        trend: 'improving',
        icon: '💪',
      });
    } else if (activity.averageDailyTummyTime < recommendedTummyTime * 0.5) {
      insights.push({
        category: 'activity',
        title: 'More tummy time recommended',
        description: `Current average is ${activity.averageDailyTummyTime} min/day. Aim for ${recommendedTummyTime}+ minutes.`,
        trend: 'stable',
        icon: '🎯',
        recommendation: 'Try short tummy time sessions throughout the day.',
      });
    }

    return insights;
  }

  /**
   * Generate highlights from insights
   */
  private generateHighlights(
    insights: import('./dto').TrendInsightItemDto[],
    aggregatedData: import('./dto').TrendAggregatedDataDto,
  ): string[] {
    const highlights: string[] = [];

    // Add positive insights
    for (const insight of insights) {
      if (insight.trend === 'improving' || (insight.trend === 'stable' && insight.icon === '⭐')) {
        highlights.push(`${insight.icon} ${insight.title}`);
      }
    }

    // Add data-based highlights
    if (aggregatedData.sleep.consistencyScore >= 70) {
      highlights.push('😴 Consistent sleep schedule');
    }
    if (aggregatedData.feeding.consistencyScore >= 70) {
      highlights.push('🍼 Regular feeding pattern');
    }
    if (aggregatedData.activity.tummyTimeMinutes > 0) {
      highlights.push(`💪 ${aggregatedData.activity.tummyTimeMinutes} minutes of tummy time`);
    }

    return highlights.slice(0, 5); // Limit to 5 highlights
  }

  /**
   * Generate areas of concern from insights
   */
  private generateAreasOfConcern(
    insights: import('./dto').TrendInsightItemDto[],
  ): string[] {
    const concerns: string[] = [];

    for (const insight of insights) {
      if (insight.trend === 'declining' && insight.recommendation) {
        concerns.push(`${insight.icon} ${insight.title}: ${insight.recommendation}`);
      }
    }

    return concerns.slice(0, 3); // Limit to 3 concerns
  }

  /**
   * Generate fallback AI summary when Ollama is unavailable
   */
  private generateFallbackTrendSummary(
    period: import('./dto').TrendPeriod,
    aggregatedData: import('./dto').TrendAggregatedDataDto,
    insights: import('./dto').TrendInsightItemDto[],
    babyName: string,
    periodDays: number,
  ): string {
    const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This week' : period === 'monthly' ? 'This month' : 'This year';
    const sleepHours = Math.round(aggregatedData.sleep.averageDailySleepMinutes / 60);
    const sleepMins = aggregatedData.sleep.averageDailySleepMinutes % 60;
    
    let summary = `${periodLabel}, ${babyName} averaged ${sleepHours}h ${sleepMins}m of sleep daily with ${aggregatedData.sleep.napCount} naps over ${periodDays} day${periodDays > 1 ? 's' : ''}. `;
    summary += `There were ${aggregatedData.feeding.totalFeedings} feedings (${aggregatedData.feeding.averageFeedingsPerDay} per day) and ${aggregatedData.diaper.totalChanges} diaper changes.`;

    if (insights.length > 0) {
      const topInsight = insights[0];
      if (topInsight) {
        summary += ` ${topInsight.title}.`;
      }
    }

    return summary;
  }

  /**
   * Generate cache key for trend insights
   */
  private generateTrendInsightsCacheKey(
    babyId: string,
    period: TrendPeriod,
    periodStart: Date,
    periodEnd: Date,
  ): string {
    const startStr = this.formatDate(periodStart);
    const endStr = this.formatDate(periodEnd);
    return `insights:trends:${babyId}:${period}:${startStr}:${endStr}`;
  }

  /**
   * Get trend insights for a specific period
   * Validates: AI-powered trend analysis for daily, weekly, monthly, yearly periods
   * Implements caching to prevent duplicate AI generation requests
   */
  async getTrendInsights(
    babyId: string,
    caregiverId: string,
    period: TrendPeriod,
    query: TrendInsightsQueryDto,
  ): Promise<TrendInsightsResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get baby details
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      select: { id: true, name: true, dateOfBirth: true, gender: true },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    const now = new Date();
    const babyAgeMonths = this.calculateAgeInMonths(baby.dateOfBirth);

    // Calculate period dates
    let periodStart: Date;
    let periodEnd: Date;
    let previousStart: Date | undefined;
    let previousEnd: Date | undefined;

    if (query.endDate) {
      periodEnd = new Date(query.endDate);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      periodEnd = now;
    }

    // Calculate period start based on period type
    switch (period) {
      case 'daily':
        if (query.startDate) {
          periodStart = new Date(query.startDate);
        } else {
          periodStart = new Date(periodEnd);
        }
        periodStart.setHours(0, 0, 0, 0);
        // Previous day
        previousEnd = new Date(periodStart.getTime() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setHours(0, 0, 0, 0);
        break;

      case 'weekly':
        if (query.startDate) {
          periodStart = new Date(query.startDate);
        } else {
          periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        periodStart.setHours(0, 0, 0, 0);
        // Previous week
        previousEnd = new Date(periodStart.getTime() - 1);
        previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStart.setHours(0, 0, 0, 0);
        break;

      case 'monthly':
        if (query.startDate) {
          periodStart = new Date(query.startDate);
        } else {
          periodStart = new Date(periodEnd);
          periodStart.setMonth(periodStart.getMonth() - 1);
        }
        periodStart.setHours(0, 0, 0, 0);
        // Previous month
        previousEnd = new Date(periodStart.getTime() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setMonth(previousStart.getMonth() - 1);
        previousStart.setHours(0, 0, 0, 0);
        break;

      case 'yearly':
        if (query.startDate) {
          periodStart = new Date(query.startDate);
        } else {
          periodStart = new Date(periodEnd);
          periodStart.setFullYear(periodStart.getFullYear() - 1);
        }
        periodStart.setHours(0, 0, 0, 0);
        // No previous period comparison for yearly (too much data)
        break;
    }

    // Check cache first
    const cacheKey = this.generateTrendInsightsCacheKey(babyId, period, periodStart, periodEnd);
    const cachedResult = await this.redisService.get(cacheKey);
    
    if (cachedResult) {
      try {
        const parsed = JSON.parse(cachedResult);
        this.logger.log(`Cache hit for trend insights: ${cacheKey}`);
        // Convert date strings back to Date objects
        return {
          ...parsed,
          periodStart: new Date(parsed.periodStart),
          periodEnd: new Date(parsed.periodEnd),
          generatedAt: new Date(parsed.generatedAt),
        };
      } catch (error) {
        this.logger.warn(`Failed to parse cached insights: ${error}`);
        // Continue to generate fresh insights
      }
    }

    const periodDays = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)));

    // Aggregate all trend data in parallel
    const [sleepData, feedingData, diaperData, growthData, activityData] = await Promise.all([
      this.aggregateSleepTrendData(babyId, periodStart, periodEnd, previousStart, previousEnd),
      this.aggregateFeedingTrendData(babyId, periodStart, periodEnd, previousStart, previousEnd),
      this.aggregateDiaperTrendData(babyId, periodStart, periodEnd, previousStart, previousEnd),
      this.aggregateGrowthTrendData(babyId, periodStart, periodEnd),
      this.aggregateActivityTrendData(babyId, periodStart, periodEnd, previousStart, previousEnd),
    ]);

    const aggregatedData: import('./dto').TrendAggregatedDataDto = {
      sleep: sleepData,
      feeding: feedingData,
      diaper: diaperData,
      growth: growthData,
      activity: activityData,
    };

    // Generate insights from data
    const insights = this.generateInsightsFromData(aggregatedData, babyAgeMonths, periodDays);
    const highlights = this.generateHighlights(insights, aggregatedData);
    const areasOfConcern = this.generateAreasOfConcern(insights);

    // Try to get AI-powered summary using configured provider
    let aiSummary = '';
    let aiSummaryGenerated = false;
    let aiError: string | null = null;
    let aiDurationMs: number | null = null;

    try {
      const promptData = {
        babyName: baby.name,
        babyGender: baby.gender,
        babyAgeMonths,
        periodStart: this.formatDate(periodStart),
        periodEnd: this.formatDate(periodEnd),
        periodDays,
        sleepSummary: this.formatSleepTrendForPrompt(sleepData, periodDays),
        feedingSummary: this.formatFeedingTrendForPrompt(feedingData),
        diaperSummary: this.formatDiaperTrendForPrompt(diaperData),
        growthSummary: this.formatGrowthTrendForPrompt(growthData),
        activitySummary: this.formatActivityTrendForPrompt(activityData),
        previousPeriodComparison: this.formatPreviousPeriodComparison(sleepData, feedingData, diaperData, activityData),
        startAgeMonths: period === 'yearly' ? Math.max(0, babyAgeMonths - 12) : babyAgeMonths,
      };

      const result = await this.aiProviderService.generateTrendInsights(period, promptData, caregiverId);

      if (result.success && result.response) {
        aiSummary = result.response;
        aiSummaryGenerated = true;
        aiDurationMs = result.duration ?? null;
      } else {
        aiError = result.error ?? 'Unknown error generating AI summary';
        aiSummary = this.generateFallbackTrendSummary(period, aggregatedData, insights, baby.name, periodDays);
      }
    } catch (error) {
      aiError = error instanceof Error ? error.message : 'Unknown error';
      aiSummary = this.generateFallbackTrendSummary(period, aggregatedData, insights, baby.name, periodDays);
    }

    const response: TrendInsightsResponseDto = {
      babyId,
      babyName: baby.name,
      babyAgeMonths,
      period,
      periodStart,
      periodEnd,
      periodDays,
      aggregatedData,
      insights,
      aiSummary,
      aiSummaryGenerated,
      aiError,
      aiDurationMs,
      highlights,
      areasOfConcern,
      generatedAt: now,
    };

    // Cache the result
    const cacheTTL = this.CACHE_TTL[period];
    try {
      await this.redisService.set(cacheKey, JSON.stringify(response), cacheTTL);
      this.logger.log(`Cached trend insights for ${period} period (TTL: ${cacheTTL}s): ${cacheKey}`);
    } catch (error) {
      this.logger.warn(`Failed to cache insights: ${error}`);
      // Continue without caching - not a critical error
    }

    return response;
  }
}
