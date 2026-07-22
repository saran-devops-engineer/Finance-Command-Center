import type { ConfigurationProvider } from "@/core/configuration/configuration-provider.interface";
import type { AppConfiguration } from "@/core/configuration/types";
import { resolveAppEnvironment } from "@/core/configuration/environment";

const APPLICATION_VERSION = "0.1.0";
const MINIMUM_SUPPORTED_VERSION = "0.1.0";

function resolveEnvironment() {
  return resolveAppEnvironment();
}

function resolvePostHogKey() {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_KEY ??
    process.env.VITE_POSTHOG_KEY ??
    ""
  );
}

function resolvePostHogHost() {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST ??
    process.env.VITE_POSTHOG_HOST ??
    "https://app.posthog.com"
  );
}

function resolveClarityProjectId() {
  return (
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ??
    process.env.VITE_CLARITY_PROJECT_ID ??
    ""
  );
}

export function createDefaultConfigurationProvider(): ConfigurationProvider {
  const posthogKey = resolvePostHogKey();
  const clarityProjectId = resolveClarityProjectId();

  return {
    getConfiguration(): AppConfiguration {
      return {
        apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
        environment: resolveEnvironment(),
        applicationVersion: APPLICATION_VERSION,
        minimumSupportedVersion: MINIMUM_SUPPORTED_VERSION,
        analyticsEnabled: Boolean(posthogKey || clarityProjectId),
        posthogKey,
        posthogHost: resolvePostHogHost(),
        clarityProjectId,
        notificationsEnabled: false,
        maintenanceMode: false,
        featureFlags: {}
      };
    }
  };
}

export { APPLICATION_VERSION, MINIMUM_SUPPORTED_VERSION };
