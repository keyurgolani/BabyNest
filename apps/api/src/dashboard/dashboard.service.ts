import { Injectable } from '@nestjs/common';

import {
  DashboardSummaryResponseDto,
  BabySummaryDto,
  DashboardAlertsResponseDto,
  AlertDto,
  AlertType,
  AlertSeverity,
  DashboardUpcomingResponseDto,
  UpcomingEventDto,
  UpcomingEventType,
} from './dto';
import { BabyService } from '../baby/baby.service';
import {
  MILESTONE_DEFINITIONS,
} from '../milestone/milestone-definitions';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Dashboard Service
 * Provides multi-baby dashboard data including summaries, alerts, and upcoming events
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
  ) {}

  /**
   * Calculate age in months from date of birth
   */
  private calculateAgeInMonths(dateOfBirth: Date): number {
    const now = new Date();
    const birthDate = new Date(dateOfBirth);
    
    const yearsDiff = now.getFullYear() - birthDate.getFullYear();
    const monthsDiff = now.getMonth() - birthDate.getMonth();
    const daysDiff = now.getDate() - birthDate.getDate();
    
    let totalMonths = yearsDiff * 12 + monthsDiff;
    
    if (daysDiff < 0) {
      totalMonths -= 1;
    }
    
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const fractionalMonth = (daysDiff >= 0 ? daysDiff : daysInMonth + daysDiff) / daysInMonth;
    
    return Math.round((totalMonths + fractionalMonth) * 10) / 10;
  }

  /**
   * Get summary for all babies accessible to a caregiver
   */
  async getSummary(caregiverId: string): Promise<DashboardSummaryResponseDto> {
    // Get all babies for this caregiver
    const babiesResult = await this.babyService.findAll(caregiverId);
    const babies = babiesResult.data;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const summaries: BabySummaryDto[] = [];
    let totalAlerts = 0;

    for (const baby of babies) {
      // Count feedings in last 24h
      const feedingsCount = await this.prisma.feedingEntry.count({
        where: {
          babyId: baby.id,
          timestamp: { gte: last24h },
          isDeleted: false,
        },
      });

      // Calculate total sleep in last 24h
      const sleepEntries = await this.prisma.sleepEntry.findMany({
        where: {
          babyId: baby.id,
          startTime: { gte: last24h },
          isDeleted: false,
        },
        select: { duration: true },
      });
      const sleepTotal = sleepEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

      // Count diapers in last 24h
      const diapersCount = await this.prisma.diaperEntry.count({
        where: {
          babyId: baby.id,
          timestamp: { gte: last24h },
          isDeleted: false,
        },
      });

      // Get last feeding
      const lastFeeding = await this.prisma.feedingEntry.findFirst({
        where: {
          babyId: baby.id,
          isDeleted: false,
        },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      });

      // Get last sleep
      const lastSleep = await this.prisma.sleepEntry.findFirst({
        where: {
          babyId: baby.id,
          isDeleted: false,
        },
        orderBy: { startTime: 'desc' },
        select: { startTime: true },
      });

      // Get last diaper
      const lastDiaper = await this.prisma.diaperEntry.findFirst({
        where: {
          babyId: baby.id,
          isDeleted: false,
        },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      });

      // Count active alerts for this baby
      const alerts = await this.getAlertsForBaby(baby.id, baby.name, baby.dateOfBirth);
      const activeAlerts = alerts.length;
      totalAlerts += activeAlerts;

      summaries.push({
        babyId: baby.id,
        babyName: baby.name,
        ageMonths: this.calculateAgeInMonths(baby.dateOfBirth),
        feedingsLast24h: feedingsCount,
        sleepLast24h: sleepTotal,
        diapersLast24h: diapersCount,
        lastFeeding: lastFeeding?.timestamp || null,
        lastSleep: lastSleep?.startTime || null,
        lastDiaper: lastDiaper?.timestamp || null,
        activeAlerts,
      });
    }

    return {
      babies: summaries,
      totalBabies: babies.length,
      totalAlerts,
    };
  }

  /**
   * Get alerts for a specific baby
   */
  private async getAlertsForBaby(
    babyId: string,
    babyName: string,
    dateOfBirth: Date,
  ): Promise<AlertDto[]> {
    const alerts: AlertDto[] = [];
    const now = new Date();

    // Check for overdue medications
    const overdueMeds = await this.prisma.medicationEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        nextDueAt: {
          lt: now,
          not: null,
        },
      },
    });

    for (const med of overdueMeds) {
      const hoursOverdue = Math.floor(
        (now.getTime() - med.nextDueAt!.getTime()) / (1000 * 60 * 60),
      );
      alerts.push({
        babyId,
        babyName,
        type: AlertType.MEDICATION_OVERDUE,
        severity: hoursOverdue > 2 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        title: 'Medication Overdue',
        message: `${med.name} was due ${hoursOverdue} hour${hoursOverdue !== 1 ? 's' : ''} ago`,
        relatedEntryId: med.id,
        timestamp: med.nextDueAt!,
      });
    }

    // Check for overdue vaccinations
    const overdueVaccinations = await this.prisma.vaccinationEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        nextDueAt: {
          lt: now,
          not: null,
        },
      },
    });

    for (const vacc of overdueVaccinations) {
      const daysOverdue = Math.floor(
        (now.getTime() - vacc.nextDueAt!.getTime()) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        babyId,
        babyName,
        type: AlertType.VACCINATION_OVERDUE,
        severity: daysOverdue > 30 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        title: 'Vaccination Overdue',
        message: `${vacc.vaccineName} was due ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`,
        relatedEntryId: vacc.id,
        timestamp: vacc.nextDueAt!,
      });
    }

    // Check for delayed milestones
    const babyAgeMonths = this.calculateAgeInMonths(dateOfBirth);
    
    // Get milestone definitions from static data
    const allDefinitions = [...MILESTONE_DEFINITIONS];
    
    // Filter to age-appropriate milestones (baby has reached minimum expected age)
    const ageAppropriateMilestones = allDefinitions.filter(
      (d) => babyAgeMonths >= d.expectedAgeMonthsMin,
    );

    // Get all achieved milestones for this baby
    const achievedEntries = await this.prisma.milestoneEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
      },
      select: { milestoneId: true },
    });

    const achievedIds = new Set(achievedEntries.map((e) => e.milestoneId));

    // Count delayed milestones (age-appropriate but not achieved and past max expected age)
    const delayedMilestones = ageAppropriateMilestones.filter(
      (d) => !achievedIds.has(d.id) && babyAgeMonths > d.expectedAgeMonthsMax,
    );

    if (delayedMilestones.length > 0) {
      alerts.push({
        babyId,
        babyName,
        type: AlertType.MILESTONE_DELAYED,
        severity: delayedMilestones.length > 3 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        title: 'Delayed Milestones',
        message: `${delayedMilestones.length} milestone${delayedMilestones.length !== 1 ? 's' : ''} delayed`,
        relatedEntryId: null,
        timestamp: now,
      });
    }

    return alerts;
  }

  /**
   * Get all alerts across all babies for a caregiver
   */
  async getAlerts(caregiverId: string): Promise<DashboardAlertsResponseDto> {
    // Get all babies for this caregiver
    const babiesResult = await this.babyService.findAll(caregiverId);
    const babies = babiesResult.data;

    const allAlerts: AlertDto[] = [];

    for (const baby of babies) {
      const babyAlerts = await this.getAlertsForBaby(baby.id, baby.name, baby.dateOfBirth);
      allAlerts.push(...babyAlerts);
    }

    // Sort by severity (high first) then by timestamp
    allAlerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    return {
      alerts: allAlerts,
      total: allAlerts.length,
    };
  }

  /**
   * Get upcoming events for all babies
   */
  async getUpcoming(caregiverId: string): Promise<DashboardUpcomingResponseDto> {
    // Get all babies for this caregiver
    const babiesResult = await this.babyService.findAll(caregiverId);
    const babies = babiesResult.data;

    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events: UpcomingEventDto[] = [];

    for (const baby of babies) {
      // Get upcoming medications
      const upcomingMeds = await this.prisma.medicationEntry.findMany({
        where: {
          babyId: baby.id,
          isDeleted: false,
          nextDueAt: {
            gte: now,
            lte: next7Days,
          },
        },
        orderBy: { nextDueAt: 'asc' },
      });

      for (const med of upcomingMeds) {
        events.push({
          babyId: baby.id,
          babyName: baby.name,
          type: UpcomingEventType.MEDICATION,
          title: med.name,
          description: `${med.dosage} ${med.unit} - ${med.frequency}`,
          scheduledTime: med.nextDueAt!,
          relatedEntryId: med.id,
        });
      }

      // Get upcoming vaccinations
      const upcomingVaccinations = await this.prisma.vaccinationEntry.findMany({
        where: {
          babyId: baby.id,
          isDeleted: false,
          nextDueAt: {
            gte: now,
            lte: next7Days,
          },
        },
        orderBy: { nextDueAt: 'asc' },
      });

      for (const vacc of upcomingVaccinations) {
        events.push({
          babyId: baby.id,
          babyName: baby.name,
          type: UpcomingEventType.VACCINATION,
          title: vacc.vaccineName,
          description: vacc.provider || null,
          scheduledTime: vacc.nextDueAt!,
          relatedEntryId: vacc.id,
        });
      }

      // Get upcoming doctor visits
      const upcomingVisits = await this.prisma.doctorVisitEntry.findMany({
        where: {
          babyId: baby.id,
          isDeleted: false,
          followUpDate: {
            gte: now,
            lte: next7Days,
          },
        },
        orderBy: { followUpDate: 'asc' },
      });

      for (const visit of upcomingVisits) {
        events.push({
          babyId: baby.id,
          babyName: baby.name,
          type: UpcomingEventType.DOCTOR_VISIT,
          title: `${visit.visitType} - ${visit.provider}`,
          description: visit.location || null,
          scheduledTime: visit.followUpDate!,
          relatedEntryId: visit.id,
        });
      }
    }

    // Sort by scheduled time
    events.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    return {
      events,
      total: events.length,
    };
  }
}
