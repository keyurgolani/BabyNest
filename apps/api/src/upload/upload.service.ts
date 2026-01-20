import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

export interface UploadResult {
  url: string;
  thumbnailUrl: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Injectable()
export class UploadService {
  private readonly uploadsDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadsDir = join(process.cwd(), 'uploads');
    // Use API URL for serving files
    const apiUrl = this.configService.get<string>('API_URL', 'http://localhost:3001');
    const apiPrefix = this.configService.get<string>('API_PREFIX', 'api/v1');
    this.baseUrl = `${apiUrl}/${apiPrefix}/uploads`;
  }

  async processUpload(file: MulterFile): Promise<UploadResult> {
    const filename = file.filename;
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = join(this.uploadsDir, thumbnailFilename);

    // Generate thumbnail using sharp
    try {
      await sharp(file.path)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    } catch (error) {
      // If thumbnail generation fails, use original as thumbnail
      console.error('Thumbnail generation failed:', error);
    }

    return {
      url: `${this.baseUrl}/${filename}`,
      thumbnailUrl: existsSync(thumbnailPath)
        ? `${this.baseUrl}/${thumbnailFilename}`
        : `${this.baseUrl}/${filename}`,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  getFilePath(filename: string): string {
    const filePath = join(this.uploadsDir, filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return filePath;
  }

  deleteFile(filename: string): boolean {
    const filePath = join(this.uploadsDir, filename);
    const thumbnailPath = join(this.uploadsDir, `thumb_${filename}`);

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
      if (existsSync(thumbnailPath)) {
        unlinkSync(thumbnailPath);
      }
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }
}
