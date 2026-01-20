import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

import { HealthService, HealthCheckResult, LivenessResult } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check(): { status: string; timestamp: string } {
    return this.healthService.check();
  }

  @Get('ready')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness check - verifies all dependencies are available (DB, Redis)' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept traffic' })
  @ApiResponse({ status: 503, description: 'Service is not ready - dependencies unavailable' })
  async ready(@Res() res: Response): Promise<void> {
    const result: HealthCheckResult = await this.healthService.checkReadiness();
    const statusCode = result.status === 'healthy' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(result);
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness check - verifies service process is running' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live(): LivenessResult {
    return this.healthService.checkLiveness();
  }
}
