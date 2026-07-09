import { compareSchedules } from "@/engines/loan/home-loan/core/comparison";
import { buildBaselineSchedule } from "@/engines/loan/home-loan/core/schedule-builder";
import type {
  TargetClosureSearchStep,
  TargetClosureSimulationRequest,
  TargetClosureSimulationResult
} from "@/engines/loan/home-loan/core/types";
import { validateSnapshot } from "@/engines/loan/home-loan/core/validation";
import { simulateMonthlyExtraPayment } from "@/engines/loan/home-loan/simulation/monthly-extra";

/**
 * Target Closure Date — finds the MINIMUM fixed monthly extra payment that
 * closes the loan on or before the target date. It does NOT define new maths:
 * every candidate is evaluated with the existing Monthly Extra simulation, and
 * a binary search converges on the smallest amount that meets the target.
 */
export function simulateTargetClosure(
  request: TargetClosureSimulationRequest
): TargetClosureSimulationResult {
  const { snapshot, targetMonths } = request;
  const validation = validateSnapshot(snapshot);
  const baseline = buildBaselineSchedule(snapshot);

  const errors = [...validation.errors];

  if (targetMonths < 1) {
    errors.push("Target months must be at least 1.");
  }

  if (validation.valid && targetMonths >= baseline.tenureMonths) {
    errors.push("Target must be earlier than the current closure date.");
  }

  if (errors.length > 0) {
    return {
      kind: "target-closure",
      strategy: "reduce-tenure",
      valid: false,
      errors,
      warnings: validation.warnings,
      targetMonths,
      achievable: false,
      requiredMonthlyExtra: 0,
      searchIterations: 0,
      newEmi: snapshot.monthlyEmi,
      interestSaved: 0,
      monthsSaved: 0,
      totalExtraPaid: 0,
      closureDate: baseline.closureDate,
      comparison: compareSchedules(baseline, baseline)
    };
  }

  const steps: TargetClosureSearchStep[] = [];
  let iterations = 0;

  const evaluate = (extra: number): number => {
    const sim =
      extra > 0
        ? simulateMonthlyExtraPayment({ snapshot, monthlyExtraAmount: extra, strategy: "reduce-tenure" })
        : null;
    const months = sim && sim.valid ? sim.newTenureMonths : baseline.tenureMonths;
    iterations += 1;
    steps.push({
      iteration: iterations,
      monthlyExtraTested: extra,
      simulatedClosureMonths: months,
      simulatedClosureDate: sim && sim.valid ? sim.closureDate : baseline.closureDate
    });
    return months;
  };

  let lo = 1;
  let hi = Math.max(1, Math.floor(snapshot.outstandingPrincipal) - 1);
  let achievable = true;

  if (evaluate(hi) > targetMonths) {
    // Even the largest monthly extra (just below foreclosure) misses the target.
    achievable = false;
  } else {
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);

      if (evaluate(mid) <= targetMonths) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
  }

  const requiredMonthlyExtra = hi;

  const finalSimulation = simulateMonthlyExtraPayment({
    snapshot,
    monthlyExtraAmount: requiredMonthlyExtra,
    strategy: "reduce-tenure",
    debug: request.debug
  });

  return {
    kind: "target-closure",
    strategy: "reduce-tenure",
    valid: true,
    errors: [],
    warnings: validation.warnings,
    targetMonths,
    achievable,
    requiredMonthlyExtra,
    searchIterations: iterations,
    newEmi: snapshot.monthlyEmi,
    interestSaved: finalSimulation.interestSaved,
    monthsSaved: finalSimulation.monthsSaved,
    totalExtraPaid: finalSimulation.totalExtraPaid,
    closureDate: finalSimulation.closureDate,
    comparison: finalSimulation.comparison,
    searchSteps: request.debug ? steps : undefined
  };
}
