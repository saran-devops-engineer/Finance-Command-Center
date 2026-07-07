import type { ValidationEngine } from "@/engines/loan/home-loan/validators/ValidationEngine";
import type { PaymentProcessor } from "@/engines/loan/home-loan/services/PaymentProcessor";
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
import { paymentProcessor } from "@/engines/loan/home-loan/services/PaymentProcessor";
import { recommendationEngine } from "@/engines/loan/home-loan/recommendations/RecommendationEngine";
import { loanRepository } from "@/engines/loan/home-loan/services/LoanRepository";
import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";

export interface HomeLoanEngineDependencies {
  validationEngine: ValidationEngine;
  amortizationEngine: typeof homeLoanAmortizationEngine;
  paymentProcessor: PaymentProcessor;
  recommendationEngine: RecommendationEngine;
  loanRepository: LoanRepository;
  eventBus?: HomeLoanEventBus;
}

/**
 * Facade orchestrating the Home Loan Engine pipeline.
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
    throw new Error("HomeLoanEngine.analyze is not implemented. Use homeLoanAmortizationEngine.");
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

  /** Direct access to the amortization engine — single source of truth for simulations. */
  get amortization() {
    return this.deps.amortizationEngine;
  }
}

/** Default engine wired with placeholder module implementations. */
export const homeLoanEngine = new HomeLoanEngine({
  validationEngine,
  amortizationEngine: homeLoanAmortizationEngine,
  paymentProcessor,
  recommendationEngine,
  loanRepository
});
