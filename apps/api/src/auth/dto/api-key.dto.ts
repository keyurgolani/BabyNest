import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for creating a new API key
 * Validates: Requirements 12.2
 */
export class CreateApiKeyDto {
  @ApiProperty({
    description: 'A friendly name for the API key',
    example: 'Home Assistant Integration',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Optional expiration date for the API key (ISO 8601 format)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

/**
 * Response DTO for a created API key (includes the raw key - only shown once)
 * Validates: Requirements 12.2
 */
export class ApiKeyCreatedResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the API key',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'The API key value - only shown once at creation time',
    example: 'bnk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  })
  key: string;

  @ApiProperty({
    description: 'The friendly name for the API key',
    example: 'Home Assistant Integration',
  })
  name: string;

  @ApiProperty({
    description: 'When the API key was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'When the API key expires (null if no expiration)',
    example: '2025-12-31T23:59:59.000Z',
  })
  expiresAt: Date | null;
}

/**
 * Response DTO for listing API keys (does not include the raw key)
 * Validates: Requirements 12.2
 */
export class ApiKeyResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the API key',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'The friendly name for the API key',
    example: 'Home Assistant Integration',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'When the API key was last used',
    example: '2024-01-15T10:30:00.000Z',
  })
  lastUsedAt: Date | null;

  @ApiProperty({
    description: 'When the API key was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'When the API key expires (null if no expiration)',
    example: '2025-12-31T23:59:59.000Z',
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: 'Masked version of the key for display (last 4 characters)',
    example: '****y5z6',
  })
  keyHint: string;
}
