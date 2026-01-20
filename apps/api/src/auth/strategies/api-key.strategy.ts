import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { PrismaService } from '../../prisma/prisma.service';

interface CaregiverPayload {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Key Strategy for Passport
 * Validates API keys from the X-API-Key header for programmatic access
 * Validates: Requirements 12.2
 */
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Validate the API key from the request header
   * This method is called by Passport to authenticate the request
   */
  async validate(request: Request): Promise<CaregiverPayload> {
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Find the API key in the database
    const apiKeyRecord = await this.prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        caregiver: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if the API key has expired
    if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update the last used timestamp (fire and forget - don't await)
    this.prisma.apiKey
      .update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {
        // Silently ignore errors updating last used timestamp
      });

    // Return the caregiver associated with the API key
    return apiKeyRecord.caregiver;
  }
}
