import { Module } from '@nestjs/common';

import { MilestoneController } from './milestone.controller';
import { MilestoneService } from './milestone.service';
import { AuthModule } from '../auth/auth.module';
import { BabyModule } from '../baby/baby.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Milestone Module
 * Provides milestone tracking functionality
 * Validates: Requirements 7.1, 7.2, 7.4, 7.5
 */
@Module({
  imports: [PrismaModule, AuthModule, BabyModule],
  controllers: [MilestoneController],
  providers: [MilestoneService],
  exports: [MilestoneService],
})
export class MilestoneModule {}
