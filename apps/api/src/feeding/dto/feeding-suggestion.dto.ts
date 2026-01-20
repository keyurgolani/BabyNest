import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BreastSide } from './create-feeding.dto';

/**
 * Response DTO for feeding suggestion
 * Validates: Requirements 3.8
 */
export class FeedingSuggestionDto {
  @ApiPropertyOptional({
    description: 'Suggested next breast side based on last breastfeeding session',
    enum: BreastSide,
    example: BreastSide.RIGHT,
    nullable: true,
  })
  suggestedNextSide: BreastSide | null;

  @ApiPropertyOptional({
    description: 'Last breast side used in the most recent breastfeeding session',
    enum: BreastSide,
    example: BreastSide.LEFT,
    nullable: true,
  })
  lastUsedSide: BreastSide | null;

  @ApiPropertyOptional({
    description: 'Timestamp of the last breastfeeding session',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  lastBreastfeedingTime: Date | null;

  @ApiProperty({
    description: 'Whether there is a previous breastfeeding session to base the suggestion on',
    example: true,
  })
  hasPreviousBreastfeeding: boolean;
}
