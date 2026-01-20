import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for milestone progress
 */
export class MilestoneProgressResponseDto {
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
    description: 'Total number of age-appropriate milestones',
    example: 20,
  })
  totalMilestones: number;

  @ApiProperty({
    description: 'Number of achieved milestones',
    example: 15,
  })
  achievedMilestones: number;

  @ApiProperty({
    description: 'Overall progress percentage',
    example: 75.0,
  })
  progressPercentage: number;

  @ApiProperty({
    description: 'Progress by category',
    example: {
      motor: 80.0,
      cognitive: 70.0,
      social: 75.0,
      language: 72.5,
    },
  })
  progressByCategory: {
    motor: number;
    cognitive: number;
    social: number;
    language: number;
  };
}
