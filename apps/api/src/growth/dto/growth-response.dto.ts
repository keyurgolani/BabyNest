import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Imperial weight measurements
 */
export class ImperialWeightDto {
  @ApiProperty({
    description: 'Total weight in pounds (decimal)',
    example: 7.72,
  })
  pounds: number;

  @ApiProperty({
    description: 'Weight broken down into whole pounds',
    example: 7,
  })
  wholePounds: number;

  @ApiProperty({
    description: 'Remaining ounces after whole pounds',
    example: 11.5,
  })
  ounces: number;

  @ApiProperty({
    description: 'Total weight in ounces',
    example: 123.5,
  })
  totalOunces: number;
}

/**
 * Imperial length measurements
 */
export class ImperialLengthDto {
  @ApiProperty({
    description: 'Total length in inches (decimal)',
    example: 19.69,
  })
  inches: number;
}

/**
 * Metric measurements for growth entry
 */
export class MetricMeasurementsDto {
  @ApiPropertyOptional({
    description: 'Weight in grams',
    example: 3500,
    nullable: true,
  })
  weight: number | null;

  @ApiPropertyOptional({
    description: 'Weight in kilograms',
    example: 3.5,
    nullable: true,
  })
  weightKg: number | null;

  @ApiPropertyOptional({
    description: 'Height in millimeters',
    example: 500,
    nullable: true,
  })
  height: number | null;

  @ApiPropertyOptional({
    description: 'Height in centimeters',
    example: 50,
    nullable: true,
  })
  heightCm: number | null;

  @ApiPropertyOptional({
    description: 'Head circumference in millimeters',
    example: 350,
    nullable: true,
  })
  headCircumference: number | null;

  @ApiPropertyOptional({
    description: 'Head circumference in centimeters',
    example: 35,
    nullable: true,
  })
  headCircumferenceCm: number | null;
}

/**
 * Imperial measurements for growth entry
 */
export class ImperialMeasurementsDto {
  @ApiPropertyOptional({
    description: 'Weight in pounds (decimal)',
    example: 7.72,
    nullable: true,
  })
  weightLbs: number | null;

  @ApiPropertyOptional({
    description: 'Weight broken down: whole pounds',
    example: 7,
    nullable: true,
  })
  weightWholeLbs: number | null;

  @ApiPropertyOptional({
    description: 'Weight broken down: remaining ounces',
    example: 11.5,
    nullable: true,
  })
  weightOz: number | null;

  @ApiPropertyOptional({
    description: 'Total weight in ounces',
    example: 123.5,
    nullable: true,
  })
  weightTotalOz: number | null;

  @ApiPropertyOptional({
    description: 'Height in inches',
    example: 19.69,
    nullable: true,
  })
  heightIn: number | null;

  @ApiPropertyOptional({
    description: 'Head circumference in inches',
    example: 13.78,
    nullable: true,
  })
  headCircumferenceIn: number | null;
}

/**
 * Converted measurements in both metric and imperial units
 */
export class ConvertedMeasurementsDto {
  @ApiProperty({
    description: 'Measurements in metric units',
    type: MetricMeasurementsDto,
  })
  metric: MetricMeasurementsDto;

  @ApiProperty({
    description: 'Measurements in imperial units',
    type: ImperialMeasurementsDto,
  })
  imperial: ImperialMeasurementsDto;
}

/**
 * Response DTO for a growth entry
 * Validates: Requirements 6.1, 6.4
 */
export class GrowthResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the growth entry',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this growth entry belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who logged this growth entry',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiPropertyOptional({
    description: 'Weight in grams (e.g., 3500 = 3.5 kg)',
    example: 3500,
    nullable: true,
  })
  weight: number | null;

  @ApiPropertyOptional({
    description: 'Height/length in millimeters (e.g., 500 = 50 cm)',
    example: 500,
    nullable: true,
  })
  height: number | null;

  @ApiPropertyOptional({
    description: 'Head circumference in millimeters (e.g., 350 = 35 cm)',
    example: 350,
    nullable: true,
  })
  headCircumference: number | null;

  @ApiPropertyOptional({
    description: 'Weight percentile based on WHO growth standards',
    example: 50.5,
    nullable: true,
  })
  weightPercentile: number | null;

  @ApiPropertyOptional({
    description: 'Height percentile based on WHO growth standards',
    example: 75.2,
    nullable: true,
  })
  heightPercentile: number | null;

  @ApiPropertyOptional({
    description: 'Head circumference percentile based on WHO growth standards',
    example: 60.0,
    nullable: true,
  })
  headPercentile: number | null;

  @ApiPropertyOptional({
    description: 'Additional notes about the measurement',
    example: 'Measured at pediatrician visit',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Timestamp when the measurement was taken',
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

  @ApiPropertyOptional({
    description: 'Measurements converted to both metric and imperial units. Only included when includeConversions=true query parameter is set.',
    type: ConvertedMeasurementsDto,
  })
  convertedMeasurements?: ConvertedMeasurementsDto;
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
 * Response DTO for paginated list of growth entries
 */
export class GrowthListResponseDto {
  @ApiProperty({
    description: 'List of growth entries',
    type: [GrowthResponseDto],
  })
  data: GrowthResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
