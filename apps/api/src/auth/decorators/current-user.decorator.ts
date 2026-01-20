import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current authenticated user from the request
 * Usage: 
 * - @CurrentUser() user: CaregiverResponseDto - returns the entire user object
 * - @CurrentUser('id') userId: string - returns just the user ID
 * - @CurrentUser('email') email: string - returns just the user email
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // If a property name is provided, return that property
    if (data && user) {
      return user[data];
    }
    
    // Otherwise return the entire user object
    return user;
  },
);
