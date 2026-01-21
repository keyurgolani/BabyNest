import * as crypto from 'crypto';

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AccountLockoutService } from './account-lockout.service';
import {
  RegisterDto,
  LoginDto,
  AuthTokensResponseDto,
  CaregiverResponseDto,
  AuthResponseDto,
  CreateApiKeyDto,
  ApiKeyCreatedResponseDto,
  ApiKeyResponseDto,
  CreateInvitationDto,
  AcceptInvitationDto,
  InvitationResponseDto,
  InvitationAcceptedResponseDto,
  InvitationListItemDto,
  InvitationStatus,
  InvitationValidationResponseDto,
  PendingInvitationDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * Authentication Service
 * Handles user registration, login, and token management
 * Validates: Requirements 2.1, 2.2, 2.6
 */
@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly accountLockoutService: AccountLockoutService,
  ) {
    this.accessTokenExpiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';
    this.refreshTokenExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    this.jwtSecret = this.configService.get<string>('jwt.secret') || 'default-secret';
    this.jwtRefreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret';
  }

  /**
   * Register a new caregiver account
   * Validates: Requirements 2.1
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;

    // Check if email already exists
    const existingCaregiver = await this.prisma.caregiver.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingCaregiver) {
      throw new ConflictException('Email already registered');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create the caregiver
    const caregiver = await this.prisma.caregiver.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(caregiver);

    return {
      tokens,
      caregiver,
    };
  }

  /**
   * Authenticate a caregiver and return tokens
   * Validates: Requirements 2.2, 2.6
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    const normalizedEmail = email.toLowerCase();

    // Check if account is locked (Requirement 2.6)
    const lockoutStatus = await this.accountLockoutService.isAccountLocked(normalizedEmail);
    if (lockoutStatus.locked) {
      const remainingMinutes = lockoutStatus.remainingSeconds
        ? Math.ceil(lockoutStatus.remainingSeconds / 60)
        : 15;
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'ACCOUNT_LOCKED',
          message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
          remainingSeconds: lockoutStatus.remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Find the caregiver by email
    const caregiver = await this.prisma.caregiver.findUnique({
      where: { email: normalizedEmail },
    });

    if (!caregiver) {
      // Record failed attempt even for non-existent users to prevent enumeration
      await this.accountLockoutService.recordFailedAttempt(normalizedEmail);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, caregiver.passwordHash);

    if (!isPasswordValid) {
      // Record failed attempt (Requirement 2.6)
      const lockoutResult = await this.accountLockoutService.recordFailedAttempt(normalizedEmail);

      if (lockoutResult.isLocked) {
        const remainingMinutes = Math.ceil((lockoutResult.lockoutDurationSeconds || 900) / 60);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'ACCOUNT_LOCKED',
            message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
            remainingSeconds: lockoutResult.lockoutDurationSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Include remaining attempts in error for user feedback
      if (lockoutResult.remainingAttempts > 0) {
        throw new UnauthorizedException(
          `Invalid credentials. ${lockoutResult.remainingAttempts} attempt(s) remaining before account lockout.`,
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login (Requirement 2.6)
    await this.accountLockoutService.resetFailedAttempts(normalizedEmail);

    // Generate tokens
    const tokens = await this.generateTokens({
      id: caregiver.id,
      email: caregiver.email,
      name: caregiver.name,
    });

    return {
      tokens,
      caregiver: {
        id: caregiver.id,
        email: caregiver.email,
        name: caregiver.name,
        createdAt: caregiver.createdAt,
        updatedAt: caregiver.updatedAt,
      },
    };
  }

  /**
   * Refresh access token using a valid refresh token
   * Validates: Requirements 2.2
   */
  async refreshToken(refreshToken: string): Promise<AuthTokensResponseDto> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.jwtRefreshSecret,
      });

      // Check if the user still exists
      const caregiver = await this.prisma.caregiver.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (!caregiver) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      return this.generateTokens(caregiver);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Generate access and refresh tokens for a caregiver
   */
  private async generateTokens(
    caregiver: Pick<CaregiverResponseDto, 'id' | 'email' | 'name'>,
  ): Promise<AuthTokensResponseDto> {
    const payload: JwtPayload = {
      sub: caregiver.id,
      email: caregiver.email,
      name: caregiver.name,
    };

    // Convert expiration strings to seconds for JWT
    const accessExpiresInSeconds = this.parseExpiresIn(this.accessTokenExpiresIn);
    const refreshExpiresInSeconds = this.parseExpiresIn(this.refreshTokenExpiresIn);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
        expiresIn: accessExpiresInSeconds,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtRefreshSecret,
        expiresIn: refreshExpiresInSeconds,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresInSeconds,
    };
  }

  /**
   * Parse expiration string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match || !match[1] || !match[2]) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }

  /**
   * Validate a caregiver exists by ID
   */
  async validateCaregiver(caregiverId: string): Promise<CaregiverResponseDto | null> {
    const caregiver = await this.prisma.caregiver.findUnique({
      where: { id: caregiverId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return caregiver;
  }

  /**
   * Update caregiver profile
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<CaregiverResponseDto> {
    const caregiver = await this.prisma.caregiver.update({
      where: { id: userId },
      data: {
        name: updateProfileDto.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return caregiver;
  }

  /**
   * Change caregiver password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const caregiver = await this.prisma.caregiver.findUnique({
      where: { id: userId },
    });

    if (!caregiver) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, caregiver.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await this.prisma.caregiver.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });
  }

  // ============================================================================
  // API Key Management Methods
  // Validates: Requirements 12.2
  // ============================================================================

  /**
   * Generate a cryptographically secure API key
   * Format: bnk_<48 random hex characters>
   */
  private generateApiKey(): string {
    const randomBytes = crypto.randomBytes(24);
    return `bnk_${randomBytes.toString('hex')}`;
  }

  /**
   * Create a new API key for a caregiver
   * Validates: Requirements 12.2
   */
  async createApiKey(
    caregiverId: string,
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyCreatedResponseDto> {
    // Verify the caregiver exists
    const caregiver = await this.prisma.caregiver.findUnique({
      where: { id: caregiverId },
    });

    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    // Generate a secure API key
    const key = this.generateApiKey();

    // Parse expiration date if provided
    const expiresAt = createApiKeyDto.expiresAt
      ? new Date(createApiKeyDto.expiresAt)
      : null;

    // Create the API key record
    const apiKey = await this.prisma.apiKey.create({
      data: {
        caregiverId,
        key,
        name: createApiKeyDto.name,
        expiresAt,
      },
    });

    return {
      id: apiKey.id,
      key: apiKey.key, // Only returned at creation time
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    };
  }

  /**
   * List all API keys for a caregiver (without exposing the actual key values)
   * Validates: Requirements 12.2
   */
  async listApiKeys(caregiverId: string): Promise<ApiKeyResponseDto[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { caregiverId },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      keyHint: `****${apiKey.key.slice(-4)}`,
    }));
  }

  /**
   * Revoke (delete) an API key
   * Validates: Requirements 12.2
   */
  async revokeApiKey(caregiverId: string, apiKeyId: string): Promise<void> {
    // Find the API key and verify ownership
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.caregiverId !== caregiverId) {
      throw new ForbiddenException('You do not have permission to revoke this API key');
    }

    // Delete the API key
    await this.prisma.apiKey.delete({
      where: { id: apiKeyId },
    });
  }

  /**
   * Validate an API key and return the associated caregiver
   * Used by the API key strategy
   * Validates: Requirements 12.2
   */
  async validateApiKey(key: string): Promise<CaregiverResponseDto | null> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key },
      include: {
        caregiver: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!apiKey) {
      return null;
    }

    // Check if expired
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return null;
    }

    // Update last used timestamp (fire and forget)
    this.prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {
        // Silently ignore errors
      });

    return apiKey.caregiver;
  }

  // ============================================================================
  // Caregiver Invitation Methods
  // Validates: Requirements 2.3
  // ============================================================================

  /**
   * Default invitation expiration time (7 days)
   */
  private readonly INVITATION_EXPIRY_DAYS = 7;

  /**
   * Generate a unique invitation token
   * Format: inv_<48 random hex characters>
   */
  private generateInvitationToken(): string {
    const randomBytes = crypto.randomBytes(24);
    return `inv_${randomBytes.toString('hex')}`;
  }

  /**
   * Create an invitation for a caregiver to access a baby
   * Validates: Requirements 2.3
   */
  async createInvitation(
    inviterId: string,
    createInvitationDto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    const { babyId, inviteeEmail } = createInvitationDto;
    const normalizedEmail = inviteeEmail.toLowerCase();

    // Verify the inviter exists
    const inviter = await this.prisma.caregiver.findUnique({
      where: { id: inviterId },
    });

    if (!inviter) {
      throw new NotFoundException('Caregiver not found');
    }

    // Verify the baby exists and inviter has primary access
    const babyCaregiver = await this.prisma.babyCaregiver.findUnique({
      where: {
        babyId_caregiverId: {
          babyId,
          caregiverId: inviterId,
        },
      },
      include: {
        baby: true,
      },
    });

    if (!babyCaregiver || babyCaregiver.acceptedAt === null) {
      throw new NotFoundException('Baby not found or you do not have access');
    }

    if (babyCaregiver.role !== 'primary') {
      throw new ForbiddenException('Only primary caregivers can invite others');
    }

    // Check if invitee is already a caregiver for this baby
    const existingCaregiver = await this.prisma.caregiver.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingCaregiver) {
      const existingRelation = await this.prisma.babyCaregiver.findUnique({
        where: {
          babyId_caregiverId: {
            babyId,
            caregiverId: existingCaregiver.id,
          },
        },
      });

      if (existingRelation && existingRelation.acceptedAt !== null) {
        throw new ConflictException('This person is already a caregiver for this baby');
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        babyId,
        inviteeEmail: normalizedEmail,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('A pending invitation already exists for this email');
    }

    // Generate token and expiration
    const token = this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.INVITATION_EXPIRY_DAYS);

    // Create the invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        token,
        babyId,
        inviterId,
        inviteeEmail: normalizedEmail,
        status: 'pending',
        expiresAt,
      },
      include: {
        baby: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: invitation.id,
      token: invitation.token,
      babyId: invitation.babyId,
      babyName: invitation.baby.name,
      inviteeEmail: invitation.inviteeEmail,
      status: invitation.status as InvitationStatus,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt || undefined,
    };
  }

  /**
   * Accept an invitation using the token
   * Validates: Requirements 2.3
   */
  async acceptInvitation(
    caregiverId: string,
    acceptInvitationDto: AcceptInvitationDto,
  ): Promise<InvitationAcceptedResponseDto> {
    const { token } = acceptInvitationDto;

    // Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        baby: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      throw new ConflictException(`Invitation has already been ${invitation.status}`);
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      throw new ConflictException('Invitation has expired');
    }

    // Get the accepting caregiver
    const caregiver = await this.prisma.caregiver.findUnique({
      where: { id: caregiverId },
    });

    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    // Verify the email matches (optional - can be removed if we want to allow any authenticated user)
    if (caregiver.email.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    // Check if already a caregiver for this baby
    const existingRelation = await this.prisma.babyCaregiver.findUnique({
      where: {
        babyId_caregiverId: {
          babyId: invitation.babyId,
          caregiverId,
        },
      },
    });

    if (existingRelation && existingRelation.acceptedAt !== null) {
      throw new ConflictException('You are already a caregiver for this baby');
    }

    // Use a transaction to update invitation and create/update caregiver relationship
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedAt: now,
          acceptedById: caregiverId,
        },
      });

      // Create or update the baby-caregiver relationship
      if (existingRelation) {
        // Update existing pending relationship
        await tx.babyCaregiver.update({
          where: {
            babyId_caregiverId: {
              babyId: invitation.babyId,
              caregiverId,
            },
          },
          data: {
            acceptedAt: now,
          },
        });
      } else {
        // Create new relationship
        await tx.babyCaregiver.create({
          data: {
            babyId: invitation.babyId,
            caregiverId,
            role: 'secondary',
            invitedAt: invitation.createdAt,
            acceptedAt: now,
          },
        });
      }
    });

    return {
      message: 'Invitation accepted successfully',
      babyId: invitation.baby.id,
      babyName: invitation.baby.name,
      role: 'secondary',
    };
  }

  /**
   * List all invitations sent by a caregiver for a specific baby
   * Validates: Requirements 2.3
   */
  async listInvitations(
    caregiverId: string,
    babyId: string,
  ): Promise<InvitationListItemDto[]> {
    // Verify the caregiver has access to the baby
    const babyCaregiver = await this.prisma.babyCaregiver.findUnique({
      where: {
        babyId_caregiverId: {
          babyId,
          caregiverId,
        },
      },
    });

    if (!babyCaregiver || babyCaregiver.acceptedAt === null) {
      throw new NotFoundException('Baby not found or you do not have access');
    }

    const invitations = await this.prisma.invitation.findMany({
      where: { babyId },
      include: {
        baby: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Update expired invitations
    const now = new Date();
    const expiredIds = invitations
      .filter((inv) => inv.status === 'pending' && inv.expiresAt < now)
      .map((inv) => inv.id);

    if (expiredIds.length > 0) {
      await this.prisma.invitation.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: 'expired' },
      });
    }

    return invitations.map((invitation) => ({
      id: invitation.id,
      babyId: invitation.babyId,
      babyName: invitation.baby.name,
      inviteeEmail: invitation.inviteeEmail,
      status: (invitation.status === 'pending' && invitation.expiresAt < now
        ? 'expired'
        : invitation.status) as InvitationStatus,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt || undefined,
      tokenHint: `****${invitation.token.slice(-4)}`,
    }));
  }

  /**
   * Revoke a pending invitation
   * Validates: Requirements 2.3
   */
  async revokeInvitation(
    caregiverId: string,
    invitationId: string,
  ): Promise<void> {
    // Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        baby: {
          include: {
            caregivers: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify the caregiver is a primary caregiver for this baby
    const caregiverRelation = invitation.baby.caregivers.find(
      (bc) => bc.caregiverId === caregiverId && bc.acceptedAt !== null,
    );

    if (!caregiverRelation) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    if (caregiverRelation.role !== 'primary') {
      throw new ForbiddenException('Only primary caregivers can revoke invitations');
    }

    // Check if invitation can be revoked
    if (invitation.status !== 'pending') {
      throw new ConflictException(`Cannot revoke an invitation that has been ${invitation.status}`);
    }

    // Revoke the invitation
    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'revoked' },
    });
  }

  /**
   * Validate an invitation token (public endpoint - no auth required)
   * Returns invitation details and validity status
   * Validates: Requirements 2.3
   */
  async validateInvitation(token: string): Promise<InvitationValidationResponseDto> {
    // Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        baby: {
          select: {
            name: true,
          },
        },
        inviter: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return {
        valid: false,
        babyName: '',
        inviterName: '',
        inviteeEmail: '',
        status: InvitationStatus.EXPIRED,
        expiresAt: new Date(),
        error: 'Invitation not found',
      };
    }

    const now = new Date();
    const isExpired = now > invitation.expiresAt;

    // If invitation is pending but expired, update its status
    if (invitation.status === 'pending' && isExpired) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
    }

    // Determine the effective status
    let effectiveStatus = invitation.status as InvitationStatus;
    if (invitation.status === 'pending' && isExpired) {
      effectiveStatus = InvitationStatus.EXPIRED;
    }

    // Determine validity and error message
    let valid = false;
    let error: string | undefined;

    if (effectiveStatus === InvitationStatus.PENDING) {
      valid = true;
    } else if (effectiveStatus === InvitationStatus.EXPIRED) {
      error = 'This invitation has expired';
    } else if (effectiveStatus === InvitationStatus.ACCEPTED) {
      error = 'This invitation has already been accepted';
    } else if (effectiveStatus === InvitationStatus.REVOKED) {
      error = 'This invitation has been revoked';
    }

    return {
      valid,
      babyName: invitation.baby.name,
      inviterName: invitation.inviter.name,
      inviteeEmail: invitation.inviteeEmail,
      status: effectiveStatus,
      expiresAt: invitation.expiresAt,
      error,
    };
  }

  /**
   * Get pending invitations for the current user by their email
   * Used to show a banner when user has pending invitations
   */
  async getPendingInvitationsForUser(userEmail: string): Promise<PendingInvitationDto[]> {
    const normalizedEmail = userEmail.toLowerCase();
    const now = new Date();

    // Find all pending invitations for this email that haven't expired
    const invitations = await this.prisma.invitation.findMany({
      where: {
        inviteeEmail: normalizedEmail,
        status: 'pending',
        expiresAt: { gt: now },
      },
      include: {
        baby: {
          select: {
            name: true,
          },
        },
        inviter: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((invitation) => ({
      token: invitation.token,
      babyName: invitation.baby.name,
      inviterName: invitation.inviter.name,
      expiresAt: invitation.expiresAt,
    }));
  }
}
