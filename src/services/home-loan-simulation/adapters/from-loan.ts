import type { Loan } from "@/shared/domain/finance";
import type { HomeLoanSimulationInput } from "@/services/home-loan-simulation/types";

/**
 * Maps a persisted home loan to a simulation snapshot.
 * Uses ONLY current snapshot fields — never original loan amount.
 */
function toSimulationInput(loan: Loan): HomeLoanSimulationInput {
  return {
    loanId: loan.id,
    outstandingBalance: loan.outstandingBalance,
    annualInterestRate: loan.annualInterestRate,
    monthlyEmi: loan.monthlyEmi,
    remainingTenureMonths: loan.remainingTenureMonths,
    asOfDate: new Date().toISOString().slice(0, 10)
  };
}

export function assertHomeLoan(loan: Loan) {
  if (loan.type !== "home") {
    throw new Error("Simulation is only available for home loans.");
  }
}

export function fromLoan(loan: Loan): HomeLoanSimulationInput {
  assertHomeLoan(loan);
  return toSimulationInput(loan);
}

export function tryFromLoan(loan: Loan): HomeLoanSimulationInput | null {
  if (loan.type !== "home") {
    return null;
  }

  return toSimulationInput(loan);
}
