import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional, MinLength, MaxLength, ValidateIf } from 'class-validator';

import { Gender } from './create-baby.dto';

/**
 * DTO for updating a baby profile
 * All fields are optional for partial updates
 * Validates: Requirements 1.3
 */
export class UpdateBabyDto {
  @ApiPropertyOptional({
    description: "Baby's name",
    example: 'Emma Rose',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: "Baby's date of birth in ISO 8601 format",
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: "Baby's gender",
    enum: Gender,
    example: Gender.FEMALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'URL to baby photo (use POST /uploads to upload the photo first, set to null to remove)',
    example: 'http://localhost:3001/api/v1/uploads/1234567890-abc123.jpg',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.photoUrl !== null && o.photoUrl !== undefined)
  @IsString()
  photoUrl?: string | null;
}
