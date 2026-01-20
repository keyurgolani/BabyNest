import { Module } from '@nestjs/common';

import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';
import { AuthModule } from '../auth/auth.module';
import { BabyModule } from '../baby/baby.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Reminder Module
 * Provides reminder/notification scheduling functionality
 */
@Module({
  imports: [PrismaModule, AuthModule, BabyModule],
  controllers: [ReminderController],
  providers: [ReminderService],
  exports: [ReminderService],
})
export class ReminderModule {}
