import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAGS_KEY = 'feature_flags';

/**
 * Decorator to require specific feature flags for accessing a route
 * @param featureFlags - Array of feature flag keys required
 * @example
 * @RequireFeatureFlags(['advanced_reporting', 'multi_clinic_support'])
 * @RequireFeatureFlags(['premium_features'])
 */
export const RequireFeatureFlags = (...featureFlags: string[]) =>
  SetMetadata(FEATURE_FLAGS_KEY, featureFlags);