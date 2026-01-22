import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * Extracted feeding entry from photo
 */
export class ExtractedFeedingDto {
  @ApiProperty({ enum: ['breastfeeding', 'bottle', 'pumping', 'solid'] })
  @IsEnum(['breastfeeding', 'bottle', 'pumping', 'solid'])
  type: 'breastfeeding' | 'bottle' | 'pumping' | 'solid';

  @ApiProperty()
  @IsDateString()
  timestamp: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  leftDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  rightDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ enum: ['formula', 'breastMilk', 'water'] })
  @IsOptional()
  @IsEnum(['formula', 'breastMilk', 'water'])
  bottleType?: 'formula' | 'breastMilk' | 'water';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  foodType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Confidence score 0-1' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

/**
 * Extracted sleep entry from photo
 */
export class ExtractedSleepDto {
  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({ enum: ['nap', 'night'] })
  @IsEnum(['nap', 'night'])
  sleepType: 'nap' | 'night';

  @ApiPropertyOptional({ enum: ['good', 'fair', 'poor'] })
  @IsOptional()
  @IsEnum(['good', 'fair', 'poor'])
  quality?: 'good' | 'fair' | 'poor';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Confidence score 0-1' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

/**
 * Extracted diaper entry from photo
 */
export class ExtractedDiaperDto {
  @ApiProperty({ enum: ['wet', 'dirty', 'mixed', 'dry'] })
  @IsEnum(['wet', 'dirty', 'mixed', 'dry'])
  type: 'wet' | 'dirty' | 'mixed' | 'dry';

  @ApiProperty()
  @IsDateString()
  timestamp: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consistency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasRash?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Confidence score 0-1' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

/**
 * Extracted medication entry from photo
 */
export class ExtractedMedicationDto {
  @ApiProperty()
  @IsDateString()
  timestamp: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  dosage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Confidence score 0-1' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

/**
 * Extracted symptom/temperature entry from photo
 */
export class ExtractedSymptomDto {
  @ApiProperty()
  @IsDateString()
  timestamp: string;

  @ApiProperty()
  @IsString()
  symptomType: string;

  @ApiPropertyOptional({ enum: ['mild', 'moderate', 'severe'] })
  @IsOptional()
  @IsEnum(['mild', 'moderate', 'severe'])
  severity?: 'mild' | 'moderate' | 'severe';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Confidence score 0-1' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

/**
 * Extracted activity entry from photo
 */
export class ExtractedActivityDto {
  @ApiProperty()
  @IsDateString()
  timestamp: string;

  @ApiProperty()
  @IsString()
  activityType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Confidence score 0-1' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

/**
 * Response from photo analysis
 */
export class PhotoAnalysisResponseDto {
  @ApiProperty({ description: 'Whether OCR and extraction was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Error message if extraction failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Raw OCR text extracted from the image' })
  rawText?: string;

  @ApiProperty({ type: [ExtractedFeedingDto] })
  feedings: ExtractedFeedingDto[];

  @ApiProperty({ type: [ExtractedSleepDto] })
  sleepEntries: ExtractedSleepDto[];

  @ApiProperty({ type: [ExtractedDiaperDto] })
  diaperEntries: ExtractedDiaperDto[];

  @ApiProperty({ type: [ExtractedMedicationDto] })
  medications: ExtractedMedicationDto[];

  @ApiProperty({ type: [ExtractedSymptomDto] })
  symptoms: ExtractedSymptomDto[];

  @ApiProperty({ type: [ExtractedActivityDto] })
  activities: ExtractedActivityDto[];

  @ApiPropertyOptional({ description: 'Overall confidence score 0-1' })
  overallConfidence?: number;

  @ApiPropertyOptional({ description: 'Warnings about extraction quality' })
  warnings?: string[];
}

/**
 * Request to confirm and import extracted entries
 */
export class ConfirmImportDto {
  @ApiProperty({ type: [ExtractedFeedingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedFeedingDto)
  feedings: ExtractedFeedingDto[];

  @ApiProperty({ type: [ExtractedSleepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedSleepDto)
  sleepEntries: ExtractedSleepDto[];

  @ApiProperty({ type: [ExtractedDiaperDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedDiaperDto)
  diaperEntries: ExtractedDiaperDto[];

  @ApiProperty({ type: [ExtractedMedicationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedMedicationDto)
  medications: ExtractedMedicationDto[];

  @ApiProperty({ type: [ExtractedSymptomDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedSymptomDto)
  symptoms: ExtractedSymptomDto[];

  @ApiProperty({ type: [ExtractedActivityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedActivityDto)
  activities: ExtractedActivityDto[];
}

/**
 * Response from import confirmation
 */
export class ImportResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  feedingsImported: number;

  @ApiProperty()
  sleepEntriesImported: number;

  @ApiProperty()
  diaperEntriesImported: number;

  @ApiProperty()
  medicationsImported: number;

  @ApiProperty()
  symptomsImported: number;

  @ApiProperty()
  activitiesImported: number;

  @ApiPropertyOptional({ type: [String] })
  errors?: string[];
}
