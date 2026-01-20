import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { BabyModule } from '../baby/baby.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, BabyModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
