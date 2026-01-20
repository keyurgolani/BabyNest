import { Module } from '@nestjs/common';

import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';
import { AuthModule } from '../auth/auth.module';
import { BabyModule } from '../baby/baby.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Memory Module
 * Provides photo journal/memory functionality for tracking baby moments
 */
@Module({
  imports: [PrismaModule, AuthModule, BabyModule],
  controllers: [MemoryController],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
