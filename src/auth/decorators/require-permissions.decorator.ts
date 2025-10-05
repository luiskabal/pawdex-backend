import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for accessing a route
 * @param permissions - Array of permission names required
 * @example
 * @RequirePermissions(['patients.create', 'patients.read'])
 * @RequirePermissions(['system.admin'])
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);