import { Module } from '@nestjs/common';

import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { AuthModule } from '../auth/auth.module';
import { BabyModule } from '../baby/baby.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Activity Module
 * Provides activity tracking functionality (tummy time, bath, outdoor, play)
 * Validates: Requirements 9.1, 9.2, 9.3
 */
@Module({
  imports: [PrismaModule, AuthModule, BabyModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
