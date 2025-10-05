import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { TenantsModule } from './tenants/tenants.module';
import { CommonModule } from './common/common.module';
import { HttpLoggerInterceptor } from './logger/http-logger.interceptor';
import { GlobalExceptionFilter } from './logger/global-exception.filter';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { TenantGuard } from './common/guards/tenant.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    PrismaModule,
    CommonModule,
    AuthModule,
    PermissionsModule,
    RolesModule,
    FeatureFlagsModule,
    TenantsModule,
    PatientsModule,
    AppointmentsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes('*');
  }
}