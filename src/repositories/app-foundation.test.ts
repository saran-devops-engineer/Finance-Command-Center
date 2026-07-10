import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_DEVICE_PREFERENCES,
  DEFAULT_USER_APP_STATE,
  LEGACY_APP_SETTINGS_STORAGE_KEY
} from "@/repositories/app-settings";
import {
  invalidateFinanceBootstrapCache,
  setFinanceBootstrapCache
} from "@/repositories/finance-data-cache";
import { buildHomeStateFromBootstrapCache } from "@/repositories/finance-preload";
import { runLegacyStorageMigration } from "@/repositories/legacy-migration";
import {
  shouldClearPinnedLoan,
  verifyRestoredSnapshot
} from "@/repositories/restore-verification";
import {
  INSTALL_PROMPT_DISMISS_DURATION_MS,
  isInstallPromptDismissed
} from "@/lib/pwa/install-prompt-dismissal";
import type { FinanceDataSnapshot } from "@/shared/domain/finance";

const sampleProfile = {
  id: "primary",
  displayName: "Arjun",
  onboardingCompleted: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const sampleMoneyBreakdown = {
  monthlyIncome: 150000,
  mandatoryExpenses: 45000,
  emis: 52000,
  loanPayments: 52000,
  insurance: 8000,
  rent: 0,
  utilityBills: 6000,
  fixedCommitments: 66000,
  emergencyBuffer: 20000
};

const sampleLoan = {
  id: "loan-1",
  name: "Home Loan",
  type: "home" as const,
  lender: "HDFC",
  originalAmount: 4200000,
  outstandingBalance: 3820000,
  annualInterestRate: 8.6,
  monthlyEmi: 45200,
  nextDueDate: "2026-07-15",
  status: "active" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const sampleSnapshot: FinanceDataSnapshot = {
  schemaVersion: 1,
  exportedAt: "2026-07-10T00:00:00.000Z",
  profile: sampleProfile,
  moneyBreakdown: sampleMoneyBreakdown,
  loans: [sampleLoan],
  loanPayments: [],
  upcomingDues: []
};

function createLocalStorage() {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null
  };
}

function createMigrationDeps(overrides: Partial<Parameters<typeof runLegacyStorageMigration>[0]> = {}) {
  let userState = { ...DEFAULT_USER_APP_STATE };
  let devicePrefs = { ...DEFAULT_DEVICE_PREFERENCES, featureFlags: {} };
  let snapshot: FinanceDataSnapshot = {
    schemaVersion: 1,
    exportedAt: "2026-07-10T00:00:00.000Z",
    profile: null,
    moneyBreakdown: null,
    loans: [],
    loanPayments: [],
    upcomingDues: []
  };

  const deps = {
    readUserAppState: async () => userState,
    writeUserAppState: async (next: typeof userState) => {
      userState = next;
    },
    readDevicePreferences: () => devicePrefs,
    writeDevicePreferences: (next: typeof devicePrefs) => {
      devicePrefs = next;
    },
    hasIndexedDbFinancialData: async () => snapshot.loans.length > 0 || Boolean(snapshot.profile),
    replaceAllData: async (value: FinanceDataSnapshot) => {
      snapshot = value;
    },
    createDataSnapshot: async () => snapshot,
    ...overrides
  };

  return { deps, getUserState: () => userState, getDevicePrefs: () => devicePrefs, getSnapshot: () => snapshot };
}

describe("App Foundation — Phase 11", () => {
  afterEach(() => {
    invalidateFinanceBootstrapCache();
    vi.unstubAllGlobals();
  });

  describe("Scenario 1 — legacy localStorage upgrade migration", () => {
    it("migrates legacy financial snapshot into IndexedDB and removes source keys", async () => {
      const storage = createLocalStorage();
      vi.stubGlobal("window", {});
      vi.stubGlobal("localStorage", storage);

      storage.setItem("fcc:financeSnapshot", JSON.stringify(sampleSnapshot));

      const { deps } = createMigrationDeps();
      const result = await runLegacyStorageMigration(deps);

      expect(result.migrated).toBe(true);
      expect(result.message).toContain("Migrated financial data");
      expect(storage.getItem("fcc:financeSnapshot")).toBeNull();
    });

    it("migrates legacy Phase 1 app settings preferences", async () => {
      const storage = createLocalStorage();
      vi.stubGlobal("window", {});
      vi.stubGlobal("localStorage", storage);

      storage.setItem(
        LEGACY_APP_SETTINGS_STORAGE_KEY,
        JSON.stringify({
          pinnedLoanId: "loan-1",
          theme: "dark",
          installPromptDismissedAt: "2026-07-01T00:00:00.000Z"
        })
      );

      const { deps, getUserState, getDevicePrefs } = createMigrationDeps();
      await runLegacyStorageMigration(deps);

      expect(getUserState().pinnedLoanId).toBe("loan-1");
      expect(getDevicePrefs().theme).toBe("dark");
      expect(getDevicePrefs().installPromptDismissedAt).toBe("2026-07-01T00:00:00.000Z");
      expect(storage.getItem(LEGACY_APP_SETTINGS_STORAGE_KEY)).toBeNull();
    });
  });

  describe("Scenario 2 — fresh installation", () => {
    it("marks financial migration complete when IndexedDB is empty and no legacy data exists", async () => {
      const storage = createLocalStorage();
      vi.stubGlobal("window", {});
      vi.stubGlobal("localStorage", storage);

      const { deps, getUserState } = createMigrationDeps();
      const result = await runLegacyStorageMigration(deps);

      expect(result.migrated).toBe(false);
      expect(result.message).toContain("No legacy financial localStorage data found");
      expect(getUserState().legacyFinancialMigrationCompletedAt).not.toBeNull();
    });

    it("skips financial migration when IndexedDB already has data", async () => {
      const storage = createLocalStorage();
      vi.stubGlobal("window", {});
      vi.stubGlobal("localStorage", storage);

      storage.setItem("fcc:financeSnapshot", JSON.stringify(sampleSnapshot));

      const { deps, getSnapshot } = createMigrationDeps();
      await deps.replaceAllData(sampleSnapshot);

      const result = await runLegacyStorageMigration(deps);

      expect(result.message).toContain("IndexedDB already contains financial data");
      expect(getSnapshot().loans).toHaveLength(1);
      expect(storage.getItem("fcc:financeSnapshot")).not.toBeNull();
    });
  });

  describe("Scenario 3 — backup restore verification", () => {
    it("accepts matching restored snapshots", () => {
      expect(() => verifyRestoredSnapshot(sampleSnapshot, sampleSnapshot)).not.toThrow();
    });

    it("rejects restore when loan counts differ", () => {
      expect(() =>
        verifyRestoredSnapshot(sampleSnapshot, {
          ...sampleSnapshot,
          loans: []
        })
      ).toThrow(/expected 1 loans/);
    });

    it("clears pinned loan when restored loans no longer include it", () => {
      expect(shouldClearPinnedLoan("missing-loan", sampleSnapshot.loans)).toBe(true);
      expect(shouldClearPinnedLoan("loan-1", sampleSnapshot.loans)).toBe(false);
    });
  });

  describe("Scenario 6 — Continue Without Installing for 30 days", () => {
    it("suppresses welcome when dismissed within 30 days", () => {
      const now = Date.parse("2026-07-10T00:00:00.000Z");
      const dismissedAt = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();

      expect(isInstallPromptDismissed(dismissedAt, now)).toBe(true);
    });

    it("shows welcome again after 30 days", () => {
      const now = Date.parse("2026-07-10T00:00:00.000Z");
      const dismissedAt = new Date(now - INSTALL_PROMPT_DISMISS_DURATION_MS).toISOString();

      expect(isInstallPromptDismissed(dismissedAt, now)).toBe(false);
    });
  });

  describe("Scenario 7 — offline dashboard bootstrap support", () => {
    it("builds home state synchronously from warm startup cache", () => {
      setFinanceBootstrapCache({
        profile: sampleProfile,
        moneyBreakdown: sampleMoneyBreakdown,
        loans: [sampleLoan],
        upcomingDues: [],
        settings: {
          ...DEFAULT_DEVICE_PREFERENCES,
          pinnedLoanId: "loan-1",
          lastBackupAt: null,
          lastRestoreAt: null
        },
        warmedAt: "2026-07-10T00:00:00.000Z"
      });

      const homeState = buildHomeStateFromBootstrapCache();

      expect(homeState).not.toBeNull();
      expect(homeState?.profile.displayName).toBe("Arjun");
      expect(homeState?.loans).toHaveLength(1);
      expect(homeState?.pinnedLoanId).toBe("loan-1");
      expect(homeState?.snapshot.availableMoney).toBeDefined();
    });

    it("returns null when onboarding is incomplete", () => {
      setFinanceBootstrapCache({
        profile: { ...sampleProfile, onboardingCompleted: false },
        moneyBreakdown: sampleMoneyBreakdown,
        loans: [],
        upcomingDues: [],
        settings: {
          ...DEFAULT_DEVICE_PREFERENCES,
          pinnedLoanId: null,
          lastBackupAt: null,
          lastRestoreAt: null
        },
        warmedAt: "2026-07-10T00:00:00.000Z"
      });

      expect(buildHomeStateFromBootstrapCache()).toBeNull();
    });
  });
});
