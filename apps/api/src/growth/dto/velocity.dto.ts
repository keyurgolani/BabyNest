import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

/**
 * Time unit for velocity calculation
 */
export enum VelocityTimeUnit {
  DAY = 'day',
  WEEK = 'week',
}

/**
 * Query DTO for growth velocity
 * Validates: Requirements 6.5
 */
export class GrowthVelocityQueryDto {
  @ApiPropertyOptional({
    description: 'Time unit for velocity calculation (default: week)',
    enum: VelocityTimeUnit,
    example: VelocityTimeUnit.WEEK,
  })
  @IsOptional()
  @IsEnum(VelocityTimeUnit)
  timeUnit?: VelocityTimeUnit;
}

/**
 * Single velocity data point between two measurements
 */
export class VelocityDataPointDto {
  @ApiProperty({
    description: 'Start date of the measurement period',
    example: '2024-01-01T10:00:00.000Z',
  })
  fromDate: Date;

  @ApiProperty({
    description: 'End date of the measurement period',
    example: '2024-01-15T10:00:00.000Z',
  })
  toDate: Date;

  @ApiProperty({
    description: 'Number of days between measurements',
    example: 14,
  })
  daysBetween: number;

  @ApiPropertyOptional({
    description: 'Weight gain rate (grams per time unit)',
    example: 200,
    nullable: true,
  })
  weightVelocity: number | null;

  @ApiPropertyOptional({
    description: 'Height growth rate (mm per time unit)',
    example: 10,
    nullable: true,
  })
  heightVelocity: number | null;

  @ApiPropertyOptional({
    description: 'Head circumference growth rate (mm per time unit)',
    example: 5,
    nullable: true,
  })
  headCircumferenceVelocity: number | null;

  @ApiPropertyOptional({
    description: 'Weight change (grams)',
    example: 400,
    nullable: true,
  })
  weightChange: number | null;

  @ApiPropertyOptional({
    description: 'Height change (mm)',
    example: 20,
    nullable: true,
  })
  heightChange: number | null;

  @ApiPropertyOptional({
    description: 'Head circumference change (mm)',
    example: 10,
    nullable: true,
  })
  headCircumferenceChange: number | null;
}

/**
 * Summary statistics for growth velocity
 */
export class VelocitySummaryDto {
  @ApiPropertyOptional({
    description: 'Average weight gain rate (grams per time unit)',
    example: 180,
    nullable: true,
  })
  averageWeightVelocity: number | null;

  @ApiPropertyOptional({
    description: 'Average height growth rate (mm per time unit)',
    example: 8,
    nullable: true,
  })
  averageHeightVelocity: number | null;

  @ApiPropertyOptional({
    description: 'Average head circumference growth rate (mm per time unit)',
    example: 4,
    nullable: true,
  })
  averageHeadCircumferenceVelocity: number | null;

  @ApiPropertyOptional({
    description: 'Total weight change over all measurements (grams)',
    example: 1500,
    nullable: true,
  })
  totalWeightChange: number | null;

  @ApiPropertyOptional({
    description: 'Total height change over all measurements (mm)',
    example: 80,
    nullable: true,
  })
  totalHeightChange: number | null;

  @ApiPropertyOptional({
    description: 'Total head circumference change over all measurements (mm)',
    example: 30,
    nullable: true,
  })
  totalHeadCircumferenceChange: number | null;
}

/**
 * Response DTO for growth velocity data
 * Validates: Requirements 6.5
 */
export class GrowthVelocityResponseDto {
  @ApiProperty({
    description: 'Baby ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  babyId: string;

  @ApiProperty({
    description: 'Time unit used for velocity calculation',
    enum: VelocityTimeUnit,
    example: VelocityTimeUnit.WEEK,
  })
  timeUnit: VelocityTimeUnit;

  @ApiProperty({
    description: 'Unit description for velocity values',
    example: 'grams/week for weight, mm/week for height and head circumference',
  })
  unitDescription: string;

  @ApiProperty({
    description: 'Number of measurements used for calculation',
    example: 5,
  })
  measurementCount: number;

  @ApiProperty({
    description: 'Velocity data points between consecutive measurements',
    type: [VelocityDataPointDto],
  })
  velocityData: VelocityDataPointDto[];

  @ApiProperty({
    description: 'Summary statistics for growth velocity',
    type: VelocitySummaryDto,
  })
  summary: VelocitySummaryDto;
}
