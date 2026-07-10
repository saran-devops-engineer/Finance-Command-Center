import type { Loan, LoanStatus } from "@/shared/domain/finance";
import { migrateLegacyHomeLoan } from "@/shared/finance/home-loan-form";
import { migrateGoldLoan } from "@/shared/finance/gold-loan-form";

export function getLoanStatus(loan: Loan): LoanStatus {
  return loan.status ?? "active";
}

export function isActiveLoan(loan: Loan) {
  return getLoanStatus(loan) === "active";
}

export function isArchivedLoan(loan: Loan) {
  return getLoanStatus(loan) === "archived";
}

export function isVisibleLoan(loan: Loan) {
  return getLoanStatus(loan) !== "deleted";
}

export function normalizeLoan(loan: Loan): Loan {
  return migrateGoldLoan(
    migrateLegacyHomeLoan({
      ...loan,
      status: getLoanStatus(loan)
    })
  );
}

export function filterActiveLoans(loans: Loan[]) {
  return loans.filter(isActiveLoan);
}

export function filterArchivedLoans(loans: Loan[]) {
  return loans.filter(isArchivedLoan);
}
