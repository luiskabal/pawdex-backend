import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithTenant } from '../interfaces/tenant-context.interface';

export const REQUIRE_TENANT_KEY = 'requireTenant';
export const RequireTenant = () => Reflector.createDecorator<boolean>();

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireTenant = this.reflector.getAllAndOverride<boolean>(REQUIRE_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If tenant is not required, allow access
    if (!requireTenant) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    
    // Check if tenant context exists
    if (!request.tenant) {
      throw new BadRequestException('Tenant context is required for this operation');
    }

    // Check if tenant is active
    if (!request.tenant.isActive) {
      throw new ForbiddenException('Tenant is not active');
    }

    return true;
  }
}