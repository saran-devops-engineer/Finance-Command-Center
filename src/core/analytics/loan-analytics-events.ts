import { AppEvent } from "@/core/analytics/events";
import { trackApplicationEvent } from "@/core/analytics/track-application-event";
import type { Loan } from "@/shared/domain/finance";

export function trackLoanCreatedEvent(loan: Pick<Loan, "id" | "type">) {
  if (loan.type === "gold") {
    trackApplicationEvent(AppEvent.GOLD_LOAN_CREATED, { loan_id: loan.id });
    return;
  }

  if (loan.type === "home") {
    trackApplicationEvent(AppEvent.HOME_LOAN_CREATED, { loan_id: loan.id });
  }
}

export function trackLoanUpdatedEvent(loan: Pick<Loan, "id" | "type">) {
  if (loan.type === "gold") {
    trackApplicationEvent(AppEvent.GOLD_LOAN_UPDATED, { loan_id: loan.id });
    return;
  }

  if (loan.type === "home") {
    trackApplicationEvent(AppEvent.HOME_LOAN_UPDATED, { loan_id: loan.id });
  }
}

export function trackLoanArchivedEvent(loan: Pick<Loan, "id" | "type">) {
  if (loan.type === "gold") {
    trackApplicationEvent(AppEvent.GOLD_LOAN_ARCHIVED, { loan_id: loan.id });
    return;
  }

  if (loan.type === "home") {
    trackApplicationEvent(AppEvent.HOME_LOAN_ARCHIVED, { loan_id: loan.id });
  }
}

export function trackLoanDeletedEvent(loan: Pick<Loan, "id" | "type">) {
  if (loan.type === "gold") {
    trackApplicationEvent(AppEvent.GOLD_LOAN_DELETED, { loan_id: loan.id });
    return;
  }

  if (loan.type === "home") {
    trackApplicationEvent(AppEvent.HOME_LOAN_DELETED, { loan_id: loan.id });
  }
}

export function trackLoanViewedEvent(loan: Pick<Loan, "id" | "type">) {
  if (loan.type === "gold") {
    trackApplicationEvent(AppEvent.GOLD_LOAN_VIEWED, { loan_id: loan.id });
    return;
  }

  if (loan.type === "home") {
    trackApplicationEvent(AppEvent.HOME_LOAN_VIEWED, { loan_id: loan.id });
  }
}
