/**
 * V2 cash flow — calculated, not user-entered.
 * Available Cash = Total Monthly Income − Monthly Commitments
 */

import type { IncomeProfile } from "@/shared/domain/income";
import { calculateTotalMonthlyIncome } from "@/shared/domain/income";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import { CommitmentFrequency } from "@/shared/domain/commitment-record";
import type { MoneyBreakdown } from "@/shared/domain/finance";

export interface CashFlowSummary {
  totalMonthlyIncome: number;
  totalMonthlyCommitments: number;
  availableCash: number;
  emergencyBuffer: number;
  commitmentRatio: number;
  incomeSourceCount: number;
  commitmentCount: number;
}

/** Normalize any commitment frequency to a monthly burden for cash-flow math. */
export function toMonthlyCommitmentAmount(commitment: CommitmentRecord): number {
  const amount = Math.max(commitment.amount, 0);

  switch (commitment.frequency) {
    case CommitmentFrequency.MONTHLY:
      return amount;
    case CommitmentFrequency.YEARLY:
      return amount / 12;
    case CommitmentFrequency.QUARTERLY:
      return amount / 3;
    case CommitmentFrequency.WEEKLY:
      return (amount * 52) / 12;
    case CommitmentFrequency.ONE_TIME:
      return 0;
    default:
      return amount;
  }
}

export function calculateCashFlow(params: {
  incomeProfile: IncomeProfile | null;
  commitments: CommitmentRecord[];
  emergencyBuffer?: number;
  /** Fallback when income profile is not yet migrated. */
  fallbackMonthlyIncome?: number;
}): CashFlowSummary {
  const totalMonthlyIncome = params.incomeProfile
    ? calculateTotalMonthlyIncome(params.incomeProfile)
    : Math.max(params.fallbackMonthlyIncome ?? 0, 0);

  const totalMonthlyCommitments = params.commitments.reduce(
    (sum, item) => sum + toMonthlyCommitmentAmount(item),
    0
  );

  const availableCash = totalMonthlyIncome - totalMonthlyCommitments;
  const commitmentRatio =
    totalMonthlyIncome > 0 ? totalMonthlyCommitments / totalMonthlyIncome : 0;

  return {
    totalMonthlyIncome,
    totalMonthlyCommitments,
    availableCash,
    emergencyBuffer: Math.max(params.emergencyBuffer ?? 0, 0),
    commitmentRatio,
    incomeSourceCount: params.incomeProfile?.sources.length ?? (totalMonthlyIncome > 0 ? 1 : 0),
    commitmentCount: params.commitments.length
  };
}

/**
 * Build a MoneyBreakdown compatible with V1 engines from V2 income + commitments.
 * Avoids double-counting by deriving fields from commitment categories.
 */
export function buildCompatMoneyBreakdown(params: {
  cashFlow: CashFlowSummary;
  commitments: CommitmentRecord[];
  existing?: MoneyBreakdown | null;
}): MoneyBreakdown {
  const existing = params.existing;
  const byCategory = (category: CommitmentRecord["category"]) =>
    params.commitments
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + toMonthlyCommitmentAmount(item), 0);

  return {
    monthlyIncome: params.cashFlow.totalMonthlyIncome,
    mandatoryExpenses: byCategory("manual-expense"),
    emis: byCategory("loan-emi"),
    loanPayments: 0,
    insurance: byCategory("insurance-premium"),
    rent: byCategory("rent"),
    utilityBills: byCategory("utility"),
    fixedCommitments:
      byCategory("subscription") +
      byCategory("chit-installment") +
      byCategory("school-fees") +
      byCategory("tax") +
      byCategory("other") +
      byCategory("gold-renewal"),
    emergencyBuffer:
      params.cashFlow.emergencyBuffer || existing?.emergencyBuffer || 0
  };
}
