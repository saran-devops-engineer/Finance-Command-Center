import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";
import { trySnapshotFromPersistedLoan } from "@/engines/loan/home-loan/adapters/from-persisted-loan";
import { resolveFirstPaymentDate } from "@/engines/loan/home-loan/core/payment-dates";
import { buildBaselineSchedule } from "@/engines/loan/home-loan/core/schedule-builder";
import type { TargetClosureSearchStep } from "@/engines/loan/home-loan/core/types";
import type { Loan } from "@/shared/domain/finance";

export interface TargetClosureSimulationView {
  isHomeLoan: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
  targetDate: string;
  targetMonths: number;
  achievable: boolean;
  requiredMonthlyExtra: number;
  currentEmi: number;
  currentClosureDate: string | null;
  expectedClosureDate: string | null;
  interestSaved: number;
  monthsSaved: number;
  totalExtraPaid: number;
  originalMonths: number;
  newMonths: number;
  searchIterations: number;
  searchSteps: TargetClosureSearchStep[];
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Converts a target calendar date into the number of EMI payments that fall on
 * or before it, aligned with how the amortization engine dates each month.
 */
function computeTargetMonths(
  firstPaymentDate: string,
  targetDate: string,
  emiPaymentDay: number
): number {
  const first = new Date(`${firstPaymentDate.slice(0, 10)}T00:00:00`);
  const target = new Date(`${targetDate.slice(0, 10)}T00:00:00`);

  const monthDiff =
    (target.getFullYear() - first.getFullYear()) * 12 + (target.getMonth() - first.getMonth());

  const payDayInTargetMonth = Math.min(
    emiPaymentDay,
    daysInMonth(target.getFullYear(), target.getMonth())
  );
  const includesTargetMonth = target.getDate() >= payDayInTargetMonth;

  return monthDiff + (includesTargetMonth ? 1 : 0);
}

function invalidView(
  loan: Loan,
  targetDate: string,
  errors: string[]
): TargetClosureSimulationView {
  return {
    isHomeLoan: true,
    valid: false,
    errors,
    warnings: [],
    targetDate,
    targetMonths: 0,
    achievable: false,
    requiredMonthlyExtra: 0,
    currentEmi: loan.monthlyEmi,
    currentClosureDate: null,
    expectedClosureDate: null,
    interestSaved: 0,
    monthsSaved: 0,
    totalExtraPaid: 0,
    originalMonths: 0,
    newMonths: 0,
    searchIterations: 0,
    searchSteps: []
  };
}

/**
 * Target Closure Date — computes the minimum monthly extra required to close by
 * the chosen date. Home loans only. Reuses the Monthly Extra engine end-to-end;
 * the persisted loan is never mutated (we simulate on a derived snapshot).
 */
export function simulateTargetClosure(
  loan: Loan,
  targetDate: string,
  debug = false
): TargetClosureSimulationView | null {
  const snapshot = trySnapshotFromPersistedLoan(loan);

  if (!snapshot) {
    return null;
  }

  const today = snapshot.asOfDate.slice(0, 10);
  const target = targetDate.slice(0, 10);

  if (!target) {
    return invalidView(loan, targetDate, ["Select a target closure date."]);
  }

  if (target <= today) {
    return invalidView(loan, targetDate, ["Target closure date must be in the future."]);
  }

  const baseline = buildBaselineSchedule(snapshot);
  const firstPaymentDate = resolveFirstPaymentDate(snapshot.asOfDate, snapshot.emiPaymentDay);
  const targetMonths = computeTargetMonths(firstPaymentDate, target, snapshot.emiPaymentDay);

  if (targetMonths < 1) {
    return invalidView(loan, targetDate, ["Target closure date is too soon for a monthly plan."]);
  }

  if (targetMonths >= baseline.tenureMonths) {
    return invalidView(loan, targetDate, [
      "Target date must be earlier than your current closure date."
    ]);
  }

  const result = homeLoanAmortizationEngine.simulateTargetClosure({
    snapshot,
    targetMonths,
    debug
  });

  return {
    isHomeLoan: true,
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    targetDate: target,
    targetMonths: result.targetMonths,
    achievable: result.achievable,
    requiredMonthlyExtra: result.requiredMonthlyExtra,
    currentEmi: snapshot.monthlyEmi,
    currentClosureDate: baseline.closureDate,
    expectedClosureDate: result.closureDate,
    interestSaved: result.interestSaved,
    monthsSaved: result.monthsSaved,
    totalExtraPaid: result.totalExtraPaid,
    originalMonths: result.comparison.original.tenureMonths,
    newMonths: result.comparison.simulated.tenureMonths,
    searchIterations: result.searchIterations,
    searchSteps: result.searchSteps ?? []
  };
}
