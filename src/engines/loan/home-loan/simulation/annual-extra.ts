import { monthlyInterestRate } from "@/engines/loan/home-loan/core/math";
import { buildDebugReport, compareSchedules } from "@/engines/loan/home-loan/core/comparison";
import { resolveFirstPaymentDate } from "@/engines/loan/home-loan/core/payment-dates";
import {
  buildAmortizationSchedule,
  buildBaselineSchedule
} from "@/engines/loan/home-loan/core/schedule-builder";
import type {
  AnnualExtraSimulationRequest,
  AnnualExtraSimulationResult
} from "@/engines/loan/home-loan/core/types";
import { validateAnnualExtra } from "@/engines/loan/home-loan/core/validation";

const MAX_EXTRA_MONTHS = 600;

/**
 * Builds a sparse extra-payment map that places the annual amount ONLY on the
 * schedule months whose calendar month matches the configured payment month.
 */
function buildAnnualExtraMap(
  amount: number,
  paymentMonth: number,
  firstPaymentMonth: number
): Record<number, number> {
  const map: Record<number, number> = {};

  for (let monthIndex = 0; monthIndex <= MAX_EXTRA_MONTHS; monthIndex += 1) {
    const calendarMonth = ((firstPaymentMonth - 1 + monthIndex) % 12) + 1;

    if (calendarMonth === paymentMonth) {
      map[monthIndex] = amount;
    }
  }

  return map;
}

export function simulateAnnualExtraPayment(
  request: AnnualExtraSimulationRequest
): AnnualExtraSimulationResult {
  const validation = validateAnnualExtra(request.snapshot, request.annualExtraAmount);
  const baseline = buildBaselineSchedule(request.snapshot);

  if (!validation.valid) {
    return {
      kind: "annual-extra",
      strategy: "reduce-tenure",
      valid: false,
      errors: validation.errors,
      warnings: validation.warnings,
      annualExtraAmount: request.annualExtraAmount,
      paymentMonth: request.paymentMonth,
      annualPaymentsMade: 0,
      totalExtraPaid: 0,
      newEmi: request.snapshot.monthlyEmi,
      newTenureMonths: baseline.tenureMonths,
      monthsSaved: 0,
      interestSaved: 0,
      closureDate: baseline.closureDate,
      comparison: compareSchedules(baseline, baseline)
    };
  }

  const firstPaymentDate = resolveFirstPaymentDate(
    request.snapshot.asOfDate,
    request.snapshot.emiPaymentDay
  );
  const firstPaymentMonth = new Date(`${firstPaymentDate}T00:00:00`).getMonth() + 1;

  const monthlyExtraByMonth = buildAnnualExtraMap(
    request.annualExtraAmount,
    request.paymentMonth,
    firstPaymentMonth
  );

  // Annual extra ALWAYS reduces tenure: EMI stays constant, extra clears principal.
  const simulated = buildAmortizationSchedule({
    openingPrincipal: request.snapshot.outstandingPrincipal,
    monthlyEmi: request.snapshot.monthlyEmi,
    annualInterestRate: request.snapshot.annualInterestRate,
    snapshot: request.snapshot,
    monthlyExtraByMonth
  });

  const annualPaymentsMade = simulated.rows.filter((row) => row.extraPayment > 0).length;
  const totalExtraPaid = simulated.rows.reduce((sum, row) => sum + row.extraPayment, 0);
  const comparison = compareSchedules(baseline, simulated);

  return {
    kind: "annual-extra",
    strategy: "reduce-tenure",
    valid: true,
    errors: [],
    warnings: validation.warnings,
    annualExtraAmount: request.annualExtraAmount,
    paymentMonth: request.paymentMonth,
    annualPaymentsMade,
    totalExtraPaid,
    newEmi: request.snapshot.monthlyEmi,
    newTenureMonths: simulated.tenureMonths,
    monthsSaved: comparison.monthsSaved,
    interestSaved: comparison.interestSaved,
    closureDate: simulated.closureDate,
    comparison,
    debug: request.debug
      ? buildDebugReport(
          {
            monthlyInterestRate: monthlyInterestRate(request.snapshot.annualInterestRate),
            emi: request.snapshot.monthlyEmi
          },
          baseline,
          simulated
        )
      : undefined
  };
}
