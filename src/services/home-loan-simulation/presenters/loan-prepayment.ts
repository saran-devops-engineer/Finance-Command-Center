import { homeLoanSimulationEngine, tryFromLoan } from "@/services/home-loan-simulation";
import { simulatePrepayment } from "@/services/loan-projection/prepayment";
import type { Loan } from "@/shared/domain/finance";

export type LoanPrepaymentStrategy = "reduce-tenure" | "reduce-emi";

export interface LoanPrepaymentSimulationView {
  prepaymentAmount: number;
  estimatedInterestSaved: number;
  estimatedMonthsSaved: number;
  originalMonths: number;
  revisedMonths: number;
  revisedEmi?: number;
  strategy: LoanPrepaymentStrategy;
  isHomeLoan: boolean;
}

export function simulateLoanPrepayment(
  loan: Loan,
  prepaymentAmount: number,
  strategy: LoanPrepaymentStrategy
): LoanPrepaymentSimulationView {
  const homeLoanInput = tryFromLoan(loan);

  if (homeLoanInput) {
    const result = homeLoanSimulationEngine.simulate(homeLoanInput, {
      kind: strategy === "reduce-tenure" ? "prepay-reduce-tenure" : "prepay-reduce-emi",
      prepaymentAmount
    });

    return {
      prepaymentAmount:
        homeLoanInput.outstandingBalance - result.outcome.revisedOutstanding,
      estimatedInterestSaved: result.outcome.interestSaved,
      estimatedMonthsSaved: result.outcome.monthsSaved,
      originalMonths: result.baseline.remainingMonths,
      revisedMonths: result.outcome.remainingMonths,
      revisedEmi: result.outcome.revisedEmi,
      strategy,
      isHomeLoan: true
    };
  }

  const generic = simulatePrepayment(loan, prepaymentAmount);

  return {
    prepaymentAmount: generic.prepaymentAmount,
    estimatedInterestSaved: generic.estimatedInterestSaved,
    estimatedMonthsSaved: generic.estimatedMonthsSaved,
    originalMonths: generic.originalMonths,
    revisedMonths: generic.revisedMonths,
    strategy: "reduce-tenure",
    isHomeLoan: false
  };
}
