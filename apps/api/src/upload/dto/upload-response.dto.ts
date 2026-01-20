import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for file uploads
 * 
 * Upload endpoint accepts images up to 200MB to support high-quality baby photos and memories.
 * Supported formats: JPEG, PNG, GIF, WebP, HEIC, HEIF
 */
export class UploadResponseDto {
  @ApiProperty({
    description: 'URL to access the uploaded file',
    example: 'http://localhost:3001/api/v1/uploads/abc123.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'URL to access the thumbnail',
    example: 'http://localhost:3001/api/v1/uploads/thumb_abc123.jpg',
  })
  thumbnailUrl: string;

  @ApiProperty({
    description: 'Generated filename',
    example: 'abc123.jpg',
  })
  filename: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'my-photo.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  size: number;
}
