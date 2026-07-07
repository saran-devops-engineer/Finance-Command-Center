import type { Loan, LoanStatus } from "@/shared/domain/finance";

export function getLoanStatus(loan: Loan): LoanStatus {
  return loan.status ?? "active";
}

export function isActiveLoan(loan: Loan) {
  return getLoanStatus(loan) === "active";
}

export function isVisibleLoan(loan: Loan) {
  return getLoanStatus(loan) !== "deleted";
}

export function normalizeLoan(loan: Loan): Loan {
  return {
    ...loan,
    status: getLoanStatus(loan)
  };
}

export function filterActiveLoans(loans: Loan[]) {
  return loans.filter(isActiveLoan);
}
