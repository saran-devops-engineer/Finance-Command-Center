import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";
import { trySnapshotFromPersistedLoan } from "@/engines/loan/home-loan/adapters/from-persisted-loan";
import type { AmortizationScheduleRow } from "@/engines/loan/home-loan/core/types";
import type { Loan } from "@/shared/domain/finance";

export interface MonthlyExtraSimulationView {
  isHomeLoan: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
  monthlyExtraAmount: number;
  originalMonths: number;
  newMonths: number;
  monthsSaved: number;
  interestSaved: number;
  totalExtraPaid: number;
  totalPaid: number;
  originalTotalInterest: number;
  simulatedTotalInterest: number;
  originalTotalPayments: number;
  originalClosureDate: string | null;
  newClosureDate: string | null;
  scheduleRows: AmortizationScheduleRow[];
}

/**
 * Monthly Extra Payment — ALWAYS reduces tenure (no strategy selection).
 * Home loans only. All figures come from the shared amortization engine; the
 * persisted loan is never mutated (we simulate on a derived snapshot).
 */
export function simulateMonthlyExtra(
  loan: Loan,
  monthlyExtraAmount: number,
  debug = false
): MonthlyExtraSimulationView | null {
  const snapshot = trySnapshotFromPersistedLoan(loan);

  if (!snapshot) {
    return null;
  }

  const result = homeLoanAmortizationEngine.simulateMonthlyExtra({
    snapshot,
    monthlyExtraAmount,
    strategy: "reduce-tenure",
    debug
  });

  const original = result.comparison.original;
  const simulated = result.comparison.simulated;

  return {
    isHomeLoan: true,
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    monthlyExtraAmount: result.monthlyExtraAmount,
    originalMonths: original.tenureMonths,
    newMonths: simulated.tenureMonths,
    monthsSaved: result.monthsSaved,
    interestSaved: result.interestSaved,
    totalExtraPaid: result.totalExtraPaid,
    totalPaid: simulated.totalPayments,
    originalTotalInterest: original.totalInterest,
    simulatedTotalInterest: simulated.totalInterest,
    originalTotalPayments: original.totalPayments,
    originalClosureDate: original.closureDate,
    newClosureDate: result.closureDate,
    scheduleRows: simulated.rows
  };
}
