import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * DTO for marking a milestone as achieved
 * Validates: Requirements 7.2
 */
export class CreateMilestoneDto {
  @ApiProperty({
    description: 'ID of the milestone definition being achieved',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  milestoneId: string;

  @ApiPropertyOptional({
    description: 'Date when the milestone was achieved (defaults to now if not provided)',
    example: '2024-06-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  achievedDate?: string;

  @ApiPropertyOptional({
    description: 'URL to a photo documenting the milestone (use POST /uploads to upload the photo first)',
    example: 'http://localhost:3001/api/v1/uploads/1234567890-abc123.jpg',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Notes about the milestone achievement',
    example: 'Took first steps while holding onto the couch!',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
