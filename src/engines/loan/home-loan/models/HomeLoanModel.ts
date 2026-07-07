import type { HomeLoanSnapshot } from "@/engines/loan/home-loan/types/LoanInterfaces";

/**
 * Domain model wrapper for a Home Loan contract at a point in time.
 * Keeps engine logic independent from app `Loan` persistence shape.
 *
 * @todo Map from `shared/domain/finance.Loan` via a dedicated adapter.
 * @todo Enforce handbook invariants from docs/handbook/loan-engine/home-loan/002-domain-model.md
 */
export class HomeLoanModel {
  constructor(readonly snapshot: HomeLoanSnapshot) {}

  get loanId(): string {
    return this.snapshot.loanId;
  }

  /** @todo Derive completion state once closure rules are defined. */
  isClosed(): boolean {
    return this.snapshot.outstandingPrincipal <= 0;
  }

  /** @todo Replace with banking-rule-backed tenure derivation. */
  projectedRemainingMonths(): number {
    return this.snapshot.remainingTenureMonths;
  }
}
