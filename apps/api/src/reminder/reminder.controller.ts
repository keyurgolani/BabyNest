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
  CreateReminderDto,
  UpdateReminderDto,
  ReminderResponseDto,
  ReminderListResponseDto,
  ReminderQueryDto,
  NextReminderResponseDto,
} from './dto';
import { ReminderService } from './reminder.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Reminder Controller
 * Handles CRUD operations for reminders
 */
@ApiTags('reminders')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('babies/:babyId/reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  /**
   * Create a new reminder
   * POST /babies/:babyId/reminders
   */
  @Post()
  @ApiOperation({
    summary: 'Create a reminder',
    description: `Create a new reminder for a baby. Reminders can be configured in two ways:
    - **Interval-based**: Set intervalMinutes to trigger every X minutes. Optionally set basedOnLastEntry to trigger X minutes after the last entry of that type.
    - **Fixed schedule**: Set scheduledTimes to an array of times in HH:MM format (24-hour) to trigger at specific times each day.`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Reminder created successfully',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async create(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() createReminderDto: CreateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.reminderService.create(babyId, user.id, createReminderDto);
  }

  /**
   * List reminders for a baby
   * GET /babies/:babyId/reminders
   */
  @Get()
  @ApiOperation({
    summary: 'List reminders',
    description: 'Get all reminders for a baby with optional filtering and pagination.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reminders',
    type: ReminderListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAll(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: ReminderQueryDto,
  ): Promise<ReminderListResponseDto> {
    return this.reminderService.findAll(babyId, user.id, query);
  }

  /**
   * Get next upcoming reminder
   * GET /babies/:babyId/reminders/next
   */
  @Get('next')
  @ApiOperation({
    summary: 'Get next upcoming reminder',
    description: `Get the next reminder that will trigger for this baby. 
    Returns the reminder details along with the calculated next trigger time and time until trigger.`,
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Next upcoming reminder',
    type: NextReminderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getNextReminder(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<NextReminderResponseDto> {
    return this.reminderService.getNextReminder(babyId, user.id);
  }

  /**
   * Get a single reminder
   * GET /babies/:babyId/reminders/:reminderId
   */
  @Get(':reminderId')
  @ApiOperation({
    summary: 'Get single reminder',
    description: 'Get a specific reminder by ID.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'reminderId',
    description: 'Reminder ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Reminder details',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async findOne(
    @Param('babyId') babyId: string,
    @Param('reminderId') reminderId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<ReminderResponseDto> {
    return this.reminderService.findOne(babyId, reminderId, user.id);
  }

  /**
   * Update a reminder
   * PATCH /babies/:babyId/reminders/:reminderId
   */
  @Patch(':reminderId')
  @ApiOperation({
    summary: 'Update reminder',
    description: 'Update a reminder. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'reminderId',
    description: 'Reminder ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Reminder updated successfully',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async update(
    @Param('babyId') babyId: string,
    @Param('reminderId') reminderId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() updateReminderDto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.reminderService.update(babyId, reminderId, user.id, updateReminderDto);
  }

  /**
   * Delete a reminder (soft delete)
   * DELETE /babies/:babyId/reminders/:reminderId
   */
  @Delete(':reminderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete reminder',
    description: 'Soft delete a reminder.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'reminderId',
    description: 'Reminder ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Reminder deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async remove(
    @Param('babyId') babyId: string,
    @Param('reminderId') reminderId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.reminderService.remove(babyId, reminderId, user.id);
  }
}
