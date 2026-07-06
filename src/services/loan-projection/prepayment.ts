import type { Loan } from "@/shared/domain/finance";

export interface PrepaymentSimulation {
  prepaymentAmount: number;
  revisedOutstanding: number;
  estimatedMonthsSaved: number;
  estimatedInterestSaved: number;
  originalMonths: number;
  revisedMonths: number;
}

export function simulatePrepayment(
  loan: Loan,
  prepaymentAmount: number
): PrepaymentSimulation {
  const safePrepayment = Math.min(Math.max(prepaymentAmount, 0), loan.outstandingBalance);
  const revisedOutstanding = loan.outstandingBalance - safePrepayment;
  const monthlyRate = loan.annualInterestRate / 12 / 100;

  const originalMonths = estimateRemainingMonths({
    principal: loan.outstandingBalance,
    monthlyRate,
    monthlyPayment: loan.monthlyEmi,
    fallbackMonths: loan.remainingTenureMonths
  });

  const revisedMonths = estimateRemainingMonths({
    principal: revisedOutstanding,
    monthlyRate,
    monthlyPayment: loan.monthlyEmi,
    fallbackMonths: Math.max(loan.remainingTenureMonths - 1, 0)
  });

  const originalInterest = Math.max(originalMonths * loan.monthlyEmi - loan.outstandingBalance, 0);
  const revisedInterest = Math.max(revisedMonths * loan.monthlyEmi - revisedOutstanding, 0);

  return {
    prepaymentAmount: safePrepayment,
    revisedOutstanding,
    estimatedMonthsSaved: Math.max(originalMonths - revisedMonths, 0),
    estimatedInterestSaved: Math.max(originalInterest - revisedInterest, 0),
    originalMonths,
    revisedMonths
  };
}

function estimateRemainingMonths(params: {
  principal: number;
  monthlyRate: number;
  monthlyPayment: number;
  fallbackMonths: number;
}) {
  if (params.principal <= 0) {
    return 0;
  }

  if (params.monthlyPayment <= 0) {
    return params.fallbackMonths;
  }

  if (params.monthlyRate <= 0) {
    return Math.ceil(params.principal / params.monthlyPayment);
  }

  const monthlyInterest = params.principal * params.monthlyRate;
  if (params.monthlyPayment <= monthlyInterest) {
    return params.fallbackMonths;
  }

  const months =
    -Math.log(1 - (params.principal * params.monthlyRate) / params.monthlyPayment) /
    Math.log(1 + params.monthlyRate);

  return Number.isFinite(months) ? Math.ceil(months) : params.fallbackMonths;
}
