import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Milestone category enum
 */
export enum MilestoneCategory {
  MOTOR = 'motor',
  COGNITIVE = 'cognitive',
  SOCIAL = 'social',
  LANGUAGE = 'language',
}

/**
 * Response DTO for a milestone definition
 * Validates: Requirements 7.1
 */
export class MilestoneDefinitionResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the milestone definition',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Category of the milestone',
    enum: MilestoneCategory,
    example: 'motor',
  })
  category: string;

  @ApiProperty({
    description: 'Name of the milestone',
    example: 'First Steps',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the milestone',
    example: 'Baby takes first independent steps without support',
  })
  description: string;

  @ApiProperty({
    description: 'Minimum expected age in months for this milestone',
    example: 9,
  })
  expectedAgeMonthsMin: number;

  @ApiProperty({
    description: 'Maximum expected age in months for this milestone',
    example: 12,
  })
  expectedAgeMonthsMax: number;
}

/**
 * Response DTO for a milestone entry (achieved milestone)
 * Validates: Requirements 7.2
 */
export class MilestoneEntryResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the milestone entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this milestone entry belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who logged this milestone',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'ID of the milestone definition',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  milestoneId: string;

  @ApiProperty({
    description: 'Date when the milestone was achieved',
    example: '2024-06-15T10:30:00.000Z',
  })
  achievedDate: Date;

  @ApiPropertyOptional({
    description: 'URL to a photo documenting the milestone',
    example: 'https://example.com/photos/first-steps.jpg',
    nullable: true,
  })
  photoUrl: string | null;

  @ApiPropertyOptional({
    description: 'Notes about the milestone achievement',
    example: 'Took first steps while holding onto the couch!',
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

  @ApiPropertyOptional({
    description: 'The milestone definition details',
    type: MilestoneDefinitionResponseDto,
  })
  milestone?: MilestoneDefinitionResponseDto;
}

/**
 * Combined milestone with achievement status
 * Validates: Requirements 7.1, 7.2, 7.4
 */
export class MilestoneWithStatusDto {
  @ApiProperty({
    description: 'The milestone definition',
    type: MilestoneDefinitionResponseDto,
  })
  definition: MilestoneDefinitionResponseDto;

  @ApiProperty({
    description: 'Whether this milestone has been achieved',
    example: true,
  })
  isAchieved: boolean;

  @ApiPropertyOptional({
    description: 'The achievement entry if milestone is achieved',
    type: MilestoneEntryResponseDto,
    nullable: true,
  })
  achievement: MilestoneEntryResponseDto | null;

  @ApiProperty({
    description: 'Whether this milestone is upcoming based on baby age',
    example: false,
  })
  isUpcoming: boolean;

  @ApiProperty({
    description: 'Whether this milestone is delayed (past expected age range)',
    example: false,
  })
  isDelayed: boolean;

  @ApiPropertyOptional({
    description: 'Age in months when achieved (if achieved)',
    example: 10.5,
    nullable: true,
  })
  achievedAgeMonths: number | null;
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
 * Response DTO for paginated list of milestone entries
 */
export class MilestoneEntryListResponseDto {
  @ApiProperty({
    description: 'List of milestone entries',
    type: [MilestoneEntryResponseDto],
  })
  data: MilestoneEntryResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

/**
 * Response DTO for milestones grouped by category with status
 */
export class MilestonesByCategoryResponseDto {
  @ApiProperty({
    description: 'Baby ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Baby age in months',
    example: 10.5,
  })
  babyAgeMonths: number;

  @ApiProperty({
    description: 'Motor milestones (movement)',
    type: [MilestoneWithStatusDto],
  })
  motor: MilestoneWithStatusDto[];

  @ApiProperty({
    description: 'Cognitive milestones',
    type: [MilestoneWithStatusDto],
  })
  cognitive: MilestoneWithStatusDto[];

  @ApiProperty({
    description: 'Social milestones',
    type: [MilestoneWithStatusDto],
  })
  social: MilestoneWithStatusDto[];

  @ApiProperty({
    description: 'Language milestones',
    type: [MilestoneWithStatusDto],
  })
  language: MilestoneWithStatusDto[];

  @ApiProperty({
    description: 'Summary statistics',
  })
  summary: {
    totalMilestones: number;
    achievedCount: number;
    upcomingCount: number;
    delayedCount: number;
  };
}
