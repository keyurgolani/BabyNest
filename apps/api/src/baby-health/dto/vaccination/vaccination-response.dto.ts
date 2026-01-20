import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationMetaDto } from '../shared/pagination.dto';

/**
 * Vaccination status enum for API responses
 * Validates: Requirements 8.4
 */
export enum VaccinationStatusDto {
  COMPLETED = 'completed',
  UPCOMING = 'upcoming',
  OVERDUE = 'overdue',
}

/**
 * Response DTO for a vaccination entry
 * Validates: Requirements 8.3, 8.4
 */
export class VaccinationResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the vaccination entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this vaccination entry belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who logged this vaccination',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'Name of the vaccine',
    example: 'DTaP (Diphtheria, Tetanus, Pertussis)',
  })
  vaccineName: string;

  @ApiProperty({
    description: 'Timestamp when the vaccination was administered',
    example: '2024-06-15T10:30:00.000Z',
  })
  timestamp: Date;

  @ApiPropertyOptional({
    description: 'Healthcare provider who administered the vaccine',
    example: 'Dr. Smith',
    nullable: true,
  })
  provider: string | null;

  @ApiPropertyOptional({
    description: 'Location where the vaccine was administered',
    example: 'City Pediatric Clinic',
    nullable: true,
  })
  location: string | null;

  @ApiPropertyOptional({
    description: 'Next due date for follow-up vaccination',
    example: '2024-08-15T00:00:00.000Z',
    nullable: true,
  })
  nextDueAt: Date | null;

  @ApiPropertyOptional({
    description: 'Additional notes about the vaccination',
    example: 'No adverse reactions observed',
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
    description: 'Vaccination status (completed, upcoming, or overdue)',
    enum: VaccinationStatusDto,
    example: VaccinationStatusDto.COMPLETED,
  })
  status?: VaccinationStatusDto;
}

/**
 * Response DTO for paginated list of vaccination entries
 */
export class VaccinationListResponseDto {
  @ApiProperty({
    description: 'List of vaccination entries',
    type: [VaccinationResponseDto],
  })
  data: VaccinationResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
