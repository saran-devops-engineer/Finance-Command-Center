import type { AnalyticsProvider } from "@/core/analytics/analytics-provider.interface";
import { createNoOpAnalyticsProvider } from "@/core/analytics/noop-analytics-provider";
import { createPostHogProvider } from "@/core/analytics/posthog-provider";
import type { ConfigurationService } from "@/core/configuration/configuration-service";

export type AnalyticsProviderKind = "posthog" | "noop";

export interface AnalyticsProviderFactoryOptions {
  kind?: AnalyticsProviderKind;
}

function resolveAnalyticsProviderKind(
  configuration: ConfigurationService,
  override?: AnalyticsProviderKind
): AnalyticsProviderKind {
  if (override) {
    return override;
  }

  const config = configuration.getConfig();
  return config.analyticsEnabled && config.posthogKey ? "posthog" : "noop";
}

export function createAnalyticsProvider(
  configuration: ConfigurationService,
  options: AnalyticsProviderFactoryOptions = {}
): AnalyticsProvider {
  switch (resolveAnalyticsProviderKind(configuration, options.kind)) {
    case "posthog":
      return createPostHogProvider(configuration);
    default:
      return createNoOpAnalyticsProvider();
  }
}
