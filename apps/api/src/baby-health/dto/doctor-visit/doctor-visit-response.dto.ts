import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationMetaDto } from '../shared/pagination.dto';

/**
 * Response DTO for a doctor visit entry
 * Validates: Requirements 8.6
 */
export class DoctorVisitResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the doctor visit entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this doctor visit entry belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who logged this doctor visit',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'Type of visit',
    example: 'checkup',
  })
  visitType: string;

  @ApiProperty({
    description: 'Healthcare provider name',
    example: 'Dr. Sarah Johnson',
  })
  provider: string;

  @ApiProperty({
    description: 'Timestamp of the visit',
    example: '2024-06-15T10:30:00.000Z',
  })
  timestamp: Date;

  @ApiPropertyOptional({
    description: 'Location of the visit',
    example: 'City Pediatric Clinic',
    nullable: true,
  })
  location: string | null;

  @ApiPropertyOptional({
    description: 'Diagnosis or findings from the visit',
    example: 'Healthy development, no concerns',
    nullable: true,
  })
  diagnosis: string | null;

  @ApiPropertyOptional({
    description: 'Follow-up appointment date',
    example: '2024-09-15T00:00:00.000Z',
    nullable: true,
  })
  followUpDate: Date | null;

  @ApiPropertyOptional({
    description: 'Additional notes about the visit',
    example: 'Weight and height on track. Next vaccines due at 6 months.',
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
 * Response DTO for paginated list of doctor visit entries
 */
export class DoctorVisitListResponseDto {
  @ApiProperty({
    description: 'List of doctor visit entries',
    type: [DoctorVisitResponseDto],
  })
  data: DoctorVisitResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
