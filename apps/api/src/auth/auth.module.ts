import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AccountLockoutService } from './account-lockout.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

/**
 * Parse expiration string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) {
    return 900; // Default 15 minutes
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
}

/**
 * Authentication Module
 * Provides JWT-based authentication for the BabyNest API
 * Validates: Requirements 2.1, 2.2, 2.6
 */
@Module({
  imports: [
    PrismaModule,
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: parseExpiresIn(configService.get<string>('jwt.expiresIn') || '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ApiKeyStrategy, AccountLockoutService],
  exports: [AuthService, JwtStrategy, ApiKeyStrategy, AccountLockoutService, PassportModule],
})
export class AuthModule {}
