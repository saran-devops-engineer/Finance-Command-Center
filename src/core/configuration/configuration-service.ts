import type { ConfigurationProvider } from "@/core/configuration/configuration-provider.interface";
import type { AppConfiguration } from "@/core/configuration/types";

export class ConfigurationService {
  constructor(private readonly provider: ConfigurationProvider) {}

  getConfig(): AppConfiguration {
    return this.provider.getConfiguration();
  }

  getApiBaseUrl() {
    return this.getConfig().apiBaseUrl;
  }

  getEnvironment() {
    return this.getConfig().environment;
  }

  getApplicationVersion() {
    return this.getConfig().applicationVersion;
  }

  isAnalyticsEnabled() {
    return this.getConfig().analyticsEnabled;
  }

  isNotificationsEnabled() {
    return this.getConfig().notificationsEnabled;
  }

  isMaintenanceMode() {
    return this.getConfig().maintenanceMode;
  }

  getFeatureFlags() {
    return this.getConfig().featureFlags;
  }

  isFeatureEnabled(featureKey: string) {
    return Boolean(this.getFeatureFlags()[featureKey]);
  }
}

export function createConfigurationService(provider: ConfigurationProvider) {
  return new ConfigurationService(provider);
}
