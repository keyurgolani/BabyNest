import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { StandardErrorResponse } from './http-exception.filter';

/**
 * Global All Exceptions Filter
 * 
 * Catches all exceptions (including non-HTTP exceptions) and transforms them
 * into a standardized error response format. This ensures that even unexpected
 * errors return a consistent response structure.
 * 
 * Validates: Requirements 12.5 - API request validation and appropriate HTTP status codes
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code and message
    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = this.extractMessage(exceptionResponse);
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal Server Error';
      
      // Log the actual error for debugging
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal Server Error';
      
      this.logger.error(`Unknown exception type: ${String(exception)}`);
    }

    const errorResponse: StandardErrorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log all 5xx errors at error level
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Extract message from exception response
   */
  private extractMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    const responseObj = exceptionResponse as Record<string, unknown>;

    if (responseObj['message']) {
      if (Array.isArray(responseObj['message'])) {
        return 'Validation failed';
      }
      return String(responseObj['message']);
    }

    if (responseObj['error']) {
      return String(responseObj['error']);
    }

    return 'An error occurred';
  }
}
