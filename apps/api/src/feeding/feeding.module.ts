import { Module } from '@nestjs/common';

import { FeedingController } from './feeding.controller';
import { FeedingService } from './feeding.service';
import { AuthModule } from '../auth/auth.module';
import { BabyModule } from '../baby/baby.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Feeding Module
 * Provides feeding tracking functionality
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
@Module({
  imports: [PrismaModule, AuthModule, BabyModule],
  controllers: [FeedingController],
  providers: [FeedingService],
  exports: [FeedingService],
})
export class FeedingModule {}
