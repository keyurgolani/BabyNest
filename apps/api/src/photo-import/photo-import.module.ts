import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { PhotoImportController } from './photo-import.controller';
import { PhotoImportService } from './photo-import.service';
import { ActivityModule } from '../activity/activity.module';
import { AuthModule } from '../auth/auth.module';
import { BabyHealthModule } from '../baby-health/baby-health.module';
import { DiaperModule } from '../diaper/diaper.module';
import { FeedingModule } from '../feeding/feeding.module';
import { SleepModule } from '../sleep/sleep.module';

// Ensure uploads directory exists for photo imports
const uploadsDir = join(process.cwd(), 'uploads', 'photo-imports');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

@Module({
  imports: [
    AuthModule,
    FeedingModule,
    SleepModule,
    DiaperModule,
    BabyHealthModule,
    ActivityModule,
    MulterModule.register({
      storage: diskStorage({
        destination: uploadsDir,
        filename: (
          _req: unknown,
          file: { originalname: string },
          callback: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueName = `photo-import-${generateUniqueId()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (
        _req: unknown,
        file: { mimetype: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        // Only allow images suitable for OCR/vision analysis
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|heic|heif)$/)) {
          callback(new Error('Only image files are allowed (JPEG, PNG, WebP, HEIC)'), false);
          return;
        }
        callback(null, true);
      },
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max for photo analysis
      },
    }),
  ],
  controllers: [PhotoImportController],
  providers: [PhotoImportService],
  exports: [PhotoImportService],
})
export class PhotoImportModule {}
