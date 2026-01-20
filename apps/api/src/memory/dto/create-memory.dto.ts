import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
  IsEnum,
} from 'class-validator';

/**
 * Memory entry types
 */
export enum MemoryEntryType {
  PHOTO = 'photo',
  MILESTONE = 'milestone',
  FIRST = 'first',
  NOTE = 'note',
}

/**
 * Linked entry types for memories
 */
export enum LinkedEntryType {
  FEEDING = 'feeding',
  SLEEP = 'sleep',
  DIAPER = 'diaper',
  MILESTONE = 'milestone',
  GROWTH = 'growth',
  ACTIVITY = 'activity',
  MEDICATION = 'medication',
  VACCINATION = 'vaccination',
  SYMPTOM = 'symptom',
  DOCTOR_VISIT = 'doctorVisit',
}

/**
 * DTO for creating a memory entry
 */
export class CreateMemoryDto {
  @ApiPropertyOptional({
    description: 'Title for the memory',
    example: 'First smile!',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Note or description for the memory',
    example: 'Baby smiled for the first time today while playing with daddy!',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiProperty({
    description: 'URL to the uploaded photo (use POST /uploads to upload the photo first)',
    example: 'http://localhost:3001/api/v1/uploads/1234567890-abc123.jpg',
  })
  @IsString()
  photoUrl: string;

  @ApiPropertyOptional({
    description: 'URL to the thumbnail image (returned from POST /uploads)',
    example: 'http://localhost:3001/api/v1/uploads/thumb_1234567890-abc123.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Type of memory entry',
    enum: MemoryEntryType,
    example: MemoryEntryType.PHOTO,
  })
  @IsEnum(MemoryEntryType)
  entryType: MemoryEntryType;

  @ApiPropertyOptional({
    description: 'ID of a linked entry (feeding, sleep, diaper, etc.)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  linkedEntryId?: string;

  @ApiPropertyOptional({
    description: 'Type of the linked entry',
    enum: LinkedEntryType,
  })
  @IsOptional()
  @IsEnum(LinkedEntryType)
  linkedEntryType?: LinkedEntryType;

  @ApiPropertyOptional({
    description: 'When the photo was taken (defaults to now if not provided)',
    example: '2024-06-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  takenAt?: string;
}
