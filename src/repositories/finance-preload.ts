import type { FinanceRepository } from "@/repositories/finance-repository";
import {
  getFinanceBootstrapCache,
  isFinanceCacheWarm,
  setFinanceBootstrapCache
} from "@/repositories/finance-data-cache";
import { createFinancialSnapshot } from "@/services/financial-snapshot/create-snapshot";
import type {
  FinancialSnapshot,
  Loan,
  MoneyBreakdown,
  UserProfile
} from "@/shared/domain/finance";

/**
 * Phase 9 — preload dashboard-critical data while the splash screen is visible.
 */
export async function preloadFinanceData(repository: FinanceRepository) {
  const [profile, moneyBreakdown, loans, upcomingDues, settings] = await Promise.all([
    repository.getProfile(),
    repository.getMoneyBreakdown(),
    repository.listLoans(),
    repository.listUpcomingDues(),
    repository.getSettings()
  ]);

  setFinanceBootstrapCache({
    profile,
    moneyBreakdown,
    loans,
    upcomingDues,
    settings,
    warmedAt: new Date().toISOString()
  });
}

export interface HomeBootstrapState {
  profile: UserProfile;
  loans: Loan[];
  moneyBreakdown: MoneyBreakdown;
  snapshot: FinancialSnapshot;
  pinnedLoanId: string | null;
}

/** Synchronous dashboard seed when startup cache is warm. */
export function buildHomeStateFromBootstrapCache(): HomeBootstrapState | null {
  if (!isFinanceCacheWarm()) {
    return null;
  }

  const cache = getFinanceBootstrapCache();
  if (!cache?.profile?.onboardingCompleted || !cache.moneyBreakdown) {
    return null;
  }

  return {
    profile: cache.profile,
    loans: cache.loans,
    moneyBreakdown: cache.moneyBreakdown,
    snapshot: createFinancialSnapshot({
      money: cache.moneyBreakdown,
      loans: cache.loans,
      upcomingDues: cache.upcomingDues
    }),
    pinnedLoanId: cache.settings.pinnedLoanId
  };
}
