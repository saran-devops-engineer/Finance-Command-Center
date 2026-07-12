import type { AnalyticsProvider } from "@/core/analytics/analytics-provider.interface";

export function createNoOpAnalyticsProvider(): AnalyticsProvider {
  return {
    async initialize() {
      return;
    },
    track() {
      return;
    },
    screen() {
      return;
    },
    identify() {
      return;
    },
    error() {
      return;
    },
    timing() {
      return;
    },
    setUserProperty() {
      return;
    },
    async flush() {
      return;
    }
  };
}
