import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * API Key Authentication Guard
 * Protects routes requiring API key authentication for programmatic access
 * Validates: Requirements 12.2
 */
@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') {
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
}
