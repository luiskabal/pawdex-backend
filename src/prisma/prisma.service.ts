import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CustomLoggerService } from '../logger/logger.service';
import { PrismaLoggerService } from '../logger/prisma-logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private prismaLogger: PrismaLoggerService;

  constructor(private readonly logger: CustomLoggerService) {
    super();
    this.prismaLogger = new PrismaLoggerService(logger);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.prismaLogger.logConnection('connect', {
        database: 'PostgreSQL',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.prismaLogger.logConnection('error', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.prismaLogger.logConnection('disconnect', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.prismaLogger.logConnection('error', error);
    }
  }



  /**
   * Enhanced create method with logging
   */
  async createWithLogging<T>(
    model: string,
    data: any,
    context?: { requestId?: string; userId?: string }
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await (this as any)[model].create({ data });
      const duration = Date.now() - startTime;
      
      this.prismaLogger.logCrudOperation(
        'CREATE',
        model,
        result.id,
        data,
        context
      );

      if (duration > 100) {
        this.prismaLogger.logTransaction('COMMIT', undefined, context, {
          model,
          operation: 'CREATE',
          duration: `${duration}ms`,
        });
      }

      return result;
    } catch (error) {
      this.prismaLogger.logError(error, undefined, undefined, context);
      throw error;
    }
  }

  /**
   * Enhanced update method with logging
   */
  async updateWithLogging<T>(
    model: string,
    where: any,
    data: any,
    context?: { requestId?: string; userId?: string }
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await (this as any)[model].update({ where, data });
      const duration = Date.now() - startTime;
      
      this.prismaLogger.logCrudOperation(
        'UPDATE',
        model,
        where.id || JSON.stringify(where),
        data,
        context
      );

      if (duration > 100) {
        this.prismaLogger.logTransaction('COMMIT', undefined, context, {
          model,
          operation: 'UPDATE',
          duration: `${duration}ms`,
        });
      }

      return result;
    } catch (error) {
      this.prismaLogger.logError(error, undefined, undefined, context);
      throw error;
    }
  }

  /**
   * Enhanced delete method with logging
   */
  async deleteWithLogging<T>(
    model: string,
    where: any,
    context?: { requestId?: string; userId?: string }
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await (this as any)[model].delete({ where });
      const duration = Date.now() - startTime;
      
      this.prismaLogger.logCrudOperation(
        'DELETE',
        model,
        where.id || JSON.stringify(where),
        undefined,
        context
      );

      if (duration > 100) {
        this.prismaLogger.logTransaction('COMMIT', undefined, context, {
          model,
          operation: 'DELETE',
          duration: `${duration}ms`,
        });
      }

      return result;
    } catch (error) {
      this.prismaLogger.logError(error, undefined, undefined, context);
      throw error;
    }
  }
}