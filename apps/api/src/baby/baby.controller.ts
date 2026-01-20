import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';

import { BabyService } from './baby.service';
import {
  CreateBabyDto,
  UpdateBabyDto,
  BabyResponseDto,
  BabyListResponseDto,
  CaregiverListResponseDto,
  UpdateCaregiverRoleDto,
} from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Baby Profile Controller
 * Handles CRUD operations for baby profiles
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */
@ApiTags('babies')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('babies')
export class BabyController {
  constructor(private readonly babyService: BabyService) {}

  /**
   * Create a new baby profile
   * POST /babies
   * Validates: Requirements 1.1
   */
  @Post()
  @ApiOperation({
    summary: 'Create baby profile',
    description: 'Create a new baby profile. The authenticated caregiver becomes the primary caregiver.',
  })
  @ApiResponse({
    status: 201,
    description: 'Baby profile created successfully',
    type: BabyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createBabyDto: CreateBabyDto,
  ): Promise<BabyResponseDto> {
    return this.babyService.create(user.id, createBabyDto);
  }

  /**
   * List all babies for the authenticated caregiver
   * GET /babies
   * Validates: Requirements 1.1
   */
  @Get()
  @ApiOperation({
    summary: 'List all babies',
    description: 'Get all baby profiles accessible to the authenticated caregiver.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of baby profiles',
    type: BabyListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<BabyListResponseDto> {
    return this.babyService.findAll(user.id);
  }

  /**
   * Get a single baby profile by ID
   * GET /babies/:id
   * Validates: Requirements 1.1, 1.2
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get baby profile',
    description: 'Get a specific baby profile by ID. Includes calculated age in months and days.',
  })
  @ApiParam({
    name: 'id',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Baby profile details',
    type: BabyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<BabyResponseDto> {
    return this.babyService.findOne(id, user.id);
  }

  /**
   * Update a baby profile
   * PATCH /babies/:id
   * Validates: Requirements 1.3
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update baby profile',
    description: 'Update a baby profile. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Baby profile updated successfully',
    type: BabyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateBabyDto: UpdateBabyDto,
  ): Promise<BabyResponseDto> {
    return this.babyService.update(id, user.id, updateBabyDto);
  }

  /**
   * Delete a baby profile and all associated data
   * DELETE /babies/:id
   * Validates: Requirements 1.4
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete baby profile',
    description: 'Delete a baby profile and all associated tracking data. Only primary caregivers can delete.',
  })
  @ApiParam({
    name: 'id',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 204, description: 'Baby profile deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only primary caregivers can delete' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.babyService.remove(id, user.id);
  }

  /**
   * Remove a caregiver from a baby
   * DELETE /babies/:babyId/caregivers/:caregiverId
   * Validates: Requirements 2.3
   */
  @Delete(':babyId/caregivers/:caregiverId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove caregiver',
    description: 'Remove a caregiver from a baby. Only primary caregivers can remove others.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Caregiver removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only primary caregivers can remove other caregivers',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Baby or caregiver not found',
  })
  async removeCaregiver(
    @CurrentUser() user: CaregiverResponseDto,
    @Param('babyId') babyId: string,
    @Param('caregiverId') caregiverId: string,
  ): Promise<void> {
    return this.babyService.removeCaregiver(babyId, user.id, caregiverId);
  }

  /**
   * List all caregivers for a baby
   * GET /babies/:babyId/caregivers
   */
  @Get(':babyId/caregivers')
  @ApiOperation({
    summary: 'List caregivers',
    description: 'Get all caregivers with access to a baby and their roles.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of caregivers',
    type: CaregiverListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async listCaregivers(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<CaregiverListResponseDto> {
    return this.babyService.listCaregivers(babyId, user.id);
  }

  /**
   * Update a caregiver's role
   * PATCH /babies/:babyId/caregivers/:caregiverId/role
   */
  @Patch(':babyId/caregivers/:caregiverId/role')
  @ApiOperation({
    summary: 'Update caregiver role',
    description: 'Update a caregiver\'s role (primary or secondary). Only primary caregivers can update roles.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'caregiverId',
    description: 'Caregiver ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Caregiver role updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only primary caregivers can update roles' })
  @ApiResponse({ status: 404, description: 'Baby or caregiver not found' })
  async updateCaregiverRole(
    @Param('babyId') babyId: string,
    @Param('caregiverId') caregiverId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateRoleDto: UpdateCaregiverRoleDto,
  ) {
    return this.babyService.updateCaregiverRole(
      babyId,
      user.id,
      caregiverId,
      updateRoleDto.role,
    );
  }
}
