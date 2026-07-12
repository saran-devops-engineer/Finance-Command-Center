/**
 * Shared core architecture constants and boundary markers.
 */

export const CORE_ARCHITECTURE_VERSION = "1.0.0";

export const ALLOWED_LOCAL_STORAGE_KEYS = ["fcc:devicePreferences"] as const;

export const APPLICATION_SERVICE_KEYS = [
  "configuration",
  "analytics",
  "api",
  "backup",
  "notifications",
  "errorService",
  "financeRepository"
] as const;

export type ApplicationServiceKey = (typeof APPLICATION_SERVICE_KEYS)[number];
