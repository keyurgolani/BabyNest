import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import {
  ReportQueryDto,
  ReportData,
  BabyProfileSummary,
  GrowthDataPoint,
  FeedingSummary,
  SleepSummary,
  DiaperSummary,
  MilestoneAchievement,
} from './dto';
import { BabyService } from '../baby/baby.service';
import { InsightsService } from '../insights/insights.service';
import { PrismaService } from '../prisma/prisma.service';


/**
 * Report Service
 * Generates PDF reports with growth charts and summaries
 * Validates: Requirements 13.1, 13.2
 */
@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
    private readonly insightsService: InsightsService,
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
   * Calculate age in months and days
   */
  private calculateAge(dateOfBirth: Date): { months: number; days: number } {
    const now = new Date();
    const birth = new Date(dateOfBirth);
    
    let months = (now.getFullYear() - birth.getFullYear()) * 12;
    months += now.getMonth() - birth.getMonth();
    
    let days = now.getDate() - birth.getDate();
    if (days < 0) {
      months--;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    return { months: Math.max(0, months), days: Math.max(0, days) };
  }

  /**
   * Build date filter for queries
   * Date ranges are dynamic based on the selected month/period
   * If no dates provided, defaults to the current month
   */
  private buildDateFilter(query: ReportQueryDto): { startDate: Date; endDate: Date } {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    
    let startDate: Date;
    if (query.startDate) {
      startDate = new Date(query.startDate);
    } else {
      // Default to start of the current month if no startDate provided
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }
    
    return { startDate, endDate };
  }

  /**
   * Get baby profile summary
   */
  private async getBabyProfile(babyId: string): Promise<BabyProfileSummary> {
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    const age = this.calculateAge(baby.dateOfBirth);

    return {
      name: baby.name,
      dateOfBirth: baby.dateOfBirth,
      gender: baby.gender,
      ageMonths: age.months,
      ageDays: age.days,
    };
  }

  /**
   * Get growth data for the report period
   */
  private async getGrowthData(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<GrowthDataPoint[]> {
    const entries = await this.prisma.growthEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return entries.map((entry) => ({
      date: entry.timestamp,
      weight: entry.weight,
      height: entry.height,
      headCircumference: entry.headCircumference,
      weightPercentile: entry.weightPercentile,
      heightPercentile: entry.heightPercentile,
      headPercentile: entry.headPercentile,
    }));
  }

  /**
   * Get feeding summary for the report period
   */
  private async getFeedingSummary(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<FeedingSummary> {
    const entries = await this.prisma.feedingEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const breastfeedings = entries.filter((e) => e.type === 'breastfeeding');
    const bottles = entries.filter((e) => e.type === 'bottle');
    const solids = entries.filter((e) => e.type === 'solid');
    const pumpings = entries.filter((e) => e.type === 'pumping');

    // Calculate average breastfeeding duration
    let avgBreastfeedingDuration: number | null = null;
    if (breastfeedings.length > 0) {
      const totalDuration = breastfeedings.reduce((sum, e) => {
        return sum + (e.leftDuration || 0) + (e.rightDuration || 0);
      }, 0);
      avgBreastfeedingDuration = Math.round(totalDuration / breastfeedings.length);
    }

    // Calculate average bottle amount
    let avgBottleAmount: number | null = null;
    if (bottles.length > 0) {
      const totalAmount = bottles.reduce((sum, e) => sum + (e.amount || 0), 0);
      avgBottleAmount = Math.round(totalAmount / bottles.length);
    }

    return {
      totalFeedings: entries.length,
      breastfeedingCount: breastfeedings.length,
      bottleCount: bottles.length,
      solidCount: solids.length,
      pumpingCount: pumpings.length,
      averageBreastfeedingDuration: avgBreastfeedingDuration,
      averageBottleAmount: avgBottleAmount,
    };
  }

  /**
   * Get sleep summary for the report period
   */
  private async getSleepSummary(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SleepSummary> {
    const entries = await this.prisma.sleepEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const naps = entries.filter((e) => e.sleepType === 'nap');
    const nightSleeps = entries.filter((e) => e.sleepType === 'night');

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

    // Calculate average nap duration
    let avgNapDuration: number | null = null;
    if (naps.length > 0) {
      const totalNapMinutes = naps.reduce((sum, e) => sum + (e.duration || 0), 0);
      avgNapDuration = Math.round(totalNapMinutes / naps.length);
    }

    // Calculate average night sleep duration
    let avgNightSleepDuration: number | null = null;
    if (nightSleeps.length > 0) {
      const totalNightMinutes = nightSleeps.reduce((sum, e) => sum + (e.duration || 0), 0);
      avgNightSleepDuration = Math.round(totalNightMinutes / nightSleeps.length);
    }

    return {
      totalSleepMinutes: totalMinutes,
      averageSleepPerDay: Math.round(totalMinutes / daysDiff),
      napCount: naps.length,
      nightSleepCount: nightSleeps.length,
      averageNapDuration: avgNapDuration,
      averageNightSleepDuration: avgNightSleepDuration,
    };
  }

  /**
   * Get diaper summary for the report period
   */
  private async getDiaperSummary(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DiaperSummary> {
    const entries = await this.prisma.diaperEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

    return {
      totalChanges: entries.length,
      wetCount: entries.filter((e) => e.type === 'wet').length,
      dirtyCount: entries.filter((e) => e.type === 'dirty').length,
      mixedCount: entries.filter((e) => e.type === 'mixed').length,
      averagePerDay: Math.round((entries.length / daysDiff) * 10) / 10,
    };
  }

  /**
   * Get milestone achievements for the report period
   */
  private async getMilestoneAchievements(
    babyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MilestoneAchievement[]> {
    const entries = await this.prisma.milestoneEntry.findMany({
      where: {
        babyId,
        isDeleted: false,
        achievedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        milestone: true,
      },
      orderBy: { achievedDate: 'asc' },
    });

    return entries.map((entry) => ({
      name: entry.milestone?.name || 'Unknown Milestone',
      category: entry.milestone?.category || 'Unknown',
      achievedDate: entry.achievedDate,
      notes: entry.notes,
    }));
  }

  /**
   * Gather all report data
   */
  async gatherReportData(
    babyId: string,
    caregiverId: string,
    query: ReportQueryDto,
  ): Promise<ReportData> {
    await this.verifyAccess(babyId, caregiverId);

    const { startDate, endDate } = this.buildDateFilter(query);

    const [baby, growth, feeding, sleep, diaper, milestones] = await Promise.all([
      this.getBabyProfile(babyId),
      this.getGrowthData(babyId, startDate, endDate),
      this.getFeedingSummary(babyId, startDate, endDate),
      this.getSleepSummary(babyId, startDate, endDate),
      this.getDiaperSummary(babyId, startDate, endDate),
      this.getMilestoneAchievements(babyId, startDate, endDate),
    ]);

    return {
      baby,
      period: { startDate, endDate },
      growth,
      feeding,
      sleep,
      diaper,
      milestones,
      generatedAt: new Date(),
    };
  }

  /**
   * Format duration in minutes to human readable string
   */
  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Format date to readable string
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Generate PDF report
   * Validates: Requirements 13.1, 13.2
   */
  async generatePDFReport(
    babyId: string,
    caregiverId: string,
    query: ReportQueryDto,
  ): Promise<Buffer> {
    const data = await this.gatherReportData(babyId, caregiverId, query);

    // Get AI summary if requested (default: true)
    const includeAiSummary = query.includeAiSummary !== false;
    let aiSummary: string | null = null;

    if (includeAiSummary) {
      try {
        const summary = await this.insightsService.getWeeklySummary(
          babyId,
          caregiverId,
          {
            startDate: data.period.startDate.toISOString(),
            endDate: data.period.endDate.toISOString(),
          },
        );
        aiSummary = summary.aiSummary;
      } catch (error) {
        console.error('Failed to generate AI summary for report:', error);
        // Continue without AI summary if it fails
      }
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('BabyNest Report', { align: 'center' });
      doc.moveDown(0.5);

      // Baby Profile Section
      doc.fontSize(18).font('Helvetica-Bold').text('Baby Profile');
      doc.moveDown(0.3);
      doc.fontSize(12).font('Helvetica');
      doc.text(`Name: ${data.baby.name}`);
      doc.text(`Date of Birth: ${this.formatDate(data.baby.dateOfBirth)}`);
      doc.text(`Age: ${data.baby.ageMonths} months, ${data.baby.ageDays} days`);
      doc.text(`Gender: ${data.baby.gender.charAt(0).toUpperCase() + data.baby.gender.slice(1)}`);
      doc.moveDown();

      // Report Period
      doc.fontSize(12).font('Helvetica-Oblique');
      doc.text(`Report Period: ${this.formatDate(data.period.startDate)} - ${this.formatDate(data.period.endDate)}`);
      doc.moveDown();

      // AI Summary Section (if available)
      if (aiSummary) {
        doc.fontSize(18).font('Helvetica-Bold').text('AI-Powered Insights');
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        
        // Split the AI summary into paragraphs and format nicely
        const paragraphs = aiSummary.split('\n\n');
        for (const paragraph of paragraphs) {
          if (paragraph.trim()) {
            doc.text(paragraph.trim(), { align: 'justify' });
            doc.moveDown(0.5);
          }
        }
        doc.moveDown();
      }

      // Growth Section
      doc.fontSize(18).font('Helvetica-Bold').text('Growth Measurements');
      doc.moveDown(0.3);
      
      if (data.growth.length > 0) {
        // Growth table header
        doc.fontSize(10).font('Helvetica-Bold');
        const growthTableTop = doc.y;
        doc.text('Date', 50, growthTableTop);
        doc.text('Weight (g)', 150, growthTableTop);
        doc.text('Height (mm)', 250, growthTableTop);
        doc.text('Head (mm)', 350, growthTableTop);
        doc.text('Percentiles', 450, growthTableTop);
        
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        doc.moveDown(0.5);

        // Growth data rows
        doc.font('Helvetica').fontSize(9);
        for (const point of data.growth) {
          const y = doc.y;
          doc.text(this.formatDate(point.date).slice(0, 12), 50, y);
          doc.text(point.weight?.toString() || '-', 150, y);
          doc.text(point.height?.toString() || '-', 250, y);
          doc.text(point.headCircumference?.toString() || '-', 350, y);
          
          const percentiles: string[] = [];
          if (point.weightPercentile !== null) percentiles.push(`W:${point.weightPercentile}%`);
          if (point.heightPercentile !== null) percentiles.push(`H:${point.heightPercentile}%`);
          if (point.headPercentile !== null) percentiles.push(`HC:${point.headPercentile}%`);
          doc.text(percentiles.join(' ') || '-', 450, y);
          
          doc.moveDown(0.8);
        }
      } else {
        doc.fontSize(11).font('Helvetica').text('No growth measurements recorded during this period.');
      }
      doc.moveDown();

      // Feeding Summary Section
      doc.fontSize(18).font('Helvetica-Bold').text('Feeding Summary');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Feedings: ${data.feeding.totalFeedings}`);
      doc.text(`  • Breastfeeding: ${data.feeding.breastfeedingCount}`);
      doc.text(`  • Bottle: ${data.feeding.bottleCount}`);
      doc.text(`  • Solid Food: ${data.feeding.solidCount}`);
      doc.text(`  • Pumping: ${data.feeding.pumpingCount}`);
      if (data.feeding.averageBreastfeedingDuration !== null) {
        doc.text(`Average Breastfeeding Duration: ${this.formatDuration(Math.round(data.feeding.averageBreastfeedingDuration / 60))}`);
      }
      if (data.feeding.averageBottleAmount !== null) {
        doc.text(`Average Bottle Amount: ${data.feeding.averageBottleAmount} ml`);
      }
      doc.moveDown();

      // Sleep Summary Section
      doc.fontSize(18).font('Helvetica-Bold').text('Sleep Summary');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Sleep: ${this.formatDuration(data.sleep.totalSleepMinutes)}`);
      doc.text(`Average Sleep Per Day: ${this.formatDuration(data.sleep.averageSleepPerDay)}`);
      doc.text(`Naps: ${data.sleep.napCount}`);
      doc.text(`Night Sleep Sessions: ${data.sleep.nightSleepCount}`);
      if (data.sleep.averageNapDuration !== null) {
        doc.text(`Average Nap Duration: ${this.formatDuration(data.sleep.averageNapDuration)}`);
      }
      if (data.sleep.averageNightSleepDuration !== null) {
        doc.text(`Average Night Sleep Duration: ${this.formatDuration(data.sleep.averageNightSleepDuration)}`);
      }
      doc.moveDown();

      // Diaper Summary Section
      doc.fontSize(18).font('Helvetica-Bold').text('Diaper Summary');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Changes: ${data.diaper.totalChanges}`);
      doc.text(`  • Wet: ${data.diaper.wetCount}`);
      doc.text(`  • Dirty: ${data.diaper.dirtyCount}`);
      doc.text(`  • Mixed: ${data.diaper.mixedCount}`);
      doc.text(`Average Per Day: ${data.diaper.averagePerDay}`);
      doc.moveDown();

      // Milestones Section
      doc.fontSize(18).font('Helvetica-Bold').text('Milestone Achievements');
      doc.moveDown(0.3);
      
      if (data.milestones.length > 0) {
        doc.fontSize(11).font('Helvetica');
        for (const milestone of data.milestones) {
          doc.font('Helvetica-Bold').text(`${milestone.name}`, { continued: true });
          doc.font('Helvetica').text(` (${milestone.category})`);
          doc.text(`  Achieved: ${this.formatDate(milestone.achievedDate)}`);
          if (milestone.notes) {
            doc.text(`  Notes: ${milestone.notes}`);
          }
          doc.moveDown(0.5);
        }
      } else {
        doc.fontSize(11).font('Helvetica').text('No milestones achieved during this period.');
      }
      doc.moveDown();

      // Footer
      doc.fontSize(9).font('Helvetica-Oblique');
      doc.text(`Report generated on ${this.formatDate(data.generatedAt)} by BabyNest`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Get filename for PDF report
   */
  getReportFilename(babyId: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `baby-${babyId}-report-${timestamp}.pdf`;
  }
}
