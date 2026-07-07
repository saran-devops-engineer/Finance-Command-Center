import type {
  HomeLoanSimulationSnapshot,
  ValidationResult
} from "@/engines/loan/home-loan/core/types";

export function validateSnapshot(snapshot: HomeLoanSimulationSnapshot): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (snapshot.outstandingPrincipal <= 0) {
    errors.push("Outstanding principal must be greater than zero.");
  }

  if (snapshot.monthlyEmi <= 0) {
    errors.push("EMI must be greater than zero.");
  }

  if (snapshot.annualInterestRate <= 0) {
    errors.push("Interest rate must be greater than zero.");
  }

  if (snapshot.remainingTenureMonths <= 0) {
    errors.push("Remaining tenure must be greater than zero.");
  }

  const status = snapshot.status ?? "active";

  if (status === "archived") {
    errors.push("Archived loans cannot be simulated.");
  }

  if (status === "closed" || status === "deleted") {
    errors.push("Closed loans cannot be simulated.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validatePayment(
  snapshot: HomeLoanSimulationSnapshot,
  paymentAmount: number
): ValidationResult {
  const base = validateSnapshot(snapshot);
  const errors = [...base.errors];
  const warnings = [...base.warnings];

  if (paymentAmount <= 0) {
    errors.push("Payment must be greater than zero.");
  }

  if (paymentAmount > snapshot.outstandingPrincipal) {
    errors.push("Payment cannot exceed outstanding principal.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateMonthlyExtra(
  snapshot: HomeLoanSimulationSnapshot,
  monthlyExtraAmount: number
): ValidationResult {
  const base = validateSnapshot(snapshot);
  const errors = [...base.errors];
  const warnings = [...base.warnings];

  if (monthlyExtraAmount <= 0) {
    errors.push("Monthly extra payment must be greater than zero.");
  }

  if (monthlyExtraAmount > snapshot.outstandingPrincipal) {
    warnings.push("Monthly extra payment exceeds outstanding principal. Loan may close quickly.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
