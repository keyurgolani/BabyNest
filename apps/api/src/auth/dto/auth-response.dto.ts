import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for authentication tokens
 * Validates: Requirements 2.1, 2.2
 */
export class AuthTokensResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;
}

/**
 * Response DTO for caregiver profile
 */
export class CaregiverResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the caregiver',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Email address',
    example: 'parent@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Account creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}

/**
 * Response DTO for registration/login including user info
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Authentication tokens',
    type: AuthTokensResponseDto,
  })
  tokens: AuthTokensResponseDto;

  @ApiProperty({
    description: 'Caregiver profile information',
    type: CaregiverResponseDto,
  })
  caregiver: CaregiverResponseDto;
}
