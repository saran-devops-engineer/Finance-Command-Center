import type { Loan } from "@/shared/domain/finance";
import { estimateRemainingMonths } from "@/shared/finance/loan-tenure";

export interface PrepaymentSimulation {
  prepaymentAmount: number;
  revisedOutstanding: number;
  estimatedMonthsSaved: number;
  estimatedInterestSaved: number;
  originalMonths: number;
  revisedMonths: number;
}

/**
 * Shortcut prepayment estimate for NON-home loans only. Home loans must use the
 * banking-grade amortization engine (HomeLoanAmortizationEngine) — never this.
 */
export function simulatePrepayment(
  loan: Loan,
  prepaymentAmount: number
): PrepaymentSimulation {
  if (loan.type === "home") {
    throw new Error(
      "Home loans must be simulated with HomeLoanAmortizationEngine, not the shortcut estimator."
    );
  }

  const safePrepayment = Math.min(Math.max(prepaymentAmount, 0), loan.outstandingBalance);
  const revisedOutstanding = loan.outstandingBalance - safePrepayment;
  const monthlyRate = loan.annualInterestRate / 12 / 100;

  const originalMonths = estimateRemainingMonths({
    principal: loan.outstandingBalance,
    monthlyRate,
    monthlyPayment: loan.monthlyEmi,
    fallbackMonths: loan.remainingTenureMonths
  });

  const revisedMonths = estimateRemainingMonths({
    principal: revisedOutstanding,
    monthlyRate,
    monthlyPayment: loan.monthlyEmi,
    fallbackMonths: Math.max(loan.remainingTenureMonths - 1, 0)
  });

  const originalInterest = Math.max(originalMonths * loan.monthlyEmi - loan.outstandingBalance, 0);
  const revisedInterest = Math.max(revisedMonths * loan.monthlyEmi - revisedOutstanding, 0);

  return {
    prepaymentAmount: safePrepayment,
    revisedOutstanding,
    estimatedMonthsSaved: Math.max(originalMonths - revisedMonths, 0),
    estimatedInterestSaved: Math.max(originalInterest - revisedInterest, 0),
    originalMonths,
    revisedMonths
  };
}
