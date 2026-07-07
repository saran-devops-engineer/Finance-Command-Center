import type { MoneyAmount } from "@/engines/loan/home-loan/types/LoanTypes";

export function roundMoney(amount: number): MoneyAmount {
  return Math.round(amount);
}

export function roundInterest(amount: number): MoneyAmount {
  return Math.round(amount);
}
