import { ApiProperty } from '@nestjs/swagger';

import { BabyCaregiverDto } from './baby-response.dto';

/**
 * Response DTO for listing caregivers of a baby
 */
export class CaregiverListResponseDto {
  @ApiProperty({
    description: 'List of caregivers with their roles',
    type: [BabyCaregiverDto],
  })
  data: BabyCaregiverDto[];

  @ApiProperty({
    description: 'Total number of caregivers',
    example: 2,
  })
  total: number;
}
