/**
 * Finance Command Center — data access entry point.
 *
 * UI and business logic must import ONLY from this module.
 * Do not import IndexedDB, localStorage, or concrete repository implementations.
 */
export type {
  FinanceRepository,
  FinanceBackupExport,
  FinanceMigrationResult,
  BackupPreview,
  RestoredBackupSummary
} from "@/repositories/finance-repository";
export type { AppSettings, DevicePreferences, UserAppState } from "@/repositories/app-settings";
export { buildHomeStateFromBootstrapCache } from "@/repositories/finance-preload";

import type { FinanceMigrationResult, FinanceRepository } from "@/repositories/finance-repository";
import { indexedDbFinanceRepository } from "@/repositories/indexeddb-finance-repository";
import { preloadFinanceData } from "@/repositories/finance-preload";

/** Default repository instance backed by IndexedDB. */
export const financeRepository = indexedDbFinanceRepository;

let bootstrapPromise: Promise<FinanceMigrationResult> | null = null;

/**
 * Opens IndexedDB, runs legacy migration, and preloads dashboard data (Phase 9).
 * Safe to call multiple times — subsequent calls await the same promise.
 */
export function bootstrapFinanceRepository(
  repository: FinanceRepository = financeRepository
): Promise<FinanceMigrationResult> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await repository.initializeDatabase();
      const migrationResult = await repository.migrateFromLegacyStorage();
      await preloadFinanceData(repository);
      return migrationResult;
    })();
  }

  return bootstrapPromise;
}
