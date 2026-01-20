import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';

/**
 * Measurement types for percentile charts
 */
export enum MeasurementTypeEnum {
  WEIGHT = 'weight',
  HEIGHT = 'height',
  HEAD_CIRCUMFERENCE = 'headCircumference',
}

/**
 * Query DTO for percentile chart data
 * Validates: Requirements 6.2
 */
export class PercentileChartQueryDto {
  @ApiProperty({
    description: 'Type of measurement for the chart',
    enum: MeasurementTypeEnum,
    example: MeasurementTypeEnum.WEIGHT,
  })
  @IsEnum(MeasurementTypeEnum)
  measurementType: MeasurementTypeEnum;

  @ApiPropertyOptional({
    description: 'Starting age in months (default: 0)',
    example: 0,
    minimum: 0,
    maximum: 24,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(24)
  startMonth?: number;

  @ApiPropertyOptional({
    description: 'Ending age in months (default: 24)',
    example: 24,
    minimum: 0,
    maximum: 24,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(24)
  endMonth?: number;
}

/**
 * Single data point for percentile chart
 * Includes more granular percentile steps for better visualization
 */
export class PercentileChartDataPointDto {
  @ApiProperty({
    description: 'Age in months',
    example: 6,
  })
  ageMonths: number;

  @ApiProperty({
    description: '1st percentile value',
    example: 5.5,
  })
  p1: number;

  @ApiProperty({
    description: '3rd percentile value',
    example: 5.9,
  })
  p3: number;

  @ApiProperty({
    description: '5th percentile value',
    example: 6.1,
  })
  p5: number;

  @ApiProperty({
    description: '10th percentile value',
    example: 6.4,
  })
  p10: number;

  @ApiProperty({
    description: '15th percentile value',
    example: 6.6,
  })
  p15: number;

  @ApiProperty({
    description: '25th percentile value',
    example: 7.0,
  })
  p25: number;

  @ApiProperty({
    description: '50th percentile value (median)',
    example: 7.9,
  })
  p50: number;

  @ApiProperty({
    description: '75th percentile value',
    example: 8.8,
  })
  p75: number;

  @ApiProperty({
    description: '85th percentile value',
    example: 9.3,
  })
  p85: number;

  @ApiProperty({
    description: '90th percentile value',
    example: 9.6,
  })
  p90: number;

  @ApiProperty({
    description: '95th percentile value',
    example: 10.0,
  })
  p95: number;

  @ApiProperty({
    description: '97th percentile value',
    example: 10.3,
  })
  p97: number;

  @ApiProperty({
    description: '99th percentile value',
    example: 10.8,
  })
  p99: number;
}

/**
 * Response DTO for percentile chart data
 * Validates: Requirements 6.2
 */
export class PercentileChartResponseDto {
  @ApiProperty({
    description: 'Type of measurement',
    enum: MeasurementTypeEnum,
    example: MeasurementTypeEnum.WEIGHT,
  })
  measurementType: MeasurementTypeEnum;

  @ApiProperty({
    description: 'Gender used for the chart',
    example: 'male',
  })
  gender: string;

  @ApiProperty({
    description: 'Unit of measurement (kg for weight, cm for height/head)',
    example: 'kg',
  })
  unit: string;

  @ApiProperty({
    description: 'Percentile chart data points',
    type: [PercentileChartDataPointDto],
  })
  data: PercentileChartDataPointDto[];

  @ApiProperty({
    description: "Baby's growth measurements plotted on the chart",
    type: 'array',
    items: {
      type: 'object',
      properties: {
        ageMonths: { type: 'number', example: 6 },
        value: { type: 'number', example: 7.5 },
        percentile: { type: 'number', example: 45.2 },
      },
    },
  })
  measurements: {
    ageMonths: number;
    value: number;
    percentile: number | null;
  }[];
}
