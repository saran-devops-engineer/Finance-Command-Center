import type { ConfigurationService } from "@/core/configuration/configuration-service";
import type {
  AnalyticsEventProperties,
  AnalyticsProvider,
  AnalyticsUserTraits
} from "@/core/analytics/analytics-provider.interface";
import { AppEvent } from "@/core/analytics/events";
import { getAnalyticsDistinctId } from "@/core/analytics/analytics-context";

type ClarityClient = {
  init: (projectId: string) => void;
  event: (eventName: string) => void;
  set: (key: string, value: string | string[]) => void;
  identify: (
    customId: string,
    customSessionId?: string,
    customPageId?: string,
    friendlyName?: string
  ) => void;
};

export function createClarityProvider(configuration: ConfigurationService): AnalyticsProvider {
  let initialized = false;
  let clarity: ClarityClient | null = null;

  function safeRun(action: () => void) {
    try {
      action();
    } catch {
      // Analytics failures must never break the application.
    }
  }

  function captureEvent(event: string) {
    safeRun(() => {
      if (!initialized || !clarity) {
        return;
      }

      clarity.event(event);
    });
  }

  function setTag(key: string, value: string | number | boolean | null | undefined) {
    safeRun(() => {
      if (!initialized || !clarity || value === undefined || value === null) {
        return;
      }

      clarity.set(key, String(value));
    });
  }

  return {
    async initialize() {
      if (initialized || typeof window === "undefined") {
        return;
      }

      const config = configuration.getConfig();
      const projectId = config.clarityProjectId;

      if (!projectId) {
        return;
      }

      await safeRunAsync(async () => {
        const clarityModule = await import("@microsoft/clarity");
        clarity = clarityModule.default as ClarityClient;
        clarity.init(projectId);
        clarity.identify(getAnalyticsDistinctId());
        initialized = true;
      });
    },

    track(event) {
      captureEvent(event);
    },

    screen(name) {
      captureEvent(AppEvent.SCREEN_VIEWED);
      setTag("screen_name", name);
    },

    identify(userId, traits) {
      safeRun(() => {
        if (!initialized || !clarity) {
          return;
        }

        const friendlyName =
          typeof traits?.displayName === "string" ? traits.displayName : undefined;

        clarity.identify(userId, undefined, undefined, friendlyName);
      });
    },

    error() {
      captureEvent(AppEvent.ERROR_OCCURRED);
    },

    timing(name, durationMs) {
      setTag("timing_name", name);
      setTag("duration_ms", durationMs);
      captureEvent("timing");
    },

    setUserProperty(key, value) {
      setTag(key, value);
    },

    async flush() {
      return;
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
