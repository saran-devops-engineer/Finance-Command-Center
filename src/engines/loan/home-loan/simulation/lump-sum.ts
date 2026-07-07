import {
  calculateEmi,
  calculateTenureMonths,
  monthlyInterestRate
} from "@/engines/loan/home-loan/core/math";
import { buildDebugReport, compareSchedules } from "@/engines/loan/home-loan/core/comparison";
import {
  buildAmortizationSchedule,
  buildBaselineSchedule
} from "@/engines/loan/home-loan/core/schedule-builder";
import type {
  ForeclosureSimulationRequest,
  LumpSumSimulationRequest,
  LumpSumSimulationResult
} from "@/engines/loan/home-loan/core/types";
import { validatePayment } from "@/engines/loan/home-loan/core/validation";

function invalidLumpSumResult(
  request: LumpSumSimulationRequest,
  errors: string[],
  warnings: string[] = []
): LumpSumSimulationResult {
  const baseline = buildBaselineSchedule(request.snapshot);

  return {
    kind: request.paymentAmount >= request.snapshot.outstandingPrincipal ? "foreclosure" : "lump-sum",
    strategy: request.strategy,
    valid: false,
    errors,
    warnings,
    prepaymentAmount: 0,
    newOutstanding: request.snapshot.outstandingPrincipal,
    newEmi: request.snapshot.monthlyEmi,
    newTenureMonths: baseline.tenureMonths,
    monthsSaved: 0,
    interestSaved: 0,
    closureDate: baseline.closureDate,
    comparison: compareSchedules(baseline, baseline)
  };
}

export function simulateLumpSumPayment(request: LumpSumSimulationRequest): LumpSumSimulationResult {
  const validation = validatePayment(request.snapshot, request.paymentAmount);

  if (!validation.valid) {
    return invalidLumpSumResult(request, validation.errors, validation.warnings);
  }

  const baseline = buildBaselineSchedule(request.snapshot);
  const isForeclosure = request.paymentAmount >= request.snapshot.outstandingPrincipal;

  if (isForeclosure) {
    return simulateForeclosure({
      snapshot: request.snapshot,
      settlementAmount: request.paymentAmount,
      debug: request.debug
    });
  }

  const newOutstanding = request.snapshot.outstandingPrincipal - request.paymentAmount;
  const r = monthlyInterestRate(request.snapshot.annualInterestRate);

  if (request.strategy === "reduce-emi") {
    const newEmi = calculateEmi(
      newOutstanding,
      request.snapshot.annualInterestRate,
      request.snapshot.remainingTenureMonths
    );

    const simulated = buildAmortizationSchedule({
      openingPrincipal: request.snapshot.outstandingPrincipal,
      monthlyEmi: newEmi,
      annualInterestRate: request.snapshot.annualInterestRate,
      snapshot: request.snapshot,
      upfrontPrincipalReduction: request.paymentAmount,
      fixedTenureMonths: request.snapshot.remainingTenureMonths
    });
    const simulatedWithUpfrontPayment = includeUpfrontPaymentInTotals(
      simulated,
      request.paymentAmount
    );

    const comparison = compareSchedules(baseline, simulatedWithUpfrontPayment);

    return {
      kind: "lump-sum",
      strategy: "reduce-emi",
      valid: true,
      errors: [],
      warnings: validation.warnings,
      prepaymentAmount: request.paymentAmount,
      newOutstanding,
      newEmi,
      newTenureMonths: simulated.tenureMonths,
      monthsSaved: comparison.monthsSaved,
      interestSaved: comparison.interestSaved,
      closureDate: simulated.closureDate,
      comparison,
      debug: request.debug
        ? buildDebugReport(
            {
              monthlyInterestRate: r,
              emi: newEmi,
              tenureMonths: request.snapshot.remainingTenureMonths,
              newOutstanding
            },
            baseline,
            simulatedWithUpfrontPayment
          )
        : undefined
    };
  }

  const newTenureMonths = calculateTenureMonths(
    newOutstanding,
    request.snapshot.annualInterestRate,
    request.snapshot.monthlyEmi
  );

  const simulated = buildAmortizationSchedule({
    openingPrincipal: request.snapshot.outstandingPrincipal,
    monthlyEmi: request.snapshot.monthlyEmi,
    annualInterestRate: request.snapshot.annualInterestRate,
    snapshot: request.snapshot,
    upfrontPrincipalReduction: request.paymentAmount,
    fixedTenureMonths: newTenureMonths
  });
  const simulatedWithUpfrontPayment = includeUpfrontPaymentInTotals(
    simulated,
    request.paymentAmount
  );

  const comparison = compareSchedules(baseline, simulatedWithUpfrontPayment);

  return {
    kind: "lump-sum",
    strategy: "reduce-tenure",
    valid: true,
    errors: [],
    warnings: validation.warnings,
    prepaymentAmount: request.paymentAmount,
    newOutstanding,
    newEmi: request.snapshot.monthlyEmi,
    newTenureMonths: simulated.tenureMonths,
    monthsSaved: comparison.monthsSaved,
    interestSaved: comparison.interestSaved,
    closureDate: simulated.closureDate,
    comparison,
    debug: request.debug
      ? buildDebugReport(
          {
            monthlyInterestRate: r,
            emi: request.snapshot.monthlyEmi,
            tenureMonths: newTenureMonths,
            newOutstanding
          },
          baseline,
          simulatedWithUpfrontPayment
        )
      : undefined
  };
}

function includeUpfrontPaymentInTotals<T extends ReturnType<typeof buildAmortizationSchedule>>(
  schedule: T,
  upfrontPayment: number
): T {
  return {
    ...schedule,
    totalPrincipal: schedule.totalPrincipal + upfrontPayment,
    totalPayments: schedule.totalPayments + upfrontPayment
  };
}

export function simulateForeclosure(
  request: ForeclosureSimulationRequest
): LumpSumSimulationResult {
  const validation = validatePayment(request.snapshot, request.settlementAmount);
  const baseline = buildBaselineSchedule(request.snapshot);

  if (!validation.valid) {
    return invalidLumpSumResult(
      {
        snapshot: request.snapshot,
        paymentAmount: request.settlementAmount,
        strategy: "reduce-tenure",
        debug: request.debug
      },
      validation.errors,
      validation.warnings
    );
  }

  const simulated: typeof baseline = {
    rows: [],
    totalInterest: 0,
    totalPrincipal: request.settlementAmount,
    totalPayments: request.settlementAmount,
    tenureMonths: 0,
    closureDate: request.snapshot.asOfDate
  };

  const comparison = compareSchedules(baseline, simulated);

  return {
    kind: "foreclosure",
    strategy: "reduce-tenure",
    valid: true,
    errors: [],
    warnings: validation.warnings,
    prepaymentAmount: request.settlementAmount,
    newOutstanding: 0,
    newEmi: 0,
    newTenureMonths: 0,
    monthsSaved: baseline.tenureMonths,
    interestSaved: comparison.interestSaved,
    closureDate: request.snapshot.asOfDate,
    settlementAmount: request.settlementAmount,
    comparison,
    debug: request.debug
      ? buildDebugReport(
          {
            monthlyInterestRate: monthlyInterestRate(request.snapshot.annualInterestRate),
            newOutstanding: 0
          },
          baseline,
          simulated
        )
      : undefined
  };
}
