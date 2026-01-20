import { Module } from '@nestjs/common';

import { GrowthController } from './growth.controller';
import { GrowthService } from './growth.service';
import { PercentileService } from './percentile.service';
import { AuthModule } from '../auth/auth.module';
import { BabyModule } from '../baby/baby.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Growth Module
 * Provides growth tracking functionality with WHO percentile calculations
 * Validates: Requirements 6.1, 6.2
 */
@Module({
  imports: [PrismaModule, AuthModule, BabyModule],
  controllers: [GrowthController],
  providers: [GrowthService, PercentileService],
  exports: [GrowthService, PercentileService],
})
export class GrowthModule {}
