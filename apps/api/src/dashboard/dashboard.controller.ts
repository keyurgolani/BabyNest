import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';

import { DashboardService } from './dashboard.service';
import {
  DashboardSummaryResponseDto,
  DashboardAlertsResponseDto,
  DashboardUpcomingResponseDto,
} from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Dashboard Controller
 * Provides multi-baby dashboard endpoints for summaries, alerts, and upcoming events
 */
@ApiTags('dashboard')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get summary for all babies
   * GET /dashboard/summary
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get multi-baby dashboard summary',
    description: 'Get summary statistics for all babies accessible to the authenticated caregiver, including feeding, sleep, and diaper counts for the last 24 hours.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary',
    type: DashboardSummaryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSummary(
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(user.id);
  }

  /**
   * Get all alerts across babies
   * GET /dashboard/alerts
   */
  @Get('alerts')
  @ApiOperation({
    summary: 'Get all alerts',
    description: 'Get all active alerts across all babies, including overdue medications, vaccinations, and delayed milestones.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of alerts',
    type: DashboardAlertsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAlerts(
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<DashboardAlertsResponseDto> {
    return this.dashboardService.getAlerts(user.id);
  }

  /**
   * Get upcoming events for all babies
   * GET /dashboard/upcoming
   */
  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming events',
    description: 'Get upcoming events for all babies in the next 7 days, including medications, vaccinations, and doctor visits.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming events',
    type: DashboardUpcomingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUpcoming(
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<DashboardUpcomingResponseDto> {
    return this.dashboardService.getUpcoming(user.id);
  }
}
