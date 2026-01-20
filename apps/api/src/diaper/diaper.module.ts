import { Module } from '@nestjs/common';

import { DiaperController } from './diaper.controller';
import { DiaperService } from './diaper.service';
import { AuthModule } from '../auth/auth.module';
import { BabyModule } from '../baby/baby.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Diaper Module
 * Provides diaper tracking functionality
 * Validates: Requirements 5.1, 5.2
 */
@Module({
  imports: [PrismaModule, AuthModule, BabyModule],
  controllers: [DiaperController],
  providers: [DiaperService],
  exports: [DiaperService],
})
export class DiaperModule {}
