import { Module } from '@nestjs/common';

import { SleepController } from './sleep.controller';
import { SleepService } from './sleep.service';
import { AuthModule } from '../auth/auth.module';
import { BabyModule } from '../baby/baby.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Sleep Module
 * Provides sleep tracking functionality
 * Validates: Requirements 4.1, 4.2, 4.5
 */
@Module({
  imports: [PrismaModule, AuthModule, BabyModule],
  controllers: [SleepController],
  providers: [SleepService],
  exports: [SleepService],
})
export class SleepModule {}
