import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

import {
  CreateScheduledReportDto,
  UpdateScheduledReportDto,
  ScheduledReportResponseDto,
} from './dto';
import { ScheduledReportService } from './scheduled-report.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

interface AuthenticatedUser {
  id: string;
}

/**
 * Scheduled Report Controller
 * Provides endpoints for managing scheduled report configurations
 * Validates: Requirements 13.4
 */
@ApiTags('Scheduled Reports')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('babies/:babyId/reports/schedule')
export class ScheduledReportController {
  constructor(private readonly scheduledReportService: ScheduledReportService) {}

  /**
   * Create a new scheduled report
   */
  @Post()
  @ApiOperation({
    summary: 'Create a scheduled report',
    description: 'Create a new scheduled report configuration for automatic report generation and delivery',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiResponse({
    status: 201,
    description: 'Scheduled report created successfully',
    type: ScheduledReportResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async create(
    @Param('babyId') babyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScheduledReportDto,
  ): Promise<ScheduledReportResponseDto> {
    return this.scheduledReportService.create(babyId, user.id, dto);
  }

  /**
   * List all scheduled reports for a baby
   */
  @Get()
  @ApiOperation({
    summary: 'List scheduled reports',
    description: 'Get all scheduled report configurations for a baby',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiResponse({
    status: 200,
    description: 'List of scheduled reports',
    type: [ScheduledReportResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async findAll(
    @Param('babyId') babyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ScheduledReportResponseDto[]> {
    return this.scheduledReportService.findAll(babyId, user.id);
  }

  /**
   * Get a specific scheduled report
   */
  @Get(':scheduleId')
  @ApiOperation({
    summary: 'Get a scheduled report',
    description: 'Get details of a specific scheduled report configuration',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiParam({ name: 'scheduleId', description: 'Scheduled report ID' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled report details',
    type: ScheduledReportResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  @ApiResponse({ status: 404, description: 'Scheduled report not found' })
  async findOne(
    @Param('babyId') babyId: string,
    @Param('scheduleId') scheduleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ScheduledReportResponseDto> {
    return this.scheduledReportService.findOne(babyId, scheduleId, user.id);
  }

  /**
   * Update a scheduled report
   */
  @Patch(':scheduleId')
  @ApiOperation({
    summary: 'Update a scheduled report',
    description: 'Update an existing scheduled report configuration',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiParam({ name: 'scheduleId', description: 'Scheduled report ID' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled report updated successfully',
    type: ScheduledReportResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  @ApiResponse({ status: 404, description: 'Scheduled report not found' })
  async update(
    @Param('babyId') babyId: string,
    @Param('scheduleId') scheduleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateScheduledReportDto,
  ): Promise<ScheduledReportResponseDto> {
    return this.scheduledReportService.update(babyId, scheduleId, user.id, dto);
  }

  /**
   * Delete a scheduled report
   */
  @Delete(':scheduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a scheduled report',
    description: 'Delete a scheduled report configuration',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiParam({ name: 'scheduleId', description: 'Scheduled report ID' })
  @ApiResponse({ status: 204, description: 'Scheduled report deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  @ApiResponse({ status: 404, description: 'Scheduled report not found' })
  async delete(
    @Param('babyId') babyId: string,
    @Param('scheduleId') scheduleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.scheduledReportService.delete(babyId, scheduleId, user.id);
  }
}
