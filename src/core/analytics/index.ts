export type {
  AnalyticsEventProperties,
  AnalyticsProvider,
  AnalyticsUserTraits
} from "@/core/analytics/analytics-provider.interface";

export { createNoOpAnalyticsProvider } from "@/core/analytics/noop-analytics-provider";
export { createPostHogProvider } from "@/core/analytics/posthog-provider";
export { createClarityProvider } from "@/core/analytics/clarity-provider";
export { createCompositeAnalyticsProvider } from "@/core/analytics/composite-analytics-provider";
export {
  createAnalyticsProvider,
  type AnalyticsProviderFactoryOptions,
  type AnalyticsProviderKind
} from "@/core/analytics/analytics-provider-factory";
export { AnalyticsService, createAnalyticsService } from "@/core/analytics/analytics-service";
export {
  buildAnalyticsContextProperties,
  getAnalyticsDistinctId,
  mergeAnalyticsProperties,
  resolveAnalyticsProviderName
} from "@/core/analytics/analytics-context";
export { identifyAnalyticsUser, sanitizeAnalyticsTraits } from "@/core/analytics/analytics-identity";
export {
  trackApplicationEvent,
  reportApplicationError
} from "@/core/analytics/track-application-event";
export { trackScreenViewed, ScreenName } from "@/core/analytics/track-screen-view";
export {
  AppEvent,
  ScreenName as ScreenNames,
  EVENT_CATEGORIES,
  EVENT_BUSINESS_QUESTIONS,
  UNUSED_TAXONOMY_EVENTS,
  TAXONOMY_EVENT_COUNT,
  StandardActions,
  type AppEventName,
  type AppEventPayload,
  type ScreenNameValue,
  type EventCategory
} from "@/core/analytics/events";
