import { Injectable } from '@nestjs/common';
import { CustomLoggerService, LogContext } from './logger.service';

export interface DatabaseLogContext extends LogContext {
  operation?: string;
  table?: string;
  duration?: number;
}

@Injectable()
export class PrismaLoggerService {
  constructor(private readonly logger: CustomLoggerService) {}

  /**
   * Logs database queries with sanitized parameters
   */
  logQuery(query: string, params: any[], duration: number, context?: LogContext) {
    const sanitizedParams = this.sanitizeQueryParams(params);
    
    const dbContext: DatabaseLogContext = {
      ...context,
      operation: 'QUERY',
      duration,
    };

    this.logger.database(
      'Query executed',
      'database',
      dbContext,
      {
        query: this.sanitizeQuery(query),
        params: sanitizedParams,
        duration: `${duration}ms`,
      }
    );

    // Log slow queries
    if (duration > 500) {
      this.logger.performance(
        'Slow database query detected',
        duration,
        dbContext,
        {
          query: this.sanitizeQuery(query),
          threshold: '500ms',
        }
      );
    }
  }

  /**
   * Logs database errors
   */
  logError(error: any, query?: string, params?: any[], context?: LogContext) {
    const sanitizedParams = params ? this.sanitizeQueryParams(params) : undefined;
    
    const dbContext: DatabaseLogContext = {
      ...context,
      operation: 'ERROR',
    };

    this.logger.error(
      `Database error: ${error.message}`,
      dbContext,
      {
        errorCode: error.code,
        errorMessage: error.message,
        query: query ? this.sanitizeQuery(query) : undefined,
        params: sanitizedParams,
        stack: error.stack,
      }
    );
  }

  /**
   * Logs database connection events
   */
  logConnection(event: 'connect' | 'disconnect' | 'error', details?: any, context?: LogContext) {
    const dbContext: DatabaseLogContext = {
      ...context,
      operation: event.toUpperCase(),
    };

    if (event === 'error') {
      this.logger.error(
        `Database connection error: ${details?.message || 'Unknown error'}`,
        dbContext,
        {
          ...details,
          stack: details?.stack,
        }
      );
    } else {
      this.logger.info(
        `Database ${event}`,
        dbContext,
        details
      );
    }
  }

  /**
   * Logs CRUD operations with business context
   */
  logCrudOperation(
    operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    table: string,
    recordId?: string | number,
    data?: any,
    context?: LogContext
  ) {
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    
    const dbContext: DatabaseLogContext = {
      ...context,
      operation,
      table,
    };

    this.logger.business(
      `${operation} operation on ${table}${recordId ? ` (ID: ${recordId})` : ''}`,
      dbContext,
      {
        table,
        operation,
        recordId,
        data: sanitizedData,
      }
    );
  }

  /**
   * Logs transaction operations
   */
  logTransaction(
    event: 'BEGIN' | 'COMMIT' | 'ROLLBACK',
    transactionId?: string,
    context?: LogContext,
    details?: any
  ) {
    const dbContext: DatabaseLogContext = {
      ...context,
      operation: `TRANSACTION_${event}`,
    };

    this.logger.database(
      `Transaction ${event.toLowerCase()}${transactionId ? ` (ID: ${transactionId})` : ''}`,
      'transaction',
      dbContext,
      {
        event,
        transactionId,
        ...details,
      }
    );
  }

  /**
   * Sanitizes query parameters to remove sensitive data
   */
  private sanitizeQueryParams(params: any[]): any[] {
    if (!Array.isArray(params)) {
      return [];
    }

    return params.map(param => this.sanitizeData(param));
  }

  /**
   * Sanitizes SQL queries to remove sensitive data from literals
   */
  private sanitizeQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return query;
    }

    // Replace potential password/token values in SQL
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password = '[REDACTED]'")
      .replace(/token\s*=\s*'[^']*'/gi, "token = '[REDACTED]'")
      .replace(/secret\s*=\s*'[^']*'/gi, "secret = '[REDACTED]'")
      .replace(/key\s*=\s*'[^']*'/gi, "key = '[REDACTED]'");
  }

  /**
   * Sanitizes data objects
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sensitiveFields = [
      'password',
      'token',
      'authorization',
      'secret',
      'key',
      'credential',
      'auth',
      'session',
      'cookie',
      'bearer',
      'api_key',
      'apikey',
      'access_token',
      'refresh_token',
    ];

    const sanitized = { ...data };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }
}