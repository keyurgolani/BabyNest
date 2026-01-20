import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MedicationFrequency } from '../../utils/medication-due-time.util';
import { PaginationMetaDto } from '../shared/pagination.dto';

/**
 * Response DTO for a medication entry
 * Validates: Requirements 8.1, 8.2
 */
export class MedicationResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the medication entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this medication entry belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who logged this medication',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'Name of the medication',
    example: 'Infant Tylenol',
  })
  name: string;

  @ApiProperty({
    description: 'Dosage amount',
    example: '2.5',
  })
  dosage: string;

  @ApiProperty({
    description: 'Unit of measurement for dosage',
    example: 'ml',
  })
  unit: string;

  @ApiProperty({
    description: 'Frequency of medication',
    enum: MedicationFrequency,
    example: MedicationFrequency.EVERY_4_HOURS,
    enumName: 'MedicationFrequency',
  })
  frequency: string;

  @ApiProperty({
    description: 'Timestamp when the medication was administered',
    example: '2024-06-15T10:30:00.000Z',
  })
  timestamp: Date;

  @ApiPropertyOptional({
    description: 'Next due time for the medication (automatically calculated based on frequency)',
    example: '2024-06-15T14:30:00.000Z',
    nullable: true,
  })
  nextDueAt: Date | null;

  @ApiPropertyOptional({
    description: 'Additional notes about the medication',
    example: 'Given for fever after vaccination',
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
 * Response DTO for paginated list of medication entries
 */
export class MedicationListResponseDto {
  @ApiProperty({
    description: 'List of medication entries',
    type: [MedicationResponseDto],
  })
  data: MedicationResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
