import type { MoneyBreakdown } from "@/shared/domain/finance";

export function calculateMandatoryCommitments(breakdown: MoneyBreakdown) {
  return (
    breakdown.mandatoryExpenses +
    breakdown.emis +
    breakdown.loanPayments +
    breakdown.insurance +
    breakdown.rent +
    breakdown.utilityBills +
    breakdown.fixedCommitments
  );
}

export function calculateAvailableMoney(breakdown: MoneyBreakdown) {
  return breakdown.monthlyIncome - calculateMandatoryCommitments(breakdown);
}

export function calculateDebtToIncomeRatio(params: {
  monthlyIncome: number;
  monthlyDebtPayments: number;
}) {
  if (params.monthlyIncome <= 0) {
    return 1;
  }

  return params.monthlyDebtPayments / params.monthlyIncome;
}
