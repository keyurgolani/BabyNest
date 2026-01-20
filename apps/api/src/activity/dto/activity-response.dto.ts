import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ActivityType } from './create-activity.dto';

/**
 * Response DTO for an activity entry
 * Validates: Requirements 9.1, 9.2, 9.3
 */
export class ActivityResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the activity entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this activity entry belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who logged this activity entry',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'Type of activity',
    enum: ActivityType,
    example: ActivityType.TUMMY_TIME,
  })
  activityType: ActivityType;

  @ApiPropertyOptional({
    description: 'Start time of the activity',
    example: '2024-01-15T10:00:00.000Z',
    nullable: true,
  })
  startTime: Date | null;

  @ApiPropertyOptional({
    description: 'End time of the activity (null if ongoing or not tracked)',
    example: '2024-01-15T10:15:00.000Z',
    nullable: true,
  })
  endTime: Date | null;

  @ApiPropertyOptional({
    description: 'Duration of activity in minutes (calculated from start and end time, or set directly)',
    example: 15,
    nullable: true,
  })
  duration: number | null;

  @ApiPropertyOptional({
    description: 'Notes about the activity',
    example: 'Baby enjoyed tummy time today, lifted head well',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Timestamp when the activity occurred',
    example: '2024-01-15T10:00:00.000Z',
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
 * Response DTO for paginated list of activity entries
 */
export class ActivityListResponseDto {
  @ApiProperty({
    description: 'List of activity entries',
    type: [ActivityResponseDto],
  })
  data: ActivityResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
