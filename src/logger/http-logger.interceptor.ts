import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CustomLoggerService, LogContext } from './logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    
    // Generate unique request ID
    const requestId = uuidv4();
    request['requestId'] = requestId;

    // Extract request information
    const { method, url, headers, body, query, params, ip } = request;
    const userAgent = headers['user-agent'] || 'Unknown';

    // Create log context
    const logContext: LogContext = {
      requestId,
      endpoint: `${method} ${url}`,
      method,
      userAgent,
      ip,
    };

    // Log incoming request
    this.logger.http(
      `Incoming ${method} request to ${url}`,
      logContext,
      {
        headers: this.sanitizeHeaders(headers),
        body: this.formatJsonData(body),
        query: this.formatJsonData(query),
        params: this.formatJsonData(params),
      }
    );

    return next.handle().pipe(
      tap((responseData) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const responseContext: LogContext = {
          ...logContext,
          statusCode: response.statusCode,
          responseTime,
        };

        // Log successful response
        this.logger.http(
          `${method} ${url} completed successfully`,
          responseContext,
          undefined,
          {
            statusCode: response.statusCode,
            responseTime: `${responseTime}ms`,
            dataSize: JSON.stringify(responseData || {}).length,
            responseData: this.formatJsonData(responseData),
          }
        );

        // Log performance if response time is significant
        if (responseTime > 1000) {
          this.logger.performance(
            `Slow response detected`,
            responseTime,
            responseContext,
            {
              endpoint: `${method} ${url}`,
              threshold: '1000ms',
            }
          );
        }
      }),
      catchError((error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const errorContext: LogContext = {
          ...logContext,
          statusCode: error.status || 500,
          responseTime,
        };

        // Log error response
        this.logger.error(
          `${method} ${url} failed with error: ${error.message}`,
          errorContext,
          {
            errorName: error.name,
            errorMessage: error.message,
            statusCode: error.status || 500,
            responseTime: `${responseTime}ms`,
            stack: error.stack,
          }
        );

        throw error;
      })
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-auth-token',
    ];

    const sanitized = { ...headers };
    
    for (const key in sanitized) {
      if (sensitiveHeaders.some(sensitive => 
        key.toLowerCase().includes(sensitive.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private formatJsonData(data: any): any {
    if (!data) return data;
    
    try {
      // If it's already an object, return it as-is for proper JSON formatting
      if (typeof data === 'object') {
        return data;
      }
      
      // If it's a string that might be JSON, try to parse it
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      
      return data;
    } catch (error) {
      // If parsing fails, return the original data
      return data;
    }
  }
}