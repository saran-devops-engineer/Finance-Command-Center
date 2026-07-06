import type {
  FinancialHealthStatus,
  MoneyBreakdown,
  UpcomingDue
} from "@/shared/domain/finance";
import {
  calculateAvailableMoney,
  calculateDebtToIncomeRatio,
  calculateMandatoryCommitments
} from "./available-money";

interface HealthAssessmentInput {
  money: MoneyBreakdown;
  upcomingDues: UpcomingDue[];
}

interface HealthAssessment {
  status: FinancialHealthStatus;
  reason: string;
  availableMoney: number;
  mandatoryCommitments: number;
  debtToIncomeRatio: number;
}

export function assessFinancialHealth(input: HealthAssessmentInput): HealthAssessment {
  const mandatoryCommitments = calculateMandatoryCommitments(input.money);
  const availableMoney = calculateAvailableMoney(input.money);
  const debtToIncomeRatio = calculateDebtToIncomeRatio({
    monthlyIncome: input.money.monthlyIncome,
    monthlyDebtPayments: input.money.emis + input.money.loanPayments
  });

  const hasOverduePayment = input.upcomingDues.some((due) => due.isOverdue);
  const hasDueSoon = input.upcomingDues.length > 0;
  const hasLowEmergencyBuffer = input.money.emergencyBuffer < mandatoryCommitments;

  if (
    availableMoney < 0 ||
    hasOverduePayment ||
    mandatoryCommitments > input.money.monthlyIncome
  ) {
    return {
      status: "critical",
      reason: "Mandatory commitments are not fully covered this month.",
      availableMoney,
      mandatoryCommitments,
      debtToIncomeRatio
    };
  }

  if (
    availableMoney < input.money.monthlyIncome * 0.1 ||
    hasDueSoon ||
    debtToIncomeRatio > 0.45 ||
    hasLowEmergencyBuffer
  ) {
    return {
      status: "attention",
      reason: "Cash flow is positive, but upcoming commitments need attention.",
      availableMoney,
      mandatoryCommitments,
      debtToIncomeRatio
    };
  }

  return {
    status: "healthy",
    reason: "Mandatory expenses are covered with room left for savings or prepayment.",
    availableMoney,
    mandatoryCommitments,
    debtToIncomeRatio
  };
}
