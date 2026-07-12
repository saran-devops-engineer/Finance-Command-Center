import type { ConfigurationProvider } from "@/core/configuration/configuration-provider.interface";
import type { AppConfiguration, Environment } from "@/core/configuration/types";

const APPLICATION_VERSION = "0.1.0";
const MINIMUM_SUPPORTED_VERSION = "0.1.0";

function resolveEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv === "production") {
    return "production";
  }

  if (nodeEnv === "test") {
    return "test";
  }

  return "development";
}

export function createDefaultConfigurationProvider(): ConfigurationProvider {
  return {
    getConfiguration(): AppConfiguration {
      return {
        apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
        environment: resolveEnvironment(),
        applicationVersion: APPLICATION_VERSION,
        minimumSupportedVersion: MINIMUM_SUPPORTED_VERSION,
        analyticsEnabled: false,
        notificationsEnabled: false,
        maintenanceMode: false,
        featureFlags: {}
      };
    }
  };
}

export { APPLICATION_VERSION, MINIMUM_SUPPORTED_VERSION };
