import { Injectable, NestMiddleware, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../../tenants/tenants.service';
import { RequestWithTenant, TenantContext } from '../interfaces/tenant-context.interface';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: RequestWithTenant, res: Response, next: NextFunction) {
    try {
      // Skip tenant resolution for certain paths
      if (this.shouldSkipTenantResolution(req.path)) {
        return next();
      }

      let tenant: TenantContext | null = null;

      // Method 1: Extract tenant from subdomain
      tenant = await this.extractTenantFromSubdomain(req);

      // Method 2: Extract tenant from header (for API clients)
      if (!tenant) {
        tenant = await this.extractTenantFromHeader(req);
      }

      // Method 3: Extract tenant from JWT token (will be implemented later)
      if (!tenant) {
        tenant = await this.extractTenantFromToken(req);
      }

      // Method 4: Extract tenant from query parameter (for development/testing)
      if (!tenant && process.env.NODE_ENV !== 'production') {
        tenant = await this.extractTenantFromQuery(req);
      }

      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
        
        // Add tenant ID to response headers for debugging
        res.setHeader('X-Tenant-ID', tenant.id);
        res.setHeader('X-Tenant-Subdomain', tenant.subdomain);
      }

      next();
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid tenant context');
    }
  }

  private shouldSkipTenantResolution(path: string): boolean {
    const skipPaths = [
      '/health',
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/tenants', // Tenant management endpoints
      '/docs', // Swagger documentation
      '/api-docs',
    ];

    return skipPaths.some(skipPath => path.startsWith(skipPath));
  }

  private async extractTenantFromSubdomain(req: RequestWithTenant): Promise<TenantContext | null> {
    const host = req.get('host');
    if (!host) return null;

    // Extract subdomain from host
    // Format: subdomain.domain.com or subdomain.localhost:3001
    const hostParts = host.split('.');
    
    // Skip if no subdomain or if it's www
    if (hostParts.length < 2 || hostParts[0] === 'www') {
      return null;
    }

    const subdomain = hostParts[0];
    
    // Skip common subdomains
    if (['api', 'admin', 'app'].includes(subdomain)) {
      return null;
    }

    try {
      const tenant = await this.tenantsService.findBySubdomain(subdomain);
      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        slug: tenant.slug,
        isActive: tenant.isActive,
        settings: tenant.settings,
      };
    } catch (error) {
      // Tenant not found by subdomain
      return null;
    }
  }

  private async extractTenantFromHeader(req: RequestWithTenant): Promise<TenantContext | null> {
    const tenantHeader = req.get('X-Tenant-ID') || req.get('X-Tenant-Subdomain');
    if (!tenantHeader) return null;

    try {
      let tenant;
      
      // Check if it's a tenant ID (CUID format) or subdomain
      if (tenantHeader.startsWith('c') && tenantHeader.length > 20) {
        tenant = await this.tenantsService.findOne(tenantHeader);
      } else {
        tenant = await this.tenantsService.findBySubdomain(tenantHeader);
      }

      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        slug: tenant.slug,
        isActive: tenant.isActive,
        settings: tenant.settings,
      };
    } catch (error) {
      throw new BadRequestException('Invalid tenant specified in header');
    }
  }

  private async extractTenantFromToken(req: RequestWithTenant): Promise<TenantContext | null> {
    // Extract tenant from JWT token if user is authenticated
    const user = (req as any).user;
    if (!user || !user.tenantId) return null;

    try {
      const tenant = await this.tenantsService.findOne(user.tenantId);
      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        slug: tenant.slug,
        isActive: tenant.isActive,
        settings: tenant.settings,
      };
    } catch (error) {
      // Tenant not found or invalid
      return null;
    }
  }

  private async extractTenantFromQuery(req: RequestWithTenant): Promise<TenantContext | null> {
    const tenantQuery = req.query.tenant as string;
    if (!tenantQuery) return null;

    try {
      let tenant;
      
      // Check if it's a tenant ID or subdomain
      if (tenantQuery.startsWith('c') && tenantQuery.length > 20) {
        tenant = await this.tenantsService.findOne(tenantQuery);
      } else {
        tenant = await this.tenantsService.findBySubdomain(tenantQuery);
      }

      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        slug: tenant.slug,
        isActive: tenant.isActive,
        settings: tenant.settings,
      };
    } catch (error) {
      throw new BadRequestException('Invalid tenant specified in query parameter');
    }
  }
}