import type { FinanceRepository } from "@/core/repository/finance-repository";
import { syncProductGeneratedCommitments } from "@/services/commitment-sync/sync-product-commitments";
import {
  buildCompatMoneyBreakdown,
  calculateCashFlow,
  type CashFlowSummary
} from "@/services/cash-flow/calculate-cash-flow";
import { createFinancialSnapshot } from "@/services/financial-snapshot/create-snapshot";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import type { IncomeProfile } from "@/shared/domain/income";
import type {
  FinancialSnapshot,
  Loan,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import type { Chit } from "@/shared/domain/chit";

export interface CommandCenterState {
  profile: UserProfile;
  incomeProfile: IncomeProfile | null;
  commitments: CommitmentRecord[];
  loans: Loan[];
  chits: Chit[];
  upcomingDues: UpcomingDue[];
  moneyBreakdown: MoneyBreakdown;
  cashFlow: CashFlowSummary;
  snapshot: FinancialSnapshot;
  pinnedLoanId: string | null;
}

export async function loadCommandCenterState(
  repository: FinanceRepository
): Promise<CommandCenterState | null> {
  await syncProductGeneratedCommitments(repository);

  const [
    profile,
    incomeProfile,
    commitments,
    moneyBreakdown,
    loans,
    chits,
    upcomingDues,
    settings
  ] = await Promise.all([
    repository.getProfile(),
    repository.getIncomeProfile(),
    repository.listCommitments(),
    repository.getMoneyBreakdown(),
    repository.listLoans(),
    repository.listChits(),
    repository.listUpcomingDues(),
    repository.getSettings()
  ]);

  if (!profile?.onboardingCompleted) {
    return null;
  }

  const cashFlow = calculateCashFlow({
    incomeProfile,
    commitments,
    emergencyBuffer: moneyBreakdown?.emergencyBuffer,
    fallbackMonthlyIncome: moneyBreakdown?.monthlyIncome
  });

  const compatMoney = buildCompatMoneyBreakdown({
    cashFlow,
    commitments,
    existing: moneyBreakdown
  });

  const baseSnapshot = createFinancialSnapshot({
    money: compatMoney,
    loans,
    upcomingDues
  });

  const snapshot = {
    ...baseSnapshot,
    availableMoney: cashFlow.availableCash,
    mandatoryCommitments: cashFlow.totalMonthlyCommitments
  };

  return {
    profile,
    incomeProfile,
    commitments,
    loans,
    chits,
    upcomingDues,
    moneyBreakdown: compatMoney,
    cashFlow,
    snapshot,
    pinnedLoanId: settings.pinnedLoanId
  };
}
