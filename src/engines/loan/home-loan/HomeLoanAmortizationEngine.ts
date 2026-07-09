import { buildBaselineSchedule } from "@/engines/loan/home-loan/core/schedule-builder";
import type {
  AnnualExtraSimulationRequest,
  HomeLoanSimulationSnapshot,
  LumpSumSimulationRequest,
  MonthlyExtraSimulationRequest,
  TargetClosureSimulationRequest
} from "@/engines/loan/home-loan/core/types";
import { validateSnapshot } from "@/engines/loan/home-loan/core/validation";
import { simulateAnnualExtraPayment } from "@/engines/loan/home-loan/simulation/annual-extra";
import { simulateLumpSumPayment } from "@/engines/loan/home-loan/simulation/lump-sum";
import { simulateMonthlyExtraPayment } from "@/engines/loan/home-loan/simulation/monthly-extra";
import { simulateTargetClosure } from "@/engines/loan/home-loan/simulation/target-closure";
import {
  comparePrepaymentStrategies,
  type StrategyRecommendationContext
} from "@/engines/loan/home-loan/recommendation/strategy-v1";

/**
 * Banking-grade Home Loan Amortization Engine.
 * The ONLY source of truth for every home loan simulation.
 */
export class HomeLoanAmortizationEngine {
  projectBaseline(snapshot: HomeLoanSimulationSnapshot) {
    const validation = validateSnapshot(snapshot);

    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }

    return buildBaselineSchedule(snapshot);
  }

  simulateLumpSum(request: LumpSumSimulationRequest) {
    return simulateLumpSumPayment(request);
  }

  simulateMonthlyExtra(request: MonthlyExtraSimulationRequest) {
    return simulateMonthlyExtraPayment(request);
  }

  simulateAnnualExtra(request: AnnualExtraSimulationRequest) {
    return simulateAnnualExtraPayment(request);
  }

  simulateTargetClosure(request: TargetClosureSimulationRequest) {
    return simulateTargetClosure(request);
  }

  comparePrepaymentStrategies(
    snapshot: HomeLoanSimulationSnapshot,
    prepaymentAmount: number,
    context?: StrategyRecommendationContext,
    debug = false
  ) {
    return comparePrepaymentStrategies(snapshot, prepaymentAmount, context, debug);
  }
}

export const homeLoanAmortizationEngine = new HomeLoanAmortizationEngine();
