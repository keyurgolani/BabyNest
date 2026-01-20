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
  CreateSleepDto,
  UpdateSleepDto,
  SleepResponseDto,
  SleepListResponseDto,
  SleepQueryDto,
  WakeWindowResponseDto,
  WakeWindowTimerResponseDto,
  SleepStatisticsDto,
  SleepStatisticsQueryDto,
} from './dto';
import { SleepService } from './sleep.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Sleep Controller
 * Handles CRUD operations for sleep entries
 * Validates: Requirements 4.1, 4.2, 4.5
 */
@ApiTags('sleep')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('babies/:babyId/sleep')
export class SleepController {
  constructor(private readonly sleepService: SleepService) {}

  /**
   * Create a new sleep entry
   * POST /babies/:babyId/sleep
   * Validates: Requirements 4.1, 4.2, 4.5
   */
  @Post()
  @ApiOperation({
    summary: 'Log sleep entry',
    description: `Create a new sleep entry for a baby. Records:
    - **startTime**: When the sleep session started
    - **endTime**: When the sleep session ended (optional, null for ongoing sleep)
    - **sleepType**: Type of sleep (nap or night sleep)
    - **quality**: Optional quality rating (good, fair, poor)
    - **notes**: Optional notes about sleep conditions and disturbances
    
    Duration is automatically calculated when endTime is provided.`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Sleep entry created successfully',
    type: SleepResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async create(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createSleepDto: CreateSleepDto,
  ): Promise<SleepResponseDto> {
    return this.sleepService.create(babyId, user.id, createSleepDto);
  }

  /**
   * List sleep entries for a baby
   * GET /babies/:babyId/sleep
   * Validates: Requirements 4.3, 12.6
   */
  @Get()
  @ApiOperation({
    summary: 'List sleep entries with filters',
    description: 'Get all sleep entries for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of sleep entries',
    type: SleepListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAll(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: SleepQueryDto,
  ): Promise<SleepListResponseDto> {
    return this.sleepService.findAll(babyId, user.id, query);
  }

  /**
   * Get current wake window for a baby
   * GET /babies/:babyId/sleep/wake-window
   * Validates: Requirements 4.4
   * Property 11: Wake Window Calculation
   */
  @Get('wake-window')
  @ApiOperation({
    summary: 'Get current wake window',
    description: `Calculate and return the current wake window duration for a baby.
    
    The wake window is the time elapsed since the end of the most recent completed sleep session.
    
    Returns:
    - **wakeWindowMinutes**: Duration in minutes
    - **wakeWindowFormatted**: Human-readable format (e.g., "2h 30m")
    - **wakeWindowStartTime**: When the baby woke up (end time of last sleep)
    - **lastSleep**: Details of the most recent completed sleep session
    - **hasSleepHistory**: Whether there is any sleep history for this baby
    
    If no sleep history exists, returns 0 minutes with hasSleepHistory=false.`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Current wake window information',
    type: WakeWindowResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getWakeWindow(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<WakeWindowResponseDto> {
    return this.sleepService.getWakeWindow(babyId, user.id);
  }

  /**
   * Get enhanced wake window timer with age-appropriate recommendations
   * GET /babies/:babyId/sleep/wake-window-timer
   * Similar to Huckleberry's SweetSpot feature
   */
  @Get('wake-window-timer')
  @ApiOperation({
    summary: 'Get wake window timer with recommendations',
    description: `Calculate and return the current wake window with age-appropriate sleep recommendations.
    
    Similar to Huckleberry's SweetSpot feature, this endpoint provides:
    - **currentAwakeMinutes**: How long baby has been awake
    - **recommendedWakeWindowMinutes**: Age-appropriate wake window based on baby's age
    - **suggestedNextSleepTime**: When baby should ideally go down for next sleep
    - **status**: 'well-rested' | 'approaching-tired' | 'overtired'
    - **percentageOfWakeWindow**: How much of the wake window has been used (0-100+)
    
    Age-based wake window guidelines:
    - 0-1 months: 45-60 min
    - 1-2 months: 60-90 min
    - 2-3 months: 75-105 min
    - 3-4 months: 90-120 min
    - 4-6 months: 120-150 min (2-2.5 hours)
    - 6-9 months: 150-180 min (2.5-3 hours)
    - 9-12 months: 180-240 min (3-4 hours)
    - 12-18 months: 240-300 min (4-5 hours)
    - 18-24 months: 300-360 min (5-6 hours)`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Wake window timer with age-appropriate recommendations',
    type: WakeWindowTimerResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getWakeWindowTimer(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<WakeWindowTimerResponseDto> {
    return this.sleepService.getWakeWindowTimer(babyId, user.id);
  }

  /**
   * Get sleep statistics for a baby
   * GET /babies/:babyId/sleep/stats
   * Validates: Requirements 4.3, 4.6
   * Property 12: Sleep Statistics Calculation
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get sleep statistics',
    description: `Get sleep statistics for a baby within a date range.
    
    Calculates:
    - **totalSleepMinutes**: Total sleep time in the period
    - **averageSleepMinutesPerDay**: Average daily sleep
    - **napCount**: Number of naps
    - **napMinutes**: Total nap time
    - **nightSleepCount**: Number of night sleep sessions
    - **nightSleepMinutes**: Total night sleep time
    - **averageNapDuration**: Average nap length
    - **averageNightSleepDuration**: Average night sleep length
    - **currentWakeWindowMinutes**: Time since last sleep ended
    - **dailyBreakdown**: Day-by-day sleep breakdown
    
    Use periodDays (7, 14, or 30) for configurable time periods, or provide startDate/endDate for custom ranges.
    Defaults to last 7 days if no parameters provided.`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Sleep statistics',
    type: SleepStatisticsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getStatistics(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: SleepStatisticsQueryDto,
  ): Promise<SleepStatisticsDto> {
    return this.sleepService.getStatistics(babyId, user.id, query);
  }

  /**
   * Get a single sleep entry
   * GET /babies/:babyId/sleep/:sleepId
   * Validates: Requirements 4.1, 4.2, 4.5
   */
  @Get(':sleepId')
  @ApiOperation({
    summary: 'Get single sleep entry',
    description: 'Get a specific sleep entry by ID.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'sleepId',
    description: 'Sleep entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Sleep entry details',
    type: SleepResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Sleep entry not found' })
  async findOne(
    @Param('babyId') babyId: string,
    @Param('sleepId') sleepId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<SleepResponseDto> {
    return this.sleepService.findOne(babyId, sleepId, user.id);
  }

  /**
   * Update a sleep entry
   * PATCH /babies/:babyId/sleep/:sleepId
   * Validates: Requirements 4.1, 4.2, 4.5
   */
  @Patch(':sleepId')
  @ApiOperation({
    summary: 'Update sleep entry',
    description: `Update a sleep entry. Only provided fields will be updated.
    
    Common use cases:
    - End an ongoing sleep session by providing endTime
    - Update sleep quality or notes
    - Correct start/end times`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'sleepId',
    description: 'Sleep entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Sleep entry updated successfully',
    type: SleepResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Sleep entry not found' })
  async update(
    @Param('babyId') babyId: string,
    @Param('sleepId') sleepId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateSleepDto: UpdateSleepDto,
  ): Promise<SleepResponseDto> {
    return this.sleepService.update(babyId, sleepId, user.id, updateSleepDto);
  }

  /**
   * Delete a sleep entry (soft delete)
   * DELETE /babies/:babyId/sleep/:sleepId
   * Validates: Requirements 4.1
   */
  @Delete(':sleepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete sleep entry',
    description: 'Soft delete a sleep entry. The entry can be recovered by including deleted entries in queries.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'sleepId',
    description: 'Sleep entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Sleep entry deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Sleep entry not found' })
  async remove(
    @Param('babyId') babyId: string,
    @Param('sleepId') sleepId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.sleepService.remove(babyId, sleepId, user.id);
  }
}
