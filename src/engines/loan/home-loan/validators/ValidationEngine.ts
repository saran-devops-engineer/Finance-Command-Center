import type {
  HomeLoanValidationRequest,
  ValidationResult
} from "@/engines/loan/home-loan/types/LoanInterfaces";

/**
 * Validates Home Loan inputs and scenarios before any calculation runs.
 * Single responsibility: structural and business-rule validation only.
 */
export interface ValidationEngine {
  validate(request: HomeLoanValidationRequest): ValidationResult;
}

export class HomeLoanValidationEngine implements ValidationEngine {
  /**
   * @todo Apply handbook validation rules when banking rules are supplied.
   * @todo Separate input validation from scenario validation modules if rules grow.
   */
  validate(_request: HomeLoanValidationRequest): ValidationResult {
    throw new Error(
      "HomeLoanValidationEngine.validate is not implemented. Awaiting banking rules."
    );
  }
}

/** Default engine instance for dependency injection. */
export const validationEngine: ValidationEngine = new HomeLoanValidationEngine();
