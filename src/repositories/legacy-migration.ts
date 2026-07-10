/**
 * Phase 3 — one-time automatic migration from legacy localStorage into IndexedDB.
 *
 * Financial data was never the primary localStorage store in this codebase, but
 * this path still scans known/defensive keys so upgrades never lose data.
 *
 * Rules:
 * - Run exactly once (completion marker in IndexedDB appState).
 * - If IndexedDB already has financial data → mark complete, skip financial migrate.
 * - Only delete localStorage keys after successful verification.
 */

import type { FinanceDataSnapshot } from "@/shared/domain/finance";
import type { FinanceMigrationResult } from "@/repositories/finance-repository";
import {
  DEFAULT_DEVICE_PREFERENCES,
  DEVICE_PREFERENCES_STORAGE_KEY,
  LEGACY_APP_SETTINGS_STORAGE_KEY,
  type AppSettings,
  type DevicePreferences,
  type UserAppState
} from "@/repositories/app-settings";

/** Known keys that may hold a full or partial financial snapshot. */
export const LEGACY_FINANCIAL_STORAGE_KEYS = [
  "fcc:financeSnapshot",
  "fcc:financeData",
  "fcc:finance-data",
  "fcc:snapshot",
  "fcc:data"
] as const;

/** Known keys that may hold individual financial entities. */
export const LEGACY_FINANCIAL_PART_KEYS = {
  profile: ["fcc:profile", "fcc:userProfile"],
  moneyBreakdown: ["fcc:moneyBreakdown", "fcc:money", "fcc:cashFlow"],
  loans: ["fcc:loans", "fcc:loanList"],
  loanPayments: ["fcc:loanPayments", "fcc:payments"],
  upcomingDues: ["fcc:upcomingDues", "fcc:dues"]
} as const;

const NON_FINANCIAL_LOCAL_STORAGE_KEYS = new Set([
  DEVICE_PREFERENCES_STORAGE_KEY,
  LEGACY_APP_SETTINGS_STORAGE_KEY,
  "fcc:pinnedLoanId",
  "fcc:lastBackupAt",
  "fcc:lastRestoreAt"
]);

export interface LegacyMigrationDeps {
  readUserAppState: () => Promise<UserAppState>;
  writeUserAppState: (state: UserAppState) => Promise<void>;
  readDevicePreferences: () => DevicePreferences;
  writeDevicePreferences: (prefs: DevicePreferences) => void;
  hasIndexedDbFinancialData: () => Promise<boolean>;
  replaceAllData: (snapshot: FinanceDataSnapshot) => Promise<void>;
  createDataSnapshot: () => Promise<FinanceDataSnapshot>;
}

export async function runLegacyStorageMigration(
  deps: LegacyMigrationDeps
): Promise<FinanceMigrationResult> {
  const messages: string[] = [];
  let migrated = false;

  const userState = await deps.readUserAppState();
  const devicePrefs = deps.readDevicePreferences();

  // --- Preferences (Phase 2 keys) ---
  const prefsResult = await migratePreferenceKeys(userState, devicePrefs, deps);
  if (prefsResult.migrated) {
    migrated = true;
    messages.push(prefsResult.message);
  }

  // Re-read after preference writes so the completion marker is applied to latest state.
  const latestUserState = await deps.readUserAppState();

  // --- Financial data (Phase 3) — exactly once ---
  if (latestUserState.legacyFinancialMigrationCompletedAt) {
    messages.push("Financial migration already completed.");
    return {
      migrated,
      message: messages.join(" ") || "No legacy storage migration required."
    };
  }

  const indexedDbHasData = await deps.hasIndexedDbFinancialData();

  if (indexedDbHasData) {
    await markFinancialMigrationComplete(deps);
    messages.push("IndexedDB already contains financial data; migration marked complete.");
    return {
      migrated,
      message: messages.join(" ")
    };
  }

  const legacySnapshot = discoverLegacyFinancialSnapshot();

  if (!legacySnapshot) {
    await markFinancialMigrationComplete(deps);
    messages.push("No legacy financial localStorage data found.");
    return {
      migrated,
      message: messages.join(" ")
    };
  }

  await deps.replaceAllData(legacySnapshot.snapshot);
  const verified = await deps.createDataSnapshot();

  if (!verifyMigratedSnapshot(legacySnapshot.snapshot, verified)) {
    return {
      migrated: false,
      message:
        "Legacy financial migration verification failed. localStorage data was NOT removed."
    };
  }

  removeLocalStorageKeys(legacySnapshot.sourceKeys);
  await markFinancialMigrationComplete(deps);

  migrated = true;
  messages.push(
    `Migrated financial data from localStorage (${legacySnapshot.sourceKeys.join(", ")}).`
  );

  return {
    migrated,
    message: messages.join(" ")
  };
}

