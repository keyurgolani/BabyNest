import { ApiProperty } from '@nestjs/swagger';

/**
 * Alert types
 */
export enum AlertType {
  MEDICATION_OVERDUE = 'medication_overdue',
  VACCINATION_OVERDUE = 'vaccination_overdue',
  MILESTONE_DELAYED = 'milestone_delayed',
  FEEDING_OVERDUE = 'feeding_overdue',
  DIAPER_OVERDUE = 'diaper_overdue',
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Individual alert
 */
export class AlertDto {
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
    description: 'Alert type',
    enum: AlertType,
    example: AlertType.MEDICATION_OVERDUE,
  })
  type: AlertType;

  @ApiProperty({
    description: 'Alert severity',
    enum: AlertSeverity,
    example: AlertSeverity.HIGH,
  })
  severity: AlertSeverity;

  @ApiProperty({
    description: 'Alert title',
    example: 'Medication Overdue',
  })
  title: string;

  @ApiProperty({
    description: 'Alert message',
    example: 'Tylenol dose was due 2 hours ago',
  })
  message: string;

  @ApiProperty({
    description: 'Related entry ID (if applicable)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    nullable: true,
  })
  relatedEntryId: string | null;

  @ApiProperty({
    description: 'Timestamp when alert was triggered',
    example: '2024-01-15T16:00:00.000Z',
  })
  timestamp: Date;
}

/**
 * Response DTO for dashboard alerts
 */
export class DashboardAlertsResponseDto {
  @ApiProperty({
    description: 'List of active alerts',
    type: [AlertDto],
  })
  alerts: AlertDto[];

  @ApiProperty({
    description: 'Total number of alerts',
    example: 5,
  })
  total: number;
}
