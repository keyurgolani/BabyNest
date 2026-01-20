import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for caregiver login
 * Validates: Requirements 2.2
 */
export class LoginDto {
  @ApiProperty({
    description: 'Email address for the caregiver account',
    example: 'parent@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Account password',
    example: 'SecurePass123',
  })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
