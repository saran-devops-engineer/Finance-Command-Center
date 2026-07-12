/**
 * Finance Command Center — data access entry point.
 *
 * UI and business logic must import ONLY from this module or `@/core`.
 * Do not import IndexedDB, localStorage, or concrete repository implementations.
 */
export type {
  FinanceRepository,
  FinanceBackupExport,
  FinanceMigrationResult,
  BackupPreview,
  RestoredBackupSummary
} from "@/core/repository/finance-repository";
export type { AppSettings, DevicePreferences, UserAppState } from "@/repositories/app-settings";
export { buildHomeStateFromBootstrapCache } from "@/repositories/finance-preload";

import type { FinanceMigrationResult, FinanceRepository } from "@/core/repository/finance-repository";
import { bootstrapApplication, getApplicationServices } from "@/core/application/application-container";

/** Default repository instance backed by IndexedDB. */
export const financeRepository: FinanceRepository = getApplicationServices().financeRepository;

/**
 * Opens IndexedDB, runs legacy migration, and preloads dashboard data.
 * Safe to call multiple times — subsequent calls await the same promise.
 */
export function bootstrapFinanceRepository(
  repository: FinanceRepository = financeRepository
): Promise<FinanceMigrationResult> {
  return bootstrapApplication({
    ...getApplicationServices(),
    financeRepository: repository
  });
}

export { getApplicationServices } from "@/core/application/application-container";
