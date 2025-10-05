import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { loggerConfig } from './logger.config';

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

export interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly logger: winston.Logger;
  private readonly sensitiveFields = loggerConfig.sensitiveFields;

  constructor() {
    this.logger = winston.createLogger({
      level: loggerConfig.level,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
          const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            context,
            ...meta,
          };

          if (stack) {
            logEntry['stack'] = stack;
          }

          return JSON.stringify(logEntry, null, 2);
        }),
      ),
      transports: this.createTransports(),
    });
  }

  /**
   * Creates Winston transports based on configuration
   */
  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport
    if (loggerConfig.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf((info: any) => {
              const { timestamp, level, message, context, data, request, response, responseData } = info;
              const contextStr = context ? ` [${context}]` : '';
              let logMessage = `${timestamp} ${level}${contextStr}: ${message}`;
              
              // Add formatted JSON data if present
              if (data && typeof data === 'object') {
                logMessage += `\n  📄 Data: ${JSON.stringify(data, null, 2)}`;
              }
              
              if (request && typeof request === 'object') {
                logMessage += `\n  📥 Request: ${JSON.stringify(request, null, 2)}`;
              }
              
              if (response && typeof response === 'object') {
                logMessage += `\n  📤 Response: ${JSON.stringify(response, null, 2)}`;
              }
              
              if (responseData && typeof responseData === 'object') {
                logMessage += `\n  📤 Response Data: ${JSON.stringify(responseData, null, 2)}`;
              }
              
              return logMessage;
            }),
          ),
        }),
      );
    }

    // File transports
    if (loggerConfig.enableFile) {
      // General application logs
      transports.push(
        new DailyRotateFile({
          filename: `${loggerConfig.logDirectory}/application-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: loggerConfig.enableRotation,
          maxSize: loggerConfig.maxSize,
          maxFiles: loggerConfig.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );

      // Error-specific logs
      if (loggerConfig.enableErrorLogging) {
        transports.push(
          new DailyRotateFile({
            filename: `${loggerConfig.logDirectory}/error-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: loggerConfig.enableRotation,
            maxSize: loggerConfig.maxSize,
            maxFiles: loggerConfig.maxFiles,
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        );
      }

      // HTTP request logs
      if (loggerConfig.enableRequestLogging) {
        transports.push(
          new DailyRotateFile({
            filename: `${loggerConfig.logDirectory}/http-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: loggerConfig.enableRotation,
            maxSize: loggerConfig.maxSize,
            maxFiles: '7d', // Keep HTTP logs for shorter period
            level: 'http',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        );
      }

      // Database logs
      if (loggerConfig.enableDatabaseLogging) {
        transports.push(
          new DailyRotateFile({
            filename: `${loggerConfig.logDirectory}/database-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: loggerConfig.enableRotation,
            maxSize: loggerConfig.maxSize,
            maxFiles: '7d',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
              winston.format.printf((info: any) => {
                // Only log database-related entries
                if (info.context?.endpoint?.includes('Database') || 
                    info.message?.includes('Database') ||
                    info.query) {
                  return JSON.stringify(info);
                }
                return '';
              }),
            ),
          }),
        );
      }
    }

    return transports;
  }

  /**
   * Sanitizes data by removing or masking sensitive fields
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized = { ...data };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      
      // Check if the key contains sensitive information
      if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes headers by removing sensitive authorization data
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers || typeof headers !== 'object') {
      return headers;
    }

    const sanitized = { ...headers };
    
    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('authorization') || 
          lowerKey.includes('cookie') || 
          lowerKey.includes('token') ||
          lowerKey.includes('auth')) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Creates a structured log entry with context
   */
  private createLogEntry(level: LogLevel, message: string, context?: LogContext, data?: any) {
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    
    return {
      level,
      message,
      context: context?.endpoint || 'Application',
      requestId: context?.requestId,
      userId: context?.userId,
      endpoint: context?.endpoint,
      method: context?.method,
      statusCode: context?.statusCode,
      responseTime: context?.responseTime,
      userAgent: context?.userAgent,
      ip: context?.ip,
      data: sanitizedData,
    };
  }

  log(message: string, context?: string) {
    this.info(message, { endpoint: context });
  }

  error(message: string, context?: LogContext, data?: any): void {
    const logEntry = this.createLogEntry('error', message, context, data);
    this.logger.error(logEntry);
  }

  warn(message: string, context?: LogContext, data?: any): void {
    const logEntry = this.createLogEntry('warn', message, context, data);
    this.logger.warn(logEntry);
  }

  info(message: string, context?: LogContext, data?: any): void {
    const logEntry = this.createLogEntry('info', message, context, data);
    this.logger.info(logEntry);
  }

  debug(message: string, context?: LogContext, data?: any): void {
    const logEntry = this.createLogEntry('debug', message, context, data);
    this.logger.debug(logEntry);
  }

  verbose(message: string, context?: LogContext, data?: any) {
    this.debug(message, context, data);
  }

  /**
   * Logs HTTP requests and responses
   */
  http(message: string, context: LogContext, requestData?: any, responseData?: any) {
    const sanitizedRequest = requestData ? this.sanitizeData(requestData) : undefined;
    const sanitizedResponse = responseData ? this.sanitizeData(responseData) : undefined;
    
    const logEntry = {
      ...this.createLogEntry('http', message, context),
      request: sanitizedRequest,
      response: sanitizedResponse,
    };

    this.logger.log('http', logEntry);
  }

  /**
   * Logs database operations
   */
  database(operation: string, table: string, context?: LogContext, data?: any) {
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    
    const logEntry = {
      ...this.createLogEntry('debug', `Database ${operation} on ${table}`, context),
      operation,
      table,
      data: sanitizedData,
    };

    this.logger.debug(logEntry);
  }

  /**
   * Logs performance metrics
   */
  performance(operation: string, duration: number, context?: LogContext, metadata?: any) {
    const sanitizedMetadata = metadata ? this.sanitizeData(metadata) : undefined;
    
    const logEntry = {
      ...this.createLogEntry('info', `Performance: ${operation} took ${duration}ms`, context),
      operation,
      duration,
      metadata: sanitizedMetadata,
    };

    this.logger.info(logEntry);
  }

  /**
   * Logs business logic events
   */
  business(event: string, context?: LogContext, data?: any) {
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    
    const logEntry = {
      ...this.createLogEntry('info', `Business Event: ${event}`, context),
      event,
      data: sanitizedData,
    };

    this.logger.info(logEntry);
  }

  logRequest(method: string, url: string, statusCode: number, responseTime: number, context?: LogContext): void {
    this.logger.http({
      message: `${method} ${url} ${statusCode} - ${responseTime}ms`,
      ...this.createLogEntry('http', `${method} ${url} ${statusCode} - ${responseTime}ms`, context),
    });
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(operation: string, table: string, duration?: number, context?: LogContext): void {
    this.logger.debug({
      message: `Database ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`,
      ...this.createLogEntry('debug', `Database ${operation} on ${table}`, context),
      operation,
      table,
      duration,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, threshold: number = 100, context?: LogContext): void {
    if (duration > threshold) {
      this.logger.info({
        message: `Performance: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
        ...this.createLogEntry('info', `Performance: ${operation} took ${duration}ms`, context),
        operation,
        duration,
        threshold,
        performance: true,
      });
    }
  }

  /**
   * Log business events
   */
  logBusinessEvent(event: string, data?: any, context?: LogContext): void {
    this.logger.info({
      message: `Business Event: ${event}`,
      ...this.createLogEntry('info', `Business Event: ${event}`, context),
      event,
      businessData: this.sanitizeData(data),
    });
  }
}