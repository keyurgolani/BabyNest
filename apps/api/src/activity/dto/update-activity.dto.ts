import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

import { ActivityType } from './create-activity.dto';

/**
 * DTO for updating an activity entry
 * All fields are optional - only provided fields will be updated
 * Validates: Requirements 9.1, 9.2, 9.3
 */
export class UpdateActivityDto {
  @ApiPropertyOptional({
    description: 'Type of activity',
    enum: ActivityType,
    example: ActivityType.TUMMY_TIME,
  })
  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType;

  @ApiPropertyOptional({
    description: 'Start time of the activity',
    example: '2024-01-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time of the activity (set to null to mark as ongoing)',
    example: '2024-01-15T10:15:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  endTime?: string | null;

  @ApiPropertyOptional({
    description: 'Duration in minutes (will be recalculated if startTime or endTime changes)',
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
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
