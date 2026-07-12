export type {
  AppConfiguration,
  AppSettings,
  DevicePreferences,
  Environment,
  UserAppState
} from "@/core/configuration/types";

export {
  DEFAULT_APP_SETTINGS,
  DEFAULT_DEVICE_PREFERENCES,
  DEFAULT_USER_APP_STATE,
  DEVICE_PREFERENCES_STORAGE_KEY,
  LEGACY_APP_SETTINGS_STORAGE_KEY,
  USER_APP_STATE_ID
} from "@/core/configuration/types";

export type { ConfigurationProvider } from "@/core/configuration/configuration-provider.interface";
export { createDefaultConfigurationProvider } from "@/core/configuration/default-configuration-provider";
export {
  ConfigurationService,
  createConfigurationService
} from "@/core/configuration/configuration-service";
