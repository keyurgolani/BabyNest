import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  InsightCadence,
  InsightType,
  ConfigureInsightCadenceDto,
  InsightConfigResponseDto,
  GenerateAdhocInsightDto,
  GeneratedInsightResponseDto,
  InsightHistoryQueryDto,
  InsightHistoryListResponseDto,
} from './dto';
import { InsightsService } from './insights.service';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Insight Configuration Service
 * Manages AI insight generation cadence and history
 */
@Injectable()
export class InsightConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
    private readonly insightsService: InsightsService,
  ) {}

  /**
   * Calculate next generation time based on cadence
   */
  private calculateNextGeneration(cadence: InsightCadence, from: Date = new Date()): Date | null {
    const next = new Date(from);

    switch (cadence) {
      case InsightCadence.EVERYTIME: {
        // For everytime, we don't schedule - it's generated on-demand
        return null;
      }
      case InsightCadence.DAILY: {
        // Next day at 9 AM
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0);
        return next;
      }
      case InsightCadence.WEEKLY: {
        // Next Monday at 9 AM
        const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
        next.setDate(next.getDate() + daysUntilMonday);
        next.setHours(9, 0, 0, 0);
        return next;
      }
      case InsightCadence.MONTHLY: {
        // First day of next month at 9 AM
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(9, 0, 0, 0);
        return next;
      }
      default:
        return null;
    }
  }

  /**
   * Transform InsightConfig to response DTO
   */
  private toConfigResponse(config: any): InsightConfigResponseDto {
    return {
      id: config.id,
      babyId: config.babyId,
      cadence: config.cadence as InsightCadence,
      isEnabled: config.isEnabled,
      lastGenerated: config.lastGenerated,
      nextGeneration: config.nextGeneration,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Transform GeneratedInsight to response DTO
   */
  private toInsightResponse(insight: any): GeneratedInsightResponseDto {
    return {
      id: insight.id,
      babyId: insight.babyId,
      type: insight.type as InsightType,
      content: insight.content,
      generatedAt: insight.generatedAt,
      periodStart: insight.periodStart,
      periodEnd: insight.periodEnd,
    };
  }

  /**
   * Configure insight generation cadence for a baby
   */
  async configureInsightCadence(
    babyId: string,
    caregiverId: string,
    dto: ConfigureInsightCadenceDto,
  ): Promise<InsightConfigResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const isEnabled = dto.isEnabled !== undefined ? dto.isEnabled : true;
    const nextGeneration = isEnabled ? this.calculateNextGeneration(dto.cadence) : null;

    // Upsert configuration
    const config = await this.prisma.insightConfig.upsert({
      where: { babyId },
      create: {
        babyId,
        cadence: dto.cadence,
        isEnabled,
        nextGeneration,
      },
      update: {
        cadence: dto.cadence,
        isEnabled,
        nextGeneration,
      },
    });

    return this.toConfigResponse(config);
  }

  /**
   * Get current insight configuration for a baby
   */
  async getInsightConfig(
    babyId: string,
    caregiverId: string,
  ): Promise<InsightConfigResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    let config = await this.prisma.insightConfig.findUnique({
      where: { babyId },
    });

    // Create default configuration if it doesn't exist
    if (!config) {
      config = await this.prisma.insightConfig.create({
        data: {
          babyId,
          cadence: InsightCadence.WEEKLY,
          isEnabled: true,
          nextGeneration: this.calculateNextGeneration(InsightCadence.WEEKLY),
        },
      });
    }

    return this.toConfigResponse(config);
  }

  /**
   * Generate adhoc insight for a baby
   */
  async generateAdhocInsight(
    babyId: string,
    caregiverId: string,
    dto: GenerateAdhocInsightDto,
  ): Promise<GeneratedInsightResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const insightType = dto.type || InsightType.WEEKLY_SUMMARY;
    const now = new Date();
    const endDate = dto.endDate ? new Date(dto.endDate) : now;
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days

    // Set time to start/end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let content: any;

    // Generate the appropriate insight based on type
    switch (insightType) {
      case InsightType.WEEKLY_SUMMARY: {
        const summary = await this.insightsService.getWeeklySummary(babyId, caregiverId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        content = summary;
        break;
      }
      case InsightType.SLEEP_PREDICTION: {
        const prediction = await this.insightsService.getSleepPrediction(babyId, caregiverId, {
          analysisDays: 7,
        });
        content = prediction;
        break;
      }
      case InsightType.ANOMALY: {
        const anomalies = await this.insightsService.detectAnomalies(babyId, caregiverId, {
          analysisHours: 48,
        });
        content = anomalies;
        break;
      }
      case InsightType.DAILY_SUMMARY: {
        const summary = await this.insightsService.getDailySummary(babyId, caregiverId, {
          date: endDate.toISOString().split('T')[0],
        });
        content = summary;
        break;
      }
      case InsightType.TREND: {
        const trends = await this.insightsService.getTrendInsights(babyId, caregiverId, 'weekly', {
          endDate: endDate.toISOString(),
        });
        content = trends;
        break;
      }
      default:
        throw new Error(`Unsupported insight type: ${insightType}`);
    }

    // Store the generated insight
    const insight = await this.prisma.generatedInsight.create({
      data: {
        babyId,
        type: insightType,
        content,
        periodStart: startDate,
        periodEnd: endDate,
      },
    });

    return this.toInsightResponse(insight);
  }

  /**
   * Get insight generation history for a baby
   */
  async getInsightHistory(
    babyId: string,
    caregiverId: string,
    query: InsightHistoryQueryDto,
  ): Promise<InsightHistoryListResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const where: any = { babyId };

    if (query.type) {
      where.type = query.type;
    }

    // Pagination with defaults
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [insights, total] = await Promise.all([
      this.prisma.generatedInsight.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.generatedInsight.count({ where }),
    ]);

    return {
      data: insights.map((i) => this.toInsightResponse(i)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Background job to generate scheduled insights
   * Runs every hour to check for due insights
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledInsights(): Promise<void> {
    const now = new Date();

    // Find all enabled configurations that are due for generation
    const dueConfigs = await this.prisma.insightConfig.findMany({
      where: {
        isEnabled: true,
        nextGeneration: {
          lte: now,
        },
      },
      include: {
        baby: {
          include: {
            caregivers: {
              take: 1,
            },
          },
        },
      },
    });

    for (const config of dueConfigs) {
      try {
        // Get the first caregiver for this baby
        const firstCaregiver = config.baby.caregivers[0];
        if (!firstCaregiver) {
          console.error(`No caregivers found for baby ${config.babyId}`);
          continue;
        }

        // Determine the period based on cadence
        const endDate = new Date();
        let startDate: Date;

        switch (config.cadence as InsightCadence) {
          case InsightCadence.DAILY:
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 1);
            break;
          case InsightCadence.WEEKLY:
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 7);
            break;
          case InsightCadence.MONTHLY:
            startDate = new Date(endDate);
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          default:
            continue; // Skip everytime cadence
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Generate weekly summary (default insight type for scheduled generation)
        const summary = await this.insightsService.getWeeklySummary(
          config.babyId,
          firstCaregiver.caregiverId,
          {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        );

        // Store the generated insight
        await this.prisma.generatedInsight.create({
          data: {
            babyId: config.babyId,
            type: InsightType.WEEKLY_SUMMARY,
            content: summary as any, // Cast to any to satisfy Prisma Json type
            periodStart: startDate,
            periodEnd: endDate,
          },
        });

        // Update the configuration with next generation time
        await this.prisma.insightConfig.update({
          where: { id: config.id },
          data: {
            lastGenerated: now,
            nextGeneration: this.calculateNextGeneration(config.cadence as InsightCadence, now),
          },
        });
      } catch (error) {
        console.error(`Failed to generate scheduled insight for baby ${config.babyId}:`, error);
        // Continue with next config even if one fails
      }
    }
  }
}
