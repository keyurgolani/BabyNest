/**
 * Authentication types
 * Validates: Requirements 2.1, 2.2, 12.2
 */

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Authentication tokens response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Caregiver invitation request
 * Validates: Requirements 2.3
 */
export interface InvitationRequest {
  email: string;
  babyId: string;
  role: 'primary' | 'secondary';
}

/**
 * Invitation response
 */
export interface InvitationResponse {
  invitationId: string;
  invitationLink: string;
  expiresAt: Date;
}

/**
 * Accept invitation request
 */
export interface AcceptInvitationRequest {
  token: string;
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

/**
 * API key creation request
 */
export interface CreateApiKeyRequest {
  name: string;
  expiresAt?: Date;
}

/**
 * API key response (key is only shown once on creation)
 */
export interface ApiKeyResponse {
  id: string;
  name: string;
  key?: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

// Frontend DTOs (using string dates for JSON compatibility)
export interface UpdateProfileDto {
  name: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface AuthTokensResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CaregiverResponseDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseDto {
  tokens: AuthTokensResponseDto;
  caregiver: CaregiverResponseDto;
}

export interface LoginResponseDto {
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  caregiver: CaregiverResponseDto;
}

export interface CaregiverListResponse {
  caregivers: Array<{
    caregiverId: string;
    name: string;
    email: string;
    role: 'primary' | 'secondary' | 'viewer';
  }>;
}

// Invitation DTOs
export interface InvitationListItemDto {
  id: string;
  babyId: string;
  babyName: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  tokenHint: string;
}

export interface InvitationListResponseDto {
  data: InvitationListItemDto[];
  total: number;
}

export interface CreateInvitationDto {
  inviteeEmail: string;
  babyId: string;
}

export interface InvitationResponseDto {
  id: string;
  token: string;
  babyId: string;
  babyName: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

// API Key DTOs
export interface ApiKeyListItem {
  id: string;
  name: string;
  prefix: string; // mapped from keyHint or prefix
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreateApiKeyDto {
  name: string;
  expiresAt?: string;
}

export interface CreateApiKeyResponseDto {
  id: string;
  key: string;
  name: string;
  createdAt: string;
}
