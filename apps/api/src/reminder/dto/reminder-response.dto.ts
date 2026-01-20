import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ReminderType } from './create-reminder.dto';

/**
 * Response DTO for a reminder
 */
export class ReminderResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the reminder',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Baby ID this reminder belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  babyId: string;

  @ApiProperty({
    description: 'Caregiver ID who created this reminder',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  caregiverId: string;

  @ApiProperty({
    description: 'Type of reminder',
    enum: ReminderType,
    example: ReminderType.FEED,
  })
  type: ReminderType;

  @ApiProperty({
    description: 'Name/label for the reminder',
    example: 'Feeding reminder',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Interval in minutes for interval-based reminders',
    example: 180,
    nullable: true,
  })
  intervalMinutes: number | null;

  @ApiPropertyOptional({
    description: 'Array of scheduled times in HH:MM format',
    example: ['08:00', '12:00', '16:00', '20:00'],
    nullable: true,
    type: [String],
  })
  scheduledTimes: string[] | null;

  @ApiProperty({
    description: 'If true, reminder triggers X minutes after the last entry',
    example: true,
  })
  basedOnLastEntry: boolean;

  @ApiProperty({
    description: 'Whether the reminder is enabled',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether to notify all caregivers',
    example: false,
  })
  notifyAllCaregivers: boolean;

  @ApiProperty({
    description: 'Entry creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether the reminder is soft-deleted',
    example: false,
  })
  isDeleted: boolean;
}

/**
 * Pagination metadata
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total number of items',
    example: 10,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number (1-indexed)',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 1,
  })
  totalPages: number;
}

/**
 * Response DTO for paginated list of reminders
 */
export class ReminderListResponseDto {
  @ApiProperty({
    description: 'List of reminders',
    type: [ReminderResponseDto],
  })
  data: ReminderResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

/**
 * Response DTO for next upcoming reminder
 */
export class NextReminderResponseDto {
  @ApiPropertyOptional({
    description: 'The next reminder that will trigger',
    type: ReminderResponseDto,
    nullable: true,
  })
  reminder: ReminderResponseDto | null;

  @ApiPropertyOptional({
    description: 'The next trigger time for this reminder',
    example: '2024-01-15T14:00:00.000Z',
    nullable: true,
  })
  nextTriggerTime: Date | null;

  @ApiPropertyOptional({
    description: 'Minutes until the next reminder triggers',
    example: 45,
    nullable: true,
  })
  minutesUntilTrigger: number | null;

  @ApiPropertyOptional({
    description: 'Human-readable time until trigger',
    example: '45 minutes',
    nullable: true,
  })
  timeUntilTrigger: string | null;
}
