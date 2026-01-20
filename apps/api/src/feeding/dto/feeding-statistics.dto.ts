import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

import { BreastSide } from './create-feeding.dto';
import { FeedingResponseDto } from './feeding-response.dto';

/**
 * Query DTO for feeding statistics
 * Validates: Requirements 3.7
 */
export class FeedingStatisticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for statistics calculation (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for statistics calculation (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Count by feeding type
 * Validates: Requirements 3.7
 */
export class FeedingCountByTypeDto {
  @ApiProperty({
    description: 'Number of breastfeeding entries',
    example: 15,
  })
  breastfeeding: number;

  @ApiProperty({
    description: 'Number of bottle feeding entries',
    example: 8,
  })
  bottle: number;

  @ApiProperty({
    description: 'Number of pumping entries',
    example: 5,
  })
  pumping: number;

  @ApiProperty({
    description: 'Number of solid food entries',
    example: 3,
  })
  solid: number;
}

/**
 * Date range for statistics
 */
export class DateRangeDto {
  @ApiProperty({
    description: 'Start date of the statistics period',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date of the statistics period',
    example: '2024-01-31T23:59:59.999Z',
  })
  endDate: Date;
}

/**
 * Response DTO for feeding statistics
 * Validates: Requirements 3.7
 * Property 8: Feeding Statistics Calculation
 */
export class FeedingStatisticsDto {
  @ApiProperty({
    description: 'Date range for the statistics',
    type: DateRangeDto,
  })
  period: DateRangeDto;

  @ApiProperty({
    description: 'Total number of feeding entries in the period',
    example: 31,
  })
  totalFeedings: number;

  @ApiProperty({
    description: 'Count of feedings by type',
    type: FeedingCountByTypeDto,
  })
  byType: FeedingCountByTypeDto;

  @ApiPropertyOptional({
    description: 'Average duration for breastfeeding sessions in seconds (total of left + right)',
    example: 1080,
    nullable: true,
  })
  averageBreastfeedingDuration: number | null;

  @ApiPropertyOptional({
    description: 'Average amount for bottle feedings in milliliters',
    example: 120,
    nullable: true,
  })
  averageBottleAmount: number | null;

  @ApiPropertyOptional({
    description: 'Average pumped amount for pumping sessions in milliliters',
    example: 100,
    nullable: true,
  })
  averagePumpedAmount: number | null;

  @ApiPropertyOptional({
    description: 'Most recent feeding entry',
    type: FeedingResponseDto,
    nullable: true,
  })
  lastFeeding: FeedingResponseDto | null;

  @ApiPropertyOptional({
    description: 'Suggested next breast side based on last breastfeeding session',
    enum: BreastSide,
    example: BreastSide.RIGHT,
    nullable: true,
  })
  suggestedNextSide: BreastSide | null;
}
