import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';

/**
 * Insight generation cadence options
 */
export enum InsightCadence {
  EVERYTIME = 'everytime',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Insight type for generated insights
 */
export enum InsightType {
  WEEKLY_SUMMARY = 'weekly_summary',
  SLEEP_PREDICTION = 'sleep_prediction',
  ANOMALY = 'anomaly',
  DAILY_SUMMARY = 'daily_summary',
  TREND = 'trend',
}

/**
 * DTO for configuring insight generation cadence
 */
export class ConfigureInsightCadenceDto {
  @ApiProperty({
    description: 'Insight generation cadence',
    enum: InsightCadence,
    example: InsightCadence.WEEKLY,
  })
  @IsEnum(InsightCadence)
  cadence: InsightCadence;

  @ApiPropertyOptional({
    description: 'Enable or disable automatic insight generation',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

/**
 * DTO for insight configuration response
 */
export class InsightConfigResponseDto {
  @ApiProperty({
    description: 'Configuration ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Insight generation cadence',
    enum: InsightCadence,
    example: InsightCadence.WEEKLY,
  })
  cadence: InsightCadence;

  @ApiProperty({
    description: 'Whether automatic insight generation is enabled',
    example: true,
  })
  isEnabled: boolean;

  @ApiPropertyOptional({
    description: 'Last time insights were generated',
    example: '2024-01-15T10:30:00Z',
  })
  lastGenerated: Date | null;

  @ApiPropertyOptional({
    description: 'Next scheduled insight generation time',
    example: '2024-01-22T10:30:00Z',
  })
  nextGeneration: Date | null;

  @ApiProperty({
    description: 'Configuration created at',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Configuration last updated at',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

/**
 * DTO for triggering adhoc insight generation
 */
export class GenerateAdhocInsightDto {
  @ApiPropertyOptional({
    description: 'Insight type to generate (defaults to weekly_summary)',
    enum: InsightType,
    example: InsightType.WEEKLY_SUMMARY,
  })
  @IsEnum(InsightType)
  @IsOptional()
  type?: InsightType;

  @ApiPropertyOptional({
    description: 'Start date for the insight period (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the insight period (ISO 8601 format)',
    example: '2024-01-07',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

/**
 * DTO for generated insight response
 */
export class GeneratedInsightResponseDto {
  @ApiProperty({
    description: 'Insight ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Insight type',
    enum: InsightType,
    example: InsightType.WEEKLY_SUMMARY,
  })
  type: InsightType;

  @ApiProperty({
    description: 'Insight content (JSON)',
    example: {
      summary: 'Baby had a great week with consistent sleep patterns...',
      metrics: { totalSleep: 840, feedings: 42 },
    },
  })
  content: any;

  @ApiProperty({
    description: 'When the insight was generated',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;

  @ApiProperty({
    description: 'Start of the period covered by this insight',
    example: '2024-01-08T00:00:00Z',
  })
  periodStart: Date;

  @ApiProperty({
    description: 'End of the period covered by this insight',
    example: '2024-01-14T23:59:59Z',
  })
  periodEnd: Date;
}

/**
 * DTO for insight history query parameters
 */
export class InsightHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by insight type',
    enum: InsightType,
    example: InsightType.WEEKLY_SUMMARY,
  })
  @IsEnum(InsightType)
  @IsOptional()
  type?: InsightType;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 20;
}

/**
 * DTO for insight history list response
 */
export class InsightHistoryListResponseDto {
  @ApiProperty({
    description: 'List of generated insights',
    type: [GeneratedInsightResponseDto],
  })
  data: GeneratedInsightResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 50,
      page: 1,
      pageSize: 20,
      totalPages: 3,
    },
  })
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
