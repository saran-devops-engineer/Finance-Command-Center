import type {
  PaymentApplicationRequest,
  PaymentApplicationResult
} from "@/engines/loan/home-loan/types/LoanInterfaces";

/**
 * Applies EMI, prepayment, and part-payment events to a Home Loan snapshot.
 * Single responsibility: payment state transitions — no UI or persistence.
 */
export interface PaymentProcessor {
  apply(request: PaymentApplicationRequest): PaymentApplicationResult;
}

export class HomeLoanPaymentProcessor implements PaymentProcessor {
  /**
   * @todo Implement principal/interest split rules per banking handbook.
   * @todo Emit HomeLoanPaymentProcessedEvent via event bus when wired.
   */
  apply(_request: PaymentApplicationRequest): PaymentApplicationResult {
    throw new Error(
      "HomeLoanPaymentProcessor.apply is not implemented. Awaiting banking rules."
    );
  }
}

export const paymentProcessor: PaymentProcessor = new HomeLoanPaymentProcessor();
