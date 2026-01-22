import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';

import { ExportCategory, ExportQueryDto } from './dto';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * JSON Export format structure
 */
export interface JsonExportData {
  exportVersion: string;
  exportedAt: string;
  babyId: string;
  dateRange?: { startDate?: string; endDate?: string };
  data: {
    feedings: unknown[];
    sleepEntries: unknown[];
    diaperEntries: unknown[];
    growthEntries: unknown[];
    milestoneEntries: unknown[];
    activityEntries: unknown[];
    medicationEntries: unknown[];
    vaccinationEntries: unknown[];
    symptomEntries: unknown[];
    doctorVisitEntries: unknown[];
  };
}

/**
 * Export Service
 * Handles CSV export for all tracking categories
 * Validates: Requirements 13.3
 * Property 36: CSV Export Round-Trip
 */
@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
  ) {}

  /**
   * Verify caregiver has access to baby
   */
  private async verifyAccess(babyId: string, caregiverId: string): Promise<void> {
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }
  }

  /**
   * Build date filter for queries
   */
  private buildDateFilter(query: ExportQueryDto): { gte?: Date; lte?: Date } | undefined {
    if (!query.startDate && !query.endDate) {
      return undefined;
    }

    const filter: { gte?: Date; lte?: Date } = {};
    if (query.startDate) {
      filter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.lte = new Date(query.endDate);
    }
    return filter;
  }

  /**
   * Escape a value for CSV format
   * Handles commas, quotes, and newlines
   */
  private escapeCSVValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    let stringValue: string;
    if (value instanceof Date) {
      stringValue = value.toISOString();
    } else if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Convert an array of objects to CSV format
   */
  private toCSV(headers: string[], rows: Record<string, unknown>[]): string {
    const headerLine = headers.map((h) => this.escapeCSVValue(h)).join(',');
    const dataLines = rows.map((row) =>
      headers.map((header) => this.escapeCSVValue(row[header])).join(','),
    );

    return [headerLine, ...dataLines].join('\n');
  }

  /**
   * Export feeding entries to CSV
   * Validates: Requirements 13.3
   */
  async exportFeedingToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);
    const entries = await this.prisma.feedingEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    const headers = [
      'id',
      'timestamp',
      'type',
      'leftDuration',
      'rightDuration',
      'lastSide',
      'amount',
      'bottleType',
      'pumpedAmount',
      'pumpSide',
      'foodType',
      'reaction',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    const rows = entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      type: entry.type,
      leftDuration: entry.leftDuration,
      rightDuration: entry.rightDuration,
      lastSide: entry.lastSide,
      amount: entry.amount,
      bottleType: entry.bottleType,
      pumpedAmount: entry.pumpedAmount,
      pumpSide: entry.pumpSide,
      foodType: entry.foodType,
      reaction: entry.reaction,
      notes: entry.notes,
      caregiverId: entry.caregiverId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return this.toCSV(headers, rows);
  }

  /**
   * Export sleep entries to CSV
   * Validates: Requirements 13.3
   */
  async exportSleepToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);
    const entries = await this.prisma.sleepEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { startTime: dateFilter }),
      },
      orderBy: { startTime: 'desc' },
    });

    const headers = [
      'id',
      'startTime',
      'endTime',
      'duration',
      'sleepType',
      'quality',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    const rows = entries.map((entry) => ({
      id: entry.id,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
      sleepType: entry.sleepType,
      quality: entry.quality,
      notes: entry.notes,
      caregiverId: entry.caregiverId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return this.toCSV(headers, rows);
  }

  /**
   * Export diaper entries to CSV
   * Validates: Requirements 13.3
   */
  async exportDiaperToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);
    const entries = await this.prisma.diaperEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    const headers = [
      'id',
      'timestamp',
      'type',
      'color',
      'consistency',
      'hasRash',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    const rows = entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      type: entry.type,
      color: entry.color,
      consistency: entry.consistency,
      hasRash: entry.hasRash,
      notes: entry.notes,
      caregiverId: entry.caregiverId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return this.toCSV(headers, rows);
  }

  /**
   * Export growth entries to CSV
   * Validates: Requirements 13.3
   */
  async exportGrowthToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);
    const entries = await this.prisma.growthEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    const headers = [
      'id',
      'timestamp',
      'weight',
      'height',
      'headCircumference',
      'weightPercentile',
      'heightPercentile',
      'headPercentile',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    const rows = entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      weight: entry.weight,
      height: entry.height,
      headCircumference: entry.headCircumference,
      weightPercentile: entry.weightPercentile,
      heightPercentile: entry.heightPercentile,
      headPercentile: entry.headPercentile,
      notes: entry.notes,
      caregiverId: entry.caregiverId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return this.toCSV(headers, rows);
  }

  /**
   * Export milestone entries to CSV
   * Validates: Requirements 13.3
   */
  async exportMilestoneToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);
    const entries = await this.prisma.milestoneEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { achievedDate: dateFilter }),
      },
      include: {
        milestone: true,
      },
      orderBy: { achievedDate: 'desc' },
    });

    const headers = [
      'id',
      'achievedDate',
      'milestoneId',
      'milestoneName',
      'milestoneCategory',
      'milestoneDescription',
      'expectedAgeMonthsMin',
      'expectedAgeMonthsMax',
      'photoUrl',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    const rows = entries.map((entry) => ({
      id: entry.id,
      achievedDate: entry.achievedDate,
      milestoneId: entry.milestoneId,
      milestoneName: entry.milestone?.name ?? '',
      milestoneCategory: entry.milestone?.category ?? '',
      milestoneDescription: entry.milestone?.description ?? '',
      expectedAgeMonthsMin: entry.milestone?.expectedAgeMonthsMin ?? '',
      expectedAgeMonthsMax: entry.milestone?.expectedAgeMonthsMax ?? '',
      photoUrl: entry.photoUrl,
      notes: entry.notes,
      caregiverId: entry.caregiverId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return this.toCSV(headers, rows);
  }

  /**
   * Export activity entries to CSV
   * Validates: Requirements 13.3
   */
  async exportActivityToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);
    const entries = await this.prisma.activityEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    const headers = [
      'id',
      'timestamp',
      'activityType',
      'startTime',
      'endTime',
      'duration',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    const rows = entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      activityType: entry.activityType,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
      notes: entry.notes,
      caregiverId: entry.caregiverId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return this.toCSV(headers, rows);
  }

  /**
   * Export medication entries to CSV
   * Validates: Requirements 13.3
   */
  async exportMedicationToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);
    const entries = await this.prisma.medicationEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    const headers = [
      'id',
      'timestamp',
      'name',
      'dosage',
      'unit',
      'frequency',
      'nextDueAt',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    const rows = entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      name: entry.name,
      dosage: entry.dosage,
      unit: entry.unit,
      frequency: entry.frequency,
      nextDueAt: entry.nextDueAt,
      notes: entry.notes,
      caregiverId: entry.caregiverId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return this.toCSV(headers, rows);
  }

  /**
   * Export vaccination entries to CSV
   * Validates: Requirements 13.3
   */
  async exportVaccinationToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);
    const entries = await this.prisma.vaccinationEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    const headers = [
      'id',
      'timestamp',
      'vaccineName',
      'provider',
      'location',
      'nextDueAt',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    const rows = entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      vaccineName: entry.vaccineName,
      provider: entry.provider,
      location: entry.location,
      nextDueAt: entry.nextDueAt,
      notes: entry.notes,
      caregiverId: entry.caregiverId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return this.toCSV(headers, rows);
  }

  /**
   * Export symptom entries to CSV
   * Validates: Requirements 13.3
   */
  async exportSymptomToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);
    const entries = await this.prisma.symptomEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    const headers = [
      'id',
      'timestamp',
      'symptomType',
      'severity',
      'temperature',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    const rows = entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      symptomType: entry.symptomType,
      severity: entry.severity,
      temperature: entry.temperature,
      notes: entry.notes,
      caregiverId: entry.caregiverId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return this.toCSV(headers, rows);
  }

  /**
   * Export doctor visit entries to CSV
   * Validates: Requirements 13.3
   */
  async exportDoctorVisitToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);
    const entries = await this.prisma.doctorVisitEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    const headers = [
      'id',
      'timestamp',
      'visitType',
      'provider',
      'location',
      'diagnosis',
      'followUpDate',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    const rows = entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      visitType: entry.visitType,
      provider: entry.provider,
      location: entry.location,
      diagnosis: entry.diagnosis,
      followUpDate: entry.followUpDate,
      notes: entry.notes,
      caregiverId: entry.caregiverId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return this.toCSV(headers, rows);
  }

  /**
   * Export data for a specific category
   * Validates: Requirements 13.3
   */
  async exportCategoryToCSV(
    babyId: string,
    caregiverId: string,
    category: ExportCategory,
    query: ExportQueryDto,
  ): Promise<string> {
    switch (category) {
      case ExportCategory.FEEDING:
        return this.exportFeedingToCSV(babyId, caregiverId, query);
      case ExportCategory.SLEEP:
        return this.exportSleepToCSV(babyId, caregiverId, query);
      case ExportCategory.DIAPER:
        return this.exportDiaperToCSV(babyId, caregiverId, query);
      case ExportCategory.GROWTH:
        return this.exportGrowthToCSV(babyId, caregiverId, query);
      case ExportCategory.MILESTONE:
        return this.exportMilestoneToCSV(babyId, caregiverId, query);
      case ExportCategory.ACTIVITY:
        return this.exportActivityToCSV(babyId, caregiverId, query);
      case ExportCategory.MEDICATION:
        return this.exportMedicationToCSV(babyId, caregiverId, query);
      case ExportCategory.VACCINATION:
        return this.exportVaccinationToCSV(babyId, caregiverId, query);
      case ExportCategory.SYMPTOM:
        return this.exportSymptomToCSV(babyId, caregiverId, query);
      case ExportCategory.DOCTOR_VISIT:
        return this.exportDoctorVisitToCSV(babyId, caregiverId, query);
      default:
        throw new NotFoundException(`Unknown export category: ${category}`);
    }
  }

  /**
   * Get filename for CSV export
   */
  getExportFilename(babyId: string, category: ExportCategory): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `baby-${babyId}-${category}-${timestamp}.csv`;
  }

  /**
   * Get filename for all data export
   */
  getAllDataExportFilename(babyId: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `baby-${babyId}-all-data-${timestamp}.csv`;
  }

  /**
   * Export all data in a single CSV
   */
  async exportAllDataToCSV(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<string> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);

    // Collect all data with category indicators
    const allRows: Record<string, unknown>[] = [];

    // Feeding entries
    const feedings = await this.prisma.feedingEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    for (const entry of feedings) {
      allRows.push({
        category: 'feeding',
        id: entry.id,
        timestamp: entry.timestamp,
        type: entry.type,
        leftDuration: entry.leftDuration,
        rightDuration: entry.rightDuration,
        lastSide: entry.lastSide,
        amount: entry.amount,
        bottleType: entry.bottleType,
        pumpedAmount: entry.pumpedAmount,
        pumpSide: entry.pumpSide,
        foodType: entry.foodType,
        reaction: entry.reaction,
        notes: entry.notes,
        caregiverId: entry.caregiverId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Sleep entries
    const sleeps = await this.prisma.sleepEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { startTime: dateFilter }),
      },
      orderBy: { startTime: 'desc' },
    });

    for (const entry of sleeps) {
      allRows.push({
        category: 'sleep',
        id: entry.id,
        timestamp: entry.startTime,
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration,
        sleepType: entry.sleepType,
        quality: entry.quality,
        notes: entry.notes,
        caregiverId: entry.caregiverId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Diaper entries
    const diapers = await this.prisma.diaperEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    for (const entry of diapers) {
      allRows.push({
        category: 'diaper',
        id: entry.id,
        timestamp: entry.timestamp,
        type: entry.type,
        color: entry.color,
        consistency: entry.consistency,
        hasRash: entry.hasRash,
        notes: entry.notes,
        caregiverId: entry.caregiverId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Growth entries
    const growths = await this.prisma.growthEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    for (const entry of growths) {
      allRows.push({
        category: 'growth',
        id: entry.id,
        timestamp: entry.timestamp,
        weight: entry.weight,
        height: entry.height,
        headCircumference: entry.headCircumference,
        weightPercentile: entry.weightPercentile,
        heightPercentile: entry.heightPercentile,
        headPercentile: entry.headPercentile,
        notes: entry.notes,
        caregiverId: entry.caregiverId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Milestone entries
    const milestones = await this.prisma.milestoneEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { achievedDate: dateFilter }),
      },
      include: {
        milestone: true,
      },
      orderBy: { achievedDate: 'desc' },
    });

    for (const entry of milestones) {
      allRows.push({
        category: 'milestone',
        id: entry.id,
        timestamp: entry.achievedDate,
        achievedDate: entry.achievedDate,
        milestoneId: entry.milestoneId,
        milestoneName: entry.milestone?.name ?? '',
        milestoneCategory: entry.milestone?.category ?? '',
        photoUrl: entry.photoUrl,
        notes: entry.notes,
        caregiverId: entry.caregiverId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Medication entries
    const medications = await this.prisma.medicationEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    for (const entry of medications) {
      allRows.push({
        category: 'medication',
        id: entry.id,
        timestamp: entry.timestamp,
        name: entry.name,
        dosage: entry.dosage,
        unit: entry.unit,
        frequency: entry.frequency,
        nextDueAt: entry.nextDueAt,
        notes: entry.notes,
        caregiverId: entry.caregiverId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Vaccination entries
    const vaccinations = await this.prisma.vaccinationEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    for (const entry of vaccinations) {
      allRows.push({
        category: 'vaccination',
        id: entry.id,
        timestamp: entry.timestamp,
        vaccineName: entry.vaccineName,
        provider: entry.provider,
        location: entry.location,
        nextDueAt: entry.nextDueAt,
        notes: entry.notes,
        caregiverId: entry.caregiverId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Symptom entries
    const symptoms = await this.prisma.symptomEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    for (const entry of symptoms) {
      allRows.push({
        category: 'symptom',
        id: entry.id,
        timestamp: entry.timestamp,
        symptomType: entry.symptomType,
        severity: entry.severity,
        temperature: entry.temperature,
        notes: entry.notes,
        caregiverId: entry.caregiverId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Doctor visit entries
    const doctorVisits = await this.prisma.doctorVisitEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    for (const entry of doctorVisits) {
      allRows.push({
        category: 'doctor_visit',
        id: entry.id,
        timestamp: entry.timestamp,
        visitType: entry.visitType,
        provider: entry.provider,
        location: entry.location,
        diagnosis: entry.diagnosis,
        followUpDate: entry.followUpDate,
        notes: entry.notes,
        caregiverId: entry.caregiverId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Activity entries
    const activities = await this.prisma.activityEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
    });

    for (const entry of activities) {
      allRows.push({
        category: 'activity',
        id: entry.id,
        timestamp: entry.timestamp,
        activityType: entry.activityType,
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration,
        notes: entry.notes,
        caregiverId: entry.caregiverId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Sort all rows by timestamp descending
    allRows.sort((a, b) => {
      const timeA = a['timestamp'] instanceof Date ? (a['timestamp'] as Date).getTime() : 0;
      const timeB = b['timestamp'] instanceof Date ? (b['timestamp'] as Date).getTime() : 0;
      return timeB - timeA;
    });

    // Define comprehensive headers
    const headers = [
      'category',
      'id',
      'timestamp',
      'type',
      'name',
      'dosage',
      'unit',
      'frequency',
      'nextDueAt',
      'vaccineName',
      'provider',
      'location',
      'symptomType',
      'severity',
      'temperature',
      'visitType',
      'diagnosis',
      'followUpDate',
      'activityType',
      'startTime',
      'endTime',
      'duration',
      'sleepType',
      'quality',
      'leftDuration',
      'rightDuration',
      'lastSide',
      'amount',
      'bottleType',
      'pumpedAmount',
      'pumpSide',
      'foodType',
      'reaction',
      'color',
      'consistency',
      'hasRash',
      'weight',
      'height',
      'headCircumference',
      'weightPercentile',
      'heightPercentile',
      'headPercentile',
      'achievedDate',
      'milestoneId',
      'milestoneName',
      'milestoneCategory',
      'photoUrl',
      'notes',
      'caregiverId',
      'createdAt',
      'updatedAt',
    ];

    return this.toCSV(headers, allRows);
  }

  /**
   * Export all data to JSON format
   * Returns structured JSON that can be re-imported
   */
  async exportAllDataToJSON(
    babyId: string,
    caregiverId: string,
    query: ExportQueryDto,
  ): Promise<JsonExportData> {
    await this.verifyAccess(babyId, caregiverId);

    const dateFilter = this.buildDateFilter(query);

    // Fetch all data types
    const [
      feedings,
      sleepEntries,
      diaperEntries,
      growthEntries,
      milestoneEntries,
      activityEntries,
      medicationEntries,
      vaccinationEntries,
      symptomEntries,
      doctorVisitEntries,
    ] = await Promise.all([
      this.prisma.feedingEntry.findMany({
        where: { babyId, isDeleted: false, ...(dateFilter && { timestamp: dateFilter }) },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.sleepEntry.findMany({
        where: { babyId, isDeleted: false, ...(dateFilter && { startTime: dateFilter }) },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.diaperEntry.findMany({
        where: { babyId, isDeleted: false, ...(dateFilter && { timestamp: dateFilter }) },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.growthEntry.findMany({
        where: { babyId, isDeleted: false, ...(dateFilter && { timestamp: dateFilter }) },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.milestoneEntry.findMany({
        where: { babyId, isDeleted: false, ...(dateFilter && { achievedDate: dateFilter }) },
        include: { milestone: true },
        orderBy: { achievedDate: 'desc' },
      }),
      this.prisma.activityEntry.findMany({
        where: { babyId, isDeleted: false, ...(dateFilter && { timestamp: dateFilter }) },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.medicationEntry.findMany({
        where: { babyId, isDeleted: false, ...(dateFilter && { timestamp: dateFilter }) },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.vaccinationEntry.findMany({
        where: { babyId, isDeleted: false, ...(dateFilter && { timestamp: dateFilter }) },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.symptomEntry.findMany({
        where: { babyId, isDeleted: false, ...(dateFilter && { timestamp: dateFilter }) },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.doctorVisitEntry.findMany({
        where: { babyId, isDeleted: false, ...(dateFilter && { timestamp: dateFilter }) },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      babyId,
      dateRange: query.startDate || query.endDate ? { startDate: query.startDate, endDate: query.endDate } : undefined,
      data: {
        feedings: feedings.map(e => this.stripInternalFields(e)),
        sleepEntries: sleepEntries.map(e => this.stripInternalFields(e)),
        diaperEntries: diaperEntries.map(e => this.stripInternalFields(e)),
        growthEntries: growthEntries.map(e => this.stripInternalFields(e)),
        milestoneEntries: milestoneEntries.map(e => ({
          ...this.stripInternalFields(e),
          milestone: e.milestone ? { name: e.milestone.name, category: e.milestone.category } : null,
        })),
        activityEntries: activityEntries.map(e => this.stripInternalFields(e)),
        medicationEntries: medicationEntries.map(e => this.stripInternalFields(e)),
        vaccinationEntries: vaccinationEntries.map(e => this.stripInternalFields(e)),
        symptomEntries: symptomEntries.map(e => this.stripInternalFields(e)),
        doctorVisitEntries: doctorVisitEntries.map(e => this.stripInternalFields(e)),
      },
    };
  }

  /**
   * Strip internal fields from entries for export
   */
  private stripInternalFields(entry: Record<string, unknown>): Record<string, unknown> {
    const { id: _id, babyId: _babyId, caregiverId: _caregiverId, isDeleted: _isDeleted, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = entry;
    return rest;
  }

  /**
   * Get filename for JSON export
   */
  getJsonExportFilename(babyId: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `baby-${babyId}-export-${timestamp}.json`;
  }
}
