import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis Service
 * Provides Redis client for caching and rate limiting
 * Used for account lockout tracking (Requirement 2.6)
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      const host = this.configService.get<string>('redis.host') || 'localhost';
      const port = this.configService.get<number>('redis.port') || 6379;
      const password = this.configService.get<string>('redis.password');

      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed after 3 retries, operating without Redis');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to Redis');
      });

      this.client.on('error', (error: Error) => {
        this.isConnected = false;
        this.logger.warn(`Redis error: ${error.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });

      // Try to connect
      await this.client.connect().catch(() => {
        this.logger.warn('Redis not available, account lockout will be disabled');
      });
    } catch (error) {
      this.logger.warn('Failed to initialize Redis, account lockout will be disabled');
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => {
        // Ignore errors during shutdown
      });
    }
  }

  /**
   * Check if Redis is connected and available
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get the Redis client
   * Returns null if not connected
   */
  getClient(): Redis | null {
    return this.isConnected ? this.client : null;
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }
    try {
      return await this.client!.get(key);
    } catch (error) {
      this.logger.warn(`Redis GET error for key ${key}: ${error}`);
      return null;
    }
  }

  /**
   * Set a value in Redis with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    try {
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      this.logger.warn(`Redis SET error for key ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Increment a value in Redis
   */
  async incr(key: string): Promise<number | null> {
    if (!this.isAvailable()) {
      return null;
    }
    try {
      return await this.client!.incr(key);
    } catch (error) {
      this.logger.warn(`Redis INCR error for key ${key}: ${error}`);
      return null;
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    try {
      await this.client!.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      this.logger.warn(`Redis EXPIRE error for key ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      this.logger.warn(`Redis DEL error for key ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Get TTL of a key in seconds
   */
  async ttl(key: string): Promise<number | null> {
    if (!this.isAvailable()) {
      return null;
    }
    try {
      return await this.client!.ttl(key);
    } catch (error) {
      this.logger.warn(`Redis TTL error for key ${key}: ${error}`);
      return null;
    }
  }
}
