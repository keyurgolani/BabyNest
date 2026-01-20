import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../redis/redis.service';

/**
 * Account Lockout Service
 * Tracks failed login attempts and implements temporary account lockout
 * Validates: Requirements 2.6
 */
@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);

  // Configuration constants
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes
  private readonly FAILED_ATTEMPTS_TTL_SECONDS = 15 * 60; // 15 minutes window for counting attempts

  // Redis key prefixes
  private readonly FAILED_ATTEMPTS_PREFIX = 'auth:failed_attempts:';
  private readonly LOCKOUT_PREFIX = 'auth:lockout:';

  constructor(
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get the Redis key for tracking failed attempts
   */
  private getFailedAttemptsKey(email: string): string {
    return `${this.FAILED_ATTEMPTS_PREFIX}${email.toLowerCase()}`;
  }

  /**
   * Get the Redis key for account lockout
   */
  private getLockoutKey(email: string): string {
    return `${this.LOCKOUT_PREFIX}${email.toLowerCase()}`;
  }

  /**
   * Check if an account is currently locked
   * Returns lockout info if locked, null if not locked
   */
  async isAccountLocked(email: string): Promise<{ locked: boolean; remainingSeconds: number | null }> {
    // If Redis is not available, don't enforce lockout
    if (!this.redisService.isAvailable()) {
      return { locked: false, remainingSeconds: null };
    }

    const lockoutKey = this.getLockoutKey(email);
    const lockoutValue = await this.redisService.get(lockoutKey);

    if (lockoutValue) {
      const remainingSeconds = await this.redisService.ttl(lockoutKey);
      return {
        locked: true,
        remainingSeconds: remainingSeconds && remainingSeconds > 0 ? remainingSeconds : null,
      };
    }

    return { locked: false, remainingSeconds: null };
  }

  /**
   * Record a failed login attempt
   * Returns true if the account is now locked, false otherwise
   */
  async recordFailedAttempt(email: string): Promise<{
    isLocked: boolean;
    attemptCount: number;
    remainingAttempts: number;
    lockoutDurationSeconds: number | null;
  }> {
    // If Redis is not available, don't track attempts
    if (!this.redisService.isAvailable()) {
      this.logger.warn('Redis not available, skipping failed attempt tracking');
      return {
        isLocked: false,
        attemptCount: 0,
        remainingAttempts: this.MAX_FAILED_ATTEMPTS,
        lockoutDurationSeconds: null,
      };
    }

    const failedAttemptsKey = this.getFailedAttemptsKey(email);

    // Increment the failed attempts counter
    const attemptCount = await this.redisService.incr(failedAttemptsKey);

    if (attemptCount === null) {
      return {
        isLocked: false,
        attemptCount: 0,
        remainingAttempts: this.MAX_FAILED_ATTEMPTS,
        lockoutDurationSeconds: null,
      };
    }

    // Set TTL on first attempt
    if (attemptCount === 1) {
      await this.redisService.expire(failedAttemptsKey, this.FAILED_ATTEMPTS_TTL_SECONDS);
    }

    const remainingAttempts = Math.max(0, this.MAX_FAILED_ATTEMPTS - attemptCount);

    // Check if we should lock the account
    if (attemptCount >= this.MAX_FAILED_ATTEMPTS) {
      await this.lockAccount(email);
      this.logger.warn(`Account locked for email: ${email} after ${attemptCount} failed attempts`);

      return {
        isLocked: true,
        attemptCount,
        remainingAttempts: 0,
        lockoutDurationSeconds: this.LOCKOUT_DURATION_SECONDS,
      };
    }

    return {
      isLocked: false,
      attemptCount,
      remainingAttempts,
      lockoutDurationSeconds: null,
    };
  }

  /**
   * Lock an account for the configured duration
   */
  private async lockAccount(email: string): Promise<void> {
    const lockoutKey = this.getLockoutKey(email);
    const lockoutTime = new Date().toISOString();

    await this.redisService.set(lockoutKey, lockoutTime, this.LOCKOUT_DURATION_SECONDS);

    // Clear the failed attempts counter since we're now locked
    const failedAttemptsKey = this.getFailedAttemptsKey(email);
    await this.redisService.del(failedAttemptsKey);
  }

  /**
   * Reset failed attempts counter on successful login
   */
  async resetFailedAttempts(email: string): Promise<void> {
    if (!this.redisService.isAvailable()) {
      return;
    }

    const failedAttemptsKey = this.getFailedAttemptsKey(email);
    await this.redisService.del(failedAttemptsKey);
  }

  /**
   * Manually unlock an account (for admin purposes)
   */
  async unlockAccount(email: string): Promise<void> {
    if (!this.redisService.isAvailable()) {
      return;
    }

    const lockoutKey = this.getLockoutKey(email);
    const failedAttemptsKey = this.getFailedAttemptsKey(email);

    await Promise.all([
      this.redisService.del(lockoutKey),
      this.redisService.del(failedAttemptsKey),
    ]);

    this.logger.log(`Account unlocked for email: ${email}`);
  }

  /**
   * Get the current failed attempt count for an email
   */
  async getFailedAttemptCount(email: string): Promise<number> {
    if (!this.redisService.isAvailable()) {
      return 0;
    }

    const failedAttemptsKey = this.getFailedAttemptsKey(email);
    const count = await this.redisService.get(failedAttemptsKey);

    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Get lockout configuration (for testing/debugging)
   */
  getConfig(): {
    maxFailedAttempts: number;
    lockoutDurationSeconds: number;
    failedAttemptsTtlSeconds: number;
  } {
    return {
      maxFailedAttempts: this.MAX_FAILED_ATTEMPTS,
      lockoutDurationSeconds: this.LOCKOUT_DURATION_SECONDS,
      failedAttemptsTtlSeconds: this.FAILED_ATTEMPTS_TTL_SECONDS,
    };
  }
}
