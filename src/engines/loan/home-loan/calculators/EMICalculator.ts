import { estimateRemainingMonths } from "@/shared/finance/loan-tenure";
import type {
  EmiCalculationRequest,
  EmiCalculationResult,
  EmiRecalculationRequest
} from "@/engines/loan/home-loan/types/LoanInterfaces";
import { calculateMonthlyRate } from "@/engines/loan/home-loan/utils/rates";
import { roundMoney } from "@/engines/loan/home-loan/utils/money";
import { estimateClosureDate } from "@/engines/loan/home-loan/utils/dates";

export interface EMICalculator {
  calculate(request: EmiCalculationRequest): EmiCalculationResult;
  recalculateAfterPrepayment(request: EmiRecalculationRequest): EmiCalculationResult;
  calculateTenure(
    principal: number,
    annualInterestRate: number,
    emi: number,
    fallbackMonths: number
  ): number;
}

export class HomeLoanEMICalculator implements EMICalculator {
  calculate(request: EmiCalculationRequest): EmiCalculationResult {
    const monthlyEmi = roundMoney(
      computeEmi(request.principal, request.annualInterestRate, request.tenureMonths)
    );

    return {
      monthlyEmi,
      assumptions: ["EMI rounded to nearest rupee.", "Reducing-balance monthly rate applied."]
    };
  }

  recalculateAfterPrepayment(request: EmiRecalculationRequest): EmiCalculationResult {
    const tenureMonths =
      request.strategy === "reduce-tenure"
        ? request.tenureMonths
        : request.tenureMonths;

    return this.calculate({
      principal: request.revisedPrincipal,
      annualInterestRate: request.annualInterestRate,
      tenureMonths,
      asOfDate: request.asOfDate
    });
  }

  calculateTenure(
    principal: number,
    annualInterestRate: number,
    emi: number,
    fallbackMonths: number
  ) {
    return estimateRemainingMonths({
      principal,
      monthlyRate: calculateMonthlyRate(annualInterestRate),
      monthlyPayment: emi,
      fallbackMonths
    });
  }
}

export function computeEmi(principal: number, annualInterestRate: number, months: number) {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = calculateMonthlyRate(annualInterestRate);

  if (monthlyRate <= 0) {
    return Math.round(principal / months);
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function resolveClosureDate(asOfDate: string, tenureMonths: number) {
  return estimateClosureDate(asOfDate, tenureMonths);
}

export const emiCalculator: EMICalculator = new HomeLoanEMICalculator();
