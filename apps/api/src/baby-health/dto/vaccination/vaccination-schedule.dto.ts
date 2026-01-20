import { ApiProperty } from '@nestjs/swagger';

import { VaccinationResponseDto, VaccinationStatusDto } from './vaccination-response.dto';

/**
 * Response DTO for vaccination schedule
 * Returns vaccinations categorized by status (completed, upcoming, overdue)
 * Validates: Requirements 8.4
 */
export class VaccinationScheduleResponseDto {
  @ApiProperty({
    description: 'Completed vaccinations (no follow-up needed or already administered)',
    type: [VaccinationResponseDto],
  })
  completed: VaccinationResponseDto[];

  @ApiProperty({
    description: 'Upcoming vaccinations (nextDueAt is in the future)',
    type: [VaccinationResponseDto],
  })
  upcoming: VaccinationResponseDto[];

  @ApiProperty({
    description: 'Overdue vaccinations (nextDueAt is in the past)',
    type: [VaccinationResponseDto],
  })
  overdue: VaccinationResponseDto[];

  @ApiProperty({
    description: 'Summary counts by status',
    example: { completed: 5, upcoming: 2, overdue: 1 },
  })
  summary: {
    completed: number;
    upcoming: number;
    overdue: number;
  };
}

export { VaccinationStatusDto };
