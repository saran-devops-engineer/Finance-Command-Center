import { monthlyInterestRate } from "@/engines/loan/home-loan/core/math";
import { buildDebugReport, compareSchedules } from "@/engines/loan/home-loan/core/comparison";
import {
  buildAmortizationSchedule,
  buildBaselineSchedule
} from "@/engines/loan/home-loan/core/schedule-builder";
import type {
  MonthlyExtraSimulationRequest,
  MonthlyExtraSimulationResult
} from "@/engines/loan/home-loan/core/types";
import { validateMonthlyExtra } from "@/engines/loan/home-loan/core/validation";

const MAX_EXTRA_MONTHS = 600;

function buildExtraPaymentMap(
  amount: number,
  startMonthIndex: number,
  endMonthIndex?: number
): Record<number, number> {
  const map: Record<number, number> = {};
  const end = endMonthIndex ?? MAX_EXTRA_MONTHS;

  for (let monthIndex = startMonthIndex; monthIndex <= end; monthIndex += 1) {
    map[monthIndex] = amount;
  }

  return map;
}

export function simulateMonthlyExtraPayment(
  request: MonthlyExtraSimulationRequest
): MonthlyExtraSimulationResult {
  const validation = validateMonthlyExtra(request.snapshot, request.monthlyExtraAmount);
  const baseline = buildBaselineSchedule(request.snapshot);

  if (!validation.valid) {
    return {
      kind: "monthly-extra",
      strategy: request.strategy,
      valid: false,
      errors: validation.errors,
      warnings: validation.warnings,
      monthlyExtraAmount: request.monthlyExtraAmount,
      totalExtraPaid: 0,
      newEmi: request.snapshot.monthlyEmi,
      newTenureMonths: baseline.tenureMonths,
      monthsSaved: 0,
      interestSaved: 0,
      closureDate: baseline.closureDate,
      comparison: compareSchedules(baseline, baseline)
    };
  }

  const startMonthIndex = request.startMonthIndex ?? 0;
  const monthlyExtraByMonth = buildExtraPaymentMap(
    request.monthlyExtraAmount,
    startMonthIndex,
    request.endMonthIndex
  );

  const r = monthlyInterestRate(request.snapshot.annualInterestRate);

  if (request.strategy === "reduce-emi") {
    // Keep the (derived) tenure fixed; the extra principal lowers the EMI each
    // month as the balance is re-amortized over the remaining months.
    const simulated = buildAmortizationSchedule({
      openingPrincipal: request.snapshot.outstandingPrincipal,
      monthlyEmi: request.snapshot.monthlyEmi,
      annualInterestRate: request.snapshot.annualInterestRate,
      snapshot: request.snapshot,
      monthlyExtraByMonth,
      recalculateEmiToTenure: baseline.tenureMonths
    });

    const firstRow = simulated.rows[startMonthIndex];
    const newEmi = firstRow?.emi ?? request.snapshot.monthlyEmi;
    const totalExtraPaid = simulated.rows.reduce((sum, row) => sum + row.extraPayment, 0);
    const comparison = compareSchedules(baseline, simulated);

    return {
      kind: "monthly-extra",
      strategy: "reduce-emi",
      valid: true,
      errors: [],
      warnings: validation.warnings,
      monthlyExtraAmount: request.monthlyExtraAmount,
      totalExtraPaid,
      newEmi,
      newTenureMonths: simulated.tenureMonths,
      monthsSaved: comparison.monthsSaved,
      interestSaved: comparison.interestSaved,
      closureDate: simulated.closureDate,
      comparison,
      debug: request.debug
        ? buildDebugReport(
            { monthlyInterestRate: r, emi: newEmi },
            baseline,
            simulated
          )
        : undefined
    };
  }

  const simulated = buildAmortizationSchedule({
    openingPrincipal: request.snapshot.outstandingPrincipal,
    monthlyEmi: request.snapshot.monthlyEmi,
    annualInterestRate: request.snapshot.annualInterestRate,
    snapshot: request.snapshot,
    monthlyExtraByMonth
  });

  const totalExtraPaid = simulated.rows.reduce((sum, row) => sum + row.extraPayment, 0);
  const comparison = compareSchedules(baseline, simulated);

  return {
    kind: "monthly-extra",
    strategy: "reduce-tenure",
    valid: true,
    errors: [],
    warnings: validation.warnings,
    monthlyExtraAmount: request.monthlyExtraAmount,
    totalExtraPaid,
    newEmi: request.snapshot.monthlyEmi,
    newTenureMonths: simulated.tenureMonths,
    monthsSaved: comparison.monthsSaved,
    interestSaved: comparison.interestSaved,
    closureDate: simulated.closureDate,
    comparison,
    debug: request.debug
      ? buildDebugReport(
          { monthlyInterestRate: r, emi: request.snapshot.monthlyEmi },
          baseline,
          simulated
        )
      : undefined
  };
}
