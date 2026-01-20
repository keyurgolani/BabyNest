import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * Reminder types supported by the system
 */
export enum ReminderType {
  FEED = 'feed',
  SLEEP = 'sleep',
  DIAPER = 'diaper',
  MEDICINE = 'medicine',
  CUSTOM = 'custom',
}

/**
 * DTO for creating a new reminder
 */
export class CreateReminderDto {
  @ApiProperty({
    description: 'Type of reminder',
    enum: ReminderType,
    example: ReminderType.FEED,
  })
  @IsEnum(ReminderType)
  type: ReminderType;

  @ApiProperty({
    description: 'Name/label for the reminder',
    example: 'Feeding reminder',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    description: 'Interval in minutes for interval-based reminders (e.g., 180 for every 3 hours)',
    example: 180,
    minimum: 15,
    maximum: 1440,
  })
  @IsOptional()
  @IsInt()
  @Min(15) // Minimum 15 minutes
  @Max(1440) // Maximum 24 hours
  intervalMinutes?: number;

  @ApiPropertyOptional({
    description: 'Array of scheduled times in HH:MM format for fixed schedule reminders',
    example: ['08:00', '12:00', '16:00', '20:00'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    each: true,
    message: 'Each scheduled time must be in HH:MM format (24-hour)',
  })
  scheduledTimes?: string[];

  @ApiPropertyOptional({
    description: 'If true, reminder triggers X minutes after the last entry of this type',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  basedOnLastEntry?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the reminder is enabled',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to notify all caregivers or just the creator',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notifyAllCaregivers?: boolean;
}
