import type { FinanceDataSnapshot } from "@/shared/domain/finance";

/**
 * Verifies that IndexedDB reflects the restored snapshot after replaceAllData.
 * Throws if counts or presence flags do not match — restore is rolled back
 * only by the caller (we do not auto-rollback; caller must not notify UI).
 */
export function verifyRestoredSnapshot(
  expected: FinanceDataSnapshot,
  actual: FinanceDataSnapshot
): void {
  if (expected.loans.length !== actual.loans.length) {
    throw new Error(
      `Restore verification failed: expected ${expected.loans.length} loans, found ${actual.loans.length}.`
    );
  }

  if (expected.loanPayments.length !== actual.loanPayments.length) {
    throw new Error(
      `Restore verification failed: expected ${expected.loanPayments.length} payments, found ${actual.loanPayments.length}.`
    );
  }

  if (expected.upcomingDues.length !== actual.upcomingDues.length) {
    throw new Error(
      `Restore verification failed: expected ${expected.upcomingDues.length} dues, found ${actual.upcomingDues.length}.`
    );
  }

  if (Boolean(expected.profile) !== Boolean(actual.profile)) {
    throw new Error("Restore verification failed: profile presence mismatch.");
  }

  if (Boolean(expected.moneyBreakdown) !== Boolean(actual.moneyBreakdown)) {
    throw new Error("Restore verification failed: money breakdown presence mismatch.");
  }

  const expectedLoanIds = new Set(expected.loans.map((loan) => loan.id));
  for (const loan of actual.loans) {
    if (!expectedLoanIds.has(loan.id)) {
      throw new Error(`Restore verification failed: unexpected loan ${loan.id}.`);
    }
  }
}

/**
 * After a successful restore, clear pinned loan if it no longer exists.
 */
export function shouldClearPinnedLoan(
  pinnedLoanId: string | null,
  restoredLoans: FinanceDataSnapshot["loans"]
): boolean {
  if (!pinnedLoanId) {
    return false;
  }

  return !restoredLoans.some((loan) => loan.id === pinnedLoanId);
}
