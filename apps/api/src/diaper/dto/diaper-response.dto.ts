import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { DiaperType } from './create-diaper.dto';

/**
 * Response DTO for a diaper entry
 * Validates: Requirements 5.1, 5.2
 */
export class DiaperResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the diaper entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this diaper entry belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who logged this diaper entry',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'Type of diaper change (wet/dirty/mixed/dry)',
    enum: DiaperType,
    example: DiaperType.WET,
  })
  type: DiaperType;

  @ApiPropertyOptional({
    description: 'Color of the stool (for dirty/mixed diapers)',
    example: 'yellow',
    nullable: true,
  })
  color: string | null;

  @ApiPropertyOptional({
    description: 'Consistency of the stool (for dirty/mixed diapers)',
    example: 'soft',
    nullable: true,
  })
  consistency: string | null;

  @ApiProperty({
    description: 'Whether the baby has a diaper rash',
    example: false,
  })
  hasRash: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes about the diaper change',
    example: 'Applied diaper cream',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Timestamp when the diaper change occurred',
    example: '2024-01-15T10:30:00.000Z',
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
 * Response DTO for paginated list of diaper entries
 */
export class DiaperListResponseDto {
  @ApiProperty({
    description: 'List of diaper entries',
    type: [DiaperResponseDto],
  })
  data: DiaperResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
