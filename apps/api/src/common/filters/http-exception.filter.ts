import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Standardized error response format
 * Validates: Requirements 12.5
 */
export interface StandardErrorResponse {
  statusCode: number;
  message: string;
  errors?: ErrorDetail[];
  timestamp: string;
  path: string;
}

/**
 * Individual error detail for validation errors
 */
export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * Global HTTP Exception Filter
 * 
 * Catches all HTTP exceptions and transforms them into a standardized
 * error response format for consistent API responses.
 * 
 * Validates: Requirements 12.5 - API request validation and appropriate HTTP status codes
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Build standardized error response
    const errorResponse: StandardErrorResponse = {
      statusCode: status,
      message: this.extractMessage(exceptionResponse, status),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add validation errors if present
    const errors = this.extractValidationErrors(exceptionResponse);
    if (errors.length > 0) {
      errorResponse.errors = errors;
    }

    // Log error for debugging (exclude 4xx client errors from error level)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${errorResponse.message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${errorResponse.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Extract the main error message from the exception response
   */
  private extractMessage(exceptionResponse: string | object, status: number): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    const responseObj = exceptionResponse as Record<string, unknown>;

    // Handle NestJS validation pipe errors
    if (responseObj['message']) {
      if (Array.isArray(responseObj['message'])) {
        // Multiple validation errors - return generic message
        return 'Validation failed';
      }
      return String(responseObj['message']);
    }

    // Handle custom error messages
    if (responseObj['error']) {
      return String(responseObj['error']);
    }

    // Default messages based on status code
    return this.getDefaultMessage(status);
  }

  /**
   * Extract validation errors from the exception response
   */
  private extractValidationErrors(exceptionResponse: string | object): ErrorDetail[] {
    if (typeof exceptionResponse === 'string') {
      return [];
    }

    const responseObj = exceptionResponse as Record<string, unknown>;

    // Handle NestJS validation pipe errors (class-validator format)
    if (Array.isArray(responseObj['message'])) {
      return this.parseValidationMessages(responseObj['message']);
    }

    // Handle custom errors array
    if (Array.isArray(responseObj['errors'])) {
      return responseObj['errors'] as ErrorDetail[];
    }

    return [];
  }

  /**
   * Parse class-validator error messages into ErrorDetail format
   * 
   * class-validator returns messages in formats like:
   * - "email must be an email"
   * - "password must be at least 8 characters"
   * - "name should not be empty"
   */
  private parseValidationMessages(messages: unknown[]): ErrorDetail[] {
    return messages.map((msg) => {
      const message = String(msg);
      const field = this.extractFieldFromMessage(message);
      return {
        field,
        message,
      };
    });
  }

  /**
   * Extract field name from validation message
   * Assumes message starts with field name (class-validator convention)
   */
  private extractFieldFromMessage(message: string): string {
    // Common patterns: "fieldName must be...", "fieldName should not be..."
    const match = message.match(/^(\w+)\s/);
    return match && match[1] ? match[1] : 'unknown';
  }

  /**
   * Get default error message based on HTTP status code
   */
  private getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
    };

    return messages[status] || 'An error occurred';
  }
}
