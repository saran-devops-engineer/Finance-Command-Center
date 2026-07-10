import type { AppSettings } from "@/repositories/app-settings";
import type {
  Loan,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";

/** In-memory startup cache populated during Phase 9 background initialization. */
export interface FinanceBootstrapCache {
  profile: UserProfile | null;
  moneyBreakdown: MoneyBreakdown | null;
  loans: Loan[];
  upcomingDues: UpcomingDue[];
  settings: AppSettings;
  warmedAt: string;
}

let bootstrapCache: FinanceBootstrapCache | null = null;

export function isFinanceCacheWarm() {
  return bootstrapCache !== null;
}

export function getFinanceBootstrapCache() {
  return bootstrapCache;
}

export function setFinanceBootstrapCache(value: FinanceBootstrapCache) {
  bootstrapCache = value;
}

export function invalidateFinanceBootstrapCache() {
  bootstrapCache = null;
}
