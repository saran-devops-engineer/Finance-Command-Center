import type { ValidationEngine } from "@/engines/loan/home-loan/validators/ValidationEngine";
import type { EMICalculator } from "@/engines/loan/home-loan/calculators/EMICalculator";
import type { AmortizationCalculator } from "@/engines/loan/home-loan/calculators/AmortizationCalculator";
import type { PaymentProcessor } from "@/engines/loan/home-loan/services/PaymentProcessor";
import type { SimulationEngine } from "@/engines/loan/home-loan/simulators/SimulationEngine";
import type { RecommendationEngine } from "@/engines/loan/home-loan/recommendations/RecommendationEngine";
import type { LoanRepository } from "@/engines/loan/home-loan/services/LoanRepository";
import type { HomeLoanEventBus } from "@/engines/loan/home-loan/types/LoanEvents";
import type {
  HomeLoanAnalysisRequest,
  HomeLoanAnalysisResult,
  PaymentApplicationRequest,
  PaymentApplicationResult
} from "@/engines/loan/home-loan/types/LoanInterfaces";
import { validationEngine } from "@/engines/loan/home-loan/validators/ValidationEngine";
import { emiCalculator } from "@/engines/loan/home-loan/calculators/EMICalculator";
import { amortizationCalculator } from "@/engines/loan/home-loan/calculators/AmortizationCalculator";
import { paymentProcessor } from "@/engines/loan/home-loan/services/PaymentProcessor";
import { simulationEngine } from "@/engines/loan/home-loan/simulators/SimulationEngine";
import { recommendationEngine } from "@/engines/loan/home-loan/recommendations/RecommendationEngine";
import { loanRepository } from "@/engines/loan/home-loan/services/LoanRepository";

export interface HomeLoanEngineDependencies {
  validationEngine: ValidationEngine;
  emiCalculator: EMICalculator;
  amortizationCalculator: AmortizationCalculator;
  paymentProcessor: PaymentProcessor;
  simulationEngine: SimulationEngine;
  recommendationEngine: RecommendationEngine;
  loanRepository: LoanRepository;
  eventBus?: HomeLoanEventBus;
}

/**
 * Facade orchestrating the Home Loan Engine pipeline.
 *
 * Pipeline:
 *   Validation → EMI → Amortization → Payment → Simulation → Recommendation
 *
 * UI and React components must call this engine — never compute values directly.
 */
export class HomeLoanEngine {
  constructor(private readonly deps: HomeLoanEngineDependencies) {}

  /**
   * End-to-end analysis for a loan scenario.
   * @todo Wire pipeline stages and event bus emissions.
   */
  analyze(_request: HomeLoanAnalysisRequest): HomeLoanAnalysisResult {
    throw new Error("HomeLoanEngine.analyze is not implemented. Awaiting banking rules.");
  }

  /**
   * Apply a payment through the PaymentProcessor after validation.
   * @todo Validate then delegate to paymentProcessor.
   */
  processPayment(_request: PaymentApplicationRequest): PaymentApplicationResult {
    throw new Error("HomeLoanEngine.processPayment is not implemented. Awaiting banking rules.");
  }

  /** Load a loan snapshot via the repository port. */
  async loadLoan(loanId: string) {
    return this.deps.loanRepository.getHomeLoanSnapshot(loanId);
  }
}

/** Default engine wired with placeholder module implementations. */
export const homeLoanEngine = new HomeLoanEngine({
  validationEngine,
  emiCalculator,
  amortizationCalculator,
  paymentProcessor,
  simulationEngine,
  recommendationEngine,
  loanRepository
});
