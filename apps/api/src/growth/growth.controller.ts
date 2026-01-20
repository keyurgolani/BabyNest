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
  CreateGrowthDto,
  UpdateGrowthDto,
  GrowthResponseDto,
  GrowthListResponseDto,
  GrowthQueryDto,
  GrowthSingleQueryDto,
  PercentileChartQueryDto,
  PercentileChartResponseDto,
  GrowthVelocityQueryDto,
  GrowthVelocityResponseDto,
} from './dto';
import { GrowthService } from './growth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Growth Controller
 * Handles CRUD operations for growth entries
 * Validates: Requirements 6.1
 */
@ApiTags('growth')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('babies/:babyId/growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  /**
   * Create a new growth entry
   * POST /babies/:babyId/growth
   * Validates: Requirements 6.1
   */
  @Post()
  @ApiOperation({
    summary: 'Log growth measurement',
    description: `Create a new growth entry for a baby. Records:
    - **weight**: Weight in grams (e.g., 3500 = 3.5 kg)
    - **height**: Height/length in millimeters (e.g., 500 = 50 cm)
    - **headCircumference**: Head circumference in millimeters (e.g., 350 = 35 cm)
    - **timestamp**: When the measurement was taken (defaults to now)
    - **notes**: Optional notes about the measurement
    
    At least one measurement (weight, height, or headCircumference) must be provided.`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Growth entry created successfully',
    type: GrowthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or no measurements provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async create(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createGrowthDto: CreateGrowthDto,
  ): Promise<GrowthResponseDto> {
    return this.growthService.create(babyId, user.id, createGrowthDto);
  }

  /**
   * List growth entries for a baby
   * GET /babies/:babyId/growth
   * Validates: Requirements 6.1, 12.6
   */
  @Get()
  @ApiOperation({
    summary: 'List growth measurements with filters',
    description: 'Get all growth entries for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of growth entries',
    type: GrowthListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAll(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: GrowthQueryDto,
  ): Promise<GrowthListResponseDto> {
    return this.growthService.findAll(babyId, user.id, query);
  }

  /**
   * Get WHO percentile chart data
   * GET /babies/:babyId/growth/percentiles
   * Validates: Requirements 6.2
   * NOTE: This route must be defined BEFORE :growthId to avoid route conflicts
   */
  @Get('percentiles')
  @ApiOperation({
    summary: 'Get WHO percentile chart data',
    description: `Get WHO growth standard percentile curves for charting, along with the baby's measurements.
    
    Returns:
    - **data**: Percentile curve data points (3rd, 15th, 50th, 85th, 97th percentiles)
    - **measurements**: Baby's actual measurements plotted on the chart
    
    Measurement types:
    - **weight**: Weight-for-age (in kg)
    - **height**: Length/height-for-age (in cm)
    - **headCircumference**: Head circumference-for-age (in cm)
    
    The percentile curves are based on WHO Child Growth Standards for children 0-24 months.`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Percentile chart data',
    type: PercentileChartResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async getPercentileChartData(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: PercentileChartQueryDto,
  ): Promise<PercentileChartResponseDto> {
    return this.growthService.getPercentileChartData(babyId, user.id, query);
  }

  /**
   * Get growth velocity data
   * GET /babies/:babyId/growth/velocity
   * Validates: Requirements 6.5
   * NOTE: This route must be defined BEFORE :growthId to avoid route conflicts
   */
  @Get('velocity')
  @ApiOperation({
    summary: 'Get growth velocity data',
    description: `Calculate growth velocity (rate of change) between consecutive measurements.
    
    Returns:
    - **velocityData**: Velocity calculations between each pair of consecutive measurements
    - **summary**: Average velocities and total changes across all measurements
    
    Velocity is calculated as:
    - **Weight velocity**: grams gained per day or week
    - **Height velocity**: mm grown per day or week
    - **Head circumference velocity**: mm grown per day or week
    
    Use the timeUnit query parameter to specify whether to calculate velocity per day or per week (default: week).`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Growth velocity data',
    type: GrowthVelocityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getGrowthVelocity(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: GrowthVelocityQueryDto,
  ): Promise<GrowthVelocityResponseDto> {
    return this.growthService.getGrowthVelocity(babyId, user.id, query);
  }

  /**
   * Get a single growth entry
   * GET /babies/:babyId/growth/:growthId
   * Validates: Requirements 6.1, 6.4
   * NOTE: This route must be defined AFTER specific routes like /percentiles and /velocity
   */
  @Get(':growthId')
  @ApiOperation({
    summary: 'Get single growth entry',
    description: 'Get a specific growth entry by ID. Optionally include converted measurements in both metric and imperial units.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'growthId',
    description: 'Growth entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Growth entry details',
    type: GrowthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Growth entry not found' })
  async findOne(
    @Param('babyId') babyId: string,
    @Param('growthId') growthId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: GrowthSingleQueryDto,
  ): Promise<GrowthResponseDto> {
    return this.growthService.findOne(babyId, growthId, user.id, query.includeConversions);
  }

  /**
   * Update a growth entry
   * PATCH /babies/:babyId/growth/:growthId
   * Validates: Requirements 6.1
   */
  @Patch(':growthId')
  @ApiOperation({
    summary: 'Update growth entry',
    description: `Update a growth entry. Only provided fields will be updated.
    
    Common use cases:
    - Update measurement values
    - Add or update notes
    - Correct timestamp`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'growthId',
    description: 'Growth entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Growth entry updated successfully',
    type: GrowthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Growth entry not found' })
  async update(
    @Param('babyId') babyId: string,
    @Param('growthId') growthId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateGrowthDto: UpdateGrowthDto,
  ): Promise<GrowthResponseDto> {
    return this.growthService.update(babyId, growthId, user.id, updateGrowthDto);
  }

  /**
   * Delete a growth entry (soft delete)
   * DELETE /babies/:babyId/growth/:growthId
   * Validates: Requirements 6.1
   */
  @Delete(':growthId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete growth entry',
    description: 'Soft delete a growth entry. The entry can be recovered by including deleted entries in queries.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'growthId',
    description: 'Growth entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Growth entry deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Growth entry not found' })
  async remove(
    @Param('babyId') babyId: string,
    @Param('growthId') growthId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.growthService.remove(babyId, growthId, user.id);
  }

}
