import { describe, expect, it } from "vitest";
import {
  buildOnboardingData,
  buildOnboardingMoneyBreakdown,
  toOnboardingNumber
} from "@/services/onboarding/build-onboarding-data";
import { CommitmentCategory, CommitmentSourceKind } from "@/shared/domain/commitment-record";
import { IncomeMode } from "@/shared/domain/income";

describe("Onboarding V2 data builder", () => {
  it("parses numeric strings safely", () => {
    expect(toOnboardingNumber("85,000")).toBe(85000);
    expect(toOnboardingNumber("")).toBe(0);
    expect(toOnboardingNumber("abc")).toBe(0);
  });

  it("builds simple income profile without advanced mode", () => {
    const result = buildOnboardingData({
      profile: {
        displayName: "Arjun",
        monthlyIncome: 85000,
        emergencyBuffer: 100000
      },
      loan: null,
      commitments: {
        rent: 0,
        electricity: 0,
        internet: 0,
        groceries: 0,
        subscriptions: 0,
        utilities: 0
      },
      now: "2026-07-19T10:00:00.000Z"
    });

    expect(result.incomeProfile.mode).toBe(IncomeMode.SIMPLE);
    expect(result.incomeProfile.simpleMonthlyIncome).toBe(85000);
    expect(result.incomeProfile.sources[0]?.isPrimary).toBe(true);
    expect(result.moneyBreakdown.emis).toBe(0);
    expect(result.moneyBreakdown.insurance).toBe(0);
  });

  it("creates only manual commitments with amounts > 0", () => {
    const result = buildOnboardingData({
      profile: {
        displayName: "Arjun",
        monthlyIncome: 85000,
        emergencyBuffer: 50000
      },
      loan: null,
      commitments: {
        rent: 18000,
        electricity: 2500,
        internet: 999,
        groceries: 8000,
        subscriptions: 500,
        utilities: 1500
      },
      now: "2026-07-19T10:00:00.000Z"
    });

    expect(result.commitments).toHaveLength(6);
    expect(result.commitments.every((item) => item.source.kind === CommitmentSourceKind.MANUAL)).toBe(
      true
    );
    expect(result.commitments.some((item) => item.category === CommitmentCategory.RENT)).toBe(true);
    expect(result.commitments.some((item) => item.category === CommitmentCategory.LOAN_EMI)).toBe(
      false
    );
  });

  it("never puts loan EMI into moneyBreakdown.emis", () => {
    const breakdown = buildOnboardingMoneyBreakdown({
      monthlyIncome: 85000,
      emergencyBuffer: 40000,
      commitments: {
        rent: 10000,
        electricity: 0,
        internet: 0,
        groceries: 0,
        subscriptions: 0,
        utilities: 0
      },
      loanMonthlyEmi: 45000
    });

    expect(breakdown.emis).toBe(0);
    expect(breakdown.loanPayments).toBe(45000);
    expect(breakdown.insurance).toBe(0);
    expect(breakdown.rent).toBe(10000);
  });

  it("skips loan creation when required fields are missing", () => {
    const result = buildOnboardingData({
      profile: {
        displayName: "Arjun",
        monthlyIncome: 50000,
        emergencyBuffer: 0
      },
      loan: {
        loanName: "",
        lender: "HDFC",
        originalAmount: 0,
        outstandingBalance: 0,
        interestRate: 8.5,
        monthlyEmi: 0,
        nextDueDate: "2026-08-05"
      },
      commitments: {
        rent: 0,
        electricity: 0,
        internet: 0,
        groceries: 0,
        subscriptions: 0,
        utilities: 0
      }
    });

    expect(result.loan).toBeNull();
    expect(result.due).toBeNull();
  });
});
