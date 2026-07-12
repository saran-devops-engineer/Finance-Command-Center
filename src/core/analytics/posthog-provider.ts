import type { PostHog } from "posthog-js";
import type { ConfigurationService } from "@/core/configuration/configuration-service";
import type {
  AnalyticsEventProperties,
  AnalyticsProvider,
  AnalyticsUserTraits
} from "@/core/analytics/analytics-provider.interface";
import {
  buildAnalyticsContextProperties,
  getAnalyticsDistinctId,
  mergeAnalyticsProperties
} from "@/core/analytics/analytics-context";
import { sanitizeAnalyticsTraits } from "@/core/analytics/analytics-identity";
import { AppEvent } from "@/core/events/app-events";

export function createPostHogProvider(configuration: ConfigurationService): AnalyticsProvider {
  let initialized = false;
  let posthog: PostHog | null = null;

  function safeRun(action: () => void) {
    try {
      action();
    } catch {
      // Analytics failures must never break the application.
    }
  }

  function capture(event: string, properties?: AnalyticsEventProperties) {
    safeRun(() => {
      if (!initialized || !posthog) {
        return;
      }

      posthog.capture(event, mergeAnalyticsProperties(configuration, properties));
    });
  }

  return {
    async initialize() {
      if (initialized || typeof window === "undefined") {
        return;
      }

      const config = configuration.getConfig();

      if (!config.analyticsEnabled || !config.posthogKey) {
        return;
      }

      await safeRunAsync(async () => {
        const module = await import("posthog-js");
        posthog = module.default;
        posthog.init(config.posthogKey, {
          api_host: config.posthogHost,
          person_profiles: "identified_only",
          capture_pageview: false,
          persistence: "localStorage",
          loaded(client) {
            client.identify(getAnalyticsDistinctId());
            client.register(buildAnalyticsContextProperties(configuration));
          }
        });
        initialized = true;
      });
    },

    track(event, properties) {
      capture(event, properties);
    },

    screen(name, properties) {
      capture("$screen", {
        screenName: name,
        ...properties
      });
    },

    identify(userId, traits) {
      safeRun(() => {
        if (!initialized || !posthog) {
          return;
        }

        const sanitized = sanitizeAnalyticsTraits(traits ?? {}) as AnalyticsUserTraits;
        posthog.identify(userId, sanitized);
      });
    },

    error(error, context) {
      const message = error instanceof Error ? error.message : String(error);
      capture(AppEvent.ERROR_OCCURRED, {
        message,
        ...context
      });
    },

    timing(name, durationMs, properties) {
      capture("timing", {
        timingName: name,
        durationMs,
        ...properties
      });
    },

    setUserProperty(key, value) {
      safeRun(() => {
        if (!initialized || !posthog) {
          return;
        }

        posthog.setPersonProperties({ [key]: value });
      });
    },

    async flush() {
      safeRun(() => {
        posthog?.capture("$flush");
      });
    }
  };
}

async function safeRunAsync(action: () => Promise<void>) {
  try {
    await action();
  } catch {
    // Analytics failures must never break the application.
  }
}
