import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationMetaDto } from '../shared/pagination.dto';

/**
 * Response DTO for a symptom entry
 * Validates: Requirements 8.5
 */
export class SymptomResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the symptom entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this symptom entry belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who logged this symptom',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'Type of symptom',
    example: 'fever',
  })
  symptomType: string;

  @ApiProperty({
    description: 'Severity of the symptom',
    example: 'mild',
  })
  severity: string;

  @ApiProperty({
    description: 'Timestamp when the symptom was observed',
    example: '2024-06-15T10:30:00.000Z',
  })
  timestamp: Date;

  @ApiPropertyOptional({
    description: 'Temperature in Celsius (if applicable)',
    example: 38.5,
    nullable: true,
  })
  temperature: number | null;

  @ApiPropertyOptional({
    description: 'Additional notes about the symptom',
    example: 'Started after dinner, seems uncomfortable',
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
 * Response DTO for paginated list of symptom entries
 */
export class SymptomListResponseDto {
  @ApiProperty({
    description: 'List of symptom entries',
    type: [SymptomResponseDto],
  })
  data: SymptomResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
