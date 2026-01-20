import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  MedicationEntry,
  VaccinationEntry,
  SymptomEntry,
  DoctorVisitEntry,
} from '@prisma/client';

import {
  // Medication
  CreateMedicationDto,
  UpdateMedicationDto,
  MedicationResponseDto,
  MedicationListResponseDto,
  MedicationQueryDto,
  MedicationSortField,
  // Vaccination
  CreateVaccinationDto,
  UpdateVaccinationDto,
  VaccinationResponseDto,
  VaccinationListResponseDto,
  VaccinationQueryDto,
  VaccinationSortField,
  VaccinationStatusDto,
  VaccinationScheduleResponseDto,
  // Symptom
  CreateSymptomDto,
  UpdateSymptomDto,
  SymptomResponseDto,
  SymptomListResponseDto,
  SymptomQueryDto,
  SymptomSortField,
  // Doctor Visit
  CreateDoctorVisitDto,
  UpdateDoctorVisitDto,
  DoctorVisitResponseDto,
  DoctorVisitListResponseDto,
  DoctorVisitQueryDto,
  DoctorVisitSortField,
  // Shared
  SortOrder,
} from './dto';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  MedicationFrequency,
  calculateNextDueTime,
} from './utils/medication-due-time.util';
import {
  VaccinationStatus,
  determineVaccinationStatus,
} from './utils/vaccination-schedule.util';

/**
 * Baby Health Service
 * Handles CRUD operations for health tracking entries (medications, vaccinations, symptoms, doctor visits)
 * Validates: Requirements 8.1, 8.3, 8.5, 8.6
 */
