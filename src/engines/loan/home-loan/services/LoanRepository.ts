import type { HomeLoanSnapshot } from "@/engines/loan/home-loan/types/LoanInterfaces";

/**
 * Read-only port for loading Home Loan data into the engine.
 * Implementations live outside the engine (IndexedDB adapter, backup import, etc.).
 *
 * The engine must never import React or browser storage directly.
 */
export interface LoanRepository {
  getHomeLoanSnapshot(loanId: string): Promise<HomeLoanSnapshot | null>;
  listHomeLoanSnapshots?(): Promise<HomeLoanSnapshot[]>;
}

/**
 * @todo Implement adapter from `indexedDbFinanceRepository` + `from-loan` mapper.
 * @todo Support historical payment replay for accurate amortization.
 */
export class UnimplementedLoanRepository implements LoanRepository {
  getHomeLoanSnapshot(_loanId: string): Promise<HomeLoanSnapshot | null> {
    return Promise.reject(
      new Error("LoanRepository is not implemented. Wire an adapter in Phase 2.")
    );
  }
}

export const loanRepository: LoanRepository = new UnimplementedLoanRepository();
