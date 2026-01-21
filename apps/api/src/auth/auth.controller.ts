import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Delete,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  AuthTokensResponseDto,
  CaregiverResponseDto,
  CreateApiKeyDto,
  ApiKeyCreatedResponseDto,
  ApiKeyResponseDto,
  CreateInvitationDto,
  AcceptInvitationDto,
  InvitationResponseDto,
  InvitationAcceptedResponseDto,
  InvitationListItemDto,
  InvitationValidationResponseDto,
  PendingInvitationDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Authentication Controller
 * Handles registration, login, and token refresh endpoints
 * Validates: Requirements 2.1, 2.2
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new caregiver account
   * POST /auth/register
   * Validates: Requirements 2.1
   */
  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register new caregiver',
    description: 'Create a new caregiver account with email and password authentication',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Caregiver registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already registered',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Login with email and password
   * POST /auth/login
   * Validates: Requirements 2.2
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login caregiver',
    description: 'Authenticate with email and password to get access tokens',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   * Validates: Requirements 2.2
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using a valid refresh token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: AuthTokensResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthTokensResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * Get current user profile
   * GET /auth/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get the profile of the currently authenticated caregiver',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile',
    type: CaregiverResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async getCurrentUser(@CurrentUser() user: CaregiverResponseDto): Promise<CaregiverResponseDto> {
    return user;
  }

  /**
   * Update current user profile
   * PATCH /auth/me
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update current user',
    description: 'Update the profile of the currently authenticated caregiver',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: CaregiverResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async updateProfile(
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<CaregiverResponseDto> {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  /**
   * Change password
   * POST /auth/change-password
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the password for the current user',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid current password or not authenticated',
  })
  async changePassword(
    @CurrentUser() user: CaregiverResponseDto,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  // ============================================================================
  // API Key Management Endpoints
  // Validates: Requirements 12.2
  // ============================================================================

  /**
   * Create a new API key
   * POST /auth/api-keys
   * Validates: Requirements 12.2
   */
  @UseGuards(JwtAuthGuard)
  @Post('api-keys')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create API key',
    description: 'Create a new API key for programmatic access. The key is only shown once at creation time.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'API key created successfully',
    type: ApiKeyCreatedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createApiKey(
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyCreatedResponseDto> {
    return this.authService.createApiKey(user.id, createApiKeyDto);
  }

  /**
   * List all API keys for the current user
   * GET /auth/api-keys
   * Validates: Requirements 12.2
   */
  @UseGuards(JwtAuthGuard)
  @Get('api-keys')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List API keys',
    description: 'List all API keys for the current user. The actual key values are not returned.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of API keys',
    type: [ApiKeyResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async listApiKeys(@CurrentUser() user: CaregiverResponseDto): Promise<ApiKeyResponseDto[]> {
    return this.authService.listApiKeys(user.id);
  }

  /**
   * Revoke (delete) an API key
   * DELETE /auth/api-keys/:id
   * Validates: Requirements 12.2
   */
  @UseGuards(JwtAuthGuard)
  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke API key',
    description: 'Revoke (delete) an API key. This action cannot be undone.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'API key revoked successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'API key not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to revoke this API key',
  })
  async revokeApiKey(
    @CurrentUser() user: CaregiverResponseDto,
    @Param('id') id: string,
  ): Promise<void> {
    return this.authService.revokeApiKey(user.id, id);
  }

  // ============================================================================
  // Caregiver Invitation Endpoints
  // Validates: Requirements 2.3
  // ============================================================================

  /**
   * Create an invitation for another caregiver
   * POST /auth/invite
   * Validates: Requirements 2.3
   */
  @UseGuards(JwtAuthGuard)
  @Post('invite')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Invite caregiver',
    description: 'Create an invitation for another person to become a caregiver for a baby. Only primary caregivers can send invitations.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invitation created successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only primary caregivers can invite others',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Baby not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Person is already a caregiver or has a pending invitation',
  })
  async createInvitation(
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createInvitationDto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    return this.authService.createInvitation(user.id, createInvitationDto);
  }

  /**
   * Validate an invitation token (public endpoint)
   * GET /auth/invite/validate/:token
   * Validates: Requirements 2.3
   */
  @Public()
  @Get('invite/validate/:token')
  @ApiOperation({
    summary: 'Validate invitation',
    description: 'Check if an invitation token is valid. This is a public endpoint that does not require authentication.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation validation result',
    type: InvitationValidationResponseDto,
  })
  async validateInvitation(
    @Param('token') token: string,
  ): Promise<InvitationValidationResponseDto> {
    return this.authService.validateInvitation(token);
  }

  /**
   * Get pending invitations for the current user
   * GET /auth/invite/pending
   * Returns invitations sent to the current user's email that are still pending
   */
  @UseGuards(JwtAuthGuard)
  @Get('invite/pending')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get pending invitations',
    description: 'Get all pending invitations for the current user. Used to show a banner when user has pending invitations.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of pending invitations',
    type: [PendingInvitationDto],
  })
  async getPendingInvitations(
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<PendingInvitationDto[]> {
    return this.authService.getPendingInvitationsForUser(user.email);
  }

  /**
   * Accept an invitation
   * POST /auth/invite/accept
   * Validates: Requirements 2.3
   */
  @UseGuards(JwtAuthGuard)
  @Post('invite/accept')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept invitation',
    description: 'Accept an invitation to become a caregiver for a baby. The invitation token must match the authenticated user\'s email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation accepted successfully',
    type: InvitationAcceptedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Invitation was sent to a different email',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invitation not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Invitation has expired or already been used',
  })
  async acceptInvitation(
    @CurrentUser() user: CaregiverResponseDto,
    @Body() acceptInvitationDto: AcceptInvitationDto,
  ): Promise<InvitationAcceptedResponseDto> {
    return this.authService.acceptInvitation(user.id, acceptInvitationDto);
  }

  /**
   * List invitations for a baby
   * GET /auth/invite/:babyId
   * Validates: Requirements 2.3
   */
  @UseGuards(JwtAuthGuard)
  @Get('invite/:babyId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List invitations',
    description: 'List all invitations for a specific baby. Only caregivers with access to the baby can view invitations.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of invitations',
    type: [InvitationListItemDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Baby not found or no access',
  })
  async listInvitations(
    @CurrentUser() user: CaregiverResponseDto,
    @Param('babyId') babyId: string,
  ): Promise<InvitationListItemDto[]> {
    return this.authService.listInvitations(user.id, babyId);
  }

  /**
   * Revoke a pending invitation
   * DELETE /auth/invite/:id
   * Validates: Requirements 2.3
   */
  @UseGuards(JwtAuthGuard)
  @Delete('invite/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke invitation',
    description: 'Revoke a pending invitation. Only primary caregivers can revoke invitations.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Invitation revoked successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only primary caregivers can revoke invitations',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invitation not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot revoke an invitation that has already been accepted or expired',
  })
  async revokeInvitation(
    @CurrentUser() user: CaregiverResponseDto,
    @Param('id') id: string,
  ): Promise<void> {
    return this.authService.revokeInvitation(user.id, id);
  }
}