@Injectable()
export class BabyHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
  ) {}

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Verify caregiver has access to baby
   */
  private async verifyAccess(babyId: string, caregiverId: string): Promise<void> {
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }
  }

  // ============================================================================
  // Medication Methods
  // ============================================================================

  /**
   * Transform a medication entry to response DTO
   */
  private toMedicationResponse(entry: MedicationEntry): MedicationResponseDto {
    return {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      name: entry.name,
      dosage: entry.dosage,
      unit: entry.unit,
      frequency: entry.frequency,
      timestamp: entry.timestamp,
      nextDueAt: entry.nextDueAt,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
    };
  }

  /**
   * Create a medication entry
   * Validates: Requirements 8.1, 8.2
   * 
   * Automatically calculates nextDueAt based on frequency if not provided.
   */
  async createMedication(
    babyId: string,
    caregiverId: string,
    dto: CreateMedicationDto,
  ): Promise<MedicationResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    // Calculate nextDueAt based on frequency if not explicitly provided
    let nextDueAt: Date | null = null;
    if (dto.nextDueAt) {
      // Use explicitly provided nextDueAt
      nextDueAt = new Date(dto.nextDueAt);
    } else {
      // Auto-calculate based on frequency
      nextDueAt = calculateNextDueTime(timestamp, dto.frequency as MedicationFrequency);
    }

    const entry = await this.prisma.medicationEntry.create({
      data: {
        babyId,
        caregiverId,
        name: dto.name,
        dosage: dto.dosage,
        unit: dto.unit,
        frequency: dto.frequency,
        timestamp,
        nextDueAt,
        notes: dto.notes ?? null,
      },
    });

    return this.toMedicationResponse(entry);
  }

  /**
   * List medication entries for a baby
   * Validates: Requirements 8.1, 12.6
   */
  async findAllMedications(
    babyId: string,
    caregiverId: string,
    query: MedicationQueryDto,
  ): Promise<MedicationListResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    // Build where clause
    const where: {
      babyId: string;
      isDeleted?: boolean;
      timestamp?: { gte?: Date; lte?: Date };
      name?: { contains: string; mode: 'insensitive' };
    } = { babyId };

    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    // Build order by
    const sortField = query.sortBy || MedicationSortField.TIMESTAMP;
    const sortOrder = query.sortOrder || SortOrder.DESC;
    const orderBy: Record<string, SortOrder> = { [sortField]: sortOrder };

    // Pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const [entries, total] = await Promise.all([
      this.prisma.medicationEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.medicationEntry.count({ where }),
    ]);

    return {
      data: entries.map((e) => this.toMedicationResponse(e)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single medication entry
   * Validates: Requirements 8.1
   */
  async findOneMedication(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<MedicationResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const entry = await this.prisma.medicationEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.babyId !== babyId) {
      throw new NotFoundException('Medication entry not found');
    }

    return this.toMedicationResponse(entry);
  }

  /**
   * Update a medication entry
   * Validates: Requirements 8.1, 8.2
   * 
   * Recalculates nextDueAt if timestamp or frequency is updated and nextDueAt is not explicitly provided.
   */
  async updateMedication(
    babyId: string,
    entryId: string,
    caregiverId: string,
    dto: UpdateMedicationDto,
  ): Promise<MedicationResponseDto> {
    const existingEntry = await this.findOneMedication(babyId, entryId, caregiverId);

    const updateData: Partial<MedicationEntry> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.dosage !== undefined) updateData.dosage = dto.dosage;
    if (dto.unit !== undefined) updateData.unit = dto.unit;
    if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
    if (dto.timestamp !== undefined) updateData.timestamp = new Date(dto.timestamp);
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Handle nextDueAt calculation
    if (dto.nextDueAt !== undefined) {
      // Explicitly provided nextDueAt (can be null to clear it)
      updateData.nextDueAt = dto.nextDueAt ? new Date(dto.nextDueAt) : null;
    } else if (dto.timestamp !== undefined || dto.frequency !== undefined) {
      // Recalculate nextDueAt if timestamp or frequency changed
      const newTimestamp = dto.timestamp ? new Date(dto.timestamp) : existingEntry.timestamp;
      const newFrequency = (dto.frequency ?? existingEntry.frequency) as MedicationFrequency;
      updateData.nextDueAt = calculateNextDueTime(newTimestamp, newFrequency);
    }

    const entry = await this.prisma.medicationEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    return this.toMedicationResponse(entry);
  }

  /**
   * Soft delete a medication entry
   * Validates: Requirements 8.1
   */
  async removeMedication(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<void> {
    await this.findOneMedication(babyId, entryId, caregiverId);

    await this.prisma.medicationEntry.update({
      where: { id: entryId },
      data: { isDeleted: true },
    });
  }

  /**
   * Get upcoming medications due within the next 24 hours
   * Validates: Requirements 8.2
   */
  async getUpcomingMedications(
    babyId: string,
    caregiverId: string,
  ): Promise<MedicationListResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const entries = await this.prisma.medicationEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        nextDueAt: {
          gte: now,
          lte: next24Hours,
        },
      },
      orderBy: {
        nextDueAt: 'asc',
      },
    });

    return {
      data: entries.map((e) => this.toMedicationResponse(e)),
      meta: {
        total: entries.length,
        page: 1,
        pageSize: entries.length,
        totalPages: 1,
      },
    };
  }

  /**
   * Mark medication as taken and update next due time
   * Validates: Requirements 8.2
   */
  async markMedicationTaken(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<MedicationResponseDto> {
    const existingEntry = await this.findOneMedication(babyId, entryId, caregiverId);

    const now = new Date();
    const nextDueAt = calculateNextDueTime(now, existingEntry.frequency as MedicationFrequency);

    const entry = await this.prisma.medicationEntry.update({
      where: { id: entryId },
      data: {
        timestamp: now,
        nextDueAt,
      },
    });

    return this.toMedicationResponse(entry);
  }

  /**
   * Get overdue medications
   */
  async getOverdueMedications(
    babyId: string,
    caregiverId: string,
  ): Promise<MedicationListResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const now = new Date();

    const entries = await this.prisma.medicationEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        nextDueAt: {
          lt: now,
          not: null,
        },
      },
      orderBy: {
        nextDueAt: 'asc',
      },
    });

    return {
      data: entries.map((e) => this.toMedicationResponse(e)),
      meta: {
        total: entries.length,
        page: 1,
        pageSize: entries.length,
        totalPages: 1,
      },
    };
  }

  /**
   * Snooze medication reminder by 30 minutes
   */
  async snoozeMedicationReminder(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<MedicationResponseDto> {
    const existingEntry = await this.findOneMedication(babyId, entryId, caregiverId);

    // Add 30 minutes to the next due time
    const currentNextDue = existingEntry.nextDueAt ? new Date(existingEntry.nextDueAt) : new Date();
    const newNextDue = new Date(currentNextDue.getTime() + 30 * 60 * 1000);

    const entry = await this.prisma.medicationEntry.update({
      where: { id: entryId },
      data: {
        nextDueAt: newNextDue,
      },
    });

    return this.toMedicationResponse(entry);
  }

  // ============================================================================
  // Vaccination Methods
  // ============================================================================

  /**
   * Map VaccinationStatus enum to VaccinationStatusDto
   */
  private mapVaccinationStatus(status: VaccinationStatus): VaccinationStatusDto {
    switch (status) {
      case VaccinationStatus.COMPLETED:
        return VaccinationStatusDto.COMPLETED;
      case VaccinationStatus.UPCOMING:
        return VaccinationStatusDto.UPCOMING;
      case VaccinationStatus.OVERDUE:
        return VaccinationStatusDto.OVERDUE;
    }
  }

  /**
   * Transform a vaccination entry to response DTO with status
   */
  private toVaccinationResponse(entry: VaccinationEntry, referenceDate: Date = new Date()): VaccinationResponseDto {
    const status = determineVaccinationStatus(
      {
        id: entry.id,
        vaccineName: entry.vaccineName,
        timestamp: entry.timestamp,
        nextDueAt: entry.nextDueAt,
        provider: entry.provider,
        notes: entry.notes,
      },
      referenceDate,
    );

    return {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      vaccineName: entry.vaccineName,
      timestamp: entry.timestamp,
      provider: entry.provider,
      location: entry.location,
      nextDueAt: entry.nextDueAt,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
      status: this.mapVaccinationStatus(status),
    };
  }

  /**
   * Create a vaccination entry
   * Validates: Requirements 8.3
   */
  async createVaccination(
    babyId: string,
    caregiverId: string,
    dto: CreateVaccinationDto,
  ): Promise<VaccinationResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    const entry = await this.prisma.vaccinationEntry.create({
      data: {
        babyId,
        caregiverId,
        vaccineName: dto.vaccineName,
        timestamp,
        provider: dto.provider ?? null,
        location: dto.location ?? null,
        nextDueAt: dto.nextDueAt ? new Date(dto.nextDueAt) : null,
        notes: dto.notes ?? null,
      },
    });

    return this.toVaccinationResponse(entry);
  }

  /**
   * List vaccination entries for a baby
   * Validates: Requirements 8.3, 8.4, 12.6
   */
  async findAllVaccinations(
    babyId: string,
    caregiverId: string,
    query: VaccinationQueryDto,
  ): Promise<VaccinationListResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const where: {
      babyId: string;
      isDeleted?: boolean;
      timestamp?: { gte?: Date; lte?: Date };
      vaccineName?: { contains: string; mode: 'insensitive' };
    } = { babyId };

    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    if (query.vaccineName) {
      where.vaccineName = { contains: query.vaccineName, mode: 'insensitive' };
    }

    const sortField = query.sortBy || VaccinationSortField.TIMESTAMP;
    const sortOrder = query.sortOrder || SortOrder.DESC;
    const orderBy: Record<string, SortOrder> = { [sortField]: sortOrder };

    // If status filter is applied, we need to fetch all entries first and filter in memory
    // because status is computed based on nextDueAt and current date
    if (query.status) {
      const allEntries = await this.prisma.vaccinationEntry.findMany({
        where,
        orderBy,
      });

      const now = new Date();
      const filteredEntries = allEntries.filter((entry) => {
        const status = determineVaccinationStatus(
          {
            id: entry.id,
            vaccineName: entry.vaccineName,
            timestamp: entry.timestamp,
            nextDueAt: entry.nextDueAt,
            provider: entry.provider,
            notes: entry.notes,
          },
          now,
        );
        // Compare the string values since VaccinationStatus and VaccinationStatusDto have the same values
        return status === (query.status as unknown as VaccinationStatus);
      });

      // Apply pagination to filtered results - page and pageSize are required
      const page = query.page;
      const pageSize = query.pageSize;
      const skip = (page - 1) * pageSize;
      const paginatedEntries = filteredEntries.slice(skip, skip + pageSize);

      return {
        data: paginatedEntries.map((e) => this.toVaccinationResponse(e, now)),
        meta: {
          total: filteredEntries.length,
          page,
          pageSize,
          totalPages: Math.ceil(filteredEntries.length / pageSize),
        },
      };
    }

    // Pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const [entries, total] = await Promise.all([
      this.prisma.vaccinationEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.vaccinationEntry.count({ where }),
    ]);

    return {
      data: entries.map((e) => this.toVaccinationResponse(e)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single vaccination entry
   * Validates: Requirements 8.3
   */
  async findOneVaccination(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<VaccinationResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const entry = await this.prisma.vaccinationEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.babyId !== babyId) {
      throw new NotFoundException('Vaccination entry not found');
    }

    return this.toVaccinationResponse(entry);
  }

  /**
   * Update a vaccination entry
   * Validates: Requirements 8.3
   */
  async updateVaccination(
    babyId: string,
    entryId: string,
    caregiverId: string,
    dto: UpdateVaccinationDto,
  ): Promise<VaccinationResponseDto> {
    await this.findOneVaccination(babyId, entryId, caregiverId);

    const updateData: Partial<VaccinationEntry> = {};
    if (dto.vaccineName !== undefined) updateData.vaccineName = dto.vaccineName;
    if (dto.timestamp !== undefined) updateData.timestamp = new Date(dto.timestamp);
    if (dto.provider !== undefined) updateData.provider = dto.provider;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.nextDueAt !== undefined) {
      updateData.nextDueAt = dto.nextDueAt ? new Date(dto.nextDueAt) : null;
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const entry = await this.prisma.vaccinationEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    return this.toVaccinationResponse(entry);
  }

  /**
   * Soft delete a vaccination entry
   * Validates: Requirements 8.3
   */
  async removeVaccination(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<void> {
    await this.findOneVaccination(babyId, entryId, caregiverId);

    await this.prisma.vaccinationEntry.update({
      where: { id: entryId },
      data: { isDeleted: true },
    });
  }

  /**
   * Get vaccination schedule for a baby
   * Returns vaccinations categorized by status (completed, upcoming, overdue)
   * Validates: Requirements 8.4
   */
  async getVaccinationSchedule(
    babyId: string,
    caregiverId: string,
  ): Promise<VaccinationScheduleResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    // Fetch all non-deleted vaccinations for the baby
    const entries = await this.prisma.vaccinationEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const now = new Date();

    // Categorize vaccinations by status
    const completed: VaccinationResponseDto[] = [];
    const upcoming: VaccinationResponseDto[] = [];
    const overdue: VaccinationResponseDto[] = [];

    for (const entry of entries) {
      const response = this.toVaccinationResponse(entry, now);
      
      switch (response.status) {
        case VaccinationStatusDto.COMPLETED:
          completed.push(response);
          break;
        case VaccinationStatusDto.UPCOMING:
          upcoming.push(response);
          break;
        case VaccinationStatusDto.OVERDUE:
          overdue.push(response);
          break;
      }
    }

    // Sort upcoming by nextDueAt ascending (soonest first)
    upcoming.sort((a, b) => {
      if (!a.nextDueAt || !b.nextDueAt) return 0;
      return new Date(a.nextDueAt).getTime() - new Date(b.nextDueAt).getTime();
    });

    // Sort overdue by nextDueAt ascending (most overdue first)
    overdue.sort((a, b) => {
      if (!a.nextDueAt || !b.nextDueAt) return 0;
      return new Date(a.nextDueAt).getTime() - new Date(b.nextDueAt).getTime();
    });

    return {
      completed,
      upcoming,
      overdue,
      summary: {
        completed: completed.length,
        upcoming: upcoming.length,
        overdue: overdue.length,
      },
    };
  }

  // ============================================================================
  // Symptom Methods
  // ============================================================================

  /**
   * Transform a symptom entry to response DTO
   */
  private toSymptomResponse(entry: SymptomEntry): SymptomResponseDto {
    return {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      symptomType: entry.symptomType,
      severity: entry.severity,
      timestamp: entry.timestamp,
      temperature: entry.temperature,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
    };
  }

  /**
   * Create a symptom entry
   * Validates: Requirements 8.5
   */
  async createSymptom(
    babyId: string,
    caregiverId: string,
    dto: CreateSymptomDto,
  ): Promise<SymptomResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    const entry = await this.prisma.symptomEntry.create({
      data: {
        babyId,
        caregiverId,
        symptomType: dto.symptomType,
        severity: dto.severity,
        timestamp,
        temperature: dto.temperature ?? null,
        notes: dto.notes ?? null,
      },
    });

    return this.toSymptomResponse(entry);
  }

  /**
   * List symptom entries for a baby
   * Validates: Requirements 8.5, 12.6
   */
  async findAllSymptoms(
    babyId: string,
    caregiverId: string,
    query: SymptomQueryDto,
  ): Promise<SymptomListResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const where: {
      babyId: string;
      isDeleted?: boolean;
      timestamp?: { gte?: Date; lte?: Date };
      symptomType?: { contains: string; mode: 'insensitive' };
      severity?: string;
    } = { babyId };

    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    if (query.symptomType) {
      where.symptomType = { contains: query.symptomType, mode: 'insensitive' };
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    const sortField = query.sortBy || SymptomSortField.TIMESTAMP;
    const sortOrder = query.sortOrder || SortOrder.DESC;
    const orderBy: Record<string, SortOrder> = { [sortField]: sortOrder };

    // Pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const [entries, total] = await Promise.all([
      this.prisma.symptomEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.symptomEntry.count({ where }),
    ]);

    return {
      data: entries.map((e) => this.toSymptomResponse(e)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single symptom entry
   * Validates: Requirements 8.5
   */
  async findOneSymptom(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<SymptomResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const entry = await this.prisma.symptomEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.babyId !== babyId) {
      throw new NotFoundException('Symptom entry not found');
    }

    return this.toSymptomResponse(entry);
  }

  /**
   * Update a symptom entry
   * Validates: Requirements 8.5
   */
  async updateSymptom(
    babyId: string,
    entryId: string,
    caregiverId: string,
    dto: UpdateSymptomDto,
  ): Promise<SymptomResponseDto> {
    await this.findOneSymptom(babyId, entryId, caregiverId);

    const updateData: Partial<SymptomEntry> = {};
    if (dto.symptomType !== undefined) updateData.symptomType = dto.symptomType;
    if (dto.severity !== undefined) updateData.severity = dto.severity;
    if (dto.timestamp !== undefined) updateData.timestamp = new Date(dto.timestamp);
    if (dto.temperature !== undefined) updateData.temperature = dto.temperature;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const entry = await this.prisma.symptomEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    return this.toSymptomResponse(entry);
  }

  /**
   * Soft delete a symptom entry
   * Validates: Requirements 8.5
   */
  async removeSymptom(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<void> {
    await this.findOneSymptom(babyId, entryId, caregiverId);

    await this.prisma.symptomEntry.update({
      where: { id: entryId },
      data: { isDeleted: true },
    });
  }

  // ============================================================================
  // Doctor Visit Methods
  // ============================================================================

  /**
   * Transform a doctor visit entry to response DTO
   */
  private toDoctorVisitResponse(entry: DoctorVisitEntry): DoctorVisitResponseDto {
    return {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      visitType: entry.visitType,
      provider: entry.provider,
      timestamp: entry.timestamp,
      location: entry.location,
      diagnosis: entry.diagnosis,
      followUpDate: entry.followUpDate,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
    };
  }

  /**
   * Create a doctor visit entry
   * Validates: Requirements 8.6
   */
  async createDoctorVisit(
    babyId: string,
    caregiverId: string,
    dto: CreateDoctorVisitDto,
  ): Promise<DoctorVisitResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    const entry = await this.prisma.doctorVisitEntry.create({
      data: {
        babyId,
        caregiverId,
        visitType: dto.visitType,
        provider: dto.provider,
        timestamp,
        location: dto.location ?? null,
        diagnosis: dto.diagnosis ?? null,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        notes: dto.notes ?? null,
      },
    });

    return this.toDoctorVisitResponse(entry);
  }

  /**
   * List doctor visit entries for a baby
   * Validates: Requirements 8.6, 12.6
   */
  async findAllDoctorVisits(
    babyId: string,
    caregiverId: string,
    query: DoctorVisitQueryDto,
  ): Promise<DoctorVisitListResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const where: {
      babyId: string;
      isDeleted?: boolean;
      timestamp?: { gte?: Date; lte?: Date };
      visitType?: string;
      provider?: { contains: string; mode: 'insensitive' };
    } = { babyId };

    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    if (query.visitType) {
      where.visitType = query.visitType;
    }

    if (query.provider) {
      where.provider = { contains: query.provider, mode: 'insensitive' };
    }

    const sortField = query.sortBy || DoctorVisitSortField.TIMESTAMP;
    const sortOrder = query.sortOrder || SortOrder.DESC;
    const orderBy: Record<string, SortOrder> = { [sortField]: sortOrder };

    // Pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    const [entries, total] = await Promise.all([
      this.prisma.doctorVisitEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.doctorVisitEntry.count({ where }),
    ]);

    return {
      data: entries.map((e) => this.toDoctorVisitResponse(e)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single doctor visit entry
   * Validates: Requirements 8.6
   */
  async findOneDoctorVisit(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<DoctorVisitResponseDto> {
    await this.verifyAccess(babyId, caregiverId);

    const entry = await this.prisma.doctorVisitEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.babyId !== babyId) {
      throw new NotFoundException('Doctor visit entry not found');
    }

    return this.toDoctorVisitResponse(entry);
  }

  /**
   * Update a doctor visit entry
   * Validates: Requirements 8.6
   */
  async updateDoctorVisit(
    babyId: string,
    entryId: string,
    caregiverId: string,
    dto: UpdateDoctorVisitDto,
  ): Promise<DoctorVisitResponseDto> {
    await this.findOneDoctorVisit(babyId, entryId, caregiverId);

    const updateData: Partial<DoctorVisitEntry> = {};
    if (dto.visitType !== undefined) updateData.visitType = dto.visitType;
    if (dto.provider !== undefined) updateData.provider = dto.provider;
    if (dto.timestamp !== undefined) updateData.timestamp = new Date(dto.timestamp);
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.diagnosis !== undefined) updateData.diagnosis = dto.diagnosis;
    if (dto.followUpDate !== undefined) {
      updateData.followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const entry = await this.prisma.doctorVisitEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    return this.toDoctorVisitResponse(entry);
  }

  /**
   * Soft delete a doctor visit entry
   * Validates: Requirements 8.6
   */
  async removeDoctorVisit(
    babyId: string,
    entryId: string,
    caregiverId: string,
  ): Promise<void> {
    await this.findOneDoctorVisit(babyId, entryId, caregiverId);

    await this.prisma.doctorVisitEntry.update({
      where: { id: entryId },
      data: { isDeleted: true },
    });
  }
}