async function markFinancialMigrationComplete(deps: LegacyMigrationDeps) {
  const current = await deps.readUserAppState();
  await deps.writeUserAppState({
    ...current,
    legacyFinancialMigrationCompletedAt: new Date().toISOString()
  });
}

async function migratePreferenceKeys(
  userState: UserAppState,
  devicePrefs: DevicePreferences,
  deps: LegacyMigrationDeps
): Promise<FinanceMigrationResult> {
  let migrated = false;
  let nextUserState = { ...userState };
  let nextDevicePrefs = { ...devicePrefs };
  const removedKeys: string[] = [];

  const phase1Blob = readLocalStorage(LEGACY_APP_SETTINGS_STORAGE_KEY);
  if (phase1Blob) {
    try {
      const parsed = JSON.parse(phase1Blob) as Partial<AppSettings>;

      if (!nextUserState.pinnedLoanId && parsed.pinnedLoanId) {
        nextUserState.pinnedLoanId = parsed.pinnedLoanId;
        migrated = true;
      }
      if (!nextUserState.lastBackupAt && parsed.lastBackupAt) {
        nextUserState.lastBackupAt = parsed.lastBackupAt;
        migrated = true;
      }
      if (!nextUserState.lastRestoreAt && parsed.lastRestoreAt) {
        nextUserState.lastRestoreAt = parsed.lastRestoreAt;
        migrated = true;
      }
      if (parsed.theme && nextDevicePrefs.theme === DEFAULT_DEVICE_PREFERENCES.theme) {
        nextDevicePrefs.theme = parsed.theme;
        migrated = true;
      }
      if (!nextDevicePrefs.installPromptDismissedAt && parsed.installPromptDismissedAt) {
        nextDevicePrefs.installPromptDismissedAt = parsed.installPromptDismissedAt;
        migrated = true;
      }
      if (!nextDevicePrefs.appVersion && parsed.appVersion) {
        nextDevicePrefs.appVersion = parsed.appVersion;
        migrated = true;
      }
      if (
        parsed.featureFlags &&
        Object.keys(nextDevicePrefs.featureFlags).length === 0 &&
        Object.keys(parsed.featureFlags).length > 0
      ) {
        nextDevicePrefs.featureFlags = parsed.featureFlags;
        migrated = true;
      }
    } catch {
      // Ignore corrupt Phase 1 blob.
    }

    removedKeys.push(LEGACY_APP_SETTINGS_STORAGE_KEY);
    migrated = true;
  }

  const legacyPinned = readLocalStorage("fcc:pinnedLoanId");
  if (legacyPinned && !nextUserState.pinnedLoanId) {
    nextUserState.pinnedLoanId = legacyPinned;
    migrated = true;
  }
  if (legacyPinned !== null) {
    removedKeys.push("fcc:pinnedLoanId");
  }

  const legacyBackup = readLocalStorage("fcc:lastBackupAt");
  if (legacyBackup && !nextUserState.lastBackupAt) {
    nextUserState.lastBackupAt = legacyBackup;
    migrated = true;
  }
  if (legacyBackup !== null) {
    removedKeys.push("fcc:lastBackupAt");
  }

  const legacyRestore = readLocalStorage("fcc:lastRestoreAt");
  if (legacyRestore && !nextUserState.lastRestoreAt) {
    nextUserState.lastRestoreAt = legacyRestore;
    migrated = true;
  }
  if (legacyRestore !== null) {
    removedKeys.push("fcc:lastRestoreAt");
  }

  const userChanged =
    nextUserState.pinnedLoanId !== userState.pinnedLoanId ||
    nextUserState.lastBackupAt !== userState.lastBackupAt ||
    nextUserState.lastRestoreAt !== userState.lastRestoreAt;

  const deviceChanged = JSON.stringify(nextDevicePrefs) !== JSON.stringify(devicePrefs);

  if (userChanged) {
    await deps.writeUserAppState(nextUserState);
  }

  if (deviceChanged) {
    deps.writeDevicePreferences(nextDevicePrefs);
  }

  if (userChanged) {
    const verified = await deps.readUserAppState();
    const ok =
      verified.pinnedLoanId === nextUserState.pinnedLoanId &&
      verified.lastBackupAt === nextUserState.lastBackupAt &&
      verified.lastRestoreAt === nextUserState.lastRestoreAt;

    if (!ok) {
      return {
        migrated: false,
        message: "Preference migration verification failed. Legacy keys were NOT removed."
      };
    }
  }

  if (removedKeys.length > 0) {
    removeLocalStorageKeys(removedKeys);
  }

  return {
    migrated,
    message: migrated
      ? "Legacy preference keys migrated into IndexedDB appState and device preferences."
      : "No preference migration required."
  };
}

interface DiscoveredSnapshot {
  snapshot: FinanceDataSnapshot;
  sourceKeys: string[];
}

