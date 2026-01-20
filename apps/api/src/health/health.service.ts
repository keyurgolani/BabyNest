import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface DependencyCheck {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: DependencyCheck;
    redis: DependencyCheck;
  };
}

export interface LivenessResult {
  status: 'alive';
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Basic health check - just confirms the service is running
   */
  check(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Liveness check - confirms the service process is alive
   * Used by Kubernetes/Docker liveness probes
   */
  checkLiveness(): LivenessResult {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness check - verifies all dependencies are available
   * Used by Kubernetes/Docker readiness probes
   * Checks database and Redis connectivity
   */
  async checkReadiness(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const checks: HealthCheckResult['checks'] = {
      database: { status: 'down' },
      redis: { status: 'down' },
    };

    // Check database connection
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      checks.database = {
        status: 'up',
        responseTime,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      checks.database = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check Redis connection
    try {
      const startTime = Date.now();
      if (this.redis.isAvailable()) {
        const client = this.redis.getClient();
        if (client) {
          await client.ping();
          const responseTime = Date.now() - startTime;
          checks.redis = {
            status: 'up',
            responseTime,
          };
        } else {
          checks.redis = {
            status: 'down',
            error: 'Redis client not available',
          };
        }
      } else {
        checks.redis = {
          status: 'down',
          error: 'Redis not connected',
        };
      }
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      checks.redis = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Service is healthy only if database is up (Redis is optional)
    const isHealthy = checks.database.status === 'up';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      checks,
    };
  }
}
