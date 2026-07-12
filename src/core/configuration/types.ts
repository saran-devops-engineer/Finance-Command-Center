/**
 * Core Architecture — centralized application configuration.
 */

export type Environment = "development" | "production" | "test";

export interface AppConfiguration {
  apiBaseUrl: string;
  environment: Environment;
  applicationVersion: string;
  minimumSupportedVersion: string;
  analyticsEnabled: boolean;
  notificationsEnabled: boolean;
  maintenanceMode: boolean;
  featureFlags: Record<string, boolean>;
}

export interface UserAppState {
  id: "primary";
  pinnedLoanId: string | null;
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
  legacyFinancialMigrationCompletedAt: string | null;
}

export interface DevicePreferences {
  theme: "light" | "dark" | "system";
  installPromptDismissedAt: string | null;
  appVersion: string | null;
  featureFlags: Record<string, boolean>;
}

export interface AppSettings extends DevicePreferences {
  pinnedLoanId: string | null;
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
}

export const DEFAULT_USER_APP_STATE: UserAppState = {
  id: "primary",
  pinnedLoanId: null,
  lastBackupAt: null,
  lastRestoreAt: null,
  legacyFinancialMigrationCompletedAt: null
};

export const DEFAULT_DEVICE_PREFERENCES: DevicePreferences = {
  theme: "system",
  installPromptDismissedAt: null,
  appVersion: null,
  featureFlags: {}
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  ...DEFAULT_DEVICE_PREFERENCES,
  pinnedLoanId: null,
  lastBackupAt: null,
  lastRestoreAt: null
};

export const USER_APP_STATE_ID = "primary" as const;
export const DEVICE_PREFERENCES_STORAGE_KEY = "fcc:devicePreferences";
export const LEGACY_APP_SETTINGS_STORAGE_KEY = "fcc:appSettings";
