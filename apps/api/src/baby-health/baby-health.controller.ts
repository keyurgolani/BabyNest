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

import { BabyHealthService } from './baby-health.service';
import {
  // Medication
  CreateMedicationDto,
  UpdateMedicationDto,
  MedicationResponseDto,
  MedicationListResponseDto,
  MedicationQueryDto,
  // Vaccination
  CreateVaccinationDto,
  UpdateVaccinationDto,
  VaccinationResponseDto,
  VaccinationListResponseDto,
  VaccinationQueryDto,
  VaccinationScheduleResponseDto,
  // Symptom
  CreateSymptomDto,
  UpdateSymptomDto,
  SymptomResponseDto,
  SymptomListResponseDto,
  SymptomQueryDto,
  // Doctor Visit
  CreateDoctorVisitDto,
  UpdateDoctorVisitDto,
  DoctorVisitResponseDto,
  DoctorVisitListResponseDto,
  DoctorVisitQueryDto,
} from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaregiverResponseDto } from '../auth/dto/auth-response.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Baby Health Controller
 * Handles CRUD operations for health tracking entries
 * Validates: Requirements 8.1, 8.3, 8.5, 8.6
 */
@ApiTags('health')
@Controller('babies/:babyId/health')
@ApiBearerAuth()
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
export class BabyHealthController {
  constructor(private readonly babyHealthService: BabyHealthService) {}


  // ============================================================================
  // Medication Endpoints
  // ============================================================================

