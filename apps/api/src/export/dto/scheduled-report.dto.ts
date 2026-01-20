import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

/**
 * Report frequency options
 */
export enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * DTO for creating a scheduled report
 * Validates: Requirements 13.4
 */
export class CreateScheduledReportDto {
  @ApiProperty({
    description: 'Name of the scheduled report',
    example: 'Weekly Summary',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Frequency of the scheduled report',
    enum: ReportFrequency,
    example: ReportFrequency.WEEKLY,
  })
  @IsEnum(ReportFrequency)
  frequency: ReportFrequency;

  @ApiPropertyOptional({
    description: 'Day of week for weekly reports (0=Sunday, 6=Saturday)',
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Day of month for monthly reports (1-31)',
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiProperty({
    description: 'Time to send the report in HH:mm format',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:mm format',
  })
  time: string;

  @ApiProperty({
    description: 'Email address to send the report to',
    example: 'parent@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Whether the scheduled report is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO for updating a scheduled report
 * Validates: Requirements 13.4
 */
export class UpdateScheduledReportDto {
  @ApiPropertyOptional({
    description: 'Name of the scheduled report',
    example: 'Weekly Summary',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Frequency of the scheduled report',
    enum: ReportFrequency,
    example: ReportFrequency.WEEKLY,
  })
  @IsOptional()
  @IsEnum(ReportFrequency)
  frequency?: ReportFrequency;

  @ApiPropertyOptional({
    description: 'Day of week for weekly reports (0=Sunday, 6=Saturday)',
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Day of month for monthly reports (1-31)',
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiPropertyOptional({
    description: 'Time to send the report in HH:mm format',
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:mm format',
  })
  time?: string;

  @ApiPropertyOptional({
    description: 'Email address to send the report to',
    example: 'parent@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Whether the scheduled report is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Response DTO for a scheduled report
 */
export class ScheduledReportResponseDto {
  @ApiProperty({ description: 'Unique identifier of the scheduled report' })
  id: string;

  @ApiProperty({ description: 'Baby ID' })
  babyId: string;

  @ApiProperty({ description: 'Caregiver ID who created the schedule' })
  caregiverId: string;

  @ApiProperty({ description: 'Name of the scheduled report' })
  name: string;

  @ApiProperty({
    description: 'Frequency of the scheduled report',
    enum: ReportFrequency,
  })
  frequency: ReportFrequency;

  @ApiPropertyOptional({ description: 'Day of week for weekly reports (0-6)' })
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: 'Day of month for monthly reports (1-31)' })
  dayOfMonth?: number;

  @ApiProperty({ description: 'Time to send the report in HH:mm format' })
  time: string;

  @ApiProperty({ description: 'Email address to send the report to' })
  email: string;

  @ApiProperty({ description: 'Whether the scheduled report is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Last time the report was sent' })
  lastSentAt?: string;

  @ApiPropertyOptional({ description: 'Next scheduled send time' })
  nextScheduledAt?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}
