import { ApiProperty } from '@nestjs/swagger';

/**
 * Upcoming event types
 */
export enum UpcomingEventType {
  MEDICATION = 'medication',
  VACCINATION = 'vaccination',
  DOCTOR_VISIT = 'doctor_visit',
  REMINDER = 'reminder',
}

/**
 * Individual upcoming event
 */
export class UpcomingEventDto {
  @ApiProperty({
    description: 'Baby ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  babyId: string;

  @ApiProperty({
    description: 'Baby name',
    example: 'Emma',
  })
  babyName: string;

  @ApiProperty({
    description: 'Event type',
    enum: UpcomingEventType,
    example: UpcomingEventType.MEDICATION,
  })
  type: UpcomingEventType;

  @ApiProperty({
    description: 'Event title',
    example: 'Tylenol dose',
  })
  title: string;

  @ApiProperty({
    description: 'Event description',
    example: '5ml every 6 hours',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Scheduled time',
    example: '2024-01-15T18:00:00.000Z',
  })
  scheduledTime: Date;

  @ApiProperty({
    description: 'Related entry ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    nullable: true,
  })
  relatedEntryId: string | null;
}

/**
 * Response DTO for upcoming events
 */
export class DashboardUpcomingResponseDto {
  @ApiProperty({
    description: 'List of upcoming events',
    type: [UpcomingEventDto],
  })
  events: UpcomingEventDto[];

  @ApiProperty({
    description: 'Total number of upcoming events',
    example: 8,
  })
  total: number;
}
