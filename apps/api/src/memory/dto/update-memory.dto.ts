import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
  IsEnum,
} from 'class-validator';

import { MemoryEntryType, LinkedEntryType } from './create-memory.dto';

/**
 * DTO for updating a memory entry
 * All fields are optional - only provided fields will be updated
 */
export class UpdateMemoryDto {
  @ApiPropertyOptional({
    description: 'Title for the memory',
    example: 'First smile!',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null;

  @ApiPropertyOptional({
    description: 'Note or description for the memory',
    example: 'Baby smiled for the first time today while playing with daddy!',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;

  @ApiPropertyOptional({
    description: 'URL to the photo or base64 data URL',
    example: 'https://example.com/photos/first-smile.jpg',
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to the thumbnail image or base64 data URL',
    example: 'https://example.com/photos/first-smile-thumb.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Type of memory entry',
    enum: MemoryEntryType,
  })
  @IsOptional()
  @IsEnum(MemoryEntryType)
  entryType?: MemoryEntryType;

  @ApiPropertyOptional({
    description: 'ID of a linked entry (feeding, sleep, diaper, etc.)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  linkedEntryId?: string | null;

  @ApiPropertyOptional({
    description: 'Type of the linked entry',
    enum: LinkedEntryType,
  })
  @IsOptional()
  @IsEnum(LinkedEntryType)
  linkedEntryType?: LinkedEntryType | null;

  @ApiPropertyOptional({
    description: 'When the photo was taken',
    example: '2024-06-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  takenAt?: string;
}
