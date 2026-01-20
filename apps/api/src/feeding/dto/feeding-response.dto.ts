import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  FeedingType,
  BreastSide,
  PumpSide,
  BottleType,
} from './create-feeding.dto';

/**
 * Response DTO for a feeding entry
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export class FeedingResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the feeding entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this feeding belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who logged this feeding',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'Type of feeding',
    enum: FeedingType,
    example: FeedingType.BREASTFEEDING,
  })
  type: FeedingType;

  @ApiProperty({
    description: 'Timestamp when the feeding occurred',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: Date;

  // Breastfeeding specific fields
  @ApiPropertyOptional({
    description: 'Duration on left breast in seconds (breastfeeding only)',
    example: 600,
    nullable: true,
  })
  leftDuration: number | null;

  @ApiPropertyOptional({
    description: 'Duration on right breast in seconds (breastfeeding only)',
    example: 480,
    nullable: true,
  })
  rightDuration: number | null;

  @ApiPropertyOptional({
    description: 'Last breast side used (breastfeeding only)',
    enum: BreastSide,
    example: BreastSide.LEFT,
    nullable: true,
  })
  lastSide: BreastSide | null;

  // Bottle specific fields
  @ApiPropertyOptional({
    description: 'Amount in milliliters (bottle only)',
    example: 120,
    nullable: true,
  })
  amount: number | null;

  @ApiPropertyOptional({
    description: 'Type of bottle content (bottle only)',
    enum: BottleType,
    example: BottleType.FORMULA,
    nullable: true,
  })
  bottleType: BottleType | null;

  // Pumping specific fields
  @ApiPropertyOptional({
    description: 'Amount pumped in milliliters (pumping only)',
    example: 100,
    nullable: true,
  })
  pumpedAmount: number | null;

  @ApiPropertyOptional({
    description: 'Breast side used for pumping (pumping only)',
    enum: PumpSide,
    example: PumpSide.BOTH,
    nullable: true,
  })
  pumpSide: PumpSide | null;

  // Solid food specific fields
  @ApiPropertyOptional({
    description: 'Type of solid food (solid only)',
    example: 'banana puree',
    nullable: true,
  })
  foodType: string | null;

  @ApiPropertyOptional({
    description: 'Reaction to solid food (solid only)',
    example: 'Loved it, no allergic reaction',
    nullable: true,
  })
  reaction: string | null;

  // Common fields
  @ApiPropertyOptional({
    description: 'Additional notes about the feeding',
    example: 'Baby was very hungry',
    nullable: true,
  })
  notes: string | null;

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
 * Response DTO for paginated list of feeding entries
 */
export class FeedingListResponseDto {
  @ApiProperty({
    description: 'List of feeding entries',
    type: [FeedingResponseDto],
  })
  data: FeedingResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
