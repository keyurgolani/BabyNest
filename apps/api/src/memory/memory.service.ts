import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MemoryEntry } from '@prisma/client';

import {
  CreateMemoryDto,
  UpdateMemoryDto,
  MemoryResponseDto,
  MemoryListResponseDto,
  MemoryQueryDto,
  MemorySortField,
  SortOrder,
  MemoryTimelineQueryDto,
  MemoryTimelineResponseDto,
  MemoryDateGroupDto,
} from './dto';
import { BabyService } from '../baby/baby.service';
import { PrismaService } from '../prisma/prisma.service';


/**
 * Memory Service
 * Handles CRUD operations for memory/photo journal entries
 */
@Injectable()
export class MemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly babyService: BabyService,
  ) {}

  /**
   * Transform a memory entry to response DTO
   */
  private toMemoryResponse(entry: MemoryEntry): MemoryResponseDto {
    return {
      id: entry.id,
      babyId: entry.babyId,
      caregiverId: entry.caregiverId,
      title: entry.title,
      note: entry.note,
      photoUrl: entry.photoUrl,
      thumbnailUrl: entry.thumbnailUrl,
      entryType: entry.entryType,
      linkedEntryId: entry.linkedEntryId,
      linkedEntryType: entry.linkedEntryType,
      takenAt: entry.takenAt,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncedAt: entry.syncedAt,
      isDeleted: entry.isDeleted,
    };
  }

  /**
   * Create a new memory entry
   */
  async create(
    babyId: string,
    caregiverId: string,
    createMemoryDto: CreateMemoryDto,
  ): Promise<MemoryResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const takenAt = createMemoryDto.takenAt
      ? new Date(createMemoryDto.takenAt)
      : new Date();

    const entry = await this.prisma.memoryEntry.create({
      data: {
        babyId,
        caregiverId,
        title: createMemoryDto.title ?? null,
        note: createMemoryDto.note ?? null,
        photoUrl: createMemoryDto.photoUrl,
        thumbnailUrl: createMemoryDto.thumbnailUrl ?? null,
        entryType: createMemoryDto.entryType,
        linkedEntryId: createMemoryDto.linkedEntryId ?? null,
        linkedEntryType: createMemoryDto.linkedEntryType ?? null,
        takenAt,
      },
    });

    return this.toMemoryResponse(entry);
  }

  /**
   * List memory entries for a baby with filtering and pagination
   */
  async findAll(
    babyId: string,
    caregiverId: string,
    query: MemoryQueryDto,
  ): Promise<MemoryListResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    // Build where clause
    const where: {
      babyId: string;
      isDeleted?: boolean;
      takenAt?: { gte?: Date; lte?: Date };
      entryType?: string;
    } = {
      babyId,
    };

    // Filter by deleted status
    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      where.takenAt = {};
      if (query.startDate) {
        where.takenAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.takenAt.lte = new Date(query.endDate);
      }
    }

    // Filter by entry type
    if (query.entryType) {
      where.entryType = query.entryType;
    }

    // Build order by
    const orderBy: Record<string, SortOrder> = {};
    const sortField = query.sortBy || MemorySortField.TAKEN_AT;
    orderBy[sortField] = query.sortOrder || SortOrder.DESC;

    // Calculate pagination - page and pageSize are required
    const page = query.page;
    const pageSize = query.pageSize;
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [entries, total] = await Promise.all([
      this.prisma.memoryEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.memoryEntry.count({ where }),
    ]);

    return {
      data: entries.map((entry) => this.toMemoryResponse(entry)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single memory entry by ID
   */
  async findOne(
    babyId: string,
    memoryId: string,
    caregiverId: string,
  ): Promise<MemoryResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const entry = await this.prisma.memoryEntry.findUnique({
      where: { id: memoryId },
    });

    if (!entry) {
      throw new NotFoundException('Memory entry not found');
    }

    // Verify the entry belongs to the specified baby
    if (entry.babyId !== babyId) {
      throw new NotFoundException('Memory entry not found');
    }

    return this.toMemoryResponse(entry);
  }

  /**
   * Update a memory entry
   */
  async update(
    babyId: string,
    memoryId: string,
    caregiverId: string,
    updateMemoryDto: UpdateMemoryDto,
  ): Promise<MemoryResponseDto> {
    // First verify access and that entry exists
    await this.findOne(babyId, memoryId, caregiverId);

    // Build update data
    const updateData: {
      title?: string | null;
      note?: string | null;
      photoUrl?: string;
      thumbnailUrl?: string | null;
      entryType?: string;
      linkedEntryId?: string | null;
      linkedEntryType?: string | null;
      takenAt?: Date;
    } = {};

    if (updateMemoryDto.title !== undefined) {
      updateData.title = updateMemoryDto.title;
    }
    if (updateMemoryDto.note !== undefined) {
      updateData.note = updateMemoryDto.note;
    }
    if (updateMemoryDto.photoUrl !== undefined) {
      updateData.photoUrl = updateMemoryDto.photoUrl;
    }
    if (updateMemoryDto.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = updateMemoryDto.thumbnailUrl;
    }
    if (updateMemoryDto.entryType !== undefined) {
      updateData.entryType = updateMemoryDto.entryType;
    }
    if (updateMemoryDto.linkedEntryId !== undefined) {
      updateData.linkedEntryId = updateMemoryDto.linkedEntryId;
    }
    if (updateMemoryDto.linkedEntryType !== undefined) {
      updateData.linkedEntryType = updateMemoryDto.linkedEntryType;
    }
    if (updateMemoryDto.takenAt !== undefined) {
      updateData.takenAt = new Date(updateMemoryDto.takenAt);
    }

    const entry = await this.prisma.memoryEntry.update({
      where: { id: memoryId },
      data: updateData,
    });

    return this.toMemoryResponse(entry);
  }

  /**
   * Soft delete a memory entry
   */
  async remove(
    babyId: string,
    memoryId: string,
    caregiverId: string,
  ): Promise<void> {
    // First verify access and that entry exists
    await this.findOne(babyId, memoryId, caregiverId);

    // Soft delete by setting isDeleted flag
    await this.prisma.memoryEntry.update({
      where: { id: memoryId },
      data: { isDeleted: true },
    });
  }

  /**
   * Get memories grouped by date for timeline view
   */
  async getTimeline(
    babyId: string,
    caregiverId: string,
    query: MemoryTimelineQueryDto,
  ): Promise<MemoryTimelineResponseDto> {
    // Verify caregiver has access to baby
    const hasAccess = await this.babyService.hasAccess(babyId, caregiverId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    const limit = query.limit || 10;

    // Build where clause
    const where: {
      babyId: string;
      isDeleted: boolean;
      takenAt?: { gte?: Date; lte?: Date; lt?: Date };
      entryType?: string;
    } = {
      babyId,
      isDeleted: false,
    };

    // Apply cursor for pagination
    if (query.cursor) {
      where.takenAt = {
        ...where.takenAt,
        lt: new Date(query.cursor + 'T23:59:59.999Z'),
      };
    }

    // Filter by date range
    if (query.startDate) {
      where.takenAt = {
        ...where.takenAt,
        gte: new Date(query.startDate + 'T00:00:00.000Z'),
      };
    }
    if (query.endDate) {
      where.takenAt = {
        ...where.takenAt,
        lte: new Date(query.endDate + 'T23:59:59.999Z'),
      };
    }

    // Filter by entry type
    if (query.entryType) {
      where.entryType = query.entryType;
    }

    // Get all memories matching criteria, ordered by takenAt desc
    const memories = await this.prisma.memoryEntry.findMany({
      where,
      orderBy: { takenAt: 'desc' },
    });

    // Get total count
    const totalMemories = await this.prisma.memoryEntry.count({
      where: {
        babyId,
        isDeleted: false,
        entryType: query.entryType,
      },
    });

    // Group memories by date
    const groupsMap = new Map<string, MemoryResponseDto[]>();
    
    for (const memory of memories) {
      const dateKey = memory.takenAt.toISOString().split('T')[0] as string;
      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, []);
      }
      groupsMap.get(dateKey)!.push(this.toMemoryResponse(memory));
    }

    // Convert to array and limit groups
    const allGroups: MemoryDateGroupDto[] = [];
    for (const [date, dateMemories] of groupsMap) {
      allGroups.push({
        date,
        count: dateMemories.length,
        memories: dateMemories,
      });
    }

    // Take only the requested number of groups
    const groups = allGroups.slice(0, limit);
    const hasMore = allGroups.length > limit;
    const nextCursor = hasMore ? (groups[groups.length - 1]?.date ?? null) : null;

    return {
      babyId,
      totalMemories,
      groups,
      hasMore,
      nextCursor,
    };
  }
}
