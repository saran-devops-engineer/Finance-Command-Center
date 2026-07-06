import {
  HIGH_ANNUAL_INTEREST_RATE_THRESHOLD,
  MAX_ANNUAL_INTEREST_RATE,
  MAX_REMAINING_TENURE_MONTHS,
  MIN_REMAINING_TENURE_MONTHS
} from "@/services/home-loan-simulation/constants";
import type {
  HomeLoanSimulationInput,
  ValidationResult
} from "@/services/home-loan-simulation/types";

export function validateInput(input: HomeLoanSimulationInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.loanId) {
    errors.push("Loan id is required.");
  }

  if (input.outstandingBalance <= 0) {
    errors.push("Loan is already closed.");
  }

  if (input.monthlyEmi <= 0) {
    errors.push("EMI is required for simulation.");
  }

  if (input.annualInterestRate < 0) {
    errors.push("Interest rate cannot be negative.");
  }

  if (input.annualInterestRate > MAX_ANNUAL_INTEREST_RATE) {
    warnings.push(`Interest rate above ${MAX_ANNUAL_INTEREST_RATE}% is unusual for projection.`);
  } else if (input.annualInterestRate > HIGH_ANNUAL_INTEREST_RATE_THRESHOLD) {
    warnings.push(`Interest rate above ${HIGH_ANNUAL_INTEREST_RATE_THRESHOLD}% may reduce estimate accuracy.`);
  }

  if (
    input.originalAmount !== undefined &&
    input.outstandingBalance > input.originalAmount
  ) {
    warnings.push("Outstanding balance exceeds the recorded original amount.");
  }

  if (
    input.remainingTenureMonths < MIN_REMAINING_TENURE_MONTHS ||
    input.remainingTenureMonths > MAX_REMAINING_TENURE_MONTHS
  ) {
    warnings.push(
      `Remaining tenure should be between ${MIN_REMAINING_TENURE_MONTHS} and ${MAX_REMAINING_TENURE_MONTHS} months.`
    );
  }

  const monthlyRate = input.annualInterestRate / 12 / 100;
  const monthlyInterest = input.outstandingBalance * monthlyRate;

  if (input.monthlyEmi <= monthlyInterest && input.outstandingBalance > 0) {
    warnings.push("EMI does not cover monthly interest. The loan may not amortize as projected.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function assertValidInput(input: HomeLoanSimulationInput): string[] {
  const result = validateInput(input);

  if (!result.valid) {
    throw new Error(result.errors[0]);
  }

  return result.warnings;
}
