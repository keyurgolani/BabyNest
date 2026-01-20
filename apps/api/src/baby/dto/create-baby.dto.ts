import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional, MinLength, MaxLength, ValidateIf } from 'class-validator';

/**
 * Gender options for baby profile
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  UNKNOWN = 'unknown',
}

/**
 * DTO for creating a new baby profile
 * Validates: Requirements 1.1
 */
export class CreateBabyDto {
  @ApiProperty({
    description: "Baby's name",
    example: 'Emma',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: "Baby's date of birth in ISO 8601 format",
    example: '2024-01-15',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    description: "Baby's gender",
    enum: Gender,
    example: Gender.FEMALE,
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    description: 'URL to baby photo (use POST /uploads to upload the photo first)',
    example: 'http://localhost:3001/api/v1/uploads/1234567890-abc123.jpg',
  })
  @IsOptional()
  @ValidateIf((o) => o.photoUrl !== null && o.photoUrl !== undefined)
  @IsString()
  photoUrl?: string;
}
