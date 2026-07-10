/**
 * App preferences accessed only through FinanceRepository.
 *
 * Phase 2 storage split:
 * - IndexedDB (`appState` store): user/session state tied to financial data
 * - localStorage: device-only prefs allowed by the App Foundation spec
 */

/** User/session state — stored in IndexedDB. Never in localStorage. */
export interface UserAppState {
  id: "primary";
  pinnedLoanId: string | null;
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
  /**
   * Phase 3 — set after the one-time localStorage → IndexedDB financial
   * migration has been attempted (whether or not data was found).
   */
  legacyFinancialMigrationCompletedAt: string | null;
}

/**
 * Device preferences — the ONLY values allowed in localStorage.
 * Theme · Install Prompt Dismissed · App Version · Feature Flags
 */
export interface DevicePreferences {
  theme: "light" | "dark" | "system";
  installPromptDismissedAt: string | null;
  appVersion: string | null;
  featureFlags: Record<string, boolean>;
}

/** Unified settings surface returned by FinanceRepository. */
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

/** localStorage key for device-only preferences (Phase 2 allow-list). */
export const DEVICE_PREFERENCES_STORAGE_KEY = "fcc:devicePreferences";

/** @deprecated Phase 1 blob — migrated into IndexedDB + device preferences. */
export const LEGACY_APP_SETTINGS_STORAGE_KEY = "fcc:appSettings";

export const USER_APP_STATE_ID = "primary" as const;
