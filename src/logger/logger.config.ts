export interface LoggerConfig {
  level: 'error' | 'warn' | 'info' | 'http' | 'debug';
  enableConsole: boolean;
  enableFile: boolean;
  enableRotation: boolean;
  maxFiles: string;
  maxSize: string;
  logDirectory: string;
  enablePerformanceLogging: boolean;
  performanceThreshold: number;
  enableDatabaseLogging: boolean;
  enableRequestLogging: boolean;
  enableErrorLogging: boolean;
  sensitiveFields: string[];
  sensitiveHeaders: string[];
}

export const getLoggerConfig = (): LoggerConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    level: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'http' | 'debug') || (isDevelopment ? 'debug' : 'info'),
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE !== 'false',
    enableRotation: process.env.LOG_ENABLE_ROTATION !== 'false',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    logDirectory: process.env.LOG_DIRECTORY || './logs',
    enablePerformanceLogging: process.env.LOG_ENABLE_PERFORMANCE !== 'false',
    performanceThreshold: parseInt(process.env.LOG_PERFORMANCE_THRESHOLD || '100'),
    enableDatabaseLogging: process.env.LOG_ENABLE_DATABASE !== 'false',
    enableRequestLogging: process.env.LOG_ENABLE_REQUEST !== 'false',
    enableErrorLogging: process.env.LOG_ENABLE_ERROR !== 'false',
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'authorization',
      'creditCard',
      'ssn',
      'socialSecurityNumber',
      'apiKey',
      'accessToken',
      'refreshToken',
      'sessionId',
      'cookie',
      ...(process.env.LOG_SENSITIVE_FIELDS?.split(',') || []),
    ],
    sensitiveHeaders: [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-access-token',
      'x-session-id',
      'x-csrf-token',
      ...(process.env.LOG_SENSITIVE_HEADERS?.split(',') || []),
    ],
  };
};

export const loggerConfig = getLoggerConfig();