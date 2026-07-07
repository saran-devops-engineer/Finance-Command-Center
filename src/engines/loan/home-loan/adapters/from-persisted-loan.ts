import type { Loan } from "@/shared/domain/finance";
import { getLoanStatus } from "@/lib/loan-status";
import type { HomeLoanSimulationSnapshot } from "@/engines/loan/home-loan/core/types";

export function snapshotFromPersistedLoan(loan: Loan): HomeLoanSimulationSnapshot {
  if (loan.type !== "home") {
    throw new Error("Expected a home loan.");
  }

  return {
    loanId: loan.id,
    outstandingPrincipal: loan.outstandingBalance,
    monthlyEmi: loan.monthlyEmi,
    annualInterestRate: loan.annualInterestRate,
    remainingTenureMonths: loan.remainingTenureMonths,
    loanStartDate: loan.loanStartDate ?? new Date().toISOString().slice(0, 10),
    emiPaymentDay: loan.emiPaymentDay ?? deriveEmiPaymentDay(loan.nextDueDate),
    asOfDate: new Date().toISOString().slice(0, 10),
    status: getLoanStatus(loan)
  };
}

export function trySnapshotFromPersistedLoan(loan: Loan): HomeLoanSimulationSnapshot | null {
  if (loan.type !== "home") {
    return null;
  }

  return snapshotFromPersistedLoan(loan);
}

function deriveEmiPaymentDay(nextDueDate: string | undefined): number {
  if (!nextDueDate) {
    return 1;
  }

  return new Date(`${nextDueDate.slice(0, 10)}T00:00:00`).getDate();
}
