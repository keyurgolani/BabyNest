import { Module } from '@nestjs/common';

import { BabyController } from './baby.controller';
import { BabyService } from './baby.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Baby Module
 * Provides baby profile management functionality
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BabyController],
  providers: [BabyService],
  exports: [BabyService],
})
export class BabyModule {}
