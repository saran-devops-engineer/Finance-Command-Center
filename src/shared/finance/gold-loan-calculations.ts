import type { GoldInterestPaymentType, Loan } from "@/shared/domain/finance";
import { daysInMonth } from "@/shared/finance/home-loan-calculations";

/** Annual interest = Outstanding Principal × Interest Rate. */
export function computeAnnualInterest(outstandingBalance: number, annualInterestRate: number) {
  if (outstandingBalance <= 0 || annualInterestRate <= 0) {
    return 0;
  }

  return (outstandingBalance * annualInterestRate) / 100;
}

/** Monthly Interest Burden = Annual Interest / 12. READ ONLY, always derived. */
export function computeMonthlyInterestBurden(
  outstandingBalance: number,
  annualInterestRate: number
) {
  return computeAnnualInterest(outstandingBalance, annualInterestRate) / 12;
}

export function getDaysUntil(date: string, referenceDate?: string) {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  const today = referenceDate
    ? new Date(`${referenceDate.slice(0, 10)}T00:00:00`)
    : new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Next due date for a gold loan.
 * - Monthly interest: next occurrence of the loan start day-of-month.
 * - Yearly interest: the renewal date (single annual interest payment).
 */
export function computeGoldNextDueDate(
  interestType: GoldInterestPaymentType,
  loanStartDate: string,
  renewalDate: string,
  referenceDate?: string
): string {
  if (interestType === "yearly") {
    return renewalDate;
  }

  const reference = referenceDate
    ? new Date(`${referenceDate.slice(0, 10)}T00:00:00`)
    : new Date();
  reference.setHours(0, 0, 0, 0);

  const startDay = loanStartDate
    ? new Date(`${loanStartDate.slice(0, 10)}T00:00:00`).getDate()
    : 1;

  const year = reference.getFullYear();
  const month = reference.getMonth();
  const day = Math.min(startDay, daysInMonth(year, month));
  let due = new Date(year, month, day);

  if (due < reference) {
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const normalizedMonth = nextMonth % 12;
    due = new Date(
      nextYear,
      normalizedMonth,
      Math.min(startDay, daysInMonth(nextYear, normalizedMonth))
    );
  }

  return due.toISOString().slice(0, 10);
}

export const GOLD_RENEWAL_REMINDER_THRESHOLDS = [30, 15, 7, 1] as const;

export interface GoldRenewalReminder {
  daysRemaining: number;
  shouldRemind: boolean;
  isOverdue: boolean;
  /** Closest reminder milestone reached (30, 15, 7, 1) or null when > 30 days out. */
  milestone: number | null;
}

export function getGoldRenewalReminder(
  renewalDate: string,
  referenceDate?: string
): GoldRenewalReminder {
  const daysRemaining = getDaysUntil(renewalDate, referenceDate);
  const isOverdue = daysRemaining < 0;
  const milestone =
    GOLD_RENEWAL_REMINDER_THRESHOLDS.find((threshold) => daysRemaining <= threshold) ?? null;

  return {
    daysRemaining,
    isOverdue,
    shouldRemind: isOverdue || daysRemaining <= 30,
    milestone: isOverdue ? 1 : milestone
  };
}

export interface GoldPrincipalPaymentResult {
  valid: boolean;
  error?: string;
  paymentAmount: number;
  currentOutstanding: number;
  newOutstanding: number;
  currentMonthlyInterest: number;
  newMonthlyInterest: number;
  currentAnnualInterest: number;
  newAnnualInterest: number;
  monthlySavings: number;
  yearlySavings: number;
}

/**
 * Gold Loan One-Time Principal Payment.
 * Interest-based (NOT amortization): reducing the principal reduces the fixed
 * monthly/annual interest burden. Never mutates the loan.
 */
export function simulateGoldPrincipalPayment(
  loan: Loan,
  paymentAmount: number
): GoldPrincipalPaymentResult {
  const currentOutstanding = loan.outstandingBalance;
  const rate = loan.annualInterestRate;
  const currentMonthlyInterest = computeMonthlyInterestBurden(currentOutstanding, rate);
  const currentAnnualInterest = computeAnnualInterest(currentOutstanding, rate);

  const base: GoldPrincipalPaymentResult = {
    valid: true,
    paymentAmount,
    currentOutstanding,
    newOutstanding: currentOutstanding,
    currentMonthlyInterest,
    newMonthlyInterest: currentMonthlyInterest,
    currentAnnualInterest,
    newAnnualInterest: currentAnnualInterest,
    monthlySavings: 0,
    yearlySavings: 0
  };

  if (paymentAmount <= 0) {
    return { ...base, valid: false, error: "Payment must be greater than zero." };
  }

  if (paymentAmount > currentOutstanding) {
    return {
      ...base,
      valid: false,
      error: "Payment cannot exceed the outstanding principal."
    };
  }

  const newOutstanding = currentOutstanding - paymentAmount;
  const newMonthlyInterest = computeMonthlyInterestBurden(newOutstanding, rate);
  const newAnnualInterest = computeAnnualInterest(newOutstanding, rate);

  return {
    valid: true,
    paymentAmount,
    currentOutstanding,
    newOutstanding,
    currentMonthlyInterest,
    newMonthlyInterest,
    currentAnnualInterest,
    newAnnualInterest,
    monthlySavings: currentMonthlyInterest - newMonthlyInterest,
    yearlySavings: currentAnnualInterest - newAnnualInterest
  };
}
