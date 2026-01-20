import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AuthModule } from '../auth/auth.module';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      storage: diskStorage({
        destination: uploadsDir,
        filename: (
          _req: unknown,
          file: { originalname: string },
          callback: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueName = `${generateUniqueId()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (
        _req: unknown,
        file: { mimetype: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        // Only allow images
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp|heic|heif)$/)) {
          callback(new Error('Only image files are allowed'), false);
          return;
        }
        callback(null, true);
      },
      limits: {
        fileSize: 200 * 1024 * 1024, // 200MB max for high-quality baby photos and memories
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
