import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAGS_KEY } from '../decorators/require-feature-flags.decorator';
import { FeatureFlagsService } from '../../feature-flags/feature-flags.service';

@Injectable()
export class FeatureFlagsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagsService: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatureFlags = this.reflector.getAllAndOverride<string[]>(
      FEATURE_FLAGS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeatureFlags || requiredFeatureFlags.length === 0) {
      return true; // No feature flags required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has all required feature flags
    for (const featureFlag of requiredFeatureFlags) {
      const hasFeatureFlag = await this.featureFlagsService.hasFeatureFlag(
        user.id,
        featureFlag,
      );

      if (!hasFeatureFlag) {
        throw new ForbiddenException(
          `Access denied. Required feature flag: ${featureFlag}`,
        );
      }
    }

    return true;
  }
}