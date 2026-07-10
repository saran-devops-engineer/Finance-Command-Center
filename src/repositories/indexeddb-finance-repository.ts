import type { FinanceRepository } from "@/repositories/finance-repository";
import {
  DEFAULT_DEVICE_PREFERENCES,
  DEFAULT_USER_APP_STATE,
  DEVICE_PREFERENCES_STORAGE_KEY,
  USER_APP_STATE_ID,
  type AppSettings,
  type DevicePreferences,
  type UserAppState
} from "@/repositories/app-settings";
import { runLegacyStorageMigration } from "@/repositories/legacy-migration";
import {
  getFinanceBootstrapCache,
  invalidateFinanceBootstrapCache,
  isFinanceCacheWarm
} from "@/repositories/finance-data-cache";
import { preloadFinanceData } from "@/repositories/finance-preload";
import {
  shouldClearPinnedLoan,
  verifyRestoredSnapshot
} from "@/repositories/restore-verification";
import type {
  FinanceDataSnapshot,
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import {
  createJsonBackup,
  inspectJsonBackup,
  restoreJsonBackup
} from "@/storage/backup/backup-service";
import { getFinanceDatabase } from "@/storage/indexeddb/database";
import { filterActiveLoans, filterArchivedLoans, normalizeLoan } from "@/lib/loan-status";

const MONEY_BREAKDOWN_ID = "current-month";
const PROFILE_ID = "primary";

/** @internal Concrete IndexedDB adapter — import `financeRepository` from `@/repositories` instead. */
export const indexedDbFinanceRepository: FinanceRepository = {
  async initializeDatabase() {
    await getFinanceDatabase();
  },

  async migrateFromLegacyStorage() {
    await getFinanceDatabase();

    return runLegacyStorageMigration({
      readUserAppState,
      writeUserAppState,
      readDevicePreferences,
      writeDevicePreferences,
      hasIndexedDbFinancialData,
      replaceAllData: (snapshot) => indexedDbFinanceRepository.replaceAllData(snapshot),
      createDataSnapshot: () => indexedDbFinanceRepository.createDataSnapshot()
    });
  },

  async clearDatabase() {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const transaction = database.transaction(
      ["profile", "moneyBreakdown", "loans", "loanPayments", "upcomingDues", "appState"],
      "readwrite"
    );

    await Promise.all([
      transaction.objectStore("profile").clear(),
      transaction.objectStore("moneyBreakdown").clear(),
      transaction.objectStore("loans").clear(),
      transaction.objectStore("loanPayments").clear(),
      transaction.objectStore("upcomingDues").clear(),
      transaction.objectStore("appState").clear()
    ]);

    await transaction.done;
  },

  async getSettings() {
    if (isFinanceCacheWarm()) {
      return getFinanceBootstrapCache()!.settings;
    }

    const [userState, devicePrefs] = await Promise.all([
      readUserAppState(),
      Promise.resolve(readDevicePreferences())
    ]);

    return mergeAppSettings(userState, devicePrefs);
  },

  async saveSettings(value) {
    invalidateFinanceBootstrapCache();
    const current = await indexedDbFinanceRepository.getSettings();
    const existingUserState = await readUserAppState();
    const next = { ...current, ...value };

    await writeUserAppState({
      id: USER_APP_STATE_ID,
      pinnedLoanId: next.pinnedLoanId,
      lastBackupAt: next.lastBackupAt,
      lastRestoreAt: next.lastRestoreAt,
      legacyFinancialMigrationCompletedAt:
        existingUserState.legacyFinancialMigrationCompletedAt
    });

    writeDevicePreferences({
      theme: next.theme,
      installPromptDismissedAt: next.installPromptDismissedAt,
      appVersion: next.appVersion,
      featureFlags: next.featureFlags
    });

    return next;
  },

  async exportBackup() {
    const backup = await createJsonBackup({ repository: indexedDbFinanceRepository });
    return {
      blob: backup.blob,
      filename: backup.filename,
      createdAt: backup.backup.createdAt
    };
  },

  async inspectBackup(file) {
    return inspectJsonBackup(file);
  },

  async restoreBackup(file) {
    const result = await restoreJsonBackup({ file, repository: indexedDbFinanceRepository });

    const verified = await indexedDbFinanceRepository.createDataSnapshot();
    verifyRestoredSnapshot(result.snapshot, verified);

    const settings = await indexedDbFinanceRepository.getSettings();
    if (shouldClearPinnedLoan(settings.pinnedLoanId, verified.loans)) {
      await indexedDbFinanceRepository.saveSettings({ pinnedLoanId: null });
    }

    invalidateFinanceBootstrapCache();
    await preloadFinanceData(indexedDbFinanceRepository);

    return result;
  },

  async getProfile() {
    if (isFinanceCacheWarm()) {
      return getFinanceBootstrapCache()!.profile;
    }

    const database = await getFinanceDatabase();
    const profile = await database.get("profile", PROFILE_ID);
    return profile ?? null;
  },

  async saveProfile(value: UserProfile) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("profile", value);
  },

  async getMoneyBreakdown() {
    if (isFinanceCacheWarm()) {
      return getFinanceBootstrapCache()!.moneyBreakdown;
    }

    const database = await getFinanceDatabase();
    const record = await database.get("moneyBreakdown", MONEY_BREAKDOWN_ID);

    if (!record) {
      return null;
    }

    return {
      monthlyIncome: record.monthlyIncome,
      mandatoryExpenses: record.mandatoryExpenses,
      emis: record.emis,
      loanPayments: record.loanPayments,
      insurance: record.insurance,
      rent: record.rent,
      utilityBills: record.utilityBills,
      fixedCommitments: record.fixedCommitments,
      emergencyBuffer: record.emergencyBuffer
    };
  },

  async saveMoneyBreakdown(value: MoneyBreakdown) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("moneyBreakdown", {
      ...value,
      id: MONEY_BREAKDOWN_ID,
      updatedAt: new Date().toISOString()
    });
  },

  async listLoans() {
    if (isFinanceCacheWarm()) {
      return getFinanceBootstrapCache()!.loans;
    }

    const database = await getFinanceDatabase();
    const loans = await database.getAll("loans");
    return filterActiveLoans(loans.map(normalizeLoan));
  },

  async listArchivedLoans() {
    const database = await getFinanceDatabase();
    const loans = await database.getAll("loans");
    return filterArchivedLoans(loans.map(normalizeLoan));
  },

  async getLoan(id: string) {
    const database = await getFinanceDatabase();
    const loan = await database.get("loans", id);
    return loan ? normalizeLoan(loan) : null;
  },

  async saveLoan(value: Loan) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("loans", normalizeLoan(value));
  },

  async softDeleteLoan(id: string) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const loan = await database.get("loans", id);

    if (!loan) {
      return;
    }

    await database.put(
      "loans",
      normalizeLoan({
        ...loan,
        status: "deleted",
        deletedAt: new Date().toISOString()
      })
    );
  },

  async archiveLoan(id: string, archiveReason?: string) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const loan = await database.get("loans", id);

    if (!loan) {
      return;
    }

    await database.put(
      "loans",
      normalizeLoan({
        ...loan,
        status: "archived",
        archivedAt: new Date().toISOString(),
        archiveReason: archiveReason?.trim() || undefined
      })
    );
  },

  async listAllLoanPayments() {
    const database = await getFinanceDatabase();
    return database.getAll("loanPayments");
  },

  async listLoanPayments(loanId: string) {
    const database = await getFinanceDatabase();
    return database.getAllFromIndex("loanPayments", "by-loan-id", loanId);
  },

  async saveLoanPayment(value: LoanPayment) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("loanPayments", value);
  },

  async listUpcomingDues() {
    if (isFinanceCacheWarm()) {
      return getFinanceBootstrapCache()!.upcomingDues;
    }

    const database = await getFinanceDatabase();
    return database.getAllFromIndex("upcomingDues", "by-due-date");
  },

  async saveUpcomingDue(value: UpcomingDue) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.put("upcomingDues", value);
  },

  async deleteUpcomingDue(id: string) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    await database.delete("upcomingDues", id);
  },

  async createDataSnapshot() {
    const database = await getFinanceDatabase();
    const [profile, moneyRecord, loans, loanPayments, upcomingDues] = await Promise.all([
      database.get("profile", PROFILE_ID),
      database.get("moneyBreakdown", MONEY_BREAKDOWN_ID),
      database.getAll("loans"),
      database.getAll("loanPayments"),
      database.getAllFromIndex("upcomingDues", "by-due-date")
    ]);
    const moneyBreakdown = moneyRecord
      ? {
          monthlyIncome: moneyRecord.monthlyIncome,
          mandatoryExpenses: moneyRecord.mandatoryExpenses,
          emis: moneyRecord.emis,
          loanPayments: moneyRecord.loanPayments,
          insurance: moneyRecord.insurance,
          rent: moneyRecord.rent,
          utilityBills: moneyRecord.utilityBills,
          fixedCommitments: moneyRecord.fixedCommitments,
          emergencyBuffer: moneyRecord.emergencyBuffer
        }
      : null;

    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: profile ?? null,
      moneyBreakdown,
      loans,
      loanPayments,
      upcomingDues
    };
  },

  async replaceAllData(value: FinanceDataSnapshot) {
    invalidateFinanceBootstrapCache();
    const database = await getFinanceDatabase();
    const transaction = database.transaction(
      ["profile", "moneyBreakdown", "loans", "loanPayments", "upcomingDues"],
      "readwrite"
    );

    await Promise.all([
      transaction.objectStore("profile").clear(),
      transaction.objectStore("moneyBreakdown").clear(),
      transaction.objectStore("loans").clear(),
      transaction.objectStore("loanPayments").clear(),
      transaction.objectStore("upcomingDues").clear()
    ]);

    if (value.profile) {
      await transaction.objectStore("profile").put(value.profile);
    }

    if (value.moneyBreakdown) {
      await transaction.objectStore("moneyBreakdown").put({
        ...value.moneyBreakdown,
        id: MONEY_BREAKDOWN_ID,
        updatedAt: new Date().toISOString()
      });
    }

    await Promise.all([
      ...value.loans.map((loan) =>
        transaction.objectStore("loans").put(normalizeLoan(loan))
      ),
      ...value.loanPayments.map((payment) =>
        transaction.objectStore("loanPayments").put(payment)
      ),
      ...value.upcomingDues.map((due) => transaction.objectStore("upcomingDues").put(due))
    ]);

    await transaction.done;
  }
};

