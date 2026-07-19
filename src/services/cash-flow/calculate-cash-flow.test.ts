import { describe, expect, it } from "vitest";
import {
  buildCompatMoneyBreakdown,
  calculateCashFlow,
  toMonthlyCommitmentAmount
} from "@/services/cash-flow/calculate-cash-flow";
import { IncomeMode } from "@/shared/domain/income";
import {
  CommitmentCategory,
  CommitmentFrequency,
  CommitmentPriority,
  CommitmentReviewStatus,
  CommitmentSourceKind,
  type CommitmentRecord
} from "@/shared/domain/commitment-record";

function commitment(overrides: Partial<CommitmentRecord>): CommitmentRecord {
  return {
    id: "c1",
    title: "Test",
    category: CommitmentCategory.RENT,
    amount: 12000,
    frequency: CommitmentFrequency.MONTHLY,
    nextDueDate: "2026-08-01",
    priority: CommitmentPriority.MEDIUM,
    source: { kind: CommitmentSourceKind.MANUAL },
    reviewStatus: CommitmentReviewStatus.CONFIRMED,
    reminderEnabled: false,
    editable: true,
    createdAt: "2026-07-19T00:00:00.000Z",
    updatedAt: "2026-07-19T00:00:00.000Z",
    ...overrides
  };
}

describe("V2 cash flow", () => {
  it("calculates available cash as income minus monthly commitments", () => {
    const result = calculateCashFlow({
      incomeProfile: {
        mode: IncomeMode.SIMPLE,
        simpleMonthlyIncome: 100000,
        sources: [],
        updatedAt: "2026-07-19T00:00:00.000Z"
      },
      commitments: [
        commitment({ amount: 20000, category: CommitmentCategory.RENT }),
        commitment({
          id: "c2",
          amount: 12000,
          category: CommitmentCategory.LOAN_EMI,
          source: { kind: CommitmentSourceKind.PRODUCT_GENERATED, productId: "loan-1" }
        })
      ],
      emergencyBuffer: 50000
    });

    expect(result.totalMonthlyIncome).toBe(100000);
    expect(result.totalMonthlyCommitments).toBe(32000);
    expect(result.availableCash).toBe(68000);
  });

  it("normalizes yearly commitments to monthly burden", () => {
    expect(
      toMonthlyCommitmentAmount(
        commitment({
          amount: 12000,
          frequency: CommitmentFrequency.YEARLY
        })
      )
    ).toBe(1000);
  });

  it("builds compat money breakdown without inventing EMI duplicates", () => {
    const cashFlow = calculateCashFlow({
      incomeProfile: {
        mode: IncomeMode.SIMPLE,
        simpleMonthlyIncome: 80000,
        sources: [],
        updatedAt: "2026-07-19T00:00:00.000Z"
      },
      commitments: [
        commitment({ amount: 15000, category: CommitmentCategory.RENT }),
        commitment({
          id: "emi",
          amount: 25000,
          category: CommitmentCategory.LOAN_EMI
        })
      ]
    });

    const breakdown = buildCompatMoneyBreakdown({
      cashFlow,
      commitments: [
        commitment({ amount: 15000, category: CommitmentCategory.RENT }),
        commitment({
          id: "emi",
          amount: 25000,
          category: CommitmentCategory.LOAN_EMI
        })
      ]
    });

    expect(breakdown.monthlyIncome).toBe(80000);
    expect(breakdown.rent).toBe(15000);
    expect(breakdown.emis).toBe(25000);
    expect(breakdown.loanPayments).toBe(0);
  });
});
