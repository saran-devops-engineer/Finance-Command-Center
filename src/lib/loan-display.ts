import { formatInr } from "@/lib/utils";
import type { Loan } from "@/shared/domain/finance";

export function formatLoanTypeLabel(loan: Loan) {
  if (loan.type === "custom" && loan.customTypeName) {
    return loan.customTypeName;
  }

  return loan.type.replace("-", " ");
}

export function formatLoanDate(value: string | undefined) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function getCompletionDateLabel(loan: Loan) {
  return formatLoanDate(loan.estimatedClosureDate || loan.archivedAt);
}

export function getArchiveDateLabel(loan: Loan) {
  return formatLoanDate(loan.archivedAt);
}

export function getOutstandingLabel(loan: Loan) {
  return formatInr(loan.outstandingBalance);
}
