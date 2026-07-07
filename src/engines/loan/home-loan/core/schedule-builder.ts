import { calculateEmi, monthlyInterestRate } from "@/engines/loan/home-loan/core/math";
import { paymentDateForMonth, resolveFirstPaymentDate } from "@/engines/loan/home-loan/core/payment-dates";
import type {
  AmortizationSchedule,
  AmortizationScheduleRow,
  HomeLoanSimulationSnapshot
} from "@/engines/loan/home-loan/core/types";

const MAX_SCHEDULE_MONTHS = 600;

export interface BuildScheduleOptions {
  openingPrincipal: number;
  monthlyEmi: number;
  annualInterestRate: number;
  snapshot: Pick<HomeLoanSimulationSnapshot, "asOfDate" | "emiPaymentDay">;
  /** Lump sum applied to principal before the first EMI month */
  upfrontPrincipalReduction?: number;
  /** Extra principal applied after EMI each month (0-based index) */
  monthlyExtraByMonth?: Record<number, number>;
  /**
   * Reduce-EMI behaviour: recompute the EMI each month so the balance amortizes
   * over the remaining months of this target tenure (keeps tenure fixed).
   */
  recalculateEmiToTenure?: number;
}

/**
 * STEP 3 — Reducing-balance amortization.
 *
 * Runs month-by-month until the balance is cleared. Tenure is ALWAYS derived
 * from the schedule; it is never forced. The final month naturally carries a
 * smaller EMI when the last principal chunk is below a full instalment.
 */
export function buildAmortizationSchedule(options: BuildScheduleOptions): AmortizationSchedule {
  const r = monthlyInterestRate(options.annualInterestRate);
  let openingBalance = Math.max(options.openingPrincipal - (options.upfrontPrincipalReduction ?? 0), 0);

  if (openingBalance <= 0) {
    return emptySchedule();
  }

  const firstPaymentDate = resolveFirstPaymentDate(
    options.snapshot.asOfDate,
    options.snapshot.emiPaymentDay
  );

  const rows: AmortizationScheduleRow[] = [];
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  let monthIndex = 0;

  while (openingBalance > 0 && monthIndex < MAX_SCHEDULE_MONTHS) {
    const monthlyEmi = resolveMonthlyEmi(options, openingBalance, monthIndex);
    const interest = openingBalance * r;
    let principal = monthlyEmi - interest;

    // EMI cannot cover the accruing interest — the loan will never amortize.
    if (principal <= 0 && (options.monthlyExtraByMonth?.[monthIndex] ?? 0) <= 0) {
      break;
    }

    // Natural final month: last chunk is smaller than a full instalment.
    if (principal > openingBalance) {
      principal = openingBalance;
    }

    if (principal < 0) {
      principal = 0;
    }

    const emi = interest + principal;
    let closingBalance = openingBalance - principal;

    const extraPayment = Math.min(options.monthlyExtraByMonth?.[monthIndex] ?? 0, closingBalance);
    closingBalance -= extraPayment;

    cumulativeInterest += interest;
    cumulativePrincipal += principal + extraPayment;

    rows.push({
      monthNumber: monthIndex + 1,
      paymentDate: paymentDateForMonth(firstPaymentDate, monthIndex, options.snapshot.emiPaymentDay),
      openingBalance,
      interest,
      principal,
      emi,
      extraPayment,
      closingBalance: Math.max(closingBalance, 0),
      cumulativeInterest,
      cumulativePrincipal
    });

    monthIndex += 1;
    openingBalance = closingBalance;
  }

  return summarizeSchedule(rows);
}

/**
 * Baseline projection — canonical basis is the current EMI. The stored
 * remaining-tenure field is display-only and is NOT used to bound the schedule.
 */
export function buildBaselineSchedule(snapshot: HomeLoanSimulationSnapshot): AmortizationSchedule {
  return buildAmortizationSchedule({
    openingPrincipal: snapshot.outstandingPrincipal,
    monthlyEmi: snapshot.monthlyEmi,
    annualInterestRate: snapshot.annualInterestRate,
    snapshot
  });
}

function resolveMonthlyEmi(
  options: BuildScheduleOptions,
  openingBalance: number,
  monthIndex: number
): number {
  if (options.recalculateEmiToTenure === undefined) {
    return options.monthlyEmi;
  }

  const remainingMonths = options.recalculateEmiToTenure - monthIndex;

  if (remainingMonths <= 0) {
    return openingBalance;
  }

  return calculateEmi(openingBalance, options.annualInterestRate, remainingMonths);
}

function summarizeSchedule(rows: AmortizationScheduleRow[]): AmortizationSchedule {
  const totalInterest = rows.reduce((sum, row) => sum + row.interest, 0);
  const totalPrincipal = rows.reduce((sum, row) => sum + row.principal + row.extraPayment, 0);
  const totalPayments = rows.reduce((sum, row) => sum + row.emi + row.extraPayment, 0);
  const lastRow = rows.at(-1);

  return {
    rows,
    totalInterest,
    totalPrincipal,
    totalPayments,
    tenureMonths: rows.length,
    closureDate: lastRow?.paymentDate ?? null
  };
}

function emptySchedule(): AmortizationSchedule {
  return {
    rows: [],
    totalInterest: 0,
    totalPrincipal: 0,
    totalPayments: 0,
    tenureMonths: 0,
    closureDate: null
  };
}
