import type {
  ComparePrepaymentRequest,
  ComparePrepaymentResult,
  HomeLoanSnapshot,
  SimulationOptions,
  SimulationResult,
  SimulationScenario
} from "@/engines/loan/home-loan/types/LoanInterfaces";

/**
 * Runs Home Loan what-if scenarios (baseline, prepayment, comparison).
 * Single responsibility: scenario orchestration — uses calculators internally.
 */
export interface SimulationEngine {
  simulate(
    loan: HomeLoanSnapshot,
    scenario: SimulationScenario,
    options?: SimulationOptions
  ): SimulationResult;

  comparePrepayment(request: ComparePrepaymentRequest): ComparePrepaymentResult;

  projectBaseline(loan: HomeLoanSnapshot, options?: SimulationOptions): SimulationResult;
}

export class HomeLoanSimulationEngine implements SimulationEngine {
  /**
   * @todo Wire ValidationEngine → EMICalculator → AmortizationCalculator pipeline.
   * @todo Delegate per-scenario runners (reduce-tenure, reduce-emi, baseline).
   */
  simulate(
    _loan: HomeLoanSnapshot,
    _scenario: SimulationScenario,
    _options?: SimulationOptions
  ): SimulationResult {
    throw new Error(
      "HomeLoanSimulationEngine.simulate is not implemented. Awaiting banking rules."
    );
  }

  /** @todo Run reduce-tenure and reduce-emi scenarios in parallel for comparison. */
  comparePrepayment(_request: ComparePrepaymentRequest): ComparePrepaymentResult {
    throw new Error(
      "HomeLoanSimulationEngine.comparePrepayment is not implemented. Awaiting banking rules."
    );
  }

  /** @todo Project remaining interest and closure date without prepayment. */
  projectBaseline(_loan: HomeLoanSnapshot, _options?: SimulationOptions): SimulationResult {
    throw new Error(
      "HomeLoanSimulationEngine.projectBaseline is not implemented. Awaiting banking rules."
    );
  }
}

export const simulationEngine: SimulationEngine = new HomeLoanSimulationEngine();
