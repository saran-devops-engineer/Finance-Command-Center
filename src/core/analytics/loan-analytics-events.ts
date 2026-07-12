import { AppEvent } from "@/core/events/app-events";
import { trackApplicationEvent } from "@/core/analytics/track-application-event";
import type { Loan } from "@/shared/domain/finance";

export function trackLoanCreatedEvent(loan: Pick<Loan, "id" | "type">) {
  if (loan.type === "gold") {
    trackApplicationEvent(AppEvent.GOLD_LOAN_CREATED, { loanId: loan.id });
    return;
  }

  if (loan.type === "home") {
    trackApplicationEvent(AppEvent.HOME_LOAN_CREATED, { loanId: loan.id });
  }
}

export function trackLoanUpdatedEvent(loan: Pick<Loan, "id" | "type">) {
  if (loan.type === "gold") {
    trackApplicationEvent(AppEvent.GOLD_LOAN_UPDATED, { loanId: loan.id });
    return;
  }

  if (loan.type === "home") {
    trackApplicationEvent(AppEvent.HOME_LOAN_UPDATED, { loanId: loan.id });
  }
}

export function trackLoanArchivedEvent(loan: Pick<Loan, "id" | "type">) {
  if (loan.type === "gold") {
    trackApplicationEvent(AppEvent.GOLD_LOAN_ARCHIVED, { loanId: loan.id });
    return;
  }

  if (loan.type === "home") {
    trackApplicationEvent(AppEvent.HOME_LOAN_ARCHIVED, { loanId: loan.id });
  }
}

export function trackLoanDeletedEvent(loan: Pick<Loan, "id" | "type">) {
  if (loan.type === "home") {
    trackApplicationEvent(AppEvent.HOME_LOAN_DELETED, { loanId: loan.id });
  }
}
