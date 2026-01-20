import { ApiProperty } from '@nestjs/swagger';

import { MilestoneDefinitionResponseDto } from './milestone-response.dto';

/**
 * Upcoming milestone with expected age
 */
export class UpcomingMilestoneDto {
  @ApiProperty({
    description: 'Milestone definition',
    type: MilestoneDefinitionResponseDto,
  })
  definition: MilestoneDefinitionResponseDto;

  @ApiProperty({
    description: 'Months until baby reaches minimum expected age',
    example: 2.5,
  })
  monthsUntilExpected: number;

  @ApiProperty({
    description: 'Whether this milestone is within the next 3 months',
    example: true,
  })
  isImminent: boolean;
}

/**
 * Response DTO for upcoming milestones
 */
export class UpcomingMilestonesResponseDto {
  @ApiProperty({
    description: 'Baby ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  babyId: string;

  @ApiProperty({
    description: 'Baby age in months',
    example: 6.5,
  })
  babyAgeMonths: number;

  @ApiProperty({
    description: 'List of upcoming milestones',
    type: [UpcomingMilestoneDto],
  })
  upcomingMilestones: UpcomingMilestoneDto[];

  @ApiProperty({
    description: 'Total number of upcoming milestones',
    example: 8,
  })
  total: number;
}
