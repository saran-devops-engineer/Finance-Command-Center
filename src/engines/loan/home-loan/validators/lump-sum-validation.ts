import type { HomeLoanSnapshot, ValidationIssue, ValidationResult } from "@/engines/loan/home-loan/types/LoanInterfaces";
import type { LumpSumSimulationRequest } from "@/engines/loan/home-loan/types/LumpSumRuleSet01";
import type { MoneyAmount } from "@/engines/loan/home-loan/types/LoanTypes";

export interface LumpSumValidationInput {
  loan: HomeLoanSnapshot;
  lumpSumAmount: MoneyAmount;
  paymentDate: string;
}

export function validateLumpSumSimulation(input: LumpSumValidationInput): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const { loan, lumpSumAmount } = input;

  if (lumpSumAmount <= 0) {
    errors.push({
      code: "lump-sum.invalid-amount",
      message: "Payment must be greater than zero.",
      field: "lumpSumAmount"
    });
  }

  if (loan.outstandingPrincipal <= 0) {
    errors.push({
      code: "loan.closed",
      message: "Outstanding principal must be greater than zero.",
      field: "outstandingPrincipal"
    });
  }

  if (loan.annualInterestRate <= 0) {
    errors.push({
      code: "loan.invalid-rate",
      message: "Interest rate must be greater than zero.",
      field: "annualInterestRate"
    });
  }

  if (loan.remainingTenureMonths <= 0) {
    errors.push({
      code: "loan.invalid-tenure",
      message: "Remaining tenure must be greater than zero.",
      field: "remainingTenureMonths"
    });
  }

  if (loan.monthlyEmi <= 0) {
    errors.push({
      code: "loan.invalid-emi",
      message: "Current EMI must be greater than zero.",
      field: "monthlyEmi"
    });
  }

  if (lumpSumAmount > loan.outstandingPrincipal) {
    errors.push({
      code: "lump-sum.exceeds-outstanding",
      message: "Payment cannot exceed outstanding principal.",
      field: "lumpSumAmount"
    });
  }

  const status = loan.status ?? "active";

  if (status !== "active") {
    errors.push({
      code: "loan.not-active",
      message: "Only active loans can be simulated.",
      field: "status"
    });
  }

  if (lumpSumAmount === loan.outstandingPrincipal && errors.length === 0) {
    warnings.push({
      code: "lump-sum.foreclosure",
      message: "Payment equals outstanding principal. Foreclosure is suggested."
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateLumpSumRequest(request: LumpSumSimulationRequest): ValidationResult {
  return validateLumpSumSimulation({
    loan: request.loan,
    lumpSumAmount: request.lumpSumAmount,
    paymentDate: request.paymentDate
  });
}
