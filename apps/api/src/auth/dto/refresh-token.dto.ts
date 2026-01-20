import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * DTO for refreshing access token
 * Validates: Requirements 2.2
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token obtained from login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @MinLength(1, { message: 'Refresh token is required' })
  refreshToken: string;
}
