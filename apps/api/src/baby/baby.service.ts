import { calculateAge as calculateAgeUtil } from '@babynest/types';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import {
  CreateBabyDto,
  UpdateBabyDto,
  BabyResponseDto,
  BabyListResponseDto,
  AgeDto,
  BabyCaregiverDto,
  CaregiverRole,
} from './dto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Baby Profile Service
 * Handles CRUD operations for baby profiles
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */
@Injectable()
export class BabyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate age in months and days from date of birth
   * Validates: Requirements 1.2
   *
   * This method delegates to the shared utility function from @babynest/types
   * for consistent age calculation across the application.
   */
  calculateAge(dateOfBirth: Date): AgeDto {
    return calculateAgeUtil(dateOfBirth);
  }

  /**
   * Transform a baby entity to response DTO
   */
  private toBabyResponse(
    baby: {
      id: string;
      name: string;
      dateOfBirth: Date;
      gender: string;
      photoUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
      caregivers?: {
        role: string;
        caregiver: {
          id: string;
          name: string;
          email: string;
        };
      }[];
    },
    includeCaregivers = false,
  ): BabyResponseDto {
    const response: BabyResponseDto = {
      id: baby.id,
      name: baby.name,
      dateOfBirth: baby.dateOfBirth,
      gender: baby.gender,
      photoUrl: baby.photoUrl,
      age: this.calculateAge(baby.dateOfBirth),
      createdAt: baby.createdAt,
      updatedAt: baby.updatedAt,
    };

    if (includeCaregivers && baby.caregivers) {
      response.caregivers = baby.caregivers.map(
        (bc): BabyCaregiverDto => ({
          caregiverId: bc.caregiver.id,
          name: bc.caregiver.name,
          email: bc.caregiver.email,
          role: bc.role as CaregiverRole,
        }),
      );
    }

    return response;
  }

  /**
   * Parse date string as local date (avoiding timezone conversion)
   * Input format: YYYY-MM-DD
   * Returns a Date object at midnight local time
   */
  private parseLocalDate(dateString: string): Date {
    const parts = dateString.split('-');
    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10);
    const day = parseInt(parts[2]!, 10);
    return new Date(year, month - 1, day);
  }

  /**
   * Create a new baby profile
   * Validates: Requirements 1.1
   */
  async create(
    caregiverId: string,
    createBabyDto: CreateBabyDto,
  ): Promise<BabyResponseDto> {
    // Create baby and associate with caregiver as primary
    const baby = await this.prisma.baby.create({
      data: {
        name: createBabyDto.name,
        dateOfBirth: this.parseLocalDate(createBabyDto.dateOfBirth),
        gender: createBabyDto.gender,
        photoUrl: createBabyDto.photoUrl || null,
        caregivers: {
          create: {
            caregiverId,
            role: 'primary',
            acceptedAt: new Date(),
          },
        },
      },
      include: {
        caregivers: {
          include: {
            caregiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return this.toBabyResponse(baby, true);
  }

  /**
   * List all babies for a caregiver
   * Validates: Requirements 1.1
   */
  async findAll(caregiverId: string): Promise<BabyListResponseDto> {
    const babies = await this.prisma.baby.findMany({
      where: {
        caregivers: {
          some: {
            caregiverId,
            acceptedAt: { not: null },
          },
        },
      },
      include: {
        caregivers: {
          include: {
            caregiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: babies.map((baby) => this.toBabyResponse(baby, true)),
      total: babies.length,
    };
  }

  /**
   * Get a single baby by ID
   * Validates: Requirements 1.1, 1.2
   */
  async findOne(babyId: string, caregiverId: string): Promise<BabyResponseDto> {
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      include: {
        caregivers: {
          include: {
            caregiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    // Check if caregiver has access
    const hasAccess = baby.caregivers.some(
      (bc) => bc.caregiverId === caregiverId && bc.acceptedAt !== null,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this baby profile');
    }

    return this.toBabyResponse(baby, true);
  }

  /**
   * Update a baby profile
   * Validates: Requirements 1.3
   */
  async update(
    babyId: string,
    caregiverId: string,
    updateBabyDto: UpdateBabyDto,
  ): Promise<BabyResponseDto> {
    // First check if baby exists and caregiver has access
    await this.findOne(babyId, caregiverId);

    // Build update data
    const updateData: {
      name?: string;
      dateOfBirth?: Date;
      gender?: string;
      photoUrl?: string | null;
    } = {};

    if (updateBabyDto.name !== undefined) {
      updateData.name = updateBabyDto.name;
    }
    if (updateBabyDto.dateOfBirth !== undefined) {
      updateData.dateOfBirth = this.parseLocalDate(updateBabyDto.dateOfBirth);
    }
    if (updateBabyDto.gender !== undefined) {
      updateData.gender = updateBabyDto.gender;
    }
    if (updateBabyDto.photoUrl !== undefined) {
      updateData.photoUrl = updateBabyDto.photoUrl;
    }

    const baby = await this.prisma.baby.update({
      where: { id: babyId },
      data: updateData,
      include: {
        caregivers: {
          include: {
            caregiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return this.toBabyResponse(baby, true);
  }

  /**
   * Delete a baby profile and all associated tracking data
   * Validates: Requirements 1.4
   * Note: Cascade delete is configured in Prisma schema
   */
  async remove(babyId: string, caregiverId: string): Promise<void> {
    // First check if baby exists and caregiver has access
    const baby = await this.prisma.baby.findUnique({
      where: { id: babyId },
      include: {
        caregivers: true,
      },
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    // Check if caregiver has access
    const caregiverRelation = baby.caregivers.find(
      (bc) => bc.caregiverId === caregiverId && bc.acceptedAt !== null,
    );

    if (!caregiverRelation) {
      throw new ForbiddenException('You do not have access to this baby profile');
    }

    // Only primary caregivers can delete baby profiles
    if (caregiverRelation.role !== 'primary') {
      throw new ForbiddenException('Only primary caregivers can delete baby profiles');
    }

    // Delete the baby (cascade will delete all associated data)
    await this.prisma.baby.delete({
      where: { id: babyId },
    });
  }

  /**
   * Check if a caregiver has access to a baby
   */
  async hasAccess(babyId: string, caregiverId: string): Promise<boolean> {
    const relation = await this.prisma.babyCaregiver.findUnique({
      where: {
        babyId_caregiverId: {
          babyId,
          caregiverId,
        },
      },
    });


    return relation !== null && relation.acceptedAt !== null;
  }

  /**
   * Remove a caregiver from a baby's profile
   * Validates: Requirements 2.3
   */
  async removeCaregiver(
    babyId: string,
    primaryCaregiverId: string,
    caregiverToRemoveId: string,
  ): Promise<void> {
    // Determine access rights
    const access = await this.prisma.babyCaregiver.findUnique({
      where: {
        babyId_caregiverId: {
          babyId,
          caregiverId: primaryCaregiverId,
        },
      },
    });

    if (!access || access.role !== 'primary' || !access.acceptedAt) {
      throw new ForbiddenException('Only primary caregivers can manage caregivers');
    }

    if (primaryCaregiverId === caregiverToRemoveId) {
      // Check if there are other primary caregivers
      const otherPrimaries = await this.prisma.babyCaregiver.findMany({
        where: {
          babyId,
          role: 'primary',
          caregiverId: { not: primaryCaregiverId },
          acceptedAt: { not: null },
        },
      });

      if (otherPrimaries.length === 0) {
        throw new ForbiddenException('You are the only primary caregiver. You cannot remove yourself unless you delete the baby profile or assign another primary caregiver first.');
      }
    }

    // Check if the target caregiver exists on this baby
    const targetLink = await this.prisma.babyCaregiver.findUnique({
      where: {
        babyId_caregiverId: {
          babyId,
          caregiverId: caregiverToRemoveId,
        },
      },
    });

    if (!targetLink) {
      throw new NotFoundException('Caregiver not associated with this baby');
    }

    await this.prisma.babyCaregiver.delete({
      where: {
        babyId_caregiverId: {
          babyId,
          caregiverId: caregiverToRemoveId,
        },
      },
    });
  }

  /**
   * List all caregivers for a baby
   */
  async listCaregivers(
    babyId: string,
    caregiverId: string,
  ): Promise<{ data: BabyCaregiverDto[]; total: number }> {
    // Verify access
    await this.findOne(babyId, caregiverId);

    const caregivers = await this.prisma.babyCaregiver.findMany({
      where: {
        babyId,
        acceptedAt: { not: null },
      },
      include: {
        caregiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // primary first
        { acceptedAt: 'asc' },
      ],
    });

    const data: BabyCaregiverDto[] = caregivers.map((bc) => ({
      caregiverId: bc.caregiver.id,
      name: bc.caregiver.name,
      email: bc.caregiver.email,
      role: bc.role as CaregiverRole,
    }));

    return {
      data,
      total: data.length,
    };
  }

  /**
   * Update a caregiver's role
   */
  async updateCaregiverRole(
    babyId: string,
    primaryCaregiverId: string,
    targetCaregiverId: string,
    newRole: CaregiverRole,
  ): Promise<BabyCaregiverDto> {
    // Verify primary caregiver access
    const access = await this.prisma.babyCaregiver.findUnique({
      where: {
        babyId_caregiverId: {
          babyId,
          caregiverId: primaryCaregiverId,
        },
      },
    });

    if (!access || access.role !== 'primary' || !access.acceptedAt) {
      throw new ForbiddenException('Only primary caregivers can update caregiver roles');
    }

    // Check if target caregiver exists
    const targetLink = await this.prisma.babyCaregiver.findUnique({
      where: {
        babyId_caregiverId: {
          babyId,
          caregiverId: targetCaregiverId,
        },
      },
      include: {
        caregiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!targetLink || !targetLink.acceptedAt) {
      throw new NotFoundException('Caregiver not found or has not accepted invitation');
    }

    // If demoting the last primary caregiver, prevent it
    if (targetLink.role === 'primary' && newRole === CaregiverRole.SECONDARY) {
      const otherPrimaries = await this.prisma.babyCaregiver.findMany({
        where: {
          babyId,
          role: 'primary',
          caregiverId: { not: targetCaregiverId },
          acceptedAt: { not: null },
        },
      });

      if (otherPrimaries.length === 0) {
        throw new ForbiddenException('Cannot demote the only primary caregiver. Promote another caregiver to primary first.');
      }
    }

    // Update the role
    const updated = await this.prisma.babyCaregiver.update({
      where: {
        babyId_caregiverId: {
          babyId,
          caregiverId: targetCaregiverId,
        },
      },
      data: {
        role: newRole,
      },
      include: {
        caregiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      caregiverId: updated.caregiver.id,
      name: updated.caregiver.name,
      email: updated.caregiver.email,
      role: updated.role as CaregiverRole,
    };
  }
}
