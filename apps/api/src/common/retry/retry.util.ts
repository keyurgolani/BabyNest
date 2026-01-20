import { Logger } from '@nestjs/common';

/**
 * Configuration options for retry with exponential backoff
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 100) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 5000) */
  maxDelay?: number;
  /** Whether to add jitter to prevent thundering herd (default: true) */
  jitter?: boolean;
  /** Custom function to determine if an error is retryable */
  isRetryable?: (error: Error) => boolean;
  /** Logger instance for logging retry attempts */
  logger?: Logger;
  /** Operation name for logging purposes */
  operationName?: string;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'logger' | 'operationName' | 'isRetryable'>> = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 5000,
  jitter: true,
};

/**
 * Prisma error codes that are considered retryable (transient failures)
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export const RETRYABLE_PRISMA_ERROR_CODES = [
  'P1001', // Can't reach database server
  'P1002', // Database server timed out
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
  'P2024', // Timed out fetching a new connection from the connection pool
  'P2034', // Transaction failed due to a write conflict or a deadlock
];

/**
 * Error messages that indicate retryable conditions
 */
export const RETRYABLE_ERROR_MESSAGES = [
  'connection',
  'timeout',
  'deadlock',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'socket hang up',
  'Connection terminated unexpectedly',
  'Connection lost',
  'Too many connections',
];

/**
 * Determines if an error is a Prisma error with a retryable error code
 */
export function isPrismaRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  // Check for Prisma error code
  const prismaError = error as { code?: string };
  if (prismaError.code && RETRYABLE_PRISMA_ERROR_CODES.includes(prismaError.code)) {
    return true;
  }

  return false;
}

/**
 * Determines if an error message indicates a retryable condition
 */
export function isRetryableErrorMessage(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const errorWithMessage = error as { message?: string };
  if (!errorWithMessage.message || typeof errorWithMessage.message !== 'string') {
    return false;
  }

  const lowerMessage = errorWithMessage.message.toLowerCase();
  return RETRYABLE_ERROR_MESSAGES.some((pattern) => lowerMessage.includes(pattern.toLowerCase()));
}

/**
 * Default function to determine if an error is retryable
 * Checks both Prisma error codes and error messages
 */
export function isRetryableError(error: unknown): boolean {
  return isPrismaRetryableError(error) || isRetryableErrorMessage(error);
}

/**
 * Calculates the delay for a retry attempt using exponential backoff with optional jitter
 *
 * @param attempt - The current attempt number (0-indexed)
 * @param baseDelay - The base delay in milliseconds
 * @param maxDelay - The maximum delay in milliseconds
 * @param jitter - Whether to add random jitter
 * @returns The delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitter: boolean,
): number {
  // Calculate exponential delay: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (random value between 0 and 50% of the delay)
  if (jitter) {
    const jitterAmount = Math.random() * cappedDelay * 0.5;
    return Math.floor(cappedDelay + jitterAmount);
  }

  return cappedDelay;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an operation with retry logic using exponential backoff
 *
 * This function will retry the operation if it fails with a retryable error,
 * using exponential backoff with optional jitter to prevent thundering herd.
 *
 * @param operation - The async operation to execute
 * @param options - Configuration options for retry behavior
 * @returns The result of the operation
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => prisma.user.create({ data: userData }),
 *   { maxRetries: 3, operationName: 'createUser' }
 * );
 * ```
 *
 * **Validates: Requirements 17.4**
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    baseDelay = DEFAULT_OPTIONS.baseDelay,
    maxDelay = DEFAULT_OPTIONS.maxDelay,
    jitter = DEFAULT_OPTIONS.jitter,
    isRetryable: customIsRetryable,
    logger,
    operationName = 'database operation',
  } = options;

  const checkRetryable = customIsRetryable ?? isRetryableError;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this is the last attempt
      if (attempt >= maxRetries) {
        logger?.error(
          `${operationName} failed after ${maxRetries + 1} attempts: ${lastError.message}`,
        );
        throw lastError;
      }

      // Check if the error is retryable
      if (!checkRetryable(lastError)) {
        logger?.debug(`${operationName} failed with non-retryable error: ${lastError.message}`);
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay, jitter);

      logger?.warn(
        `${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
          `retrying in ${delay}ms: ${lastError.message}`,
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError ?? new Error('Retry failed with unknown error');
}

/**
 * Creates a retry wrapper with pre-configured options
 *
 * @param defaultOptions - Default options to use for all retries
 * @returns A function that wraps operations with retry logic
 *
 * @example
 * ```typescript
 * const retryWithDefaults = createRetryWrapper({
 *   maxRetries: 5,
 *   logger: new Logger('DatabaseRetry'),
 * });
 *
 * const result = await retryWithDefaults(
 *   () => prisma.user.findMany(),
 *   { operationName: 'findUsers' }
 * );
 * ```
 */
export function createRetryWrapper(defaultOptions: RetryOptions) {
  return <T>(operation: () => Promise<T>, overrideOptions: RetryOptions = {}): Promise<T> => {
    return withRetry(operation, { ...defaultOptions, ...overrideOptions });
  };
}

/**
 * Decorator factory for adding retry logic to class methods
 *
 * @param options - Configuration options for retry behavior
 * @returns A method decorator
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Retry({ maxRetries: 3, operationName: 'createUser' })
 *   async createUser(data: CreateUserDto) {
 *     return this.prisma.user.create({ data });
 *   }
 * }
 * ```
 */
export function Retry(options: RetryOptions = {}) {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const operationName = options.operationName ?? String(propertyKey);
      return withRetry(() => originalMethod.apply(this, args), {
        ...options,
        operationName,
      });
    };

    return descriptor;
  };
}
