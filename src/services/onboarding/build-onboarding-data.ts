/**
 * Onboarding V2 — builds profile, income, commitments, and compatibility money breakdown.
 * No Other EMI / Insurance fields. Loan EMIs come only from products.
 */

import type {
  Loan,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import type { IncomeProfile, IncomeSource } from "@/shared/domain/income";
import { IncomeMode, IncomeSourceKind } from "@/shared/domain/income";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import {
  CommitmentCategory,
  CommitmentFrequency,
  CommitmentPriority,
  CommitmentReviewStatus,
  CommitmentSourceKind
} from "@/shared/domain/commitment-record";

export interface OnboardingProfileInput {
  displayName: string;
  monthlyIncome: number;
  emergencyBuffer: number;
}

export interface OnboardingLoanInput {
  loanName: string;
  lender: string;
  originalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  monthlyEmi: number;
  nextDueDate: string;
}

export interface OnboardingManualCommitmentsInput {
  rent: number;
  electricity: number;
  internet: number;
  groceries: number;
  subscriptions: number;
  utilities: number;
}

export interface OnboardingBuildResult {
  profile: UserProfile;
  incomeProfile: IncomeProfile;
  moneyBreakdown: MoneyBreakdown;
  commitments: CommitmentRecord[];
  loan: Loan | null;
  due: UpcomingDue | null;
}

export function toOnboardingNumber(value: string): number {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeOnboardingDisplayName(value: string): string {
  const displayName = value.trim();
  if (!displayName) {
    return "Arjun";
  }

  if (displayName.toLowerCase() === "arjun") {
    return "Arjun";
  }

  return displayName;
}

export function buildOnboardingLoan(input: OnboardingLoanInput, now = new Date().toISOString()): Loan | null {
  if (!input.loanName.trim() || input.outstandingBalance <= 0 || input.monthlyEmi <= 0) {
    return null;
  }

  const originalAmount = input.originalAmount || input.outstandingBalance;
  const principalPaid = Math.max(originalAmount - input.outstandingBalance, 0);

  return {
    id: `loan-${crypto.randomUUID()}`,
    name: input.loanName.trim(),
    type: "personal",
    lender: input.lender.trim() || "Manual entry",
    originalAmount,
    outstandingBalance: input.outstandingBalance,
    annualInterestRate: input.interestRate,
    monthlyEmi: input.monthlyEmi,
    principalPaid,
    interestPaid: 0,
    remainingTenureMonths:
      input.monthlyEmi > 0 ? Math.ceil(input.outstandingBalance / input.monthlyEmi) : 0,
    estimatedClosureDate: "",
    nextDueDate: input.nextDueDate || now.slice(0, 10),
    status: "active"
  };
}

export function buildOnboardingDue(loan: Loan | null): UpcomingDue | null {
  if (!loan) {
    return null;
  }

  return {
    id: `due-${loan.id}`,
    title: `${loan.name} EMI`,
    dueDate: loan.nextDueDate,
    amount: loan.monthlyEmi,
    source: "loan"
  };
}

export function buildOnboardingIncomeProfile(
  monthlyIncome: number,
  now = new Date().toISOString()
): IncomeProfile {
  const amount = Math.max(monthlyIncome, 0);
  const sources: IncomeSource[] =
    amount > 0
      ? [
          {
            id: `income-primary-${now.slice(0, 10)}`,
            kind: IncomeSourceKind.SALARY,
            label: "Primary income",
            monthlyAmount: amount,
            isPrimary: true,
            createdAt: now,
            updatedAt: now
          }
        ]
      : [];

  return {
    mode: IncomeMode.SIMPLE,
    simpleMonthlyIncome: amount,
    sources,
    updatedAt: now
  };
}

export function buildOnboardingManualCommitments(
  input: OnboardingManualCommitmentsInput,
  now = new Date().toISOString()
): CommitmentRecord[] {
  const nextDueDate = firstDayOfNextMonth(now);
  const entries: Array<{
    key: string;
    title: string;
    amount: number;
    category: CommitmentRecord["category"];
    priority: CommitmentRecord["priority"];
  }> = [
    {
      key: "rent",
      title: "Rent",
      amount: input.rent,
      category: CommitmentCategory.RENT,
      priority: CommitmentPriority.HIGH
    },
    {
      key: "electricity",
      title: "Electricity",
      amount: input.electricity,
      category: CommitmentCategory.UTILITY,
      priority: CommitmentPriority.MEDIUM
    },
    {
      key: "internet",
      title: "Internet",
      amount: input.internet,
      category: CommitmentCategory.SUBSCRIPTION,
      priority: CommitmentPriority.LOW
    },
    {
      key: "groceries",
      title: "Groceries",
      amount: input.groceries,
      category: CommitmentCategory.MANUAL_EXPENSE,
      priority: CommitmentPriority.MEDIUM
    },
    {
      key: "subscriptions",
      title: "Subscriptions",
      amount: input.subscriptions,
      category: CommitmentCategory.SUBSCRIPTION,
      priority: CommitmentPriority.LOW
    },
    {
      key: "utilities",
      title: "Utilities",
      amount: input.utilities,
      category: CommitmentCategory.UTILITY,
      priority: CommitmentPriority.MEDIUM
    }
  ];

  return entries
    .filter((entry) => entry.amount > 0)
    .map((entry) => ({
      id: `manual-${entry.key}`,
      title: entry.title,
      category: entry.category,
      amount: entry.amount,
      frequency: CommitmentFrequency.MONTHLY,
      nextDueDate,
      priority: entry.priority,
      source: { kind: CommitmentSourceKind.MANUAL },
      reviewStatus: CommitmentReviewStatus.CONFIRMED,
      reminderEnabled: false,
      editable: true,
      createdAt: now,
      updatedAt: now
    }));
}

/**
 * Compatibility MoneyBreakdown for V1 screens/engines.
 * emis and insurance stay 0 — those come from products / future product modules.
 */
export function buildOnboardingMoneyBreakdown(params: {
  monthlyIncome: number;
  emergencyBuffer: number;
  commitments: OnboardingManualCommitmentsInput;
  loanMonthlyEmi: number;
}): MoneyBreakdown {
  return {
    monthlyIncome: Math.max(params.monthlyIncome, 0),
    mandatoryExpenses: Math.max(params.commitments.groceries, 0),
    emis: 0,
    loanPayments: Math.max(params.loanMonthlyEmi, 0),
    insurance: 0,
    rent: Math.max(params.commitments.rent, 0),
    utilityBills: Math.max(params.commitments.electricity + params.commitments.utilities, 0),
    fixedCommitments: Math.max(
      params.commitments.internet + params.commitments.subscriptions,
      0
    ),
    emergencyBuffer: Math.max(params.emergencyBuffer, 0)
  };
}

export function buildOnboardingData(params: {
  profile: OnboardingProfileInput;
  loan: OnboardingLoanInput | null;
  commitments: OnboardingManualCommitmentsInput;
  now?: string;
}): OnboardingBuildResult {
  const now = params.now ?? new Date().toISOString();
  const loan = params.loan ? buildOnboardingLoan(params.loan, now) : null;
  const commitments = buildOnboardingManualCommitments(params.commitments, now);

  return {
    profile: {
      id: "primary",
      displayName: normalizeOnboardingDisplayName(params.profile.displayName),
      currency: "INR",
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now
    },
    incomeProfile: buildOnboardingIncomeProfile(params.profile.monthlyIncome, now),
    moneyBreakdown: buildOnboardingMoneyBreakdown({
      monthlyIncome: params.profile.monthlyIncome,
      emergencyBuffer: params.profile.emergencyBuffer,
      commitments: params.commitments,
      loanMonthlyEmi: loan?.monthlyEmi ?? 0
    }),
    commitments,
    loan,
    due: buildOnboardingDue(loan)
  };
}

function firstDayOfNextMonth(isoNow: string): string {
  const date = new Date(isoNow);
  if (Number.isNaN(date.getTime())) {
    return isoNow.slice(0, 10);
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}
