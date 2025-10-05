import { Module } from '@nestjs/common';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import { TenantGuard } from './guards/tenant.guard';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  providers: [TenantContextMiddleware, TenantGuard],
  exports: [TenantContextMiddleware, TenantGuard],
})
export class CommonModule {}