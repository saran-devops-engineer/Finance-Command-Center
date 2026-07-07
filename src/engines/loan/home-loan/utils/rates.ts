import type { AnnualRatePercent } from "@/engines/loan/home-loan/types/LoanTypes";

export function calculateMonthlyRate(annualInterestRate: AnnualRatePercent) {
  return annualInterestRate / 12 / 100;
}

export function normalizeAnnualRate(rate: AnnualRatePercent): AnnualRatePercent {
  return rate;
}
