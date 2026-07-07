import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";
import type { HomeLoanSimulationSnapshot } from "@/engines/loan/home-loan/core/types";
import type { LumpSumSimulationRequest } from "@/engines/loan/home-loan/core/types";
import type { MonthlyExtraSimulationRequest } from "@/engines/loan/home-loan/core/types";

export interface SimulationEngine {
  projectBaseline(snapshot: HomeLoanSimulationSnapshot): ReturnType<
    typeof homeLoanAmortizationEngine.projectBaseline
  >;
  simulateLumpSum(request: LumpSumSimulationRequest): ReturnType<
    typeof homeLoanAmortizationEngine.simulateLumpSum
  >;
  simulateMonthlyExtra(request: MonthlyExtraSimulationRequest): ReturnType<
    typeof homeLoanAmortizationEngine.simulateMonthlyExtra
  >;
}

export class HomeLoanSimulationEngine implements SimulationEngine {
  projectBaseline(snapshot: HomeLoanSimulationSnapshot) {
    return homeLoanAmortizationEngine.projectBaseline(snapshot);
  }

  simulateLumpSum(request: LumpSumSimulationRequest) {
    return homeLoanAmortizationEngine.simulateLumpSum(request);
  }

  simulateMonthlyExtra(request: MonthlyExtraSimulationRequest) {
    return homeLoanAmortizationEngine.simulateMonthlyExtra(request);
  }
}

export const simulationEngine: SimulationEngine = homeLoanAmortizationEngine;
