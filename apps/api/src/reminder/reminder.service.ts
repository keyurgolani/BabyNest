import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reminder, Prisma } from '@prisma/client';

import {
  CreateReminderDto,
  UpdateReminderDto,
  ReminderResponseDto,
  ReminderListResponseDto,
  ReminderQueryDto,
  NextReminderResponseDto,
  ReminderType,
  ReminderSortField,
  SortOrder,
} from './dto';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';


/**
 * Reminder Service
 * Handles CRUD operations for reminders
 */
@Injectable()
export class ReminderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
  ) {}

  /**
   * Transform a reminder to response DTO
   */
  private toReminderResponse(reminder: Reminder): ReminderResponseDto {
    return {
      id: reminder.id,
      babyId: reminder.babyId,
      caregiverId: reminder.caregiverId,
      type: reminder.type as ReminderType,
      title: reminder.name,
      intervalMinutes: reminder.intervalMinutes,
      scheduledTimes: reminder.scheduledTimes as string[] | null,
      basedOnLastEntry: reminder.basedOnLastEntry,
      isActive: reminder.isEnabled,
      notifyAllCaregivers: reminder.notifyAllCaregivers,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      isDeleted: reminder.isDeleted,
    };
  }

  /**
   * Validate reminder configuration
   * A reminder must have either intervalMinutes or scheduledTimes
   */
  private validateReminderConfig(dto: CreateReminderDto | UpdateReminderDto): void {
    const hasInterval = dto.intervalMinutes !== undefined && dto.intervalMinutes !== null;
    const hasSchedule = dto.scheduledTimes !== undefined && dto.scheduledTimes !== null && dto.scheduledTimes.length > 0;

    // For create, we need at least one
    if (!hasInterval && !hasSchedule) {
      throw new BadRequestException(
        'Reminder must have either intervalMinutes or scheduledTimes configured',
      );
    }

    // Can't have both
    if (hasInterval && hasSchedule) {
      throw new BadRequestException(
        'Reminder cannot have both intervalMinutes and scheduledTimes. Choose one.',
      );
    }

    // basedOnLastEntry only makes sense with intervalMinutes
    if (dto.basedOnLastEntry && hasSchedule) {
      throw new BadRequestException(
        'basedOnLastEntry can only be used with intervalMinutes, not scheduledTimes',
      );
    }
  }

  /**
   * Create a new reminder
   */
  async create(
    babyId: string,
    caregiverId: string,
    createReminderDto: CreateReminderDto,
  ): Promise<ReminderResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Validate reminder configuration
    this.validateReminderConfig(createReminderDto);

    const reminder = await this.prisma.reminder.create({
      data: {
        babyId,
        caregiverId,
        type: createReminderDto.type,
        name: createReminderDto.title,
        intervalMinutes: createReminderDto.intervalMinutes ?? null,
        scheduledTimes: createReminderDto.scheduledTimes ?? undefined,
        basedOnLastEntry: createReminderDto.basedOnLastEntry ?? false,
        isEnabled: createReminderDto.isActive ?? true,
        notifyAllCaregivers: createReminderDto.notifyAllCaregivers ?? false,
      },
    });

    return this.toReminderResponse(reminder);
  }

  /**
   * List reminders for a baby with filtering and pagination
   */
  async findAll(
    babyId: string,
    caregiverId: string,
    query: ReminderQueryDto,
  ): Promise<ReminderListResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Build where clause
    const where: {
      babyId: string;
      isDeleted?: boolean;
      type?: string;
      isEnabled?: boolean;
    } = {
      babyId,
    };

    // Filter by deleted status
    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    // Filter by type
    if (query.type) {
      where.type = query.type;
    }

    // Filter by enabled status
    if (query.isEnabled !== undefined) {
      where.isEnabled = query.isEnabled;
    }

    // Build order by
    const orderBy: Record<string, SortOrder> = {};
    const sortField = query.sortBy || ReminderSortField.CREATED_AT;
    orderBy[sortField] = query.sortOrder || SortOrder.DESC;

    // Calculate pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [reminders, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return {
      data: reminders.map((reminder) => this.toReminderResponse(reminder)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single reminder by ID
   */
  async findOne(
    babyId: string,
    reminderId: string,
    caregiverId: string,
  ): Promise<ReminderResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const reminder = await this.prisma.reminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    // Verify the reminder belongs to the specified baby
    if (reminder.babyId !== babyId) {
      throw new NotFoundException('Reminder not found');
    }

    return this.toReminderResponse(reminder);
  }

  /**
   * Update a reminder
   */
  async update(
    babyId: string,
    reminderId: string,
    caregiverId: string,
    updateReminderDto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    // First verify access and that reminder exists
    const existingReminder = await this.findOne(babyId, reminderId, caregiverId);

    // Build effective config for validation
    const effectiveConfig = {
      intervalMinutes: updateReminderDto.intervalMinutes ?? existingReminder.intervalMinutes,
      scheduledTimes: updateReminderDto.scheduledTimes ?? existingReminder.scheduledTimes,
      basedOnLastEntry: updateReminderDto.basedOnLastEntry ?? existingReminder.basedOnLastEntry,
    };

    // Validate if any config fields are being updated
    if (
      updateReminderDto.intervalMinutes !== undefined ||
      updateReminderDto.scheduledTimes !== undefined ||
      updateReminderDto.basedOnLastEntry !== undefined
    ) {
      this.validateReminderConfig(effectiveConfig as CreateReminderDto);
    }

    // Build update data
    const updateData: Prisma.ReminderUpdateInput = {};

    if (updateReminderDto.type !== undefined) {
      updateData.type = updateReminderDto.type;
    }
    if (updateReminderDto.title !== undefined) {
      updateData.name = updateReminderDto.title;
    }
    if (updateReminderDto.intervalMinutes !== undefined) {
      updateData.intervalMinutes = updateReminderDto.intervalMinutes;
      // Clear scheduledTimes if setting interval
      updateData.scheduledTimes = Prisma.JsonNull;
    }
    if (updateReminderDto.scheduledTimes !== undefined) {
      updateData.scheduledTimes = updateReminderDto.scheduledTimes;
      // Clear intervalMinutes if setting schedule
      updateData.intervalMinutes = null;
      updateData.basedOnLastEntry = false;
    }
    if (updateReminderDto.basedOnLastEntry !== undefined) {
      updateData.basedOnLastEntry = updateReminderDto.basedOnLastEntry;
    }
    if (updateReminderDto.isActive !== undefined) {
      updateData.isEnabled = updateReminderDto.isActive;
    }
    if (updateReminderDto.notifyAllCaregivers !== undefined) {
      updateData.notifyAllCaregivers = updateReminderDto.notifyAllCaregivers;
    }

    const reminder = await this.prisma.reminder.update({
      where: { id: reminderId },
      data: updateData as Prisma.ReminderUpdateInput,
    });

    return this.toReminderResponse(reminder);
  }

  /**
   * Soft delete a reminder
   */
  async remove(
    babyId: string,
    reminderId: string,
    caregiverId: string,
  ): Promise<void> {
    // First verify access and that reminder exists
    await this.findOne(babyId, reminderId, caregiverId);

    // Soft delete by setting isDeleted flag
    await this.prisma.reminder.update({
      where: { id: reminderId },
      data: { isDeleted: true },
    });
  }

  /**
   * Get the next upcoming reminder for a baby
   * Calculates when each enabled reminder will next trigger
   */
  async getNextReminder(
    babyId: string,
    caregiverId: string,
  ): Promise<NextReminderResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Get all enabled reminders for this baby
    const reminders = await this.prisma.reminder.findMany({
      where: {
        babyId,
        isEnabled: true,
        isDeleted: false,
      },
    });

    if (reminders.length === 0) {
      return {
        reminder: null,
        nextTriggerTime: null,
        minutesUntilTrigger: null,
        timeUntilTrigger: null,
      };
    }

    const now = new Date();
    let nextReminder: Reminder | null = null;
    let nextTriggerTime: Date | null = null;

    for (const reminder of reminders) {
      const triggerTime = await this.calculateNextTriggerTime(reminder, now);
      
      if (triggerTime && (!nextTriggerTime || triggerTime < nextTriggerTime)) {
        nextTriggerTime = triggerTime;
        nextReminder = reminder;
      }
    }

    if (!nextReminder || !nextTriggerTime) {
      return {
        reminder: null,
        nextTriggerTime: null,
        minutesUntilTrigger: null,
        timeUntilTrigger: null,
      };
    }

    const minutesUntilTrigger = Math.max(
      0,
      Math.round((nextTriggerTime.getTime() - now.getTime()) / (1000 * 60)),
    );

    return {
      reminder: this.toReminderResponse(nextReminder),
      nextTriggerTime,
      minutesUntilTrigger,
      timeUntilTrigger: this.formatTimeUntil(minutesUntilTrigger),
    };
  }

  /**
   * Calculate the next trigger time for a reminder
   */
  private async calculateNextTriggerTime(
    reminder: Reminder,
    now: Date,
  ): Promise<Date | null> {
    if (reminder.intervalMinutes) {
      // Interval-based reminder
      if (reminder.basedOnLastEntry) {
        // Get the last entry of this type
        const lastEntry = await this.getLastEntryForType(
          reminder.babyId,
          reminder.type as ReminderType,
        );
        
        if (lastEntry) {
          const triggerTime = new Date(
            lastEntry.getTime() + reminder.intervalMinutes * 60 * 1000,
          );
          // If trigger time is in the past, calculate next occurrence
          if (triggerTime <= now) {
            const elapsed = now.getTime() - lastEntry.getTime();
            const intervals = Math.ceil(elapsed / (reminder.intervalMinutes * 60 * 1000));
            return new Date(
              lastEntry.getTime() + intervals * reminder.intervalMinutes * 60 * 1000,
            );
          }
          return triggerTime;
        }
        // No last entry, trigger immediately
        return now;
      } else {
        // Fixed interval from now (or from reminder creation)
        // For simplicity, calculate next interval from now
        return new Date(now.getTime() + reminder.intervalMinutes * 60 * 1000);
      }
    } else if (reminder.scheduledTimes && Array.isArray(reminder.scheduledTimes)) {
      // Fixed schedule reminder
      const times = reminder.scheduledTimes as string[];
      const todayStr = now.toISOString().split('T')[0];
      
      // Find the next scheduled time
      for (const timeStr of times.sort()) {
        const timeParts = timeStr.split(':').map(Number);
        const hours = timeParts[0] ?? 0;
        const minutes = timeParts[1] ?? 0;
        const scheduledTime = new Date(todayStr + 'T00:00:00.000Z');
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        if (scheduledTime > now) {
          return scheduledTime;
        }
      }
      
      // All times today have passed, get first time tomorrow
      if (times.length > 0) {
        const firstTime = times.sort()[0];
        if (firstTime) {
          const timeParts = firstTime.split(':').map(Number);
          const hours = timeParts[0] ?? 0;
          const minutes = timeParts[1] ?? 0;
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(hours, minutes, 0, 0);
          return tomorrow;
        }
      }
    }

    return null;
  }

  /**
   * Get the last entry timestamp for a given type
   */
  private async getLastEntryForType(
    babyId: string,
    type: ReminderType,
  ): Promise<Date | null> {
    let lastEntry: { timestamp: Date } | null = null;

    switch (type) {
      case ReminderType.FEED:
        lastEntry = await this.prisma.feedingEntry.findFirst({
          where: { babyId, isDeleted: false },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true },
        });
        break;
      case ReminderType.SLEEP:
        lastEntry = await this.prisma.sleepEntry.findFirst({
          where: { babyId, isDeleted: false },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true },
        });
        break;
      case ReminderType.DIAPER:
        lastEntry = await this.prisma.diaperEntry.findFirst({
          where: { babyId, isDeleted: false },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true },
        });
        break;
      case ReminderType.MEDICINE:
        lastEntry = await this.prisma.medicationEntry.findFirst({
          where: { babyId, isDeleted: false },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true },
        });
        break;
      default:
        // Custom type - no automatic tracking
        return null;
    }

    return lastEntry?.timestamp ?? null;
  }

  /**
   * Format minutes into human-readable string
   */
  private formatTimeUntil(minutes: number): string {
    if (minutes < 1) {
      return 'now';
    }
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
  }
}
