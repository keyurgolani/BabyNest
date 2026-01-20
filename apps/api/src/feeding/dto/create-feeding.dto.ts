import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsDateString,
  Min,
  Max,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * Feeding types supported by the system
 * Validates: Requirements 3.1, 3.4, 3.5, 3.6
 */
export enum FeedingType {
  BREASTFEEDING = 'breastfeeding',
  BOTTLE = 'bottle',
  PUMPING = 'pumping',
  SOLID = 'solid',
}

/**
 * Breast side options for breastfeeding and pumping
 * Validates: Requirements 3.1, 3.2, 3.5
 */
export enum BreastSide {
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * Pump side options (includes both)
 * Validates: Requirements 3.5
 */
export enum PumpSide {
  LEFT = 'left',
  RIGHT = 'right',
  BOTH = 'both',
}

/**
 * Bottle content types
 * Validates: Requirements 3.4
 */
export enum BottleType {
  FORMULA = 'formula',
  BREAST_MILK = 'breastMilk',
  WATER = 'water',
}

/**
 * DTO for creating a new feeding entry
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export class CreateFeedingDto {
  @ApiProperty({
    description: 'Type of feeding',
    enum: FeedingType,
    example: FeedingType.BREASTFEEDING,
  })
  @IsEnum(FeedingType)
  type: FeedingType;

  @ApiPropertyOptional({
    description: 'Timestamp when the feeding occurred (defaults to now)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  // Breastfeeding specific fields
  @ApiPropertyOptional({
    description: 'Duration on left breast in seconds (breastfeeding only)',
    example: 600,
    minimum: 0,
    maximum: 7200,
  })
  @ValidateIf((o) => o.type === FeedingType.BREASTFEEDING)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7200) // Max 2 hours
  leftDuration?: number;

  @ApiPropertyOptional({
    description: 'Duration on right breast in seconds (breastfeeding only)',
    example: 480,
    minimum: 0,
    maximum: 7200,
  })
  @ValidateIf((o) => o.type === FeedingType.BREASTFEEDING)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7200)
  rightDuration?: number;

  @ApiPropertyOptional({
    description: 'Last breast side used (breastfeeding only)',
    enum: BreastSide,
    example: BreastSide.LEFT,
  })
  @ValidateIf((o) => o.type === FeedingType.BREASTFEEDING)
  @IsOptional()
  @IsEnum(BreastSide)
  lastSide?: BreastSide;

  // Bottle specific fields
  @ApiPropertyOptional({
    description: 'Amount in milliliters (bottle only)',
    example: 120,
    minimum: 0,
    maximum: 500,
  })
  @ValidateIf((o) => o.type === FeedingType.BOTTLE)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Type of bottle content (bottle only)',
    enum: BottleType,
    example: BottleType.FORMULA,
  })
  @ValidateIf((o) => o.type === FeedingType.BOTTLE)
  @IsOptional()
  @IsEnum(BottleType)
  bottleType?: BottleType;

  // Pumping specific fields
  @ApiPropertyOptional({
    description: 'Amount pumped in milliliters (pumping only)',
    example: 100,
    minimum: 0,
    maximum: 500,
  })
  @ValidateIf((o) => o.type === FeedingType.PUMPING)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  pumpedAmount?: number;

  @ApiPropertyOptional({
    description: 'Breast side used for pumping (pumping only)',
    enum: PumpSide,
    example: PumpSide.BOTH,
  })
  @ValidateIf((o) => o.type === FeedingType.PUMPING)
  @IsOptional()
  @IsEnum(PumpSide)
  pumpSide?: PumpSide;

  @ApiPropertyOptional({
    description: 'Duration of pumping session in seconds (pumping only)',
    example: 900,
    minimum: 0,
    maximum: 7200,
  })
  @ValidateIf((o) => o.type === FeedingType.PUMPING)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7200)
  duration?: number;

  // Solid food specific fields
  @ApiPropertyOptional({
    description: 'Type of solid food (solid only)',
    example: 'banana puree',
    maxLength: 200,
  })
  @ValidateIf((o) => o.type === FeedingType.SOLID)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  foodType?: string;

  @ApiPropertyOptional({
    description: 'Reaction to solid food (solid only)',
    example: 'Loved it, no allergic reaction',
    maxLength: 500,
  })
  @ValidateIf((o) => o.type === FeedingType.SOLID)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reaction?: string;

  // Common field
  @ApiPropertyOptional({
    description: 'Additional notes about the feeding',
    example: 'Baby was very hungry',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
