import { Request } from 'express';

export interface TenantContext {
  id: string;
  name: string;
  subdomain: string;
  slug: string;
  isActive: boolean;
  settings: Record<string, any>;
}

export interface RequestWithTenant extends Request {
  tenant?: TenantContext;
  tenantId?: string;
}