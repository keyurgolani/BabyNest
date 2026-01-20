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
  CreateFeedingDto,
  UpdateFeedingDto,
  FeedingResponseDto,
  FeedingListResponseDto,
  FeedingQueryDto,
  FeedingSuggestionDto,
  FeedingStatisticsDto,
  FeedingStatisticsQueryDto,
} from './dto';
import { FeedingService } from './feeding.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Feeding Controller
 * Handles CRUD operations for feeding entries
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
@ApiTags('feedings')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('babies/:babyId/feedings')
export class FeedingController {
  constructor(private readonly feedingService: FeedingService) {}

  /**
   * Create a new feeding entry
   * POST /babies/:babyId/feedings
   * Validates: Requirements 3.1, 3.3, 3.4, 3.5, 3.6
   */
  @Post()
  @ApiOperation({
    summary: 'Log feeding entry',
    description: `Create a new feeding entry for a baby. Supports four feeding types:
    - **breastfeeding**: Records duration per breast side and last side used
    - **bottle**: Records amount and type (formula/breast milk/water)
    - **pumping**: Records amount pumped, duration, and breast side
    - **solid**: Records food type and any reaction notes`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Feeding entry created successfully',
    type: FeedingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or type-specific validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async create(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createFeedingDto: CreateFeedingDto,
  ): Promise<FeedingResponseDto> {
    return this.feedingService.create(babyId, user.id, createFeedingDto);
  }

  /**
   * List feeding entries for a baby
   * GET /babies/:babyId/feedings
   * Validates: Requirements 3.7, 12.6
   */
  @Get()
  @ApiOperation({
    summary: 'List feedings with filters',
    description: 'Get all feeding entries for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of feeding entries',
    type: FeedingListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAll(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: FeedingQueryDto,
  ): Promise<FeedingListResponseDto> {
    return this.feedingService.findAll(babyId, user.id, query);
  }

  /**
   * Get feeding statistics for a baby
   * GET /babies/:babyId/feedings/stats
   * Validates: Requirements 3.7
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get feeding statistics',
    description: `Get feeding statistics for a baby within a date range. Statistics include:
    - Total number of feedings
    - Count by type (breastfeeding, bottle, pumping, solid)
    - Average duration for breastfeeding sessions (total of left + right)
    - Average amount for bottle feedings
    - Average pumped amount for pumping sessions
    - Last feeding entry
    - Suggested next breast side`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Feeding statistics',
    type: FeedingStatisticsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getStatistics(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: FeedingStatisticsQueryDto,
  ): Promise<FeedingStatisticsDto> {
    return this.feedingService.getStatistics(babyId, user.id, query);
  }

  /**
   * Get feeding suggestion (next breast side)
   * GET /babies/:babyId/feedings/suggestion
   * Validates: Requirements 3.8
   */
  @Get('suggestion')
  @ApiOperation({
    summary: 'Get next feed suggestion',
    description: `Get feeding suggestion including the suggested next breast side based on the last breastfeeding session.
    
    The suggestion alternates breast sides:
    - If the last breastfeeding used the left side, suggests right
    - If the last breastfeeding used the right side, suggests left
    - If no previous breastfeeding exists, returns null for suggested side`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Feeding suggestion',
    type: FeedingSuggestionDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getSuggestion(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<FeedingSuggestionDto> {
    return this.feedingService.getSuggestion(babyId, user.id);
  }

  /**
   * Get a single feeding entry
   * GET /babies/:babyId/feedings/:feedingId
   * Validates: Requirements 3.1, 3.4, 3.5, 3.6
   */
  @Get(':feedingId')
  @ApiOperation({
    summary: 'Get single feeding',
    description: 'Get a specific feeding entry by ID.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'feedingId',
    description: 'Feeding entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Feeding entry details',
    type: FeedingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Feeding entry not found' })
  async findOne(
    @Param('babyId') babyId: string,
    @Param('feedingId') feedingId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<FeedingResponseDto> {
    return this.feedingService.findOne(babyId, feedingId, user.id);
  }

  /**
   * Update a feeding entry
   * PATCH /babies/:babyId/feedings/:feedingId
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
   */
  @Patch(':feedingId')
  @ApiOperation({
    summary: 'Update feeding',
    description: 'Update a feeding entry. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'feedingId',
    description: 'Feeding entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Feeding entry updated successfully',
    type: FeedingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or type-specific validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Feeding entry not found' })
  async update(
    @Param('babyId') babyId: string,
    @Param('feedingId') feedingId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateFeedingDto: UpdateFeedingDto,
  ): Promise<FeedingResponseDto> {
    return this.feedingService.update(babyId, feedingId, user.id, updateFeedingDto);
  }

  /**
   * Delete a feeding entry (soft delete)
   * DELETE /babies/:babyId/feedings/:feedingId
   * Validates: Requirements 3.1
   */
  @Delete(':feedingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete feeding',
    description: 'Soft delete a feeding entry. The entry can be recovered by including deleted entries in queries.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'feedingId',
    description: 'Feeding entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Feeding entry deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Feeding entry not found' })
  async remove(
    @Param('babyId') babyId: string,
    @Param('feedingId') feedingId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.feedingService.remove(babyId, feedingId, user.id);
  }
}
