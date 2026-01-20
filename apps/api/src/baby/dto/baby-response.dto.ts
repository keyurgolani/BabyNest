import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Gender } from './create-baby.dto';

/**
 * Age representation in months and days
 * Validates: Requirements 1.2
 */
export class AgeDto {
  @ApiProperty({
    description: 'Age in complete months',
    example: 6,
  })
  months: number;

  @ApiProperty({
    description: 'Remaining days after complete months',
    example: 15,
  })
  days: number;

  @ApiProperty({
    description: 'Total age in days',
    example: 195,
  })
  totalDays: number;
}

/**
 * Caregiver role in relation to a baby
 */
export enum CaregiverRole {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

/**
 * Caregiver information in baby response
 */
export class BabyCaregiverDto {
  @ApiProperty({
    description: 'Caregiver ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'Caregiver name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Caregiver email',
    example: 'john@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Role of the caregiver',
    enum: CaregiverRole,
    example: CaregiverRole.PRIMARY,
  })
  role: CaregiverRole;
}

/**
 * Response DTO for baby profile
 * Validates: Requirements 1.1, 1.2
 */
export class BabyResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the baby',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: "Baby's name",
    example: 'Emma',
  })
  name: string;

  @ApiProperty({
    description: "Baby's date of birth",
    example: '2024-01-15T00:00:00.000Z',
  })
  dateOfBirth: Date;

  @ApiProperty({
    description: "Baby's gender",
    enum: Gender,
    example: Gender.FEMALE,
  })
  gender: string;

  @ApiPropertyOptional({
    description: 'URL to baby photo',
    example: 'https://example.com/photos/baby.jpg',
    nullable: true,
  })
  photoUrl: string | null;

  @ApiProperty({
    description: "Baby's current age",
    type: AgeDto,
  })
  age: AgeDto;

  @ApiProperty({
    description: 'Profile creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'List of caregivers with access to this baby',
    type: [BabyCaregiverDto],
  })
  caregivers?: BabyCaregiverDto[];
}

/**
 * Response DTO for list of babies
 */
export class BabyListResponseDto {
  @ApiProperty({
    description: 'List of baby profiles',
    type: [BabyResponseDto],
  })
  data: BabyResponseDto[];

  @ApiProperty({
    description: 'Total number of babies',
    example: 2,
  })
  total: number;
}
