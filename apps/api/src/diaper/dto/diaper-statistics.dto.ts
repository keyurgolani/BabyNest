import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsDateString,
  IsInt,
} from 'class-validator';

import { DiaperResponseDto } from './diaper-response.dto';

/**
 * Query parameters for diaper statistics
 * Validates: Requirements 5.3, 5.4
 */
export class DiaperStatisticsQueryDto {
  @ApiPropertyOptional({
    description: 'Period in days (7, 14, or 30). Takes precedence over startDate/endDate.',
    example: 7,
    enum: [7, 14, 30],
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  periodDays?: number;

  @ApiPropertyOptional({
    description: 'Start date for statistics period',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for statistics period',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Daily breakdown of diaper changes
 */
export class DailyDiaperBreakdownDto {
  @ApiProperty({
    description: 'Date string (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'Total diaper changes on this day',
    example: 8,
  })
  totalChanges: number;

  @ApiProperty({
    description: 'Number of wet diapers',
    example: 5,
  })
  wetCount: number;

  @ApiProperty({
    description: 'Number of dirty diapers',
    example: 2,
  })
  dirtyCount: number;

  @ApiProperty({
    description: 'Number of mixed diapers',
    example: 1,
  })
  mixedCount: number;

  @ApiProperty({
    description: 'Number of dry diapers',
    example: 0,
  })
  dryCount: number;
}

/**
 * Count by diaper type
 */
export class DiaperCountByTypeDto {
  @ApiProperty({
    description: 'Number of wet diapers',
    example: 35,
  })
  wet: number;

  @ApiProperty({
    description: 'Number of dirty diapers',
    example: 14,
  })
  dirty: number;

  @ApiProperty({
    description: 'Number of mixed diapers',
    example: 7,
  })
  mixed: number;

  @ApiProperty({
    description: 'Number of dry diapers',
    example: 0,
  })
  dry: number;
}

/**
 * Hydration alert information
 */
export class HydrationAlertDto {
  @ApiProperty({
    description: 'Whether a hydration alert is active',
    example: false,
  })
  isAlert: boolean;

  @ApiProperty({
    description: 'Number of wet diapers in the last 24 hours',
    example: 6,
  })
  wetCount24h: number;

  @ApiProperty({
    description: 'Expected minimum wet diapers per day based on baby age',
    example: 6,
  })
  expectedMinimum: number;

  @ApiProperty({
    description: 'Baby age category used for threshold',
    example: '1-6 months',
  })
  ageCategory: string;

  @ApiPropertyOptional({
    description: 'Alert message if hydration alert is active',
    example: 'Fewer wet diapers than expected. Consider consulting a pediatrician.',
    nullable: true,
  })
  alertMessage: string | null;
}

/**
 * Response DTO for diaper statistics
 * Validates: Requirements 5.3, 5.4
 * Property 14: Diaper Statistics Calculation
 * Property 15: Hydration Alert Threshold
 */
export class DiaperStatisticsDto {
  @ApiProperty({
    description: 'Statistics period',
    example: {
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-07T23:59:59.999Z',
    },
  })
  period: {
    startDate: Date;
    endDate: Date;
  };

  @ApiProperty({
    description: 'Total diaper changes in the period',
    example: 56,
  })
  totalChanges: number;

  @ApiProperty({
    description: 'Count by diaper type',
    type: DiaperCountByTypeDto,
  })
  byType: DiaperCountByTypeDto;

  @ApiProperty({
    description: 'Hydration alert information',
    type: HydrationAlertDto,
  })
  hydrationAlert: HydrationAlertDto;

  @ApiPropertyOptional({
    description: 'Most recent diaper entry',
    type: DiaperResponseDto,
    nullable: true,
  })
  lastDiaper: DiaperResponseDto | null;

  @ApiProperty({
    description: 'Daily breakdown of diaper changes',
    type: [DailyDiaperBreakdownDto],
  })
  dailyBreakdown: DailyDiaperBreakdownDto[];

  @ApiProperty({
    description: 'Number of days with recorded data',
    example: 7,
  })
  daysWithData: number;

  @ApiProperty({
    description: 'Average diaper changes per day',
    example: 8,
  })
  averageChangesPerDay: number;
}
