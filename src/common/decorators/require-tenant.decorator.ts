import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard, REQUIRE_TENANT_KEY } from '../guards/tenant.guard';

/**
 * Decorator that requires both authentication and tenant context.
 * This ensures the user is authenticated and belongs to a valid tenant.
 */
export function RequireTenant() {
  return applyDecorators(
    SetMetadata(REQUIRE_TENANT_KEY, true),
    UseGuards(JwtAuthGuard, TenantGuard),
  );
}