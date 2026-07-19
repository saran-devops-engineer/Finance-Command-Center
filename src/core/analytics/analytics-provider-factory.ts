import type { AnalyticsProvider } from "@/core/analytics/analytics-provider.interface";
import { createClarityProvider } from "@/core/analytics/clarity-provider";
import { createCompositeAnalyticsProvider } from "@/core/analytics/composite-analytics-provider";
import { createNoOpAnalyticsProvider } from "@/core/analytics/noop-analytics-provider";
import { createPostHogProvider } from "@/core/analytics/posthog-provider";
import type { ConfigurationService } from "@/core/configuration/configuration-service";

export type AnalyticsProviderKind = "composite" | "posthog" | "clarity" | "noop";

export interface AnalyticsProviderFactoryOptions {
  kind?: AnalyticsProviderKind;
}

function resolveEnabledProviders(configuration: ConfigurationService): AnalyticsProvider[] {
  const config = configuration.getConfig();
  const providers: AnalyticsProvider[] = [];

  if (config.analyticsEnabled && config.posthogKey) {
    providers.push(createPostHogProvider(configuration));
  }

  if (config.clarityProjectId) {
    providers.push(createClarityProvider(configuration));
  }

  return providers;
}

function resolveAnalyticsProviderKind(
  providerCount: number,
  configuration: ConfigurationService,
  override?: AnalyticsProviderKind
): AnalyticsProviderKind {
  if (override) {
    return override;
  }

  if (providerCount === 0) {
    return "noop";
  }

  if (providerCount === 1) {
    const config = configuration.getConfig();
    return config.posthogKey ? "posthog" : "clarity";
  }

  return "composite";
}

export function createAnalyticsProvider(
  configuration: ConfigurationService,
  options: AnalyticsProviderFactoryOptions = {}
): AnalyticsProvider {
  if (options.kind === "noop") {
    return createNoOpAnalyticsProvider();
  }

  if (options.kind === "posthog") {
    return createPostHogProvider(configuration);
  }

  if (options.kind === "clarity") {
    return createClarityProvider(configuration);
  }

  const providers = resolveEnabledProviders(configuration);
  const kind = resolveAnalyticsProviderKind(providers.length, configuration, options.kind);

  if (kind === "noop" || providers.length === 0) {
    return createNoOpAnalyticsProvider();
  }

  if (providers.length === 1) {
    return providers[0];
  }

  return createCompositeAnalyticsProvider(providers);
}