  /**
   * List medications for a baby
   * GET /babies/:babyId/health/medications
   * Validates: Requirements 8.1, 12.6
   */
  @Get('medications')
  @ApiOperation({
    summary: 'List medications',
    description: 'Get all medication entries for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of medication entries',
    type: MedicationListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAllMedications(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: MedicationQueryDto,
  ): Promise<MedicationListResponseDto> {
    return this.babyHealthService.findAllMedications(babyId, user.id, query);
  }

  /**
   * Create a medication entry
   * POST /babies/:babyId/health/medications
   * Validates: Requirements 8.1
   */
  @Post('medications')
  @ApiOperation({
    summary: 'Log medication',
    description: 'Log a medication administration for a baby.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Medication entry created',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async createMedication(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() dto: CreateMedicationDto,
  ): Promise<MedicationResponseDto> {
    return this.babyHealthService.createMedication(babyId, user.id, dto);
  }

  /**
   * Get upcoming medications due
   * GET /babies/:babyId/health/medications/upcoming
   * Validates: Requirements 8.2
   * NOTE: This route MUST be defined before medications/:entryId to avoid route conflicts
   */
  @Get('medications/upcoming')
  @ApiOperation({
    summary: 'Get upcoming medications',
    description: 'Get medications that are due or upcoming within the next 24 hours.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming medications',
    type: MedicationListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getUpcomingMedications(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<MedicationListResponseDto> {
    return this.babyHealthService.getUpcomingMedications(babyId, user.id);
  }

  /**
   * Get a single medication entry
   * GET /babies/:babyId/health/medications/:entryId
   * Validates: Requirements 8.1
   */
  @Get('medications/:entryId')
  @ApiOperation({
    summary: 'Get medication details',
    description: 'Get details of a specific medication entry.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Medication entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Medication entry details',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Medication entry not found' })
  async findOneMedication(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<MedicationResponseDto> {
    return this.babyHealthService.findOneMedication(babyId, entryId, user.id);
  }

  /**
   * Update a medication entry
   * PATCH /babies/:babyId/health/medications/:entryId
   * Validates: Requirements 8.1
   */
  @Patch('medications/:entryId')
  @ApiOperation({
    summary: 'Update medication',
    description: 'Update a medication entry. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Medication entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Medication entry updated',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Medication entry not found' })
  async updateMedication(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() dto: UpdateMedicationDto,
  ): Promise<MedicationResponseDto> {
    return this.babyHealthService.updateMedication(babyId, entryId, user.id, dto);
  }

  /**
   * Delete a medication entry
   * DELETE /babies/:babyId/health/medications/:entryId
   * Validates: Requirements 8.1
   */
  @Delete('medications/:entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete medication',
    description: 'Soft delete a medication entry.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Medication entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Medication entry deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Medication entry not found' })
  async removeMedication(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.babyHealthService.removeMedication(babyId, entryId, user.id);
  }

  /**
   * Mark medication as taken
   * POST /babies/:babyId/health/medications/:entryId/taken
   * Validates: Requirements 8.2
   */
  @Post('medications/:entryId/taken')
  @ApiOperation({
    summary: 'Mark medication as taken',
    description: 'Mark a medication as taken and automatically update the next due time based on frequency.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Medication entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Medication marked as taken and next due time updated',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Medication entry not found' })
  async markMedicationTaken(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<MedicationResponseDto> {
    return this.babyHealthService.markMedicationTaken(babyId, entryId, user.id);
  }

  /**
   * Get overdue medications
   * GET /babies/:babyId/health/medications/overdue
   * NOTE: This route MUST be defined before medications/:entryId to avoid route conflicts
   */
  @Get('medications/overdue')
  @ApiOperation({
    summary: 'Get overdue medications',
    description: 'Get all medications that are past their due time.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of overdue medications',
    type: MedicationListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getOverdueMedications(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<MedicationListResponseDto> {
    return this.babyHealthService.getOverdueMedications(babyId, user.id);
  }

  /**
   * Snooze medication reminder
   * POST /babies/:babyId/health/medications/:entryId/snooze
   */
  @Post('medications/:entryId/snooze')
  @ApiOperation({
    summary: 'Snooze medication reminder',
    description: 'Snooze a medication reminder by 30 minutes.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Medication entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Medication reminder snoozed',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Medication entry not found' })
  async snoozeMedicationReminder(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<MedicationResponseDto> {
    return this.babyHealthService.snoozeMedicationReminder(babyId, entryId, user.id);
  }


  // ============================================================================
  // Vaccination Endpoints
  // ============================================================================

  /**
   * List vaccinations for a baby
   * GET /babies/:babyId/health/vaccinations
   * Validates: Requirements 8.3, 12.6
   */
  @Get('vaccinations')
  @ApiOperation({
    summary: 'List vaccinations',
    description: 'Get all vaccination entries for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of vaccination entries',
    type: VaccinationListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAllVaccinations(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: VaccinationQueryDto,
  ): Promise<VaccinationListResponseDto> {
    return this.babyHealthService.findAllVaccinations(babyId, user.id, query);
  }

  /**
   * Create a vaccination entry
   * POST /babies/:babyId/health/vaccinations
   * Validates: Requirements 8.3
   */
  @Post('vaccinations')
  @ApiOperation({
    summary: 'Log vaccination',
    description: 'Log a vaccination for a baby.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Vaccination entry created',
    type: VaccinationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async createVaccination(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() dto: CreateVaccinationDto,
  ): Promise<VaccinationResponseDto> {
    return this.babyHealthService.createVaccination(babyId, user.id, dto);
  }

  /**
   * Get vaccination schedule for a baby
   * GET /babies/:babyId/health/vaccinations/schedule
   * Validates: Requirements 8.4
   */
  @Get('vaccinations/schedule')
  @ApiOperation({
    summary: 'Get vaccination schedule',
    description: 'Get vaccination schedule categorized by status (completed, upcoming, overdue).',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Vaccination schedule with categorized entries',
    type: VaccinationScheduleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async getVaccinationSchedule(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<VaccinationScheduleResponseDto> {
    return this.babyHealthService.getVaccinationSchedule(babyId, user.id);
  }

  /**
   * Get a single vaccination entry
   * GET /babies/:babyId/health/vaccinations/:entryId
   * Validates: Requirements 8.3
   */
  @Get('vaccinations/:entryId')
  @ApiOperation({
    summary: 'Get vaccination details',
    description: 'Get details of a specific vaccination entry.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Vaccination entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Vaccination entry details',
    type: VaccinationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Vaccination entry not found' })
  async findOneVaccination(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<VaccinationResponseDto> {
    return this.babyHealthService.findOneVaccination(babyId, entryId, user.id);
  }

  /**
   * Update a vaccination entry
   * PATCH /babies/:babyId/health/vaccinations/:entryId
   * Validates: Requirements 8.3
   */
  @Patch('vaccinations/:entryId')
  @ApiOperation({
    summary: 'Update vaccination',
    description: 'Update a vaccination entry. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Vaccination entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Vaccination entry updated',
    type: VaccinationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Vaccination entry not found' })
  async updateVaccination(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() dto: UpdateVaccinationDto,
  ): Promise<VaccinationResponseDto> {
    return this.babyHealthService.updateVaccination(babyId, entryId, user.id, dto);
  }

  /**
   * Delete a vaccination entry
   * DELETE /babies/:babyId/health/vaccinations/:entryId
   * Validates: Requirements 8.3
   */
  @Delete('vaccinations/:entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete vaccination',
    description: 'Soft delete a vaccination entry.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Vaccination entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Vaccination entry deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Vaccination entry not found' })
  async removeVaccination(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.babyHealthService.removeVaccination(babyId, entryId, user.id);
  }


  // ============================================================================
  // Symptom Endpoints
  // ============================================================================

  /**
   * List symptoms for a baby
   * GET /babies/:babyId/health/symptoms
   * Validates: Requirements 8.5, 12.6
   */
  @Get('symptoms')
  @ApiOperation({
    summary: 'List symptoms',
    description: 'Get all symptom entries for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of symptom entries',
    type: SymptomListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAllSymptoms(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: SymptomQueryDto,
  ): Promise<SymptomListResponseDto> {
    return this.babyHealthService.findAllSymptoms(babyId, user.id, query);
  }

  /**
   * Create a symptom entry
   * POST /babies/:babyId/health/symptoms
   * Validates: Requirements 8.5
   */
  @Post('symptoms')
  @ApiOperation({
    summary: 'Log symptom',
    description: 'Log a symptom for a baby.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Symptom entry created',
    type: SymptomResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async createSymptom(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() dto: CreateSymptomDto,
  ): Promise<SymptomResponseDto> {
    return this.babyHealthService.createSymptom(babyId, user.id, dto);
  }

  /**
   * Get a single symptom entry
   * GET /babies/:babyId/health/symptoms/:entryId
   * Validates: Requirements 8.5
   */
  @Get('symptoms/:entryId')
  @ApiOperation({
    summary: 'Get symptom details',
    description: 'Get details of a specific symptom entry.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Symptom entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Symptom entry details',
    type: SymptomResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Symptom entry not found' })
  async findOneSymptom(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<SymptomResponseDto> {
    return this.babyHealthService.findOneSymptom(babyId, entryId, user.id);
  }

  /**
   * Update a symptom entry
   * PATCH /babies/:babyId/health/symptoms/:entryId
   * Validates: Requirements 8.5
   */
  @Patch('symptoms/:entryId')
  @ApiOperation({
    summary: 'Update symptom',
    description: 'Update a symptom entry. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Symptom entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Symptom entry updated',
    type: SymptomResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Symptom entry not found' })
  async updateSymptom(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() dto: UpdateSymptomDto,
  ): Promise<SymptomResponseDto> {
    return this.babyHealthService.updateSymptom(babyId, entryId, user.id, dto);
  }

  /**
   * Delete a symptom entry
   * DELETE /babies/:babyId/health/symptoms/:entryId
   * Validates: Requirements 8.5
   */
  @Delete('symptoms/:entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete symptom',
    description: 'Soft delete a symptom entry.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Symptom entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Symptom entry deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Symptom entry not found' })
  async removeSymptom(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.babyHealthService.removeSymptom(babyId, entryId, user.id);
  }


  // ============================================================================
  // Doctor Visit Endpoints
  // ============================================================================

  /**
   * List doctor visits for a baby
   * GET /babies/:babyId/health/doctor-visits
   * Validates: Requirements 8.6, 12.6
   */
  @Get('doctor-visits')
  @ApiOperation({
    summary: 'List doctor visits',
    description: 'Get all doctor visit entries for a baby with optional filtering, pagination, and sorting.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of doctor visit entries',
    type: DoctorVisitListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async findAllDoctorVisits(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Query() query: DoctorVisitQueryDto,
  ): Promise<DoctorVisitListResponseDto> {
    return this.babyHealthService.findAllDoctorVisits(babyId, user.id, query);
  }

  /**
   * Create a doctor visit entry
   * POST /babies/:babyId/health/doctor-visits
   * Validates: Requirements 8.6
   */
  @Post('doctor-visits')
  @ApiOperation({
    summary: 'Log doctor visit',
    description: 'Log a doctor visit for a baby.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Doctor visit entry created',
    type: DoctorVisitResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  async createDoctorVisit(
    @Param('babyId') babyId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() dto: CreateDoctorVisitDto,
  ): Promise<DoctorVisitResponseDto> {
    return this.babyHealthService.createDoctorVisit(babyId, user.id, dto);
  }

  /**
   * Get a single doctor visit entry
   * GET /babies/:babyId/health/doctor-visits/:entryId
   * Validates: Requirements 8.6
   */
  @Get('doctor-visits/:entryId')
  @ApiOperation({
    summary: 'Get doctor visit details',
    description: 'Get details of a specific doctor visit entry.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Doctor visit entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Doctor visit entry details',
    type: DoctorVisitResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Doctor visit entry not found' })
  async findOneDoctorVisit(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<DoctorVisitResponseDto> {
    return this.babyHealthService.findOneDoctorVisit(babyId, entryId, user.id);
  }

  /**
   * Update a doctor visit entry
   * PATCH /babies/:babyId/health/doctor-visits/:entryId
   * Validates: Requirements 8.6
   */
  @Patch('doctor-visits/:entryId')
  @ApiOperation({
    summary: 'Update doctor visit',
    description: 'Update a doctor visit entry. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Doctor visit entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Doctor visit entry updated',
    type: DoctorVisitResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Doctor visit entry not found' })
  async updateDoctorVisit(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
    @Body() dto: UpdateDoctorVisitDto,
  ): Promise<DoctorVisitResponseDto> {
    return this.babyHealthService.updateDoctorVisit(babyId, entryId, user.id, dto);
  }

  /**
   * Delete a doctor visit entry
   * DELETE /babies/:babyId/health/doctor-visits/:entryId
   * Validates: Requirements 8.6
   */
  @Delete('doctor-visits/:entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete doctor visit',
    description: 'Soft delete a doctor visit entry.',
  })
  @ApiParam({
    name: 'babyId',
    description: 'Baby ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'entryId',
    description: 'Doctor visit entry ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 204, description: 'Doctor visit entry deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this baby' })
  @ApiResponse({ status: 404, description: 'Doctor visit entry not found' })
  async removeDoctorVisit(
    @Param('babyId') babyId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: CaregiverResponseDto,
  ): Promise<void> {
    return this.babyHealthService.removeDoctorVisit(babyId, entryId, user.id);
  }
}
