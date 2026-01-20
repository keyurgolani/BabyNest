import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MemoryEntryType, LinkedEntryType } from './create-memory.dto';

/**
 * Response DTO for a memory entry
 */
export class MemoryResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the memory entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this memory belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who created this memory',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiPropertyOptional({
    description: 'Title for the memory',
    example: 'First smile!',
    nullable: true,
  })
  title: string | null;

  @ApiPropertyOptional({
    description: 'Note or description for the memory',
    example: 'Baby smiled for the first time today!',
    nullable: true,
  })
  note: string | null;

  @ApiProperty({
    description: 'URL to the photo',
    example: 'https://example.com/photos/first-smile.jpg',
  })
  photoUrl: string;

  @ApiPropertyOptional({
    description: 'URL to the thumbnail image',
    example: 'https://example.com/photos/first-smile-thumb.jpg',
    nullable: true,
  })
  thumbnailUrl: string | null;

  @ApiProperty({
    description: 'Type of memory entry',
    enum: MemoryEntryType,
    example: MemoryEntryType.PHOTO,
  })
  entryType: string;

  @ApiPropertyOptional({
    description: 'ID of a linked entry',
    example: '550e8400-e29b-41d4-a716-446655440003',
    nullable: true,
  })
  linkedEntryId: string | null;

  @ApiPropertyOptional({
    description: 'Type of the linked entry',
    enum: LinkedEntryType,
    nullable: true,
  })
  linkedEntryType: string | null;

  @ApiProperty({
    description: 'When the photo was taken',
    example: '2024-06-15T10:30:00.000Z',
  })
  takenAt: Date;

  @ApiProperty({
    description: 'Entry creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Last sync timestamp (null if not synced)',
    nullable: true,
  })
  syncedAt: Date | null;

  @ApiProperty({
    description: 'Whether the entry is soft-deleted',
    example: false,
  })
  isDeleted: boolean;
}

/**
 * Pagination metadata
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number (1-indexed)',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;
}

/**
 * Response DTO for paginated list of memory entries
 */
export class MemoryListResponseDto {
  @ApiProperty({
    description: 'List of memory entries',
    type: [MemoryResponseDto],
  })
  data: MemoryResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

/**
 * A group of memories for a specific date
 */
export class MemoryDateGroupDto {
  @ApiProperty({
    description: 'Date string (YYYY-MM-DD)',
    example: '2024-06-15',
  })
  date: string;

  @ApiProperty({
    description: 'Number of memories on this date',
    example: 5,
  })
  count: number;

  @ApiProperty({
    description: 'Memories for this date',
    type: [MemoryResponseDto],
  })
  memories: MemoryResponseDto[];
}

/**
 * Response DTO for timeline view of memories
 */
export class MemoryTimelineResponseDto {
  @ApiProperty({
    description: 'Baby ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Total number of memories',
    example: 50,
  })
  totalMemories: number;

  @ApiProperty({
    description: 'Memories grouped by date',
    type: [MemoryDateGroupDto],
  })
  groups: MemoryDateGroupDto[];

  @ApiProperty({
    description: 'Whether there are more memories to load',
    example: true,
  })
  hasMore: boolean;

  @ApiPropertyOptional({
    description: 'Cursor for loading more memories (date of last group)',
    example: '2024-06-01',
    nullable: true,
  })
  nextCursor: string | null;
}
