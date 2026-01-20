import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';

import { ExportCategory, ExportQueryDto, ReportQueryDto, ExportCategoryQueryDto } from './dto';
import { ExportService } from './export.service';
import { ReportService } from './report.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';

/**
 * Export Controller
 * Provides endpoints for CSV export of all tracking categories
 * Validates: Requirements 13.3
 */
@ApiTags('Export')
@ApiBearerAuth()
@UseGuards(CombinedAuthGuard)
@Controller('babies/:babyId/export')
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly reportService: ReportService,
  ) {}

  /**
   * Export feeding data to CSV
   */
  @Get('feeding/csv')
  @ApiOperation({
    summary: 'Export feeding data to CSV',
    description: 'Export all feeding entries for a baby as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with feeding data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportFeedingCSV(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportFeedingToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getExportFilename(babyId, ExportCategory.FEEDING);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export sleep data to CSV
   */
  @Get('sleep/csv')
  @ApiOperation({
    summary: 'Export sleep data to CSV',
    description: 'Export all sleep entries for a baby as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with sleep data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportSleepCSV(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportSleepToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getExportFilename(babyId, ExportCategory.SLEEP);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export diaper data to CSV
   */
  @Get('diaper/csv')
  @ApiOperation({
    summary: 'Export diaper data to CSV',
    description: 'Export all diaper entries for a baby as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with diaper data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportDiaperCSV(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportDiaperToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getExportFilename(babyId, ExportCategory.DIAPER);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export growth data to CSV
   */
  @Get('growth/csv')
  @ApiOperation({
    summary: 'Export growth data to CSV',
    description: 'Export all growth measurements for a baby as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with growth data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportGrowthCSV(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportGrowthToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getExportFilename(babyId, ExportCategory.GROWTH);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export milestone data to CSV
   */
  @Get('milestone/csv')
  @ApiOperation({
    summary: 'Export milestone data to CSV',
    description: 'Export all achieved milestones for a baby as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with milestone data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportMilestoneCSV(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportMilestoneToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getExportFilename(babyId, ExportCategory.MILESTONE);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export activity data to CSV
   */
  @Get('activity/csv')
  @ApiOperation({
    summary: 'Export activity data to CSV',
    description: 'Export all activity entries for a baby as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with activity data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportActivityCSV(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportActivityToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getExportFilename(babyId, ExportCategory.ACTIVITY);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export medication data to CSV
   */
  @Get('medication/csv')
  @ApiOperation({
    summary: 'Export medication data to CSV',
    description: 'Export all medication entries for a baby as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with medication data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportMedicationCSV(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportMedicationToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getExportFilename(babyId, ExportCategory.MEDICATION);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export vaccination data to CSV
   */
  @Get('vaccination/csv')
  @ApiOperation({
    summary: 'Export vaccination data to CSV',
    description: 'Export all vaccination entries for a baby as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with vaccination data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportVaccinationCSV(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportVaccinationToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getExportFilename(babyId, ExportCategory.VACCINATION);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export symptom data to CSV
   */
  @Get('symptom/csv')
  @ApiOperation({
    summary: 'Export symptom data to CSV',
    description: 'Export all symptom entries for a baby as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with symptom data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportSymptomCSV(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportSymptomToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getExportFilename(babyId, ExportCategory.SYMPTOM);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export doctor visit data to CSV
   */
  @Get('doctor-visit/csv')
  @ApiOperation({
    summary: 'Export doctor visit data to CSV',
    description: 'Export all doctor visit entries for a baby as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with doctor visit data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportDoctorVisitCSV(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportDoctorVisitToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getExportFilename(babyId, ExportCategory.DOCTOR_VISIT);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export data by category (generic endpoint)
   */
  @Get('csv')
  @ApiOperation({
    summary: 'Export data by category to CSV',
    description: 'Export tracking data for a specific category as a CSV file',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with tracking data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  @ApiResponse({ status: 404, description: 'Unknown export category' })
  async exportByCategory(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportCategoryQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportCategoryToCSV(
      babyId,
      caregiverId,
      query.category,
      query,
    );
    const filename = this.exportService.getExportFilename(babyId, query.category);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export all data in a single CSV
   * GET /babies/:babyId/export/all/csv
   */
  @Get('all/csv')
  @ApiOperation({
    summary: 'Export all data to CSV',
    description: 'Export all tracking data for a baby in a single CSV file with category indicators.',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with all tracking data',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  async exportAllData(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.exportService.exportAllDataToCSV(babyId, caregiverId, query);
    const filename = this.exportService.getAllDataExportFilename(babyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Generate PDF report
   * Validates: Requirements 13.1, 13.2
   */
  @Get('report/pdf')
  @ApiOperation({
    summary: 'Generate PDF report',
    description: 'Generate a comprehensive PDF report with growth charts, feeding summaries, sleep patterns, diaper statistics, and milestone achievements for a specified date range',
  })
  @ApiParam({ name: 'babyId', description: 'Baby ID' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF report file',
    content: { 'application/pdf': {} },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to baby' })
  @ApiResponse({ status: 404, description: 'Baby not found' })
  async generatePDFReport(
    @Param('babyId') babyId: string,
    @CurrentUser('id') caregiverId: string,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.reportService.generatePDFReport(
      babyId,
      caregiverId,
      query,
    );
    const filename = this.reportService.getReportFilename(babyId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  }
}
