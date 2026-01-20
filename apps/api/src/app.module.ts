import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { BabyModule } from './baby/baby.module';
import { BabyHealthModule } from './baby-health/baby-health.module';
import configuration from './config/configuration';
import { DashboardModule } from './dashboard/dashboard.module';
import { DiaperModule } from './diaper/diaper.module';
import { ExportModule } from './export/export.module';
import { FeedingModule } from './feeding/feeding.module';
import { GrowthModule } from './growth/growth.module';
import { HealthModule } from './health/health.module';
import { InsightsModule } from './insights/insights.module';
import { MemoryModule } from './memory/memory.module';
import { MilestoneModule } from './milestone/milestone.module';
import { OllamaModule } from './ollama/ollama.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ReminderModule } from './reminder/reminder.module';
import { SleepModule } from './sleep/sleep.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    // Configuration module - loads environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database module
    PrismaModule,

    // Redis module for caching and rate limiting
    RedisModule,

    // Health check module
    HealthModule,

    // Authentication module
    AuthModule,

    // Baby profile management module
    BabyModule,

    // Dashboard module for multi-baby summaries, alerts, and upcoming events
    DashboardModule,

    // Feeding tracking module
    FeedingModule,

    // Sleep tracking module
    SleepModule,

    // Diaper tracking module
    DiaperModule,

    // Growth tracking module
    GrowthModule,

    // Milestone tracking module
    MilestoneModule,

    // Baby health tracking module (medications, vaccinations, symptoms, doctor visits)
    BabyHealthModule,

    // Activity tracking module (tummy time, bath, outdoor, play)
    ActivityModule,

    // Export module for CSV export of all tracking categories
    ExportModule,

    // Ollama AI module for local AI-powered insights
    OllamaModule,

    // Insights module for AI-powered weekly summaries and analysis
    InsightsModule,

    // Memory/Photo Journal module for capturing baby moments
    MemoryModule,

    // Reminder module for feeding/sleep/diaper reminders with notifications
    ReminderModule,

    // File upload module for images
    UploadModule,

    // Feature modules will be added here as they are implemented:
    // SleepModule,
    // DiaperModule,
    // GrowthModule,
    // MilestoneModule,
    // HealthModule,
    // ActivityModule,
    // InsightsModule,
    // SyncModule,
    // ReportModule,
  ],
})
export class AppModule {}
