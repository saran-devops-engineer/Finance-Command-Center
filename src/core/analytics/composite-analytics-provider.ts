import type {
  AnalyticsEventProperties,
  AnalyticsProvider,
  AnalyticsUserTraits
} from "@/core/analytics/analytics-provider.interface";

function safeRun(action: () => void) {
  try {
    action();
  } catch {
    // Analytics failures must never break the application.
  }
}

async function safeRunAsync(action: () => Promise<void>) {
  try {
    await action();
  } catch {
    // Analytics failures must never break the application.
  }
}

export function createCompositeAnalyticsProvider(
  providers: AnalyticsProvider[]
): AnalyticsProvider {
  const activeProviders = providers.filter(Boolean);

  return {
    async initialize() {
      await Promise.all(
        activeProviders.map((provider) => safeRunAsync(() => provider.initialize()))
      );
    },

    track(event, properties) {
      for (const provider of activeProviders) {
        safeRun(() => provider.track(event, properties));
      }
    },

    screen(name, properties) {
      for (const provider of activeProviders) {
        safeRun(() => provider.screen(name, properties));
      }
    },

    identify(userId, traits) {
      for (const provider of activeProviders) {
        safeRun(() => provider.identify(userId, traits));
      }
    },

    error(error, context) {
      for (const provider of activeProviders) {
        safeRun(() => provider.error(error, context));
      }
    },

    timing(name, durationMs, properties) {
      for (const provider of activeProviders) {
        safeRun(() => provider.timing(name, durationMs, properties));
      }
    },

    setUserProperty(key, value) {
      for (const provider of activeProviders) {
        safeRun(() => provider.setUserProperty(key, value));
      }
    },

    async flush() {
      await Promise.all(
        activeProviders.map((provider) => safeRunAsync(() => provider.flush()))
      );
    }
  };
}
