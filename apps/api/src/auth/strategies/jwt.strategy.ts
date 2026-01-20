import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Strategy for Passport
 * Validates JWT tokens and extracts user information
 * Validates: Requirements 2.2
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Validate the JWT payload and return the user
   * This method is called by Passport after token verification
   */
  async validate(payload: JwtPayload) {
    const caregiver = await this.prisma.caregiver.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!caregiver) {
      throw new UnauthorizedException('User not found');
    }

    return caregiver;
  }
}
