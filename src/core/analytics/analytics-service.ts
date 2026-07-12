import type {
  AnalyticsEventProperties,
  AnalyticsProvider,
  AnalyticsUserTraits
} from "@/core/analytics/analytics-provider.interface";

export class AnalyticsService {
  constructor(private readonly provider: AnalyticsProvider) {}

  initialize() {
    return this.provider.initialize();
  }

  track(event: string, properties?: AnalyticsEventProperties) {
    this.provider.track(event, properties);
  }

  screen(name: string, properties?: AnalyticsEventProperties) {
    this.provider.screen(name, properties);
  }

  identify(userId: string, traits?: AnalyticsUserTraits) {
    this.provider.identify(userId, traits);
  }

  error(error: unknown, context?: AnalyticsEventProperties) {
    this.provider.error(error, context);
  }

  timing(name: string, durationMs: number, properties?: AnalyticsEventProperties) {
    this.provider.timing(name, durationMs, properties);
  }

  setUserProperty(key: string, value: string | number | boolean | null) {
    this.provider.setUserProperty(key, value);
  }

  flush() {
    return this.provider.flush();
  }
}

export function createAnalyticsService(provider: AnalyticsProvider) {
  return new AnalyticsService(provider);
}
