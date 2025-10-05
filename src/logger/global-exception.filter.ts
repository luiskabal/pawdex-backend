import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService, LogContext } from './logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Extract request ID if available
    const requestId = (request as any).requestId || 'unknown';

    // Log the error with full context
    const logContext: LogContext = {
      requestId,
      method: request.method,
      url: request.url,
      statusCode: status,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
    };

    this.logger.error('Unhandled Exception', logContext, {
      message: typeof message === 'string' ? message : JSON.stringify(message),
      stack: exception instanceof Error ? exception.stack : undefined,
      timestamp: new Date().toISOString(),
      headers: this.sanitizeHeaders(request.headers),
      query: this.sanitizeQuery(request.query),
      body: this.sanitizeBody(request.body),
    });

    // Send error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : message,
      requestId,
    };

    response.status(status).json(errorResponse);
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-access-token',
    ];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeQuery(query: any): any {
    const sanitized = { ...query };
    const sensitiveParams = ['password', 'token', 'secret', 'key', 'auth'];

    sensitiveParams.forEach((param) => {
      if (sanitized[param]) {
        sanitized[param] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'creditCard',
      'ssn',
      'socialSecurityNumber',
    ];

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      const result = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some((field) => 
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          (result as any)[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          (result as any)[key] = sanitizeObject(value);
        } else {
          (result as any)[key] = value;
        }
      }

      return result;
    };

    return sanitizeObject(sanitized);
  }
}