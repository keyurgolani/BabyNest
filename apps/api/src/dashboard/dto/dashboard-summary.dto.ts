import { ApiProperty } from '@nestjs/swagger';

/**
 * Summary statistics for a single baby
 */
export class BabySummaryDto {
  @ApiProperty({
    description: 'Baby ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  babyId: string;

  @ApiProperty({
    description: 'Baby name',
    example: 'Emma',
  })
  babyName: string;

  @ApiProperty({
    description: 'Baby age in months',
    example: 6.5,
  })
  ageMonths: number;

  @ApiProperty({
    description: 'Number of feedings in the last 24 hours',
    example: 8,
  })
  feedingsLast24h: number;

  @ApiProperty({
    description: 'Total sleep duration in the last 24 hours (minutes)',
    example: 720,
  })
  sleepLast24h: number;

  @ApiProperty({
    description: 'Number of diaper changes in the last 24 hours',
    example: 6,
  })
  diapersLast24h: number;

  @ApiProperty({
    description: 'Last feeding timestamp',
    example: '2024-01-15T14:30:00.000Z',
    nullable: true,
  })
  lastFeeding: Date | null;

  @ApiProperty({
    description: 'Last sleep timestamp',
    example: '2024-01-15T13:00:00.000Z',
    nullable: true,
  })
  lastSleep: Date | null;

  @ApiProperty({
    description: 'Last diaper change timestamp',
    example: '2024-01-15T15:00:00.000Z',
    nullable: true,
  })
  lastDiaper: Date | null;

  @ApiProperty({
    description: 'Number of active alerts for this baby',
    example: 2,
  })
  activeAlerts: number;
}

/**
 * Response DTO for multi-baby dashboard summary
 */
export class DashboardSummaryResponseDto {
  @ApiProperty({
    description: 'Summary for each baby',
    type: [BabySummaryDto],
  })
  babies: BabySummaryDto[];

  @ApiProperty({
    description: 'Total number of babies',
    example: 2,
  })
  totalBabies: number;

  @ApiProperty({
    description: 'Total active alerts across all babies',
    example: 3,
  })
  totalAlerts: number;
}
