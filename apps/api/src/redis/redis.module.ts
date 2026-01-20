import { Module, Global } from '@nestjs/common';

import { RedisService } from './redis.service';

/**
 * Redis Module
 * Provides Redis client for caching and rate limiting
 * Global module so it can be used across the application
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
