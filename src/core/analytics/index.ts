export type {
  AnalyticsEventProperties,
  AnalyticsProvider,
  AnalyticsUserTraits
} from "@/core/analytics/analytics-provider.interface";

export { createNoOpAnalyticsProvider } from "@/core/analytics/noop-analytics-provider";
export { createPostHogProvider } from "@/core/analytics/posthog-provider";
export {
  createAnalyticsProvider,
  type AnalyticsProviderFactoryOptions,
  type AnalyticsProviderKind
} from "@/core/analytics/analytics-provider-factory";
export { AnalyticsService, createAnalyticsService } from "@/core/analytics/analytics-service";
export {
  buildAnalyticsContextProperties,
  getAnalyticsDistinctId,
  mergeAnalyticsProperties
} from "@/core/analytics/analytics-context";
export { identifyAnalyticsUser, sanitizeAnalyticsTraits } from "@/core/analytics/analytics-identity";
export {
  trackApplicationEvent,
  reportApplicationError
} from "@/core/analytics/track-application-event";
export { AppEvent } from "@/core/events/app-events";
