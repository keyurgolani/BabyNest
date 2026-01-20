import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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

import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  MilestoneEntryResponseDto,
  MilestoneEntryListResponseDto,
  MilestoneQueryDto,
  MilestonesByCategoryQueryDto,
  MilestonesByCategoryResponseDto,
  MilestoneDefinitionResponseDto,
  MilestoneDefinitionQueryDto,
  MilestoneProgressResponseDto,
  UpcomingMilestonesResponseDto,
} from './dto';
import { MilestoneService } from './milestone.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Milestone Controller
 * Handles CRUD operations for milestone entries
 * Validates: Requirements 7.1, 7.2, 7.4, 7.5
 */
@ApiTags('milestones')
@Controller()
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}

  /**
   * Get all milestone definitions
   * GET /milestones/definitions
   * Validates: Requirements 7.1
   */
  @Get('milestones/definitions')
  @ApiOperation({
    summary: 'Get all milestone definitions',
    description: `Get all developmental milestone definitions organized by category.
    
    Categories:
    - **motor**: Movement milestones (rolling, crawling, walking, etc.)
    - **cognitive**: Thinking and problem-solving milestones
    - **social**: Social and emotional milestones
    - **language**: Communication and language milestones
    
    Each milestone includes expected age ranges based on developmental guidelines.`,
  })
  @ApiResponse({
    status: 200,
    description: 'List of milestone definitions',
    type: [MilestoneDefinitionResponseDto],
  })
  async getDefinitions(
    @Query() query: MilestoneDefinitionQueryDto,
  ): Promise<MilestoneDefinitionResponseDto[]> {
    return this.milestoneService.getDefinitions(query);
  }

  /**
   * Get a single milestone definition
   * GET /milestones/definitions/:definitionId
   * Validates: Requirements 7.1
   */
  @Get('milestones/definitions/:definitionId')
  @ApiOperation({
    summary: 'Get a milestone definition',
    description: 'Get details of a specific milestone definition.',
  })
  @ApiParam({
    name: 'definitionId',
    description: 'Milestone definition ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone definition details',
    type: MilestoneDefinitionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Milestone definition not found' })
  async getDefinition(
    @Param('definitionId') definitionId: string,
  ): Promise<MilestoneDefinitionResponseDto> {
    return this.milestoneService.getDefinition(definitionId);
  }

  /**
   * Get milestones by category with achievement status
   * GET /babies/:babyId/milestones
   * Validates: Requirements 7.1, 7.4, 7.5
   */
  @Get('babies/:babyId/milestones')
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @UseGuards(CombinedAuthGuard)
  @ApiOperation({
    summary: 'Get milestones by category with status',
    description: `Get all milestones organized by category with achievement status for a baby.
    
    Returns milestones grouped by category (motor, cognitive, social, language) with:
    - **isAchieved**: Whether the milestone has been achieved
    - **isUpcoming**: Whether the milestone is upcoming (baby hasn't reached expected age)
    - **isDelayed**: Whether the milestone is delayed (baby is past expected age range)
    - **achievement**: The achievement entry if milestone is achieved
    
    Use query parameters to filter:
    - **category**: Filter by specific category
    - **ageAppropriate**: Only show milestones appropriate for baby's current age
    - **includeAchieved**: Include/exclude achieved milestones
    - **includeUpcoming**: Include/exclude upcoming milestones`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Milestones by category with status',
    type: MilestonesByCategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async getMilestonesByCategory(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: MilestonesByCategoryQueryDto,
  ): Promise<MilestonesByCategoryResponseDto> {
    return this.milestoneService.getMilestonesByCategory(babyId, user.id, query);
  }

  /**
   * List achieved milestones for a baby
   * GET /babies/:babyId/milestones/achieved
   * Validates: Requirements 7.2, 12.6
   */
  @Get('babies/:babyId/milestones/achieved')
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @UseGuards(CombinedAuthGuard)
  @ApiOperation({
    summary: 'List achieved milestones',
    description: 'Get all achieved milestones for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of achieved milestones',
    type: MilestoneEntryListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAll(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: MilestoneQueryDto,
  ): Promise<MilestoneEntryListResponseDto> {
    return this.milestoneService.findAll(babyId, user.id, query);
  }

  /**
   * Mark a milestone as achieved
   * POST /babies/:babyId/milestones
   * Validates: Requirements 7.2
   */
  @Post('babies/:babyId/milestones')
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @UseGuards(CombinedAuthGuard)
  @ApiOperation({
    summary: 'Mark milestone as achieved',
    description: `Mark a developmental milestone as achieved for a baby.
    
    Provide:
    - **milestoneId**: ID of the milestone definition being achieved
    - **achievedDate**: When the milestone was achieved (defaults to now)
    - **photoUrl**: Optional URL to a photo documenting the milestone
    - **notes**: Optional notes about the achievement
    
    Each milestone can only be achieved once per baby.`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Milestone marked as achieved',
    type: MilestoneEntryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or milestone already achieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby or milestone definition not found' })
  async create(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createMilestoneDto: CreateMilestoneDto,
  ): Promise<MilestoneEntryResponseDto> {
    return this.milestoneService.create(babyId, user.id, createMilestoneDto);
  }

  /**
   * Get a single milestone entry
   * GET /babies/:babyId/milestones/achieved/:entryId
   * Validates: Requirements 7.2
   */
  @Get('babies/:babyId/milestones/achieved/:entryId')
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @UseGuards(CombinedAuthGuard)
  @ApiOperation({
    summary: 'Get milestone achievement details',
    description: 'Get details of a specific milestone achievement.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Milestone entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone entry details',
    type: MilestoneEntryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Milestone entry not found' })
  async findOne(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<MilestoneEntryResponseDto> {
    return this.milestoneService.findOne(babyId, entryId, user.id);
  }

  /**
   * Update a milestone entry
   * PATCH /babies/:babyId/milestones/achieved/:entryId
   * Validates: Requirements 7.2
   */
  @Patch('babies/:babyId/milestones/achieved/:entryId')
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @UseGuards(CombinedAuthGuard)
  @ApiOperation({
    summary: 'Update milestone achievement',
    description: `Update a milestone achievement entry. Only provided fields will be updated.
    
    Common use cases:
    - Update achieved date
    - Add or update photo URL
    - Add or update notes`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Milestone entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone entry updated successfully',
    type: MilestoneEntryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Milestone entry not found' })
  async update(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
  ): Promise<MilestoneEntryResponseDto> {
    return this.milestoneService.update(babyId, entryId, user.id, updateMilestoneDto);
  }

  /**
   * Delete a milestone entry (soft delete)
   * DELETE /babies/:babyId/milestones/achieved/:entryId
   * Validates: Requirements 7.2
   */
  @Delete('babies/:babyId/milestones/achieved/:entryId')
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @UseGuards(CombinedAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete milestone achievement',
    description: 'Soft delete a milestone achievement. The milestone can be re-achieved after deletion.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Milestone entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Milestone entry deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Milestone entry not found' })
  async remove(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.milestoneService.remove(babyId, entryId, user.id);
  }

  /**
   * Get milestone progress
   * GET /babies/:babyId/milestones/progress
   */
  @Get('babies/:babyId/milestones/progress')
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @UseGuards(CombinedAuthGuard)
  @ApiOperation({
    summary: 'Get milestone progress',
    description: 'Get overall milestone progress percentage and progress by category for a baby.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone progress',
    type: MilestoneProgressResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async getMilestoneProgress(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<MilestoneProgressResponseDto> {
    return this.milestoneService.getMilestoneProgress(babyId, user.id);
  }

  /**
   * Get upcoming milestones
   * GET /babies/:babyId/milestones/upcoming
   */
  @Get('babies/:babyId/milestones/upcoming')
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @UseGuards(CombinedAuthGuard)
  @ApiOperation({
    summary: 'Get upcoming milestones',
    description: 'Get next expected milestones that the baby has not yet achieved.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming milestones',
    type: UpcomingMilestonesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async getUpcomingMilestones(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<UpcomingMilestonesResponseDto> {
    return this.milestoneService.getUpcomingMilestones(babyId, user.id);
  }
}
