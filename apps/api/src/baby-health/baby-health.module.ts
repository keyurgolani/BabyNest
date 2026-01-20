import { Module } from '@nestjs/common';

import { BabyHealthController } from './baby-health.controller';
import { BabyHealthService } from './baby-health.service';
import { AuthModule } from '../auth/auth.module';
import { BabyModule } from '../baby/baby.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Baby Health Module
 * Provides health tracking functionality (medications, vaccinations, symptoms, doctor visits)
 * Validates: Requirements 8.1, 8.3, 8.5, 8.6
 */
@Module({
  imports: [PrismaModule, AuthModule, BabyModule],
  controllers: [BabyHealthController],
  providers: [BabyHealthService],
  exports: [BabyHealthService],
})
export class BabyHealthModule {}
