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

import { ActivityService } from './activity.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityResponseDto,
  ActivityListResponseDto,
  ActivityQueryDto,
  ActivityStatisticsQueryDto,
  ActivityStatisticsDto,
} from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Activity Controller
 * Handles CRUD operations for activity entries (tummy time, bath, outdoor, play)
 * Validates: Requirements 9.1, 9.2, 9.3
 */
@ApiTags('activities')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('babies/:babyId/activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * Create a new activity entry
   * POST /babies/:babyId/activities
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  @Post()
  @ApiOperation({
    summary: 'Log activity entry',
    description: `Create a new activity entry for a baby. Supported activity types:
    - **tummy_time**: Tummy time sessions (Requirement 9.1)
    - **bath**: Bath time (Requirement 9.2)
    - **outdoor**: Outdoor time (Requirement 9.3)
    - **play**: Play time
    
    Duration can be:
    - Calculated automatically from startTime and endTime if both are provided
    - Set directly via the duration field
    - Left null for activities without duration tracking`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Activity entry created successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async create(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createActivityDto: CreateActivityDto,
  ): Promise<ActivityResponseDto> {
    return this.activityService.create(babyId, user.id, createActivityDto);
  }

  /**
   * List activity entries for a baby
   * GET /babies/:babyId/activities
   * Validates: Requirements 12.6
   */
  @Get()
  @ApiOperation({
    summary: 'List activity entries with filters',
    description: 'Get all activity entries for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of activity entries',
    type: ActivityListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAll(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: ActivityQueryDto,
  ): Promise<ActivityListResponseDto> {
    return this.activityService.findAll(babyId, user.id, query);
  }

  /**
   * Get activity statistics for a baby
   * GET /babies/:babyId/activities/stats
   * Validates: Requirements 9.4, 9.5
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get activity statistics',
    description: `Get activity statistics for a baby including:
    - Total duration by activity type for a date range
    - Count of activities by type
    - Average duration by type
    - Daily breakdown of activities
    - Trends comparing current period to previous period
    
    **Validates: Requirements 9.4, 9.5**`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity statistics',
    type: ActivityStatisticsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getStatistics(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: ActivityStatisticsQueryDto,
  ): Promise<ActivityStatisticsDto> {
    return this.activityService.getStatistics(babyId, user.id, query);
  }

  /**
   * Get a single activity entry
   * GET /babies/:babyId/activities/:activityId
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  @Get(':activityId')
  @ApiOperation({
    summary: 'Get single activity entry',
    description: 'Get a specific activity entry by ID.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'activityId',
    description: 'Activity entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity entry details',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Activity entry not found' })
  async findOne(
    @Param('babyId') babyId: string,
    @Param('activityId') activityId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<ActivityResponseDto> {
    return this.activityService.findOne(babyId, activityId, user.id);
  }

  /**
   * Update an activity entry
   * PATCH /babies/:babyId/activities/:activityId
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  @Patch(':activityId')
  @ApiOperation({
    summary: 'Update activity entry',
    description: `Update an activity entry. Only provided fields will be updated.
    
    Common use cases:
    - End an ongoing activity by providing endTime
    - Update duration or notes
    - Change activity type`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'activityId',
    description: 'Activity entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity entry updated successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Activity entry not found' })
  async update(
    @Param('babyId') babyId: string,
    @Param('activityId') activityId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateActivityDto: UpdateActivityDto,
  ): Promise<ActivityResponseDto> {
    return this.activityService.update(babyId, activityId, user.id, updateActivityDto);
  }

  /**
   * Delete an activity entry (soft delete)
   * DELETE /babies/:babyId/activities/:activityId
   * Validates: Requirements 9.1
   */
  @Delete(':activityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete activity entry',
    description: 'Soft delete an activity entry. The entry can be recovered by including deleted entries in queries.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'activityId',
    description: 'Activity entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Activity entry deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Activity entry not found' })
  async remove(
    @Param('babyId') babyId: string,
    @Param('activityId') activityId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.activityService.remove(babyId, activityId, user.id);
  }
}