function mergeAppSettings(userState: UserAppState, devicePrefs: DevicePreferences): AppSettings {
  return {
    pinnedLoanId: userState.pinnedLoanId,
    lastBackupAt: userState.lastBackupAt,
    lastRestoreAt: userState.lastRestoreAt,
    theme: devicePrefs.theme,
    installPromptDismissedAt: devicePrefs.installPromptDismissedAt,
    appVersion: devicePrefs.appVersion,
    featureFlags: devicePrefs.featureFlags
  };
}

async function readUserAppState(): Promise<UserAppState> {
  const database = await getFinanceDatabase();
  const record = await database.get("appState", USER_APP_STATE_ID);

  if (!record) {
    return { ...DEFAULT_USER_APP_STATE };
  }

  return {
    id: USER_APP_STATE_ID,
    pinnedLoanId: record.pinnedLoanId ?? null,
    lastBackupAt: record.lastBackupAt ?? null,
    lastRestoreAt: record.lastRestoreAt ?? null,
    legacyFinancialMigrationCompletedAt: record.legacyFinancialMigrationCompletedAt ?? null
  };
}

async function writeUserAppState(state: UserAppState) {
  const database = await getFinanceDatabase();
  await database.put("appState", {
    id: USER_APP_STATE_ID,
    pinnedLoanId: state.pinnedLoanId,
    lastBackupAt: state.lastBackupAt,
    lastRestoreAt: state.lastRestoreAt,
    legacyFinancialMigrationCompletedAt: state.legacyFinancialMigrationCompletedAt
  });
}