function discoverLegacyFinancialSnapshot(): DiscoveredSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of LEGACY_FINANCIAL_STORAGE_KEYS) {
    const raw = readLocalStorage(key);
    if (!raw) {
      continue;
    }

    const snapshot = tryParseFinanceSnapshot(raw);
    if (snapshot) {
      return { snapshot, sourceKeys: [key] };
    }
  }

  const sourceKeys: string[] = [];
  const profile = readFirstJson(LEGACY_FINANCIAL_PART_KEYS.profile, sourceKeys);
  const moneyBreakdown = readFirstJson(LEGACY_FINANCIAL_PART_KEYS.moneyBreakdown, sourceKeys);
  const loans = readFirstJsonArray(LEGACY_FINANCIAL_PART_KEYS.loans, sourceKeys);
  const loanPayments = readFirstJsonArray(LEGACY_FINANCIAL_PART_KEYS.loanPayments, sourceKeys);
  const upcomingDues = readFirstJsonArray(LEGACY_FINANCIAL_PART_KEYS.upcomingDues, sourceKeys);

  if (sourceKeys.length === 0) {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith("fcc:") || NON_FINANCIAL_LOCAL_STORAGE_KEYS.has(key)) {
        continue;
      }
      if ((LEGACY_FINANCIAL_STORAGE_KEYS as readonly string[]).includes(key)) {
        continue;
      }

      const raw = readLocalStorage(key);
      if (!raw) {
        continue;
      }

      const snapshot = tryParseFinanceSnapshot(raw);
      if (snapshot) {
        return { snapshot, sourceKeys: [key] };
      }
    }

    return null;
  }

  if (!profile && !moneyBreakdown && loans.length === 0) {
    return null;
  }

  return {
    snapshot: {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: isRecord(profile) ? (profile as FinanceDataSnapshot["profile"]) : null,
      moneyBreakdown: isRecord(moneyBreakdown)
        ? (moneyBreakdown as FinanceDataSnapshot["moneyBreakdown"])
        : null,
      loans: loans as FinanceDataSnapshot["loans"],
      loanPayments: loanPayments as FinanceDataSnapshot["loanPayments"],
      upcomingDues: upcomingDues as FinanceDataSnapshot["upcomingDues"]
    },
    sourceKeys
  };
}

function tryParseFinanceSnapshot(raw: string): FinanceDataSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed)) {
      return null;
    }

    if (parsed.schemaVersion === 1 && ("loans" in parsed || "profile" in parsed)) {
      return {
        schemaVersion: 1,
        exportedAt:
          typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
        profile: (parsed.profile as FinanceDataSnapshot["profile"]) ?? null,
        moneyBreakdown:
          (parsed.moneyBreakdown as FinanceDataSnapshot["moneyBreakdown"]) ?? null,
        loans: Array.isArray(parsed.loans) ? (parsed.loans as FinanceDataSnapshot["loans"]) : [],
        loanPayments: Array.isArray(parsed.loanPayments)
          ? (parsed.loanPayments as FinanceDataSnapshot["loanPayments"])
          : [],
        upcomingDues: Array.isArray(parsed.upcomingDues)
          ? (parsed.upcomingDues as FinanceDataSnapshot["upcomingDues"])
          : []
      };
    }

    if (isRecord(parsed.data) && parsed.data.schemaVersion === 1) {
      return tryParseFinanceSnapshot(JSON.stringify(parsed.data));
    }

    return null;
  } catch {
    return null;
  }
}

function verifyMigratedSnapshot(
  expected: FinanceDataSnapshot,
  actual: FinanceDataSnapshot
): boolean {
  if (expected.loans.length !== actual.loans.length) {
    return false;
  }

  if (expected.loanPayments.length !== actual.loanPayments.length) {
    return false;
  }

  if (expected.upcomingDues.length !== actual.upcomingDues.length) {
    return false;
  }

  if (Boolean(expected.profile) !== Boolean(actual.profile)) {
    return false;
  }

  if (Boolean(expected.moneyBreakdown) !== Boolean(actual.moneyBreakdown)) {
    return false;
  }

  const expectedLoanIds = new Set(expected.loans.map((loan) => loan.id));
  for (const loan of actual.loans) {
    if (!expectedLoanIds.has(loan.id)) {
      return false;
    }
  }

  return true;
}

function readFirstJson(keys: readonly string[], sourceKeys: string[]): unknown {
  for (const key of keys) {
    const raw = readLocalStorage(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      sourceKeys.push(key);
      return parsed;
    } catch {
      // continue
    }
  }

  return null;
}

function readFirstJsonArray(keys: readonly string[], sourceKeys: string[]): unknown[] {
  const value = readFirstJson(keys, sourceKeys);
  return Array.isArray(value) ? value : [];
}

function readLocalStorage(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(key);
}

function removeLocalStorageKeys(keys: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
