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

import { DiaperService } from './diaper.service';
import {
  CreateDiaperDto,
  UpdateDiaperDto,
  DiaperResponseDto,
  DiaperListResponseDto,
  DiaperQueryDto,
  DiaperStatisticsDto,
  DiaperStatisticsQueryDto,
} from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Diaper Controller
 * Handles CRUD operations for diaper entries
 * Validates: Requirements 5.1, 5.2
 */
@ApiTags('diapers')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('babies/:babyId/diapers')
export class DiaperController {
  constructor(private readonly diaperService: DiaperService) {}

  /**
   * Create a new diaper entry
   * POST /babies/:babyId/diapers
   * Validates: Requirements 5.1, 5.2
   */
  @Post()
  @ApiOperation({
    summary: 'Log diaper change',
    description: `Create a new diaper entry for a baby. Records:
    - **type**: Type of diaper (wet/dirty/mixed/dry)
    - **timestamp**: When the diaper change occurred (defaults to now)
    - **color**: Optional color of stool
    - **consistency**: Optional consistency of stool
    - **hasRash**: Whether the baby has a diaper rash
    - **notes**: Optional notes about the diaper change`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Diaper entry created successfully',
    type: DiaperResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async create(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createDiaperDto: CreateDiaperDto,
  ): Promise<DiaperResponseDto> {
    return this.diaperService.create(babyId, user.id, createDiaperDto);
  }

  /**
   * List diaper entries for a baby
   * GET /babies/:babyId/diapers
   * Validates: Requirements 5.3, 12.6
   */
  @Get()
  @ApiOperation({
    summary: 'List diaper entries with filters',
    description: 'Get all diaper entries for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of diaper entries',
    type: DiaperListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAll(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: DiaperQueryDto,
  ): Promise<DiaperListResponseDto> {
    return this.diaperService.findAll(babyId, user.id, query);
  }

  /**
   * Get diaper statistics for a baby
   * GET /babies/:babyId/diapers/stats
   * Validates: Requirements 5.3, 5.4
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get diaper statistics',
    description: `Get diaper statistics for a baby including:
    - **Total changes**: Total diaper changes in the period
    - **Count by type**: Breakdown by wet, dirty, mixed, dry
    - **Hydration alert**: Alert if fewer than expected wet diapers in 24 hours
    - **Daily breakdown**: Day-by-day statistics
    
    Hydration thresholds are based on baby age:
    - Newborn (0-1 month): 6+ wet diapers per day
    - 1-6 months: 6+ wet diapers per day
    - 6+ months: 4+ wet diapers per day`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Diaper statistics',
    type: DiaperStatisticsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async getStatistics(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: DiaperStatisticsQueryDto,
  ): Promise<DiaperStatisticsDto> {
    return this.diaperService.getStatistics(babyId, user.id, query);
  }

  /**
   * Get a single diaper entry
   * GET /babies/:babyId/diapers/:diaperId
   * Validates: Requirements 5.1, 5.2
   */
  @Get(':diaperId')
  @ApiOperation({
    summary: 'Get single diaper entry',
    description: 'Get a specific diaper entry by ID.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'diaperId',
    description: 'Diaper entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Diaper entry details',
    type: DiaperResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Diaper entry not found' })
  async findOne(
    @Param('babyId') babyId: string,
    @Param('diaperId') diaperId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<DiaperResponseDto> {
    return this.diaperService.findOne(babyId, diaperId, user.id);
  }

  /**
   * Update a diaper entry
   * PATCH /babies/:babyId/diapers/:diaperId
   * Validates: Requirements 5.1, 5.2
   */
  @Patch(':diaperId')
  @ApiOperation({
    summary: 'Update diaper entry',
    description: `Update a diaper entry. Only provided fields will be updated.
    
    Common use cases:
    - Update diaper type
    - Add or update notes about color, consistency, or rash
    - Correct timestamp`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'diaperId',
    description: 'Diaper entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Diaper entry updated successfully',
    type: DiaperResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Diaper entry not found' })
  async update(
    @Param('babyId') babyId: string,
    @Param('diaperId') diaperId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateDiaperDto: UpdateDiaperDto,
  ): Promise<DiaperResponseDto> {
    return this.diaperService.update(babyId, diaperId, user.id, updateDiaperDto);
  }

  /**
   * Delete a diaper entry (soft delete)
   * DELETE /babies/:babyId/diapers/:diaperId
   * Validates: Requirements 5.1
   */
  @Delete(':diaperId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete diaper entry',
    description: 'Soft delete a diaper entry. The entry can be recovered by including deleted entries in queries.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'diaperId',
    description: 'Diaper entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Diaper entry deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Diaper entry not found' })
  async remove(
    @Param('babyId') babyId: string,
    @Param('diaperId') diaperId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.diaperService.remove(babyId, diaperId, user.id);
  }
}