async function hasIndexedDbFinancialData(): Promise<boolean> {
  const database = await getFinanceDatabase();
  const [profile, money, loans] = await Promise.all([
    database.get("profile", PROFILE_ID),
    database.get("moneyBreakdown", MONEY_BREAKDOWN_ID),
    database.getAll("loans")
  ]);

  return Boolean(profile) || Boolean(money) || loans.length > 0;
}

/**
 * Device-only preferences — the ONLY localStorage usage allowed by Phase 2.
 * Keys: theme, installPromptDismissedAt, appVersion, featureFlags.
 */
function readDevicePreferences(): DevicePreferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_DEVICE_PREFERENCES, featureFlags: {} };
  }

  const raw = localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY);

  if (!raw) {
    return { ...DEFAULT_DEVICE_PREFERENCES, featureFlags: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DevicePreferences>;
    return {
      theme: parsed.theme ?? DEFAULT_DEVICE_PREFERENCES.theme,
      installPromptDismissedAt: parsed.installPromptDismissedAt ?? null,
      appVersion: parsed.appVersion ?? null,
      featureFlags: parsed.featureFlags ?? {}
    };
  } catch {
    return { ...DEFAULT_DEVICE_PREFERENCES, featureFlags: {} };
  }
}

function writeDevicePreferences(prefs: DevicePreferences) {
  if (typeof window === "undefined") {
    return;
  }

  // Persist only the Phase 2 allow-list — never financial or user-session fields.
  const payload: DevicePreferences = {
    theme: prefs.theme,
    installPromptDismissedAt: prefs.installPromptDismissedAt,
    appVersion: prefs.appVersion,
    featureFlags: prefs.featureFlags
  };

  localStorage.setItem(DEVICE_PREFERENCES_STORAGE_KEY, JSON.stringify(payload));
}
