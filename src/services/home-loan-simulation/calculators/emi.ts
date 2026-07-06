import { estimateRemainingMonths } from "@/shared/finance/loan-tenure";

export function calculateMonthlyRate(annualInterestRate: number) {
  return annualInterestRate / 12 / 100;
}

export function calculateEmi(
  principal: number,
  annualInterestRate: number,
  months: number
) {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = calculateMonthlyRate(annualInterestRate);

  if (monthlyRate <= 0) {
    return Math.round(principal / months);
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return Math.round((principal * monthlyRate * factor) / (factor - 1));
}

export function calculateTenure(
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

export function estimateClosureDate(asOfDate: string, tenureMonths: number) {
  if (tenureMonths <= 0) {
    return asOfDate.slice(0, 10);
  }

  return addMonthsToDate(asOfDate, tenureMonths - 1).slice(0, 10);
}

export function formatCalendarMonth(asOfDate: string, monthOffset: number) {
  return addMonthsToDate(asOfDate, monthOffset).slice(0, 7);
}

function addMonthsToDate(asOfDate: string, monthOffset: number) {
  const date = new Date(`${asOfDate.slice(0, 10)}T00:00:00`);
  date.setMonth(date.getMonth() + monthOffset);
  return date.toISOString();
}
