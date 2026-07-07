import type { HomeLoanSnapshot, ValidationIssue, ValidationResult } from "@/engines/loan/home-loan/types/LoanInterfaces";
import type { MonthlyExtraSimulationRequest } from "@/engines/loan/home-loan/types/MonthlyExtraRuleSet02";
import type { MoneyAmount } from "@/engines/loan/home-loan/types/LoanTypes";
import { resolveMonthlyExtraMonthWindow } from "@/engines/loan/home-loan/utils/dates";

export interface MonthlyExtraValidationInput {
  loan: HomeLoanSnapshot;
  monthlyExtraAmount: MoneyAmount;
  startMonthIndex: number;
  endMonthIndex?: number;
  monthlyAvailableMoney?: MoneyAmount;
}

export function validateMonthlyExtraSimulation(input: MonthlyExtraValidationInput): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const {
    loan,
    monthlyExtraAmount,
    startMonthIndex,
    endMonthIndex,
    monthlyAvailableMoney
  } = input;

  if (monthlyExtraAmount <= 0) {
    errors.push({
      code: "monthly-extra.invalid-amount",
      message: "Monthly extra payment must be greater than zero.",
      field: "monthlyExtraAmount"
    });
  }

  if (
    monthlyAvailableMoney !== undefined &&
    monthlyExtraAmount > monthlyAvailableMoney
  ) {
    errors.push({
      code: "monthly-extra.exceeds-available",
      message: "Monthly extra payment exceeds monthly available money.",
      field: "monthlyExtraAmount"
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

  if (startMonthIndex < 0) {
    errors.push({
      code: "monthly-extra.invalid-start",
      message: "Start month index cannot be negative.",
      field: "startMonthIndex"
    });
  }

  if (endMonthIndex !== undefined && endMonthIndex < startMonthIndex) {
    errors.push({
      code: "monthly-extra.invalid-end",
      message: "End month must be on or after start month.",
      field: "endMonthIndex"
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

  if (monthlyExtraAmount > loan.monthlyEmi && errors.length === 0) {
    warnings.push({
      code: "monthly-extra.exceeds-emi",
      message: "Monthly extra payment exceeds the current EMI."
    });
  }

  if (monthlyExtraAmount > loan.outstandingPrincipal && errors.length === 0) {
    warnings.push({
      code: "monthly-extra.exceeds-outstanding",
      message: "Monthly extra payment exceeds outstanding principal. Loan may close in the first month."
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateMonthlyExtraRequest(request: MonthlyExtraSimulationRequest): ValidationResult {
  const { startMonthIndex, endMonthIndex } = resolveRequestMonthWindow(request);

  const base = validateMonthlyExtraSimulation({
    loan: request.loan,
    monthlyExtraAmount: request.monthlyExtraAmount,
    startMonthIndex,
    endMonthIndex,
    monthlyAvailableMoney: request.recommendationContext?.monthlyAvailableMoney
  });

  const warnings = [...base.warnings];
  const context = request.recommendationContext;
  const minimumBuffer =
    context?.minimumEmergencyBuffer ?? 0;

  if (context?.emergencyBuffer !== undefined && context.emergencyBuffer <= minimumBuffer) {
    warnings.push({
      code: "monthly-extra.emergency-buffer",
      message: "Emergency buffer would fall below the configured minimum."
    });
  }

  if (context?.monthlyCashFlow !== undefined && context.monthlyCashFlow <= 0) {
    warnings.push({
      code: "monthly-extra.negative-cash-flow",
      message: "Monthly cash flow becomes negative after this extra payment."
    });
  }

  return {
    valid: base.valid,
    errors: base.errors,
    warnings
  };
}

export function resolveRequestMonthWindow(request: MonthlyExtraSimulationRequest) {
  return resolveMonthlyExtraMonthWindow(
    request.loan.asOfDate,
    request.startMonth,
    request.endMonth,
    request.startMonthIndex,
    request.endMonthIndex
  );
}
