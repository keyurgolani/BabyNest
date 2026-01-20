import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SleepType, SleepQuality } from './create-sleep.dto';

/**
 * Response DTO for a sleep entry
 * Validates: Requirements 4.1, 4.2, 4.5
 */
export class SleepResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the sleep entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this sleep entry belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who logged this sleep entry',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'Start time of the sleep session',
    example: '2024-01-15T20:00:00.000Z',
  })
  startTime: Date;

  @ApiPropertyOptional({
    description: 'End time of the sleep session (null if ongoing)',
    example: '2024-01-16T06:30:00.000Z',
    nullable: true,
  })
  endTime: Date | null;

  @ApiPropertyOptional({
    description: 'Duration of sleep in minutes (calculated from start and end time)',
    example: 630,
    nullable: true,
  })
  duration: number | null;

  @ApiProperty({
    description: 'Type of sleep (nap or night sleep)',
    enum: SleepType,
    example: SleepType.NIGHT,
  })
  sleepType: SleepType;

  @ApiPropertyOptional({
    description: 'Quality of sleep',
    enum: SleepQuality,
    example: SleepQuality.GOOD,
    nullable: true,
  })
  quality: SleepQuality | null;

  @ApiPropertyOptional({
    description: 'Notes about sleep conditions and disturbances',
    example: 'Woke up once for feeding, went back to sleep easily',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Timestamp when the activity occurred (same as startTime)',
    example: '2024-01-15T20:00:00.000Z',
  })
  timestamp: Date;

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
 * Response DTO for paginated list of sleep entries
 */
export class SleepListResponseDto {
  @ApiProperty({
    description: 'List of sleep entries',
    type: [SleepResponseDto],
  })
  data: SleepResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
