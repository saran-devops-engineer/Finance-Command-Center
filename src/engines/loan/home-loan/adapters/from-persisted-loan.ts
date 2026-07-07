import type { Loan } from "@/shared/domain/finance";
import type { HomeLoanSnapshot } from "@/engines/loan/home-loan/types/LoanInterfaces";
import { getLoanStatus } from "@/lib/loan-status";

/**
 * Maps persisted Home Loan V1 data to the Phase 2 engine snapshot.
 * Simulation starts from the current snapshot only.
 */
export function homeLoanSnapshotFromPersistedLoan(loan: Loan): HomeLoanSnapshot {
  if (loan.type !== "home") {
    throw new Error("Expected a home loan.");
  }

  return {
    loanId: loan.id,
    lender: loan.lender,
    originalPrincipal: loan.originalAmount,
    outstandingPrincipal: loan.outstandingBalance,
    annualInterestRate: loan.annualInterestRate,
    monthlyEmi: loan.monthlyEmi,
    remainingTenureMonths: loan.remainingTenureMonths,
    asOfDate: new Date().toISOString().slice(0, 10),
    nextDueDate: loan.nextDueDate,
    estimatedClosureDate: loan.estimatedClosureDate,
    status: getLoanStatus(loan)
  };
}

export function tryHomeLoanSnapshotFromPersistedLoan(loan: Loan): HomeLoanSnapshot | null {
  if (loan.type !== "home") {
    return null;
  }

  return homeLoanSnapshotFromPersistedLoan(loan);
}
