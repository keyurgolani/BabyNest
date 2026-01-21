import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO for creating a caregiver invitation
 * Validates: Requirements 2.3
 */
export class CreateInvitationDto {
  @ApiProperty({
    description: 'ID of the baby to invite the caregiver to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  babyId: string;

  @ApiProperty({
    description: 'Email address of the person being invited',
    example: 'grandparent@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  inviteeEmail: string;
}

/**
 * DTO for accepting an invitation
 * Validates: Requirements 2.3
 */
export class AcceptInvitationDto {
  @ApiProperty({
    description: 'The unique invitation token',
    example: 'inv_abc123def456...',
  })
  @IsString()
  token: string;
}

/**
 * Invitation status enum
 */
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

/**
 * Response DTO for invitation creation
 * Validates: Requirements 2.3
 */
export class InvitationResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the invitation',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'The unique invitation token (only shown at creation)',
    example: 'inv_abc123def456...',
  })
  token: string;

  @ApiProperty({
    description: 'ID of the baby the invitation is for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  babyId: string;

  @ApiProperty({
    description: 'Name of the baby',
    example: 'Baby Emma',
  })
  babyName: string;

  @ApiProperty({
    description: 'Email of the person being invited',
    example: 'grandparent@example.com',
  })
  inviteeEmail: string;

  @ApiProperty({
    description: 'Status of the invitation',
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @ApiProperty({
    description: 'When the invitation was created',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the invitation expires',
  })
  expiresAt: Date;

  @ApiPropertyOptional({
    description: 'When the invitation was accepted (if accepted)',
  })
  acceptedAt?: Date;
}

/**
 * Response DTO for invitation acceptance
 * Validates: Requirements 2.3
 */
export class InvitationAcceptedResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Invitation accepted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'ID of the baby the caregiver now has access to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  babyId: string;

  @ApiProperty({
    description: 'Name of the baby',
    example: 'Baby Emma',
  })
  babyName: string;

  @ApiProperty({
    description: 'Role assigned to the caregiver',
    example: 'secondary',
  })
  role: string;
}

/**
 * Response DTO for listing invitations (without exposing full token)
 */
export class InvitationListItemDto {
  @ApiProperty({
    description: 'Unique identifier for the invitation',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the baby the invitation is for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  babyId: string;

  @ApiProperty({
    description: 'Name of the baby',
    example: 'Baby Emma',
  })
  babyName: string;

  @ApiProperty({
    description: 'Email of the person being invited',
    example: 'grandparent@example.com',
  })
  inviteeEmail: string;

  @ApiProperty({
    description: 'Status of the invitation',
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @ApiProperty({
    description: 'When the invitation was created',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the invitation expires',
  })
  expiresAt: Date;

  @ApiPropertyOptional({
    description: 'When the invitation was accepted (if accepted)',
  })
  acceptedAt?: Date;

  @ApiProperty({
    description: 'Hint of the token (last 4 characters)',
    example: '****f456',
  })
  tokenHint: string;
}

/**
 * Response DTO for validating an invitation (public endpoint)
 * Validates: Requirements 2.3
 */
export class InvitationValidationResponseDto {
  @ApiProperty({
    description: 'Whether the invitation is valid and can be accepted',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Name of the baby the invitation is for',
    example: 'Baby Emma',
  })
  babyName: string;

  @ApiProperty({
    description: 'Name of the person who sent the invitation',
    example: 'John Doe',
  })
  inviterName: string;

  @ApiProperty({
    description: 'Email address the invitation was sent to',
    example: 'grandparent@example.com',
  })
  inviteeEmail: string;

  @ApiProperty({
    description: 'Current status of the invitation',
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @ApiProperty({
    description: 'When the invitation expires',
  })
  expiresAt: Date;

  @ApiPropertyOptional({
    description: 'Error message if the invitation is not valid',
    example: 'Invitation has expired',
  })
  error?: string;
}

/**
 * Response DTO for pending invitations for the current user
 * Used to show a banner when user has pending invitations
 */
export class PendingInvitationDto {
  @ApiProperty({
    description: 'The invitation token to accept',
    example: 'inv_abc123def456...',
  })
  token: string;

  @ApiProperty({
    description: 'Name of the baby the invitation is for',
    example: 'Baby Emma',
  })
  babyName: string;

  @ApiProperty({
    description: 'Name of the person who sent the invitation',
    example: 'John Doe',
  })
  inviterName: string;

  @ApiProperty({
    description: 'When the invitation expires',
  })
  expiresAt: Date;
}
