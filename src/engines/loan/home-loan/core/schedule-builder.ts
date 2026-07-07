import { monthlyInterestRate } from "@/engines/loan/home-loan/core/math";
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
  snapshot: Pick<HomeLoanSimulationSnapshot, "asOfDate" | "emiPaymentDay" | "loanStartDate">;
  /** Lump sum applied before the first EMI month */
  upfrontPrincipalReduction?: number;
  /** Extra principal applied after EMI each month (0-based index) */
  monthlyExtraByMonth?: Record<number, number>;
  /** When set, recalculate EMI each month after extra payment (reduce-EMI strategy) */
  recalculateEmiEachMonth?: boolean;
  /** Cap iterations when reduce-EMI keeps tenure fixed */
  fixedTenureMonths?: number;
}

/**
 * STEP 3 — Reducing-balance amortization.
 * Generates every month until closing balance <= 0.
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
    if (
      options.fixedTenureMonths !== undefined &&
      monthIndex >= options.fixedTenureMonths
    ) {
      break;
    }

    let monthlyEmi = options.monthlyEmi;

    if (options.recalculateEmiEachMonth) {
      const remainingMonths = (options.fixedTenureMonths ?? MAX_SCHEDULE_MONTHS) - monthIndex;

      if (remainingMonths <= 0) {
        break;
      }

      monthlyEmi = calculateEmiForRemaining(openingBalance, r, remainingMonths);
    }

    const interest = openingBalance * r;
    let principal = monthlyEmi - interest;

    if (principal >= openingBalance) {
      principal = openingBalance;
    }

    if (principal < 0) {
      principal = 0;
    }

    const emi = interest + principal;
    let closingBalance = openingBalance - principal;

    const extraPayment = Math.min(
      options.monthlyExtraByMonth?.[monthIndex] ?? 0,
      closingBalance
    );

    closingBalance -= extraPayment;

    cumulativeInterest += interest;
    cumulativePrincipal += principal + extraPayment;

    rows.push({
      monthNumber: monthIndex + 1,
      paymentDate: paymentDateForMonth(
        firstPaymentDate,
        monthIndex,
        options.snapshot.emiPaymentDay
      ),
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

    if (openingBalance <= 0) {
      break;
    }
  }

  return summarizeSchedule(rows);
}

export function buildBaselineSchedule(
  snapshot: HomeLoanSimulationSnapshot
): AmortizationSchedule {
  return buildAmortizationSchedule({
    openingPrincipal: snapshot.outstandingPrincipal,
    monthlyEmi: snapshot.monthlyEmi,
    annualInterestRate: snapshot.annualInterestRate,
    snapshot
  });
}

function calculateEmiForRemaining(principal: number, monthlyRate: number, months: number): number {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  if (monthlyRate <= 0) {
    return principal / months;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

function summarizeSchedule(rows: AmortizationScheduleRow[]): AmortizationSchedule {
  const totalInterest = rows.reduce((sum, row) => sum + row.interest, 0);
  const totalPrincipal = rows.reduce(
    (sum, row) => sum + row.principal + row.extraPayment,
    0
  );
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
