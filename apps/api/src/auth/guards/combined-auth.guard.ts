import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Combined Authentication Guard
 * Accepts either JWT Bearer token OR API key for authentication
 * This allows both interactive (JWT) and programmatic (API key) access
 * Validates: Requirements 12.1, 12.2
 */
@Injectable()
export class CombinedAuthGuard extends AuthGuard(['jwt', 'api-key']) {
  constructor(private reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    // If there's an error or no user, throw unauthorized
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required. Provide a valid JWT token or API key.');
    }
    return user;
  }
}
