import type { AnalyticsService } from "@/core/analytics/analytics-service";
import { getAnalyticsDistinctId } from "@/core/analytics/analytics-context";

const ALLOWED_TRAIT_KEYS = new Set(["displayName"]);

export function identifyAnalyticsUser(
  analytics: AnalyticsService,
  displayName: string | null | undefined
) {
  const normalizedName = displayName?.trim();

  if (!normalizedName) {
    return;
  }

  analytics.identify(getAnalyticsDistinctId(), {
    displayName: normalizedName
  });
}

export function sanitizeAnalyticsTraits(traits: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(traits).filter(([key]) => ALLOWED_TRAIT_KEYS.has(key))
  );
}
