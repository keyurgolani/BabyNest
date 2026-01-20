import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * Activity types supported by the system
 * Validates: Requirements 9.1, 9.2, 9.3
 */
export enum ActivityType {
  TUMMY_TIME = 'tummy_time',
  BATH = 'bath',
  OUTDOOR = 'outdoor',
  PLAY = 'play',
}

/**
 * DTO for creating a new activity entry
 * Validates: Requirements 9.1, 9.2, 9.3
 */
export class CreateActivityDto {
  @ApiProperty({
    description: 'Type of activity',
    enum: ActivityType,
    example: ActivityType.TUMMY_TIME,
  })
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiPropertyOptional({
    description: 'Start time of the activity (defaults to current time if not provided)',
    example: '2024-01-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time of the activity (null if ongoing)',
    example: '2024-01-15T10:15:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes (calculated from startTime and endTime if both provided, or can be set directly)',
    example: 15,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Notes about the activity',
    example: 'Baby enjoyed tummy time today, lifted head well',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
